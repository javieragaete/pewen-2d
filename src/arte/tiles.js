import { filas, matriz, rect } from './pixel.js';

function suelo(base, sombra, luz, variante) {
  const datos = matriz(16, 16, base);
  const vetas = [[2, 3, 3], [9, 2, 3], [6, 7, 4], [11, 11, 3], [2, 12, 3]];
  for (const [x, y, ancho] of vetas) {
    const dx = (x + variante * 2) % 12 + 1;
    rect(datos, dx, y, ancho, 1, sombra);
    rect(datos, dx, y + 1, Math.max(1, ancho - 1), 1, luz);
  }
  return datos;
}

function cesped(variante) {
  const datos = suelo('T', 'c', 'S', variante);
  for (let x = 0; x < 16; x++) {
    const altura = 3 + Number((x + variante * 2) % 7 < 2);
    rect(datos, x, 0, 1, altura + 1, 'D');
    rect(datos, x, 0, 1, altura - 1, 'V');
  }
  rect(datos, 2 + variante * 4, 0, 3, 1, 'M');
  return filas(datos);
}

function agua(fase, superficie) {
  const datos = matriz(16, 16, 'C');
  const corrimiento = fase * 3;
  // Los brillos son trazos largos y no recorren el contorno del bloque.
  rect(datos, 1 + corrimiento, 5, 8, 1, 'a');
  rect(datos, 3 + corrimiento, 6, 6, 1, 'a');
  rect(datos, 6 - corrimiento, 11, 9, 1, 'A');
  rect(datos, 8 - corrimiento, 12, 5, 1, 'A');
  if (superficie) {
    rect(datos, 0, 0, 16, 1, 'a');
    rect(datos, 2 + corrimiento, 1, 7, 1, 'N');
  }
  return filas(datos);
}

export const TERRENO = {
  'tile-cesped-0': cesped(0), 'tile-cesped-1': cesped(1), 'tile-cesped-2': cesped(2),
  'tile-tierra-0': filas(suelo('T', 'c', 'S', 0)), 'tile-tierra-1': filas(suelo('T', 'c', 'S', 1)),
  'tile-roca-0': filas(suelo('G', 'D', 'H', 0)), 'tile-roca-1': filas(suelo('G', 'D', 'H', 2)),
  'tile-arena': filas(suelo('S', 'T', 'o', 1)), 'tile-nieve': filas(suelo('N', 's', 'a', 2)),
  'tile-agua-0': agua(0, false), 'tile-agua-1': agua(1, false),
  'tile-agua-sup-0': agua(0, true), 'tile-agua-sup-1': agua(1, true)
};
