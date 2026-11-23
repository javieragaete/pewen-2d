import { CONFIG } from '../config.js';

const { pantalla, mundo, partida, paletaPixel } = CONFIG;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;

export class Hud {
  constructor(escena) {
    const anchoPanel = pantalla.ancho - 48;
    const panel = escena.add.graphics();
    panel.fillStyle(color('tinta')).fillRect(0, 0, anchoPanel, 76);
    panel.fillStyle(color('rojo')).fillRect(0, 0, anchoPanel, 4);
    panel.fillRect(0, 72, anchoPanel, 4).fillRect(0, 0, 4, 76).fillRect(anchoPanel - 4, 0, 4, 76);
    panel.fillStyle(color('madera')).fillRect(6, 6, anchoPanel - 12, 2);
    panel.fillRect(6, 68, anchoPanel - 12, 2);

    const estilo = { fontFamily: mono, fontSize: '18px', color: paletaPixel.nieve };
    this.newen = escena.add.text(48, 10, '', estilo);
    this.equilibrio = escena.add.text(282, 10, '', estilo);
    this.pinones = escena.add.text(538, 20, '', estilo);
    this.reloj = escena.add.text(1188, 20, '', { ...estilo, align: 'right' }).setOrigin(1, 0);
    this.iconoPinon = escena.add.image(510, 31, 'icono-pinon').setScale(1);
    this.iconoReloj = escena.add.image(1134, 31, 'icono-reloj').setScale(1);
    this.iconoNewen = escena.add.image(28, 20, 'icono-newen').setScale(1);
    this.iconoEquilibrio = escena.add.image(262, 20, 'icono-equilibrio').setScale(1);
    this.barras = escena.add.graphics();

    const aviso = escena.add.graphics();
    aviso.fillStyle(color('tinta')).fillRect(0, 0, 294, 32);
    aviso.fillStyle(color('musgo')).fillRect(0, 0, 294, 3);
    aviso.fillRect(0, 29, 294, 3).fillRect(0, 0, 3, 32).fillRect(291, 0, 3, 32);
    this.descansoTexto = escena.add.text(12, 6, 'Descansando cerca de la ruka', {
      ...estilo, fontSize: '14px'
    });
    this.descanso = escena.add.container(0, 84, [aviso, this.descansoTexto]).setVisible(false);

    escena.add.container(24, 20, [
      panel, this.iconoNewen, this.newen, this.iconoEquilibrio, this.equilibrio,
      this.iconoPinon, this.pinones, this.iconoReloj, this.reloj, this.barras, this.descanso
    ]).setScrollFactor(0).setDepth(mundo.alto + 4);
  }

  actualizar(newen, equilibrio, pinones, segundos, descansando) {
    newen = Math.ceil(newen);
    equilibrio = Math.round(equilibrio);
    this.newen.setText('Newen ' + newen);
    this.equilibrio.setText('Equilibrio ' + equilibrio);
    this.pinones.setText('Piñones ' + pinones + ' / ' + partida.metaPinones);
    const minutos = Math.floor(segundos / 60);
    this.reloj.setText('Jornada ' + minutos + ':' + String(segundos % 60).padStart(2, '0'));
    this.descanso.setVisible(descansando);

    const ancho = 190;
    this.barras.clear();
    const fondo = color('bosqueOscuro');
    this.barras.fillStyle(color('madera')).fillRect(16, 43, ancho, 12);
    this.barras.fillStyle(fondo).fillRect(18, 45, ancho - 4, 8);
    this.barras.fillStyle(color('rojo')).fillRect(18, 45, (ancho - 4) * newen / partida.maximoBarra, 8);
    this.barras.fillStyle(color('madera')).fillRect(250, 43, ancho, 12);
    this.barras.fillStyle(fondo).fillRect(252, 45, ancho - 4, 8);
    this.barras.fillStyle(color('verde')).fillRect(252, 45, (ancho - 4) * equilibrio / partida.maximoBarra, 8);
  }
}


