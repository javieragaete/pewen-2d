import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { guardarEstado, leerEstado } from './estado.js';

// Controla el reloj y las tarjetas; el contador se detiene con diálogos y menús.
export class GestorJornadas {
  constructor(escena) {
    this.escena = escena;
    this.estado = leerEstado(escena.game);
    this.entregadoJornada = 0;
    guardarEstado(escena.game, this.estado);
    this.pausado = false;
    this.estadoReloj = 'tarjeta';
    this.tiempoRestante = A.duracionJornadaMs;
    this.crearTarjeta();
    escena.game.events.on('jugador:bloqueado', this.cambiarPausa, this);
    escena.game.events.on('entrega:pinones', this.entregar, this);
    escena.game.events.on('jornada:terminar', this.terminarSiCorresponde, this);
    escena.events.on('update', this.actualizar, this);
    escena.events.once('shutdown', this.destruir, this);
    this.mostrarTarjeta(`Jornada ${this.estado.jornada} de ${A.cantidadJornadas}`, '', A.tarjetaJornadaMs, 'tarjeta');
    escena.game.events.emit('jornada:inicio', { n: this.estado.jornada });
  }

  crearTarjeta() {
    const fondo = this.escena.add.rectangle(640, 360, 1280, 720, 0x14181a, 0.78)
      .setScrollFactor(0).setDepth(10_000);
    const marco = this.escena.add.rectangle(640, 360, 810, 190, 0x344c3b, 1)
      .setStrokeStyle(2, 0x202522).setScrollFactor(0).setDepth(10_001);
    this.titulo = this.escena.add.text(640, 315, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '30px', color: '#e6e7d8',
      align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10_002);
    this.detalle = this.escena.add.text(640, 365, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '19px', color: '#e6e7d8',
      align: 'center', wordWrap: { width: 710 }
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10_002);
    this.tarjeta = this.escena.add.container(0, 0, [fondo, marco, this.titulo, this.detalle])
      .setScrollFactor(0).setDepth(10_000);
  }

  mostrarTarjeta(titulo, detalle, duracion, estado) {
    this.estadoReloj = estado;
    this.finTarjeta = this.escena.time.now + duracion;
    this.tarjeta.setVisible(true).setAlpha(1);
    this.titulo.setText(titulo);
    this.detalle.setText(detalle);
  }

  cambiarPausa({ bloqueado } = {}) {
    this.pausado = Boolean(bloqueado);
  }

  entregar() {
    const carga = Math.max(0, this.estado.pinonesLlevados);
    if (carga === 0) return;
    this.estado.pinonesLlevados = 0;
    this.estado.pinonesEntregados += carga;
    this.entregadoJornada += carga;
    guardarEstado(this.escena.game, this.estado);
    this.escena.game.events.emit('hud:actualizar', { ...this.estado });
  }

  actualizar(_tiempo, delta) {
    if (this.estadoReloj === 'tarjeta') {
      if (this.escena.time.now < this.finTarjeta) return;
      this.tarjeta.setVisible(false);
      this.estadoReloj = 'activo';
      return;
    }
    if (this.estadoReloj === 'resumen') {
      if (this.escena.time.now < this.finTarjeta) return;
      this.tarjeta.setVisible(false);
      if (this.estado.jornada >= A.cantidadJornadas) {
        this.estadoReloj = 'terminado';
        this.escena.scene.start('Final');
        return;
      }
      this.estado.jornada++;
      this.entregadoJornada = 0;
      this.tiempoRestante = A.duracionJornadaMs;
      guardarEstado(this.escena.game, this.estado);
      this.mostrarTarjeta(`Jornada ${this.estado.jornada} de ${A.cantidadJornadas}`, '', A.tarjetaJornadaMs, 'tarjeta');
      this.escena.game.events.emit('jornada:inicio', { n: this.estado.jornada });
      return;
    }
    if (this.estadoReloj !== 'activo' || this.pausado) return;

    this.tiempoRestante = Math.max(0, this.tiempoRestante - delta);
    this.escena.game.events.emit('hud:reloj', { jornada: this.estado.jornada, ms: this.tiempoRestante });
    if (this.tiempoRestante === 0) this.terminarJornada();
  }

  terminarJornada() {
    const perdido = Math.max(0, this.estado.pinonesLlevados);
    this.estado.pinonesLlevados = 0;
    guardarEstado(this.escena.game, this.estado);
    const resumen = `Entregaste ${this.entregadoJornada} piñones. El lof tiene ${this.estado.pinonesEntregados} de ${A.metaPinones}.`
      + (perdido ? ` Se perdieron ${perdido} que llevabas.` : '');
    this.resumenFinal = resumen;
    this.estadoReloj = 'resumen';
    this.mostrarTarjeta('Resumen de jornada', resumen, A.resumenMs, 'resumen');
    this.escena.tweens.add({ targets: this.tarjeta, alpha: { from: 0, to: 1 }, duration: A.fundidoMs });
    this.escena.game.events.emit('jornada:fin', { n: this.estado.jornada });
  }

  terminarSiCorresponde() {
    const arboles = this.escena.sistemas?.pewenes.arboles ?? [];
    if (this.estadoReloj !== 'activo' || this.estado.pinonesLlevados !== 0
      || arboles.length === 0 || !arboles.every(arbol => arbol.recolectado)) return;
    this.terminarJornada();
  }

  destruir() {
    this.escena.game.events.off('jugador:bloqueado', this.cambiarPausa, this);
    this.escena.game.events.off('entrega:pinones', this.entregar, this);
    this.escena.game.events.off('jornada:terminar', this.terminarSiCorresponde, this);
    this.escena.events.off('update', this.actualizar, this);
  }
}

