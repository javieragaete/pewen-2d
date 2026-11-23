import { CONFIG } from './config.js';

// El punto representa transparencia; las demás letras seleccionan colores de la paleta central.
const COLOR_POR_CARACTER = {
  K: 'tinta', R: 'rojo', D: 'bosqueOscuro', F: 'bosque',
  V: 'verde', M: 'musgo', G: 'rocaOscura', H: 'roca',
  N: 'nieve', B: 'maderaOscura', W: 'madera', T: 'tierra',
  S: 'tierraClara', A: 'aguaOscura', C: 'agua', P: 'piel'
};

export const ESCALA_PIXEL = 2;

const PERSONAJE_ABAJO = [
  '......KKKK......','.....KKKKKK.....','.....PPPPPP.....','.....PKKPPK.....',
  '......PPPP......','......RRRR......','....RRRRRRRR....','...RRRRRRRRRR...',
  '...RRRKKRRRRR...','...RRRKKRRRRR...','....RRRKKRR.....','....RRRKKRR.....',
  '....KK...KK.....','....KK...KK.....','...KK.....KK....','................'
];
const PERSONAJE_ABAJO_PASO = [
  ...PERSONAJE_ABAJO.slice(0, 12),'...KK.....KK....','.....KK.KK......',
  '.....KK.KK......','................'
];
const PERSONAJE_ARRIBA = [
  '......KKKK......','.....KKKKKK.....','.....KKKKKK.....','.....KKKKKK.....',
  '......KKKK......','......RRRR......','....RRRRRRRR....','...RRRRRRRRRR...',
  '...RRRKKRRRRR...','...RRRKKRRRRR...','....RRRKKRR.....','....RRRKKRR.....',
  '....KK...KK.....','....KK...KK.....','...KK.....KK....','................'
];
const PERSONAJE_ARRIBA_PASO = [
  ...PERSONAJE_ARRIBA.slice(0, 12),'...KK.....KK....','.....KK.KK......',
  '.....KK.KK......','................'
];
const PERSONAJE_IZQUIERDA = [
  [
    '.......KKK......','......KKKK......','......KKKPP.....','......KPKPP.....',
    '.......PPPP.....','......RRRR......','.....RRRRRR.....','....RRRRRRRR....',
    '....RRRKKRRR....','....RRRKKRRR....','.....RRKKRR.....','.....RRKKRR.....',
    '......KK..KK....','......KK..KK....','.....KK...KK....','................'
  ],
  [
    '.......KKK......','......KKKK......','......KKKPP.....','......KPKPP.....',
    '.......PPPP.....','......RRRR......','.....RRRRRR.....','....RRRRRRRR....',
    '....RRRKKRRR....','....RRRKKRRR....','.....RRKKRR.....','.....RRKKRR.....',
    '......KK...KK...','......KK...KK...','.....KK..KK.....','................'
  ]
];
export const SPRITES_PERSONAJE = {
  abajo: [PERSONAJE_ABAJO, PERSONAJE_ABAJO_PASO],
  arriba: [PERSONAJE_ARRIBA, PERSONAJE_ARRIBA_PASO],
  izquierda: PERSONAJE_IZQUIERDA,
  derecha: PERSONAJE_IZQUIERDA.map(matriz => matriz.map(fila => [...fila].reverse().join('')))
};

function matrizVacia(ancho, alto) {
  return Array.from({ length: alto }, () => Array(ancho).fill('.'));
}
function guardarMatriz(matriz) {
  return matriz.map(fila => fila.join(''));
}

