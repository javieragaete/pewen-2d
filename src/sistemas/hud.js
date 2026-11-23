import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';
import { PALETA, crearMarcoPixel } from './pixel.js';

const FUENTE = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(PALETA[clave]).color;

export class SistemaHud {
  constructor(escena, estado) {
    this.escena = escena;
    this.estado = estado;
    this.graficos = escena.add.graphics().setScrollFactor(0).setDepth(9_000);
    this.etiquetas = escena.add.text(0, 0, '', {
      fontFamily: FUENTE, fontSize: '14px', color: PALETA.N
    }).setScrollFactor(0).setDepth(9_001);
    this.sugerencia = escena.add.text(16, 82, 'T: terminar jornada', {
      fontFamily: FUENTE, fontSize: '14px', color: PALETA.N,
      backgroundColor: PALETA.K, padding: { x: 8, y: 5 }
    }).setScrollFactor(0).setDepth(9_001).setVisible(false);
    this.tiempo = 0;
    this.actualizar(0, false);
  }

  dibujarIcono(x, y, matriz, tonos) {
    const celda = 2;
    matriz.forEach((fila, dy) => [...fila].forEach((clave, dx) => {
      if (clave === '.') return;
      this.graficos.fillStyle(color(tonos[clave] || clave));
      this.graficos.fillRect(x + dx * celda, y + dy * celda, celda, celda);
    }));
  }

  actualizar(segundosRestantes, puedeTerminar) {
    this.tiempo = segundosRestantes;
    this.graficos.clear();
    crearMarcoPixel(this.graficos, 12, 12, 550, 62, PALETA.K, PALETA.M);
    this.dibujarIcono(22, 25, ['.KK.', 'KMMK', 'KMMK', '.KK.'], { K: 'K', M: 'R' });
    this.dibujarIcono(180, 25, ['.VV.', 'VFMV', 'VFMV', '.VV.'], { V: 'F', F: 'V', M: 'M' });
    this.dibujarIcono(338, 25, ['..o.', '.oSo', '..W.', '..B.'], { o: 'o', S: 'S', W: 'W', B: 'B' });
    this.dibujarIcono(472, 25, ['.MMM.', 'M...M', 'M.K.M', 'M...M', '.MMM.'], { M: 'M', K: 'K' });

    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = String(Math.max(0, segundosRestantes % 60)).padStart(2, '0');
    this.etiquetas.setPosition(38, 20).setText(`N ${Math.ceil(this.estado.newen)}     E ${Math.round(this.estado.equilibrio)}      ${this.estado.pinonesLlevados}/${this.estado.pinonesEntregados}/${AJUSTES.metaPinones}      ${this.estado.jornada}/3 · ${minutos}:${segundos}`);

    this.graficos.fillStyle(color('D')).fillRect(38, 49, 112, 10);
    this.graficos.fillStyle(color('R')).fillRect(40, 51, 108 * this.estado.newen / 100, 6);
    this.graficos.fillStyle(color('D')).fillRect(194, 49, 112, 10);
    this.graficos.fillStyle(color('V')).fillRect(196, 51, 108 * this.estado.equilibrio / 100, 6);
    this.sugerencia.setVisible(puedeTerminar);
  }
}
