import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { crearIconosHUD } from './pixel.js';

const P = globalThis.Phaser;

// Interfaz compacta que escucha actualizaciones del estado compartido.
export class HudSistemas {
  constructor(escena, estado) {
    this.escena = escena;
    this.estado = estado;
    this.tiempoMs = A.duracionJornadaMs;
    this.crearVista();
    this.teclaTerminar = escena.input.keyboard.addKey(P.Input.Keyboard.KeyCodes.T);
    escena.game.events.on('hud:actualizar', this.actualizarEstado, this);
    escena.game.events.on('hud:reloj', this.actualizarReloj, this);
    escena.game.events.on('jornada:inicio', this.inicioJornada, this);
    escena.events.on('update', this.actualizar, this);
    escena.events.once('shutdown', this.destruir, this);
    this.dibujar();
  }

  crearVista() {
    crearIconosHUD(this.escena);
    this.marco = this.escena.add.graphics().setScrollFactor(0).setDepth(9_000);
    this.iconos = [
      this.escena.add.image(22, 20, 'hud-newen').setOrigin(0).setScale(3),
      this.escena.add.image(190, 20, 'hud-equilibrio').setOrigin(0).setScale(3),
      this.escena.add.image(354, 20, 'hud-pinon').setOrigin(0).setScale(3),
      this.escena.add.image(474, 20, 'hud-reloj').setOrigin(0).setScale(3)
    ].map(icono => icono.setScrollFactor(0).setDepth(9_001));
    const estilo = { fontFamily: 'Consolas, "Courier New", monospace', fontSize: '15px', color: '#e6e7d8' };
    this.valores = [58, 222, 386, 505].map(x => this.escena.add.text(x, 22, '', estilo)
      .setScrollFactor(0).setDepth(9_001));
    this.ayuda = this.escena.add.text(24, 52, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '14px', color: '#a9c4cc'
    }).setScrollFactor(0).setDepth(9_001);
  }

  actualizarEstado(estado) {
    Object.assign(this.estado, estado);
    this.dibujar();
  }

  actualizarReloj({ ms } = {}) {
    if (Number.isFinite(ms)) this.tiempoMs = ms;
    this.dibujar();
  }

  inicioJornada() {
    this.tiempoMs = A.duracionJornadaMs;
    this.dibujar();
  }

  listoParaCerrar() {
    const sistemas = this.escena.sistemas;
    const usados = this.estado.pewenesUsados.filter(item => item.jornada === this.estado.jornada).length;
    return Boolean(sistemas?.pewenes.arboles.length)
      && usados >= sistemas.pewenes.arboles.length
      && this.estado.pinonesLlevados === 0
      && sistemas.jornadas.estadoReloj === 'activo';
  }

  dibujar() {
    const g = this.marco;
    g.clear();
    g.fillStyle(0x202522, 0.96).fillRect(12, 12, 570, 76);
    g.lineStyle(2, 0x14181a, 1).strokeRect(12, 12, 570, 76);
    const barra = (x, valor, color) => {
      g.fillStyle(0x344c3b).fillRect(x, 23, 76, 12);
      g.fillStyle(color).fillRect(x + 2, 25, 72 * Math.max(0, Math.min(100, valor)) / 100, 8);
    };
    barra(86, this.estado.newen, 0x9b3a3a);
    barra(254, this.estado.equilibrio, 0x70905a);
    const seg = Math.max(0, Math.ceil(this.tiempoMs / 1000));
    const tiempo = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
    const lineaFinal = this.listoParaCerrar() ? '\n[T] Terminar jornada' : '';
    this.valores[0].setText(Math.round(this.estado.newen));
    this.valores[1].setText(Math.round(this.estado.equilibrio));
    this.valores[2].setText(`${this.estado.pinonesLlevados}/${this.estado.pinonesEntregados}/${A.metaPinones}`);
    this.valores[3].setText(tiempo);
    this.ayuda.setText(lineaFinal.trim());
  }

  actualizar() {
    if (this.listoParaCerrar() && P.Input.Keyboard.JustDown(this.teclaTerminar)) {
      this.escena.game.events.emit('jornada:terminar');
    }
  }

  destruir() {
    this.escena.game.events.off('hud:actualizar', this.actualizarEstado, this);
    this.escena.game.events.off('hud:reloj', this.actualizarReloj, this);
    this.escena.game.events.off('jornada:inicio', this.inicioJornada, this);
    this.escena.events.off('update', this.actualizar, this);
    this.iconos.forEach(icono => icono.destroy());
    this.marco.destroy(); this.valores.forEach(valor => valor.destroy()); this.ayuda.destroy();
  }
}

