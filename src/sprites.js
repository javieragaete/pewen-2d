import { CONFIG } from './config.js';

// El punto representa transparencia; cada otra letra selecciona un color de la paleta.
const COLOR_POR_CARACTER = {
  K: 'tinta',
  R: 'rojo',
  D: 'bosqueOscuro',
  F: 'bosque',
  V: 'verde',
  M: 'musgo',
  G: 'rocaOscura',
  H: 'roca',
  N: 'nieve',
  B: 'maderaOscura',
  W: 'madera',
  T: 'tierra',
  S: 'tierraClara',
  A: 'aguaOscura',
  C: 'agua',
  P: 'piel'
};

export const ESCALA_PIXEL = 2;

const PERSONAJE_ABAJO = [
  '......KKKK......',
  '.....KKKKKK.....',
  '.....PPPPPP.....',
  '.....PKKPPK.....',
  '......PPPP......',
  '......RRRR......',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '...RRRKKRRRRR...',
  '...RRRKKRRRRR...',
  '....RRRKKRR.....',
  '....RRRKKRR.....',
  '....KK...KK.....',
  '....KK...KK.....',
  '...KK.....KK....',
  '................'
];

const PERSONAJE_ABAJO_PASO = [
  ...PERSONAJE_ABAJO.slice(0, 12),
  '...KK.....KK....',
  '.....KK.KK......',
  '.....KK.KK......',
  '................'
];

const PERSONAJE_ARRIBA = [
  '......KKKK......',
  '.....KKKKKK.....',
  '.....KKKKKK.....',
  '.....KKKKKK.....',
  '......KKKK......',
  '......RRRR......',
  '....RRRRRRRR....',
  '...RRRRRRRRRR...',
  '...RRRKKRRRRR...',
  '...RRRKKRRRRR...',
  '....RRRKKRR.....',
  '....RRRKKRR.....',
  '....KK...KK.....',
  '....KK...KK.....',
  '...KK.....KK....',
  '................'
];

const PERSONAJE_ARRIBA_PASO = [
  ...PERSONAJE_ARRIBA.slice(0, 12),
  '...KK.....KK....',
  '.....KK.KK......',
  '.....KK.KK......',
  '................'
];

const PERSONAJE_IZQUIERDA = [
  [
    '.......KKK......',
    '......KKKK......',
    '......KKKPP.....',
    '......KPKPP.....',
    '.......PPPP.....',
    '......RRRR......',
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '....RRRKKRRR....',
    '....RRRKKRRR....',
    '.....RRKKRR.....',
    '.....RRKKRR.....',
    '......KK..KK....',
    '......KK..KK....',
    '.....KK...KK....',
    '................'
  ],
  [
    '.......KKK......',
    '......KKKK......',
    '......KKKPP.....',
    '......KPKPP.....',
    '.......PPPP.....',
    '......RRRR......',
    '.....RRRRRR.....',
    '....RRRRRRRR....',
    '....RRRKKRRR....',
    '....RRRKKRRR....',
    '.....RRKKRR.....',
    '.....RRKKRR.....',
    '......KK...KK...',
    '......KK...KK...',
    '.....KK..KK.....',
    '................'
  ]
];

export const SPRITES_PERSONAJE = {
  abajo: [PERSONAJE_ABAJO, PERSONAJE_ABAJO_PASO],
  arriba: [PERSONAJE_ARRIBA, PERSONAJE_ARRIBA_PASO],
  izquierda: PERSONAJE_IZQUIERDA,
  derecha: PERSONAJE_IZQUIERDA.map(matriz => matriz.map(fila => [...fila].reverse().join('')))
};

export function registrarSpritesPersonaje(escena) {
  for (const [direccion, cuadros] of Object.entries(SPRITES_PERSONAJE)) {
    cuadros.forEach((matriz, indice) => {
      crearTexturaDesdeMatriz(escena, `persona-${direccion}-${indice}`, matriz);
    });
  }
}

/**
 * Convierte una matriz de caracteres en una textura de Phaser.
 * Las matrices deben tener filas del mismo ancho y usar '.' para los píxeles transparentes.
 */
export function crearTexturaDesdeMatriz(escena, clave, matriz) {
  if (!Array.isArray(matriz) || matriz.length === 0 || matriz.some(fila => typeof fila !== 'string')) {
    throw new TypeError('La matriz del sprite debe ser una lista no vacía de filas de texto.');
  }

  const ancho = Math.max(...matriz.map(fila => fila.length));
  if (ancho === 0 || matriz.some(fila => fila.length !== ancho)) {
    throw new RangeError('Todas las filas de la matriz del sprite deben tener el mismo ancho.');
  }

  const textura = escena.textures.createCanvas(clave, ancho, matriz.length);
  const contexto = textura.getContext();
  contexto.imageSmoothingEnabled = false;

  for (let y = 0; y < matriz.length; y++) {
    for (let x = 0; x < ancho; x++) {
      const simbolo = matriz[y][x];
      if (simbolo === '.') continue;

      const nombreColor = COLOR_POR_CARACTER[simbolo];
      const color = CONFIG.paletaPixel[nombreColor];
      if (!color) {
        escena.textures.remove(clave);
        throw new Error(`El carácter "${simbolo}" no tiene color en la paleta pixel art.`);
      }

      contexto.fillStyle = color;
      contexto.fillRect(x, y, 1, 1);
    }
  }

  textura.refresh();
  return textura;
}
