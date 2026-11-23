import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { GestorJornadas } from './jornadas.js';
import { Pewenes } from './pewenes.js';
import { Recoleccion } from './recoleccion.js';
import { HudSistemas } from './hud.js';
import { Dialogo } from '../historia/dialogo.js';

const CLAVE_ESTADO = 'estado';

export function crearEstadoInicial() {
  return {
    newen: A.newenInicial,
    equilibrio: A.equilibrioInicial,
    pinonesLlevados: 0,
    pinonesEntregados: 0,
    jornada: 1,
    permisosPedidos: 0,
    tomasDirectas: 0,
    pewenesUsados: []
  };
}

export function leerEstado(juego) {
  return juego.registry.get(CLAVE_ESTADO) ?? crearEstadoInicial();
}

export function guardarEstado(juego, estado) {
  juego.registry.set(CLAVE_ESTADO, estado);
  return estado;
}

// El gasto sigue el movimiento real del jugador y el evento global del agua.
class DrenajeNewen {
  constructor(escena, estado) {
    this.escena = escena;
    this.estado = estado;
    this.dentroDelAgua = false;
    this.rescateEmitido = false;
    this.posicionAnterior = null;
    this.lentoNotificado = false;
    escena.game.events.on('agua:cambio', this.cambiarAgua, this);
    escena.game.events.on('entrega:pinones', this.recuperarEnRuka, this);
    escena.game.events.on('jornada:inicio', this.cambiarJornada, this);
    escena.game.events.on('hud:actualizar', this.notificarMovimiento, this);
    escena.events.on('update', this.actualizar, this);
    escena.events.once('shutdown', this.destruir, this);
    this.notificarMovimiento();
  }

  cambiarAgua({ dentro } = {}) {
    this.dentroDelAgua = Boolean(dentro);
    if (!this.dentroDelAgua) this.rescateEmitido = false;
  }

  cambiarJornada({ n } = {}) {
    if (!n || n <= 1) return;
    this.estado.newen = Math.min(A.maximoEstado, this.estado.newen + A.recuperacionEntreJornadas);
    guardarEstado(this.escena.game, this.estado);
    this.escena.game.events.emit('hud:actualizar', { ...this.estado });
  }

  recuperarEnRuka() {
    if (this.estado.pinonesLlevados <= 0) return;
    this.estado.newen = Math.min(A.maximoEstado, this.estado.newen + A.recuperacionRukaPorEntrega);
    guardarEstado(this.escena.game, this.estado);
    this.escena.game.events.emit('hud:actualizar', { ...this.estado });
  }

  actualizar(_tiempo, delta) {
    const jugador = this.escena.jugador;
    if (!jugador) return;
    const pos = { x: jugador.x, y: jugador.y };
    if (!this.posicionAnterior) { this.posicionAnterior = pos; return; }
    const distancia = Math.hypot(pos.x - this.posicionAnterior.x, pos.y - this.posicionAnterior.y);
    this.posicionAnterior = pos;
    if (distancia < 0.5 || delta <= 0 || delta > 100) return;

    const segundos = delta / 1000;
    const factorAgua = this.dentroDelAgua ? A.multiplicadorNado : 1;
    const anterior = this.estado.newen;
    this.estado.newen = Math.max(0, this.estado.newen - A.newenMovimientoPorSegundo * factorAgua * segundos);
    if (Math.floor(anterior) !== Math.floor(this.estado.newen)) {
      guardarEstado(this.escena.game, this.estado);
      this.escena.game.events.emit('hud:actualizar', { ...this.estado });
    }
    this.notificarMovimiento();

    if (this.dentroDelAgua && this.estado.newen <= 0 && !this.rescateEmitido) {
      this.rescateEmitido = true;
      const perdida = Math.floor(this.estado.pinonesLlevados * A.perdidaRescatePct / 100);
      this.estado.pinonesLlevados = Math.max(0, this.estado.pinonesLlevados - perdida);
      guardarEstado(this.escena.game, this.estado);
      this.escena.game.events.emit('hud:actualizar', { ...this.estado });
      this.escena.game.events.emit('rescate:orilla', { perdidaPct: A.perdidaRescatePct });
    }
  }

  notificarMovimiento() {
    const cansado = this.estado.newen <= 0;
    if (cansado === this.lentoNotificado) return;
    this.lentoNotificado = cansado;
    this.escena.game.events.emit('newen:cambio', {
      newen: this.estado.newen,
      multiplicadorMovimiento: cansado ? A.multiplicadorMovimientoCansado : 1
    });
  }

  destruir() {
    this.escena.game.events.off('agua:cambio', this.cambiarAgua, this);
    this.escena.game.events.off('entrega:pinones', this.recuperarEnRuka, this);
    this.escena.game.events.off('jornada:inicio', this.cambiarJornada, this);
    this.escena.game.events.off('hud:actualizar', this.notificarMovimiento, this);
    this.escena.events.off('update', this.actualizar, this);
  }
}

// Punto de entrada del flujo D: espera la escena lateral sin importar sus módulos.
export function iniciarSistemas(escena) {
  const conectar = mundo => {
    const destino = mundo?.anclas ? mundo : escena;
    if (destino.sistemas) return;
    const estado = leerEstado(destino.game);
    guardarEstado(destino.game, estado);
    const pewenes = new Pewenes(destino, estado);
    const recoleccion = new Recoleccion(destino, estado, pewenes);
    const newen = new DrenajeNewen(destino, estado);
    const dialogo = new Dialogo(destino, estado);
    const jornadas = new GestorJornadas(destino);
    dialogo.inicioJornada({ n: estado.jornada });
    const hud = new HudSistemas(destino, estado);
    destino.sistemas = { estado, pewenes, recoleccion, newen, dialogo, jornadas, hud };
  };

  if (escena.anclas) conectar(escena);
  else escena.events?.once('mundo:listo', conectar);

  return () => escena.events?.off('mundo:listo', conectar);
}

