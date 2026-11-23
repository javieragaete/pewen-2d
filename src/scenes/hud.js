import { CONFIG } from '../config.js';
import { dibujarMarcoPixel } from '../sprites.js';

const { partida, paletaPixel } = CONFIG;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;

export class Hud {
  constructor(escena) {
    const panel = escena.add.graphics();
    dibujarMarcoPixel(panel, 0, 0, 548, 70, color('tinta'), color('rojo'));
    const estilo = { fontFamily: mono, fontSize: '15px', color: paletaPixel.nieve };
    const etiqueta = { fontFamily: mono, fontSize: '11px', color: paletaPixel.musgo };
    this.etiquetas = [
      escena.add.text(38, 9, 'NEWEN', etiqueta),
      escena.add.text(190, 9, 'EQUILIBRIO', etiqueta),
      escena.add.text(354, 9, 'PIÑONES', etiqueta),
      escena.add.text(461, 9, 'TIEMPO', etiqueta)
    ];
    this.iconoNewen = escena.add.image(14, 46, 'icono-newen');
    this.iconoEquilibrio = escena.add.image(166, 46, 'icono-equilibrio');
    this.iconoPinon = escena.add.image(330, 46, 'icono-pinon');
    this.iconoReloj = escena.add.image(438, 46, 'icono-reloj');
    this.pinones = escena.add.text(354, 39, '', estilo);
    this.reloj = escena.add.text(461, 39, '', estilo);
    this.barras = escena.add.graphics();
    escena.add.container(12, 12, [
      panel, this.iconoNewen, this.iconoEquilibrio, this.iconoPinon, this.iconoReloj,
      ...this.etiquetas, this.pinones, this.reloj, this.barras
    ]).setScrollFactor(0).setDepth(CONFIG.mundo.alto + 4);
  }

  actualizar(newen, equilibrio, pinones, segundos, totalLof = 0) {
    const minutos = Math.floor(segundos / 60);
    // Primer valor: carga que lleva el personaje. Después del separador: total/meta del lof.
    this.pinones.setText(`${pinones}|${totalLof}/${partida.metaPinones}`);
    this.reloj.setText(`${minutos}:${String(segundos % 60).padStart(2, '0')}`);
    this.barras.clear();
    const barra = (x, valor, tono) => {
      this.barras.fillStyle(color('bosqueOscuro')).fillRect(x, 40, 112, 14);
      this.barras.fillStyle(color(tono)).fillRect(x + 2, 42, 108 * valor / partida.maximoBarra, 10);
    };
    barra(38, newen, 'rojo');
    barra(190, equilibrio, 'verde');
  }
}

