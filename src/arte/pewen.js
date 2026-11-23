import { contorno, filas, matriz, rect } from './pixel.js';

const TONOS = {
  sano: ['D', 'F', 'V', 'M'],
  normal: ['d', 'D', 'F', 'V'],
  seco: ['q', 'c', 'G', 'p']
};

function rama(datos, puntos, grosor, tono) {
  for (let i = 1; i < puntos.length; i++) {
    const [x0, y0] = puntos[i - 1];
    const [x1, y1] = puntos[i];
    const pasos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let paso = 0; paso <= pasos; paso++) {
      const x = Math.round(x0 + (x1 - x0) * paso / pasos);
      const y = Math.round(y0 + (y1 - y0) * paso / pasos);
      rect(datos, x, y, grosor, grosor, tono);
    }
  }
}

function tronco(datos, centro, cima, radio) {
  const base = datos.length - 2;
  for (let y = cima; y <= base; y++) {
    const ancho = Math.max(2, Math.round(radio * (0.72 + 0.28 * y / base))) + (y > base - 8 ? 2 : 0);
    for (let dx = -ancho; dx <= ancho; dx++) {
      const anillo = (y + Math.floor(Math.abs(dx) / 2)) % 11;
      const grieta = (dx * 7 + Math.floor(y / 9) * 13 + 120) % 9;
      datos[y][centro + dx] = dx > ancho - 2 || anillo === 0 || (anillo < 4 && grieta === 0) ? 'q'
        : dx < -1 && anillo !== 9 ? 'c' : 'W';
    }
  }
}

function hojas(datos, x, y, radio, altura, tonos, semilla) {
  for (let dy = -altura; dy <= 2; dy++) {
    const borde = Math.floor(radio * Math.sqrt(Math.max(0, 1 - ((dy + altura * 0.39) / (altura * 0.68 + 1)) ** 2)));
    for (let dx = -borde; dx <= borde; dx++) {
      const patron = (Math.abs(dx * 11 + dy * 7 + semilla) % 13);
      if (Math.abs(dx) >= borde - 1 && patron < 3) continue;
      const tono = dy >= 0 ? 0 : patron < 3 ? 2 : patron === 8 && dy < -2 ? 3 : 1;
      rect(datos, x + dx, y + dy, 1, 1, tonos[tono]);
    }
  }
}

const COPAS = {
  a: [[8, 36], [11, 24], [19, 19], [29, 15], [38, 16], [47, 20], [55, 23], [57, 35]],
  b: [[8, 29], [13, 19], [23, 15], [33, 17], [43, 20], [53, 27], [56, 39], [16, 39]]
};

function adulto(variante, estado) {
  const datos = matriz(64, 224);
  const centro = variante === 'a' ? 31 : 33;
  const seco = estado === 'seco';
  tronco(datos, centro, 21, variante === 'a' ? 7 : 8);
  COPAS[variante].forEach(([x, y], i) => {
    const separacion = Math.abs(x - centro);
    const punta = seco ? y + Math.floor(separacion / 3) + 7 : y;
    const arranque = Math.max(22, y + Math.floor(separacion / 5) + 6);
    rama(datos, [[centro, arranque], [Math.round((centro + x) / 2), punta + (seco ? -5 : 2)], [x, punta]], seco ? 2 : 3, 'q');
    if (!seco || i % 3 === 0) {
      hojas(datos, x, punta + 1, seco ? 4 : estado === 'sano' ? 8 : 7, seco ? 4 : 6 + i % 3, TONOS[estado], i * 17);
    }
  });
  return filas(contorno(datos));
}

function joven(estado) {
  const datos = matriz(40, 112);
  const seco = estado === 'seco';
  tronco(datos, 20, 8, 4);
  for (let nivel = 0; nivel < 7; nivel++) {
    const y = 15 + nivel * 12;
    const alcance = 3 + nivel * 2;
    for (const lado of [-1, 1]) {
      const x = 20 + lado * alcance;
      const punta = y - (seco ? -5 : 4) + (lado === 1 ? 2 : 0);
      rama(datos, [[20, y], [x, punta]], 2, 'q');
      if (!seco || (nivel + lado) % 3 === 0) {
        hojas(datos, x, punta, seco ? 3 : 5 + nivel % 2, seco ? 3 : 7, TONOS[estado], nivel * 9 + lado);
      }
    }
  }
  return filas(contorno(datos));
}

const PINONES = {
  'pinon-suelo': ['........','.....q..','...qcq..','..qWo...','.qWTq...','.cTq....','..q.....','........'],
  'pinon-cayendo-0': ['...q....','..qWq...','..cWq...','..coq...','..cTq...','...Tq...','...q....','........'],
  'pinon-cayendo-1': ['........','.q......','.qc.....','..qWq...','...oTq..','....Tq..','.....q..','........']
};

export const PEWENES = {};
for (const estado of Object.keys(TONOS)) {
  PEWENES['pewen-adulto-a-' + estado] = adulto('a', estado);
  PEWENES['pewen-adulto-b-' + estado] = adulto('b', estado);
  PEWENES['pewen-joven-a-' + estado] = joven(estado);
}
Object.assign(PEWENES, PINONES);
