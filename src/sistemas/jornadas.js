import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';
import { PALETA, crearMarcoPixel } from './pixel.js';

const FUENTE = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(PALETA[clave]).color;

export class SistemaJornadas {
  constructor(escena, estado, pewenes, recoleccion, hud, ajustes, guardar, alFinalizar) {
    this.escena = escena;
    this.estado = estado;
    this.pewenes = pewenes;
    this.recoleccion = recoleccion;
    this.hud = hud;
    this.ajustes = ajustes;
    this.guardar = guardar;
    this.alFinalizar = alFinalizar;
    this.eventos = escena.game.events;
    this.segundosRestantes = ajustes.duracionJornadaMs / 1000;
    this.modo = 'sinIniciar';
    this.bloqueado = false;
    this.entregadosAlInicio = 0;
    this.cambioBloqueo = ({ bloqueado } = {}) => { this.bloqueado = Boolean(bloqueado); };
    this.eventos.on('jugador:bloqueado', this.cambioBloqueo);
    this.teclaTerminar = escena.input.keyboard.addKey(globalThis.Phaser.Input.Keyboard.KeyCodes.T);
    this.crearTarjeta();
    this.escena.events.on('update', this.actualizar, this);
    this.escena.events.once('shutdown', this.destruir, this);
  }

  crearTarjeta() {
    const { width, height } = this.escena.scale;
    const fondo = this.escena.add.rectangle(width / 2, height / 2, width, height, color('K'), 0.84);
    const marco = this.escena.add.graphics();
    crearMarcoPixel(marco, width / 2 - 400, height / 2 - 112, 800, 224, PALETA.K, PALETA.M);
    this.titulo = this.escena.add.text(width / 2, height / 2 - 45, '', {
      fontFamily: FUENTE, fontSize: '30px', color: PALETA.N,
      align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.detalle = this.escena.add.text(width / 2, height / 2 + 20, '', {
      fontFamily: FUENTE, fontSize: '18px', color: PALETA.N,
      align: 'center', lineSpacing: 8, wordWrap: { width: 700 }
    }).setOrigin(0.5, 0);
    this.tarjeta = this.escena.add.container(0, 0, [fondo, marco, this.titulo, this.detalle])
      .setScrollFactor(0).setDepth(11_000).setVisible(false);
  }

  iniciar() {
    if (this.modo !== 'sinIniciar') return;
    this.mostrarInicio();
  }

  mostrarInicio() {
    this.modo = 'tarjetaInicio';
    this.bloquear(true);
    this.titulo.setText(`Jornada ${this.estado.jornada} de ${this.ajustes.cantidadJornadas}`);
    this.detalle.setText('');
    this.tarjeta.setVisible(true).setAlpha(1);
    this.escena.time.delayedCall(this.ajustes.tarjetaInicioMs, () => {
      if (this.modo !== 'tarjetaInicio') return;
      this.tarjeta.setVisible(false);
      this.modo = 'libre';
      this.segundosRestantes = this.ajustes.duracionJornadaMs / 1000;
      this.entregadosAlInicio = this.estado.pinonesEntregados;
      this.eventos.emit('jornada:inicio', { n: this.estado.jornada });
      this.bloquear(false);
    });
  }

  actualizar(_, delta) {
    if (this.modo === 'sinIniciar') return;
    if (this.modo === 'libre' && !this.bloqueado) {
      this.segundosRestantes = Math.max(0, this.segundosRestantes - Math.max(0, delta) / 1000);
      if (this.segundosRestantes === 0) {
        this.terminar(false);
        return;
      }
      if (this.recoleccion.puedeTerminarJornada()
        && globalThis.Phaser.Input.Keyboard.JustDown(this.teclaTerminar)) {
        this.terminar(true);
        return;
      }
    }
    this.hud.actualizar(Math.ceil(this.segundosRestantes), this.modo === 'libre' && this.recoleccion.puedeTerminarJornada());
  }

  terminar(anticipada) {
    if (this.modo !== 'libre') return;
    this.modo = 'resumen';
    this.bloquear(true);
    const perdidos = anticipada ? 0 : this.estado.pinonesLlevados + this.recoleccion.descartarPinonesSuelo();
    this.estado.pinonesLlevados = 0;
    const entregadosHoy = this.estado.pinonesEntregados - this.entregadosAlInicio;
    this.guardar();
    const mensajes = [`Entregaste ${entregadosHoy} piñones.`, `El lof tiene ${this.estado.pinonesEntregados} de ${this.ajustes.metaPinones}.`];
    if (perdidos > 0) mensajes.splice(1, 0, `Se perdieron ${perdidos} piñones que quedaban.`);
    this.titulo.setText('Resumen de jornada');
    this.detalle.setText(mensajes.join('\n'));
    this.tarjeta.setVisible(true).setAlpha(0);
    this.escena.tweens.add({ targets: this.tarjeta, alpha: 1, duration: this.ajustes.fundidoMs });
    this.eventos.emit('jornada:fin', {
      n: this.estado.jornada,
      entregados: entregadosHoy,
      total: this.estado.pinonesEntregados,
      perdidos
    });
    this.escena.time.delayedCall(this.ajustes.resumenJornadaMs, () => this.avanzar());
  }

  avanzar() {
    this.tarjeta.setVisible(false).setAlpha(1);
    if (this.estado.jornada < this.ajustes.cantidadJornadas) {
      this.estado.jornada += 1;
      this.pewenes.avanzarJornada(this.estado.jornada);
      this.guardar();
      this.modo = 'libre';
      this.mostrarInicio();
      return;
    }
    this.modo = 'completa';
    this.alFinalizar?.(this.estado);
  }

  bloquear(bloqueado) {
    this.eventos.emit('jugador:bloqueado', { bloqueado });
  }

  destruir() {
    this.eventos.off('jugador:bloqueado', this.cambioBloqueo);
    this.escena.events.off('update', this.actualizar, this);
    if (this.bloqueado) this.bloquear(false);
  }
}
