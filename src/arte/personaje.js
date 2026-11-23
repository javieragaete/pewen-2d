import { contorno, filas, matriz, rect } from './pixel.js';

const CABEZA = [
  '..qqq...', '.qKWKq..', 'qKWKKKq.', 'qqrrrrq.',
  'qRRRRRR.', 'qKPePP..', '.KPkPPP.', '.KKPePe.', '..Keee..', '...eP...'
];
const MANTA = [
  '...rrr....', '..rRRRr...', '.rRRRRRr..', 'rRRrRRRRr.',
  'rRRKrRRRr.', 'rRRKKrRRr.', 'rRRRKrrRr.', 'rRRRRRrRr.',
  '.rRRRRRRr.', '.KrrrKKK..', '..rRRRr...'
];

function estampar(datos, x, y, sprite) {
  sprite.forEach((fila, dy) => [...fila].forEach((color, dx) => {
    if (color !== '.' && datos[y + dy]?.[x + dx] !== undefined) datos[y + dy][x + dx] = color;
  }));
}

function pierna(datos, x, y, pie, alto, tono) {
  rect(datos, x, y, 2, alto, tono);
  rect(datos, pie, y + alto - 1, 3, 1, 'e');
  rect(datos, pie + 1, y + alto - 1, 2, 1, 'P');
}

function cuadro(pose, fase = 0) {
  const datos = matriz(16, 32);
  if (pose === 'nado') {
    // La silueta horizontal conserva el centro inferior del cuadro.
    const brazada = [0, 2, 4, 2][fase];
    estampar(datos, 6, 12 - fase % 2, CABEZA);
    rect(datos, 3, 21, 9, 5, 'r');
    rect(datos, 4, 21, 7, 3, 'R');
    rect(datos, 4, 24, 6, 1, 'K');
    rect(datos, 1, 24 + fase % 2, 4, 2, 'q');
    rect(datos, 8 + Math.min(brazada, 2), 23 + brazada % 3, 4, 2, 'P');
    return filas(contorno(datos));
  }

  const baja = pose === 'reposo' ? fase : pose === 'caminar' ? fase % 2 : 0;
  estampar(datos, 4, 3 + baja, CABEZA);
  if (pose === 'caminar') {
    const pasos = [[3, 8], [5, 7], [8, 4], [6, 6]];
    const [atras, delante] = pasos[fase];
    pierna(datos, atras, 23, atras, 7 - fase % 2, 'q');
    pierna(datos, delante, 23, delante + 1, 8, 'W');
  } else if (pose === 'salto' || pose === 'caida') {
    pierna(datos, 5, 22, 3, pose === 'salto' ? 5 : 7, 'q');
    pierna(datos, 8, 22, 9, pose === 'salto' ? 7 : 8, 'W');
  } else {
    pierna(datos, 5, 23, 5, 8, 'q');
    pierna(datos, 8, 23, 8, 8, 'W');
  }
  estampar(datos, 3, 13 + baja, MANTA);
  if (pose === 'interactuar' || pose === 'salto' || pose === 'caida') {
    const y = pose === 'caida' ? 16 : 18;
    rect(datos, 10, y, 3, 2, 'R');
    rect(datos, 13, y, 2, 2, 'P');
  }
  return filas(contorno(datos));
}

export const PERSONAJE = Object.fromEntries(
  Object.entries({ reposo: 2, caminar: 4, salto: 1, caida: 1, nado: 4, interactuar: 1 })
    .flatMap(([pose, total]) => Array.from({ length: total }, (_, i) =>
      ['pj-' + pose + (total === 1 ? '' : '-' + i), cuadro(pose, i)]))
);
