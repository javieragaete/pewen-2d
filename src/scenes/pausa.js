import { CONFIG } from '../config.js';

const { pantalla, colores } = CONFIG;
const Phaser = globalThis.Phaser;

export class Pausa extends Phaser.Scene {
  constructor() { super('Pausa'); }

  create() {
    this.pausaRecienteHasta = this.time.now + 300;
    this.add.rectangle(pantalla.ancho / 2, pantalla.alto / 2, pantalla.ancho, pantalla.alto, 0x18231e, 0.78);
    this.add.text(pantalla.ancho / 2, 244, 'Pausa', { fontFamily: 'Georgia, serif', fontSize: '52px', color: colores.texto }).setOrigin(0.5);
    this.boton(360, 'Continuar', () => this.reanudar());
    this.boton(440, 'Configuración', () => this.abrirConfiguracion());
    this.boton(520, 'Volver al menú', () => this.volverAlMenu());
    this.teclaEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  update() {
    if (this.time.now > this.pausaRecienteHasta && Phaser.Input.Keyboard.JustDown(this.teclaEsc)) this.reanudar();
  }

  boton(y, etiqueta, accion) {
    const fondo = this.add.rectangle(pantalla.ancho / 2, y, 310, 56, 0x405946).setStrokeStyle(2, 0x9daf73).setInteractive({ useHandCursor: true });
    this.add.text(pantalla.ancho / 2, y, etiqueta, { fontSize: '21px', color: colores.texto }).setOrigin(0.5);
    fondo.on('pointerover', () => fondo.setFillStyle(0x58734f));
    fondo.on('pointerout', () => fondo.setFillStyle(0x405946));
    fondo.on('pointerdown', accion);
  }

  reanudar() {
    this.scene.stop();
    this.scene.resume('Juego');
  }

  abrirConfiguracion() {
    this.scene.launch('Configuracion', { origen: 'Pausa' });
    this.scene.pause();
  }

  volverAlMenu() {
    this.scene.stop('Juego');
    this.scene.start('Menu');
  }
}