function crearMatrizPewen(estado) {
  const matriz = matrizVacia(32, 40);
  const tonos = {
    sano: { hoja: 'V', brillo: 'M', rama: 'D' },
    normal: { hoja: 'D', brillo: 'F', rama: 'B' },
    seco: { hoja: 'G', brillo: 'H', rama: 'B' }
  }[estado];
  const niveles = [
    { y: 1, ancho: 4 }, { y: 7, ancho: 9 }, { y: 13, ancho: 14 },
    { y: 20, ancho: 16 }, { y: 27, ancho: 13 }
  ];
  const centro = 16;

  niveles.forEach((nivel, indice) => {
    for (let dy = 0; dy < 5; dy++) {
      const mitad = Math.max(1, Math.floor(nivel.ancho * (0.42 + dy * 0.12)));
      const y = nivel.y + dy;
      for (let dx = -mitad; dx <= mitad; dx++) {
        const brillo = (Math.abs(dx) + dy + indice) % 6 === 0;
        matriz[y][centro + dx] = brillo ? tonos.brillo : tonos.hoja;
      }
    }
    const anchoRama = Math.min(15, nivel.ancho + 2);
    const yRama = nivel.y + 4;
    for (let dx = -anchoRama; dx <= anchoRama; dx++) {
      if (Math.abs(dx) >= nivel.ancho - 2) matriz[yRama][centro + dx] = tonos.rama;
    }
    if (estado === 'seco') {
      matriz[Math.min(38, yRama + 1)][centro - anchoRama] = tonos.rama;
      matriz[Math.min(38, yRama + 1)][centro + anchoRama] = tonos.rama;
    }
  });

  for (let y = 17; y < 40; y++) {
    matriz[y][15] = y % 4 === 0 ? 'B' : 'W';
    matriz[y][16] = 'B';
  }
  return guardarMatriz(matriz);
}

function crearMatrizRuka() {
  const matriz = matrizVacia(48, 32);
  const centro = 24;
  for (let y = 0; y < 15; y++) {
    const mitad = Math.min(22, 5 + Math.floor(y * 1.2));
    for (let x = centro - mitad; x <= centro + mitad; x++) {
      matriz[y][x] = y % 4 === 0 || x % 7 === 0 ? 'B' : 'S';
    }
  }
  for (let y = 13; y < 29; y++) {
    for (let x = 5; x < 43; x++) {
      matriz[y][x] = x % 8 === 0 ? 'B' : 'W';
    }
  }
  for (let y = 18; y < 32; y++) {
    for (let x = 20; x < 28; x++) matriz[y][x] = 'K';
  }
  for (let x = 8; x < 40; x += 5) matriz[14][x] = 'T';
  return guardarMatriz(matriz);
}

function crearMatrizArbolNativo(variante) {
  const matriz = matrizVacia(24, 32);
  const copa = variante === 0 ? 'D' : 'F';
  const brillo = variante === 0 ? 'V' : 'M';
  for (let y = 2; y < 24; y++) {
    for (let x = 2; x < 22; x++) {
      const dx = (x - 12) / 10;
      const dy = (y - 13) / 12;
      if (dx * dx + dy * dy < 1) {
        matriz[y][x] = ((x * 5 + y * 7 + variante * 3) % 19 === 0) ? brillo : copa;
      }
    }
  }
  for (let y = 22; y < 32; y++) {
    matriz[y][11] = 'B';
    matriz[y][12] = 'W';
  }
  return guardarMatriz(matriz);
}

function crearMatrizMontana(variante) {
  const ancho = 80;
  const alto = 44;
  const matriz = matrizVacia(ancho, alto);
  const picos = variante === 0
    ? [{ x: 16, y: 15 }, { x: 43, y: 3 }, { x: 67, y: 17 }]
    : [{ x: 13, y: 18 }, { x: 38, y: 6 }, { x: 64, y: 13 }];
  for (let x = 0; x < ancho; x++) {
    let cima = alto;
    let picoElegido = picos[0];
    for (const pico of picos) {
      const y = pico.y + Math.floor(Math.abs(x - pico.x) * 0.62);
      if (y < cima) { cima = y; picoElegido = pico; }
    }
    cima = Math.max(0, cima + ((x + variante) % 5 === 0 ? 1 : 0));
    for (let y = cima; y < alto; y++) {
      const nieve = y < cima + 5 && Math.abs(x - picoElegido.x) < 9 - Math.floor((y - cima) * 1.4);
      matriz[y][x] = nieve ? 'N' : ((x * 5 + y * 7 + variante * 3) % 19 === 0 ? 'H' : 'G');
    }
  }
  return guardarMatriz(matriz);
}

function crearMatrizCielo() {
  const matriz = matrizVacia(16, 16);
  for (let y = 0; y < 16; y++) matriz[y].fill('A');
  return guardarMatriz(matriz);
}

