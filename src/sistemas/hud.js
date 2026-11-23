import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';

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
    this.marco = this.escena.add.graphics().setScrollFactor(0).setDepth(9_000);
    this.texto = this.escena.add.text(20, 16, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '15px',
      color: '#e6e7d8', lineSpacing: 5
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
    g.fillStyle(0x202522, 0.95).fillRect(12, 12, 500, 82);
    g.lineStyle(2, 0x14181a, 1).strokeRect(12, 12, 500, 82);
    const barra = (x, y, valor, color) => {
      g.fillStyle(0x344c3b).fillRect(x, y, 110, 12);
      g.fillStyle(color).fillRect(x + 2, y + 2, 106 * Math.max(0, Math.min(100, valor)) / 100, 8);
    };
    barra(62, 25, this.estado.newen, 0x9b3a3a);
    barra(222, 25, this.estado.equilibrio, 0x70905a);
    const seg = Math.max(0, Math.ceil(this.tiempoMs / 1000));
    const tiempo = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`;
    const lineaFinal = this.listoParaCerrar() ? '\n[T] Terminar jornada' : '';
    this.texto.setText(`✦  ${this.estado.newen}   ◉  ${this.estado.equilibrio}   ●  ${this.estado.pinonesLlevados}/${this.estado.pinonesEntregados}/${A.metaPinones}   ◷  ${tiempo}${lineaFinal}`);
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
  }
}

