import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';

export const CLAVE_ESTADO = 'estado';

export function crearEstadoInicial() {
  return {
    newen: 100,
    equilibrio: 50,
    pinonesLlevados: 0,
    pinonesEntregados: 0,
    jornada: 1,
    permisosPedidos: 0,
    tomasDirectas: 0,
    pewenes: [],
    recolecciones: 0,
    multiplicadorVelocidad: 1
  };
}

export function obtenerEstado(game) {
  const guardado = game.registry.get(CLAVE_ESTADO);
  if (!guardado) {
    const inicial = crearEstadoInicial();
    game.registry.set(CLAVE_ESTADO, inicial);
    return inicial;
  }
  const estado = { ...crearEstadoInicial(), ...guardado };
  estado.pewenes = Array.isArray(estado.pewenes) ? estado.pewenes : [];
  return estado;
}

export function guardarEstado(game, estado) {
  game.registry.set(CLAVE_ESTADO, { ...estado, pewenes: estado.pewenes.map(pewen => ({ ...pewen })) });
}

export function reiniciarEstado(game) {
  const estado = crearEstadoInicial();
  game.registry.set(CLAVE_ESTADO, estado);
  return estado;
}

export class SistemaEstado {
  constructor(escena, estado, guardar) {
    this.escena = escena;
    this.estado = estado;
    this.guardar = guardar;
    this.eventos = escena.game.events;
    this.enAgua = false;
    this.enRuka = false;
    this.bloqueado = false;
    this.ultimoRescate = -Infinity;
    this.posicionAnterior = { x: escena.jugador?.x ?? 0, y: escena.jugador?.y ?? 0 };
    this.cambioAgua = ({ dentro } = {}) => { this.enAgua = Boolean(dentro); };
    this.cambioBloqueo = ({ bloqueado } = {}) => { this.bloqueado = Boolean(bloqueado); };
    this.entrarRuka = () => { this.enRuka = true; };
    this.salirRuka = () => { this.enRuka = false; };
    this.recibirEntrega = () => {
      this.enRuka = true;
      this.estado.newen = 100;
      this.publicarCambio();
    };
    this.eventos.on('agua:cambio', this.cambioAgua);
    this.eventos.on('jugador:bloqueado', this.cambioBloqueo);
    this.eventos.on('ruka:interior', this.entrarRuka);
    this.eventos.on('ruka:exterior', this.salirRuka);
    this.eventos.on('entrega:pinones', this.recibirEntrega);
    this.escena.events.on('update', this.actualizar, this);
    this.escena.events.once('shutdown', this.destruir, this);
  }

  actualizar(_, delta) {
    const jugador = this.escena.jugador;
    if (!jugador || this.bloqueado) return;
    const movio = Math.hypot(jugador.x - this.posicionAnterior.x, jugador.y - this.posicionAnterior.y) > 0.1;
    this.posicionAnterior.x = jugador.x;
    this.posicionAnterior.y = jugador.y;
    const segundos = Math.max(0, delta) / 1000;
    if (this.enRuka) {
      this.estado.newen = Math.min(100, this.estado.newen + AJUSTES.descansoRukaPorSegundo * segundos);
    } else if (movio) {
      const agua = this.enAgua ? AJUSTES.multiplicadorDesgasteAgua : 1;
      this.estado.newen = Math.max(0, this.estado.newen - AJUSTES.desgasteMovimientoPorSegundo * agua * segundos);
    }
    this.publicarCambio();
    if (this.estado.newen === 0 && this.enAgua && this.escena.time.now - this.ultimoRescate > 1_500) {
      this.rescatar();
    }
  }

  rescatar() {
    this.ultimoRescate = this.escena.time.now;
    const perdidos = Math.ceil(this.estado.pinonesLlevados * AJUSTES.perdidaRescatePct / 100);
    this.estado.pinonesLlevados = Math.max(0, this.estado.pinonesLlevados - perdidos);
    this.estado.newen = AJUSTES.newenMinimoRescate;
    this.publicarCambio();
    this.eventos.emit('rescate:orilla', { perdidaPct: AJUSTES.perdidaRescatePct });
    this.eventos.emit('sistemas:rescate', { perdidos, estado: this.estado });
  }

  publicarCambio() {
    this.estado.multiplicadorVelocidad = this.estado.newen <= 0 ? 0.45 : 1;
    this.guardar();
    this.eventos.emit('newen:cambio', {
      newen: this.estado.newen,
      multiplicadorVelocidad: this.estado.multiplicadorVelocidad
    });
  }

  destruir() {
    this.eventos.off('agua:cambio', this.cambioAgua);
    this.eventos.off('jugador:bloqueado', this.cambioBloqueo);
    this.eventos.off('ruka:interior', this.entrarRuka);
    this.eventos.off('ruka:exterior', this.salirRuka);
    this.eventos.off('entrega:pinones', this.recibirEntrega);
    this.escena.events.off('update', this.actualizar, this);
  }
}