function crearTile(base, acento, brillo, semilla) {
  const matriz = matrizVacia(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const marca = (x * 5 + y * 11 + semilla) % 53;
      const borde = x === 0 || y === 0 || x === 15 || y === 15;
      matriz[y][x] = borde ? base : marca === 0 ? brillo : marca === 7 ? acento : base;
    }
  }
  return guardarMatriz(matriz);
}

const MATRIZ_ARBUSTO = [
  '................','.....FFFFFF.....','...FFVVVVFF.....','..FFVVVVVVFF....',
  '.FFVVVVVVVVFF...','FFVVVVVVVVVVFF..','FFVVVVVVVVVVFF..',
  '.FFVVVVVVVVFF...','..FFVVVVVVFF....','...FFVVVVFF.....',
  '.....FFFFFF.....','................'
];
const MATRIZ_ROCA_0 = [
  '................','.......HH.......','.....HHGGH......','....HGGGGGH.....',
  '...HGGGGGGGH....','..HGGGGGGGGGH...','..HHGGGGGGGHH...','...HHHHHHHHH....',
  '................','................'
];
const MATRIZ_ROCA_1 = [
  '................','......HHH.......','....HHGGGGH.....','...HGGGGGGGH....',
  '..HGGGGGGGGGH...','..HGGGGGGGGGH...','...HHGGGGGGH....','....HHHHHHHH....',
  '................','................'
];
const MATRIZ_PASTO = [
  '........','...V....','...V.M..','..VVV...','.V.V.V..',
  '..V.V...','........','........'
];
const MATRIZ_PASTO_2 = [
  '........','..M.....','..V.V...','.VVVVV..','..V.V.M.',
  '...V....','........','........'
];
const MATRIZ_PINON = [
  '...B....','..BBB...','.BWWB...','.BWWB...',
  '..BB....','...B....','..B.B...','........'
];
const MATRIZ_RELOJ = (() => {
  const matriz = matrizVacia(16, 16);
  for (let y = 1; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const distancia = dx * dx + dy * dy;
      if (distancia > 42 && distancia < 57) matriz[y][x] = 'K';
      else if (distancia <= 42) matriz[y][x] = 'N';
    }
  }
  for (let i = 0; i < 4; i++) matriz[7 - i][8] = 'K';
  for (let i = 0; i < 3; i++) matriz[8][8 + i] = 'R';
  return guardarMatriz(matriz);
})();
const MATRIZ_PINON_ICONO = [
  '......BB........','.....BWWB.......','....BWWWWB......',
  '...BWWWWWWB.....','..BWWWWWWWWB....','...BWWWWWWB.....',
  '....BWWWWB......','.....BWWB.......','......BB........',
  '.......B........','......B.B.......','................'
];
const MATRIZ_NEWEN = [
  '......RR........','.....RRRR.......','....RRRRRR......',
  '...RRRRRRRR.....','..RRRRRRRRRR....','...RRRRRRRR.....',
  '....RRRRRR......','.....RRRR.......','......RR........',
  '................','................','................'
];
const MATRIZ_EQUILIBRIO = (() => {
  const matriz = matrizVacia(16, 16);
  for (let y = 2; y < 12; y++) {
    const mitad = Math.max(1, Math.floor((y < 7 ? y - 1 : 12 - y) * 0.8));
    for (let dx = -mitad; dx <= mitad; dx++) {
      matriz[y][8 + dx] = (dx + y) % 3 === 0 ? 'M' : 'V';
    }
  }
  for (let y = 8; y < 15; y++) matriz[y][8] = 'D';
  return guardarMatriz(matriz);
})();
const MATRIZ_DESTELLO = [
  '.......N........','......NNN.......','.......N........',
  '...N...N...N....','....N.....N.....','NNNNN.....NNNNN.',
  '....N.....N.....','...N...N...N....','.......N........',
  '......NNN.......','.......N........','................',
  '................','................','................','................'
];
const MATRIZ_HUMO_0 = [
  '...HH...','..HHH...','.HH.....','..HHH...',
  '...HHH..','.....HH.','....HHH.','...HH...',
  '..HH....','...HHH..','....HH..','........'
];
const MATRIZ_HUMO_1 = [
  '....HH..','...HHH..','..HH....','...HHH..',
  '....HHH.','......HH','.....HHH','....HH..',
  '...HH...','....HHH.','.....HH.','........'
];
function crearMatrizAgua(variante) {
  const matriz = matrizVacia(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ondulacion = (x + y * 3 + variante * 5) % 9;
      matriz[y][x] = (x === 0 || y === 0 || x === 15 || y === 15 || ondulacion < 2) ? 'A' : 'C';
    }
  }
  return guardarMatriz(matriz);
}
const MATRIZ_AGUA_0 = crearMatrizAgua(0);
const MATRIZ_AGUA_1 = crearMatrizAgua(1);

