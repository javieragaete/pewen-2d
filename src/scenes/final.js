import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';
import { PALETA, crearMarcoPixel } from '../sistemas/pixel.js';
import { obtenerEstado, reiniciarEstado } from '../sistemas/estado.js';
import { resolverFinal } from '../historia/narrativa.js';

const FUENTE = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(PALETA[clave]).color;

export class EscenaFinal extends globalThis.Phaser.Scene {
  constructor() { super('Final'); }

  init(datos = {}) { this.resultado = datos; }

  create() {
    const ancho = AJUSTES.anchoPantalla;
    const alto = AJUSTES.altoPantalla;
    const estado = this.resultado?.estado || obtenerEstado(this.game);
    const texto = this.resultado?.texto || resolverFinal(estado, AJUSTES.metaPinones);
    this.add.rectangle(ancho / 2, alto / 2, ancho, alto, color('K'));
    const marco = this.add.graphics();
    crearMarcoPixel(marco, 120, 220, 1040, 280, PALETA.K, PALETA.M);
    this.add.text(ancho / 2, 284, 'Invierno', {
      fontFamily: FUENTE, fontSize: '32px', color: PALETA.N, fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(ancho / 2, 352, texto, {
      fontFamily: FUENTE, fontSize: '19px', color: PALETA.N,
      align: 'center', lineSpacing: 9, wordWrap: { width: 900 }
    }).setOrigin(0.5, 0);
    this.add.text(ancho / 2, 548, '[R] Reiniciar', {
      fontFamily: FUENTE, fontSize: '16px', color: PALETA.M
    }).setOrigin(0.5);
    this.teclaReiniciar = this.input.keyboard.addKey(globalThis.Phaser.Input.Keyboard.KeyCodes.R);
  }

  update() {
    if (globalThis.Phaser.Input.Keyboard.JustDown(this.teclaReiniciar)) this.reiniciar();
  }

  reiniciar() {
    reiniciarEstado(this.game);
    this.scene.stop('Mundo');
    this.scene.start('Mundo', { desde: 'reinicio' });
  }
}
