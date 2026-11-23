import { CONFIG } from '../config.js';

const { pantalla, mundo, partida, colores } = CONFIG;

export class Hud {
  constructor(escena) {
    const panel = escena.add.rectangle(0, 0, pantalla.ancho - 48, 76, 0x18231e, 0.94).setOrigin(0);
    const estilo = { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color: colores.texto };
    this.newen = escena.add.text(16, 12, '', estilo);
    this.equilibrio = escena.add.text(248, 12, '', estilo);
    this.pinones = escena.add.text(488, 22, '', estilo);
    this.reloj = escena.add.text(pantalla.ancho - 64, 22, '', estilo).setOrigin(1, 0);
    this.barras = escena.add.graphics();
    const descanso = escena.add.text(0, 86, 'Descansando cerca de la ruka', {
      ...estilo, fontSize: '16px', backgroundColor: colores.negro, padding: { x: 10, y: 6 }
    }).setVisible(false);
    this.descanso = descanso;
    escena.add.container(24, 20, [panel, this.newen, this.equilibrio, this.pinones, this.reloj, this.barras, descanso])
      .setScrollFactor(0).setDepth(mundo.alto + 4);
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
    this.barras.fillStyle(colores.suelo).fillRoundedRect(16, 43, ancho, 10, 4).fillRoundedRect(248, 43, ancho, 10, 4);
    this.barras.fillStyle(colores.techo).fillRect(16, 43, ancho * newen / partida.maximoBarra, 10);
    this.barras.fillStyle(colores.hierba).fillRect(248, 43, ancho * equilibrio / partida.maximoBarra, 10);
  }
}