export function registrarSpritesPersonaje(escena) {
  for (const [direccion, cuadros] of Object.entries(SPRITES_PERSONAJE)) {
    cuadros.forEach((matriz, indice) => {
      crearTexturaDesdeMatriz(escena, 'persona-' + direccion + '-' + indice, matriz);
    });
  }
}

export function registrarSpritesPixel(escena) {
  registrarSpritesPersonaje(escena);
  const assets = {
    'pewen-sano': crearMatrizPewen('sano'),
    'pewen-normal': crearMatrizPewen('normal'),
    'pewen-seco': crearMatrizPewen('seco'),
    ruka: crearMatrizRuka(),
    'humo-0': MATRIZ_HUMO_0,
    'humo-1': MATRIZ_HUMO_1,
    'arbol-nativo-0': crearMatrizArbolNativo(0),
    'arbol-nativo-1': crearMatrizArbolNativo(1),
    'montana-0': crearMatrizMontana(0),
    'montana-1': crearMatrizMontana(1),
    'arbusto': MATRIZ_ARBUSTO,
    'roca-0': MATRIZ_ROCA_0,
    'roca-1': MATRIZ_ROCA_1,
    'pasto-0': MATRIZ_PASTO,
    'pasto-1': MATRIZ_PASTO_2,
    'pasto-2': MATRIZ_PASTO.map((fila, y) => fila.split('').reverse().join('')),
    pinon: MATRIZ_PINON,
    'icono-pinon': MATRIZ_PINON_ICONO,
    'icono-reloj': MATRIZ_RELOJ,
    'icono-newen': MATRIZ_NEWEN,
    'icono-equilibrio': MATRIZ_EQUILIBRIO,
    destello: MATRIZ_DESTELLO,
    'agua-0': MATRIZ_AGUA_0,
    'agua-1': MATRIZ_AGUA_1,
    'tile-camino': crearTile('T', 'S', 'B', 3),
    'tile-ribera': crearTile('B', 'T', 'H', 5),
    'tile-cielo': crearMatrizCielo()
  };
  for (const estado of ['sano', 'normal', 'seco']) {
    const tonos = estado === 'sano' ? ['F', 'V', 'M'] : estado === 'normal' ? ['D', 'F', 'V'] : ['D', 'G', 'B'];
    assets['tile-suelo-bosque-' + estado] = crearTile(tonos[0], tonos[1], tonos[2], estado.length);
    assets['tile-suelo-claro-' + estado] = crearTile(estado === 'seco' ? 'T' : 'F', estado === 'seco' ? 'B' : 'V', estado === 'seco' ? 'S' : 'M', estado.length + 7);
  }
  for (const [clave, matriz] of Object.entries(assets)) {
    crearTexturaDesdeMatriz(escena, clave, matriz);
  }
}

export function crearTexturaDesdeMatriz(escena, clave, matriz) {
  if (escena.textures.exists(clave)) return escena.textures.get(clave);
  if (!Array.isArray(matriz) || matriz.length === 0 || matriz.some(fila => typeof fila !== 'string')) {
    throw new TypeError('La matriz del sprite debe ser una lista no vacía de filas de texto.');
  }
  const ancho = Math.max(...matriz.map(fila => fila.length));
  if (ancho === 0 || matriz.some(fila => fila.length !== ancho)) {
    throw new RangeError('Ancho de fila incorrecto en ' + clave);
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
        throw new Error('El carácter "' + simbolo + '" no tiene color en la paleta pixel art.');
      }
      contexto.fillStyle = color;
      contexto.fillRect(x, y, 1, 1);
    }
  }
  textura.refresh();
  return textura;
}







