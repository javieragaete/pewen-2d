const LOGO_CODEX = 'nube-logo-codex';
const URL_CODEX = new URL('../assets/interfaz/codex.png', import.meta.url).href;

export function precargarLogoMenu(escena) {
  if (!escena.textures.exists(LOGO_CODEX)) escena.load.image(LOGO_CODEX, URL_CODEX);
}

const PIXEL = 4;
const COLOR = {
  cielo: 0x4baabe, cenit: 0x367eab, fondo: 0x568fa7, ladera: 0x376a82,
  nieve: 0xe6e7d8, nieveSombra: 0xb0cace, nube: 0xf2ebd8, nubeSombra: 0xbbd7d8,
  valle: 0x466c50, valleLuz: 0x69834e, prado: 0x557b49, pradoSombra: 0x395f47,
  orilla: 0x294a41, arena: 0xa5a27b, agua: 0x4b9eb1, aguaSombra: 0x397f98, espuma: 0xb9d6cf
};

const cuadricula = valor => Math.round(valor / PIXEL) * PIXEL;

function alturaEn(puntos, x) {
  const i = puntos.findIndex(([px]) => px >= x);
  if (i <= 0) return puntos[i === 0 ? 0 : puntos.length - 1][1];
  const [ax, ay] = puntos[i - 1];
  const [bx, by] = puntos[i];
  return cuadricula(ay + (by - ay) * (x - ax) / (bx - ax));
}

function montanas(fondo, ancho, puntos, base, color, cumbres) {
  for (let x = 0; x < ancho; x += PIXEL) {
    const y = alturaEn(puntos, x);
    fondo.fillStyle(color).fillRect(x, y, PIXEL, base - y);
    if (!cumbres) continue;
    const [pico, cima] = cumbres.find(([px, py]) => Math.abs(px - x) < 95 && y < py + 72) ?? [];
    if (pico === undefined) continue;
    const nieve = Math.max(0, cuadricula(37 - Math.abs(x - pico) / 4 + 5 * Math.sin(x / 9)));
    if (x > pico) fondo.fillStyle(COLOR.fondo).fillRect(x, y, PIXEL, Math.min(base - y, 65));
    if (nieve > 0 && y < cima + 44) {
      fondo.fillStyle(x < pico ? COLOR.nieve : COLOR.nieveSombra).fillRect(x, y, PIXEL, nieve);
    }
  }
}

function nube(escena, x, y, escala, duracion, conLogo = false) {
  const grupo = escena.add.container(x, y).setDepth(-28).setScale(escala);
  const forma = escena.add.graphics();
  grupo.add(forma);
  forma.fillStyle(COLOR.nubeSombra)
    .fillRect(4, 20, 153, 16).fillRect(24, 14, 115, 26);
  forma.fillStyle(COLOR.nube)
    .fillRect(0, 23, 152, 7).fillRect(20, 15, 110, 12)
    .fillRect(36, 7, 34, 15).fillRect(66, 0, 29, 24).fillRect(99, 10, 28, 15);
  if (conLogo && escena.textures.exists(LOGO_CODEX)) {
    const logo = escena.add.image(79, 18, LOGO_CODEX).setDisplaySize(23, 23).setInteractive({ useHandCursor: true });
    const secreto = escena.add.text(112, 17, '23', { fontFamily: 'monospace', fontSize: '12px', color: '#294a41' }).setVisible(false);
    grupo.add([logo, secreto]);
    logo.on('pointerdown', () => secreto.setVisible(!secreto.visible));
  }
  if (duracion) {
    escena.tweens.add({
      targets: grupo, x: x + 88, duration: duracion, yoyo: true, repeat: -1,
      onUpdate: () => { grupo.x = cuadricula(grupo.x); }
    });
  }
}

export function banderaRuka(escena, x, y, animar) {
  const dibujo = escena.add.graphics({ x, y }).setDepth(-21);
  const franjas = [0x171e1d, 0x6baed3, 0x29833e, 0xb7282e, 0x171e1d];
  const dibujar = fase => {
    dibujo.clear();
    dibujo.fillStyle(0x3d3027).fillRect(0, 0, 3, 63);
    for (let columna = 0; columna < 40; columna += 2) {
      const onda = 2 * Math.round(Math.sin(fase + columna / 10) * columna / 40);
      franjas.forEach((tinta, fila) => {
        dibujo.fillStyle(tinta).fillRect(3 + columna, onda + fila * 5, 2, 5);
      });
      if (columna % 8 === 2) {
        dibujo.fillStyle(0xf0ecd1).fillRect(3 + columna, onda + 2, 2, 2);
        dibujo.fillRect(3 + columna, onda + 21, 2, 2);
      }
    }
    dibujo.fillStyle(0xf0c95a).fillCircle(23, 12, 6);
    dibujo.fillStyle(0xa8242b).fillRect(22, 7, 1, 10).fillRect(18, 12, 10, 1);
  };
  dibujar(0);
  if (animar) {
    escena.tweens.addCounter({
      from: 0, to: Math.PI * 2, duration: 2400, repeat: -1,
      onUpdate: tween => dibujar(tween.getValue())
    });
  }
  return dibujo;
}

