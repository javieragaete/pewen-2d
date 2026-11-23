import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';
import { PALETA, crearMarcoPixel } from '../sistemas/pixel.js';
import { PROLOGO } from '../historia/narrativa.js';

const FUENTE = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(PALETA[clave]).color;

export class EscenaPrologo extends globalThis.Phaser.Scene {
  constructor() { super('Prologo'); }

  create() {
    this.pantalla = 0;
    this.eventos = this.game.events;
    this.eventos.emit('jugador:bloqueado', { bloqueado: true });
    const ancho = AJUSTES.anchoPantalla;
    const alto = AJUSTES.altoPantalla;
    this.add.rectangle(ancho / 2, alto / 2, ancho, alto, color('D'));
    const montana = this.add.graphics();
    montana.fillStyle(color('K')).beginPath();
    montana.moveTo(0, 500); montana.lineTo(250, 210); montana.lineTo(390, 405);
    montana.lineTo(610, 145); montana.lineTo(860, 450); montana.lineTo(1030, 275);
    montana.lineTo(1280, 490); montana.lineTo(1280, 720); montana.lineTo(0, 720);
    montana.closePath().fillPath();
    const marco = this.add.graphics();
    crearMarcoPixel(marco, 120, 260, 1040, 220, PALETA.K, PALETA.M);
    this.texto = this.add.text(ancho / 2, 330, '', {
      fontFamily: FUENTE, fontSize: '23px', color: PALETA.N,
      align: 'center', lineSpacing: 12, wordWrap: { width: 920 }
    }).setOrigin(0.5);
    this.ayuda = this.add.text(ancho / 2, 520, 'E / Enter / Espacio · Continuar      Esc · Saltar', {
      fontFamily: FUENTE, fontSize: '14px', color: PALETA.H
    }).setOrigin(0.5);
    this.teclas = this.input.keyboard.addKeys('E,ENTER,SPACE,ESC');
    this.mostrar();
  }

  mostrar() { this.texto.setText(PROLOGO[this.pantalla]); }

  update() {
    const Phaser = globalThis.Phaser;
    if (Phaser.Input.Keyboard.JustDown(this.teclas.ESC)) {
      this.finalizar();
      return;
    }
    const avanzar = ['E', 'ENTER', 'SPACE'].some(nombre => Phaser.Input.Keyboard.JustDown(this.teclas[nombre]));
    if (!avanzar) return;
    this.pantalla += 1;
    if (this.pantalla >= PROLOGO.length) this.finalizar();
    else this.mostrar();
  }

  finalizar() {
    this.eventos.emit('prologo:fin');
    this.eventos.emit('jugador:bloqueado', { bloqueado: false });
    this.scene.stop();
    this.scene.resume('Mundo');
  }
}
