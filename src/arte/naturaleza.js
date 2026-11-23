import { filas, matriz, rect } from './pixel.js';

function mancha(datos, x, y, radioX, radioY, tono) {
  for (let dy = -radioY; dy <= radioY; dy++) {
    const ancho = Math.floor(radioX * Math.sqrt(1 - (dy / radioY) ** 2));
    rect(datos, x - ancho, y + dy, ancho * 2 + 1, 1, tono);
  }
}

function roca(variante) {
  const datos = matriz(16, 12);
  mancha(datos, 8, 8, 7 - variante, 3, 'G');
  mancha(datos, 7, 6, 5 - variante, 3, 'H');
  rect(datos, 4, 5, 3, 1, 'g');
  rect(datos, 9 - variante, 7, 3, 2, 'm');
  return filas(datos);
}

function arbusto(variante) {
  const datos = matriz(24, 16);
  mancha(datos, 12, 11, 10, 4, 'D');
  mancha(datos, 8, 9, 6, 4, 'F');
  mancha(datos, 15, 8 + variante, 7, 5, 'F');
  mancha(datos, 14, 5 + variante, 4, 2, 'V');
  rect(datos, 4, 8, 4, 2, 'V');
  return filas(datos);
}

function pasto(variante) {
  const datos = matriz(12, 10);
  for (const [x, y, alto] of [[2, 5, 3], [5, 3 + variante, 5 - variante], [8, 4, 4]]) {
    rect(datos, x, y, 2, alto, 'F');
    rect(datos, x, y - 1, 1, 2, 'V');
  }
  rect(datos, 4, 8, 6, 1, 'D');
  return filas(datos);
}

function arbol(variante) {
  const datos = matriz(48, 64);
  rect(datos, 22, 15, 5, 48, 'q');
  rect(datos, 22, 16, 2, 47, 'c');
  const copas = variante === 0 ? [[17, 27, 13, 12], [30, 22, 14, 14], [19, 16, 13, 12]]
    : [[14, 23, 11, 14], [35, 25, 11, 10], [23, 15, 15, 12]];
  for (const [x, y, rx, ry] of copas) {
    mancha(datos, x, y + 2, rx, ry, 'D');
    mancha(datos, x - 1, y - 1, rx - 2, ry - 2, 'F');
    mancha(datos, x - 3, y - 4, Math.floor(rx / 2), Math.floor(ry / 3), 'V');
  }
  rect(datos, 20, 61, 9, 3, 'q');
  return filas(datos);
}

function tronco() {
  const datos = matriz(40, 16);
  rect(datos, 4, 5, 30, 9, 'q');
  rect(datos, 5, 5, 28, 3, 'c');
  rect(datos, 10, 9, 16, 2, 'W');
  mancha(datos, 34, 9, 4, 5, 'T');
  mancha(datos, 34, 9, 2, 3, 'S');
  rect(datos, 34, 8, 1, 2, 'W');
  return filas(datos);
}

function cultivo(maiz) {
  const datos = matriz(24, 28);
  if (maiz) {
    for (const x of [7, 16]) {
      rect(datos, x, 4, 2, 24, 'F');
      rect(datos, x, 2, 2, 3, 'p');
      rect(datos, x - 4, 13, 5, 2, 'V');
      rect(datos, x + 1, 17, 6, 2, 'V');
      rect(datos, x + 2, 9, 2, 5, 'o');
    }
  } else {
    for (const [x, y] of [[7, 19], [13, 16], [17, 21]]) {
      rect(datos, x, y, 2, 27 - y, 'D');
      mancha(datos, x - 2, y, 5, 3, 'F');
      mancha(datos, x + 2, y - 1, 4, 2, 'V');
    }
    for (const x of [5, 10, 18]) mancha(datos, x, 25, 3, 2, 'T');
  }
  return filas(datos);
}

export const NATURALEZA = {
  'nat-roca-0': roca(0), 'nat-roca-1': roca(1), 'nat-roca-2': roca(2),
  'nat-arbusto-0': arbusto(0), 'nat-arbusto-1': arbusto(1),
  'nat-pasto-0': pasto(0), 'nat-pasto-1': pasto(1), 'nat-pasto-2': pasto(2),
  'nat-arbol-0': arbol(0), 'nat-arbol-1': arbol(1), 'nat-tronco-caido': tronco(),
  'nat-huerta-papa': cultivo(false), 'nat-huerta-maiz': cultivo(true)
};