export function dibujarFondoMenu(escena, anchoPantalla, alto) {
  const panel = 560;
  const ancho = anchoPantalla - panel;
  const animar = !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const fondo = escena.add.graphics({ x: panel }).setDepth(-30);
  fondo.fillStyle(COLOR.cielo).fillRect(0, 0, ancho, alto);
  for (let x = 0; x < ancho; x += PIXEL) {
    const banda = cuadricula(62 - x / 20);
    fondo.fillStyle(COLOR.cenit).fillRect(x, 0, PIXEL, banda);
    fondo.fillStyle(COLOR.cenit, 0.25).fillRect(x, banda, PIXEL, 19);
  }
  nube(escena, panel - 64, 116, 1.28, animar ? 21000 : 0);
  nube(escena, panel + 241, 70, 0.8, animar ? 27000 : 0);
  nube(escena, panel + 483, 147, 1.38, animar ? 24000 : 0, true);

  const relieve = escena.add.graphics({ x: panel }).setDepth(-26);
  montanas(relieve, ancho, [[0, 325], [136, 190], [260, 316], [410, 219], [530, 310], [640, 239], [720, 275]], 450, COLOR.fondo);
  montanas(relieve, ancho, [[0, 348], [113, 250], [219, 319], [356, 178], [505, 317], [602, 247], [720, 328]], 450, COLOR.ladera,
    [[113, 250], [356, 178], [602, 247]]);

  for (let x = 0; x < ancho; x += PIXEL) {
    const y = alturaEn([[0, 329], [100, 344], [209, 327], [358, 413], [522, 365], [620, 306], [720, 335]], x);
    relieve.fillStyle(COLOR.valle).fillRect(x, y, PIXEL, alto - y);
    const prado = cuadricula(y + 41 + 18 * Math.sin(x / 38));
    relieve.fillStyle(COLOR.valleLuz).fillRect(x, prado, PIXEL, 19);
    relieve.fillStyle(COLOR.prado).fillRect(x, prado + 19, PIXEL, alto - prado - 19);
    const sombra = cuadricula(589 + 31 * Math.sin(x / 62));
    relieve.fillStyle(COLOR.pradoSombra).fillRect(x, sombra, PIXEL, alto - sombra);
  }

  const rio = escena.add.graphics({ x: panel }).setDepth(-24);
  const chispas = escena.add.graphics({ x: panel }).setDepth(-23);
  for (let y = 405; y < alto; y += PIXEL) {
    const t = (y - 405) / (alto - 405);
    const centro = cuadricula(351 + 73 * Math.sin(t * 4.9) - 25 * t);
    const mitad = cuadricula(7 + 210 * t ** 1.65);
    rio.fillStyle(COLOR.orilla).fillRect(centro - mitad - 8, y, mitad * 2 + 16, PIXEL);
    rio.fillStyle(COLOR.arena).fillRect(centro - mitad - 4, y, mitad * 2 + 8, PIXEL);
    rio.fillStyle(COLOR.agua).fillRect(centro - mitad, y, mitad * 2, PIXEL);
    rio.fillStyle(COLOR.aguaSombra).fillRect(centro + mitad / 2, y, mitad / 2, PIXEL);
    if (y % 20 === 5 && mitad > 22) {
      const x = centro + cuadricula(Math.sin(y * 0.13) * mitad * 0.58);
      chispas.fillStyle(COLOR.espuma).fillRect(x, y, cuadricula(8 + mitad / 8), PIXEL);
    }
  }
  if (animar) escena.tweens.add({ targets: chispas, alpha: 0.3, duration: 1800, yoyo: true, repeat: -1 });

  banderaRuka(escena, panel + 236, 290, animar);

  // Las siluetas usan las texturas que ya existen en el juego.
  for (const [clave, x, y, escala] of [
    ['ruka', 204, 362, 1.75], ['pewen-normal', 103, 498, 2.6],
    ['pewen-sano', 164, 518, 3.1], ['pewen-sano', 603, 548, 3.8],
    ['pewen-normal', 675, 585, 4.4], ['pewen-normal', 42, 697, 4.9],
    ['arbusto', 482, 681, 2.4], ['pasto-1', 532, 616, 2.4], ['arbusto', 651, 683, 2.8]
  ]) {
    escena.add.image(panel + x, y, clave).setOrigin(0.5, 1).setScale(escala).setDepth(-22);
  }
}
