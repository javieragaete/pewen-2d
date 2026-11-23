import { CONFIG } from './config.js';

// El punto representa transparencia; las demás letras seleccionan colores de la paleta central.
const COLOR_POR_CARACTER = {
  K: 'tinta', R: 'rojo', D: 'bosqueOscuro', F: 'bosque',
  V: 'verde', M: 'musgo', G: 'rocaOscura', H: 'roca',
  N: 'nieve', B: 'maderaOscura', W: 'madera', T: 'tierra',
  S: 'tierraClara', A: 'aguaOscura', C: 'agua', P: 'piel'
};

export const ESCALA_PIXEL = 2;

// Marco plano compartido por HUD, ayuda y avisos para mantener una sola jerarquía visual.
export function dibujarMarcoPixel(grafico, x, y, ancho, alto, relleno, borde) {
  grafico.clear();
  grafico.fillStyle(relleno, 1).fillRect(x, y, ancho, alto);
  grafico.fillStyle(borde, 1)
    .fillRect(x, y, ancho, 2)
    .fillRect(x, y + alto - 2, ancho, 2)
    .fillRect(x, y, 2, alto)
    .fillRect(x + ancho - 2, y, 2, alto);
  return grafico;
}

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
  // La matriz base tiene la cara orientada a la derecha; la orientación
  // izquierda debe usar su espejo para coincidir con el movimiento.
  izquierda: PERSONAJE_IZQUIERDA.map(matriz => matriz.map(fila => [...fila].reverse().join(''))),
  derecha: PERSONAJE_IZQUIERDA
};

function matrizVacia(ancho, alto) {
  return Array.from({ length: alto }, () => Array(ancho).fill('.'));
}
function guardarMatriz(matriz) {
  return matriz.map(fila => fila.join(''));
}

function agregarContorno(matriz, color = 'K') {
  const salida = matriz.map(fila => fila.split(''));
  for (let y = 0; y < matriz.length; y++) {
    for (let x = 0; x < matriz[y].length; x++) {
      if (matriz[y][x] === '.') continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < matriz.length && nx >= 0 && nx < matriz[y].length && matriz[ny][nx] === '.') {
            salida[ny][nx] = color;
          }
        }
      }
    }
  }
  return salida.map(fila => fila.join(''));
}

function crearMatrizPewen(estado) {
  const matriz = matrizVacia(32, 40);
  const tonos = {
    sano: { hoja: 'M', brillo: 'V', rama: 'D' },
    normal: { hoja: 'D', brillo: 'F', rama: 'B' },
    seco: { hoja: 'H', brillo: 'G', rama: 'B' }
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
        const borde = Math.abs(dx) === mitad || dy === 4 && indice === niveles.length - 1;
        const ladoClaro = dx < -Math.max(1, Math.floor(mitad * 0.35));
        matriz[y][centro + dx] = borde ? 'K' : (ladoClaro || (dy === 2 && (dx + indice * 3 + 20) % 7 < 2)) ? tonos.brillo : tonos.hoja;
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
    matriz[y][14] = 'K'; matriz[y][15] = 'B';
    matriz[y][16] = y % 5 === 0 ? 'B' : 'W'; matriz[y][17] = 'K';
  }
  return agregarContorno(guardarMatriz(matriz));
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
  return agregarContorno(guardarMatriz(matriz));
}

function crearMatrizArbolNativo(variante) {
  const matriz = matrizVacia(24, 32);
  const copa = variante === 0 ? 'D' : 'F';
  for (let y = 2; y < 24; y++) {
    for (let x = 2; x < 22; x++) {
      const dx = (x - 12) / 10;
      const dy = (y - 13) / 12;
      if (dx * dx + dy * dy < 1) {
        // Grupos de hojas iluminadas desde arriba a la izquierda.
        const relieve = Math.sin(x * 0.74 + Math.floor(y / 3)) + Math.cos(y * 0.87);
        matriz[y][x] = dx + dy > 0.85 ? 'D' : relieve - dx - dy > 1.35 ? (variante ? 'V' : 'F') : copa;
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
  const ancho = 320;
  const alto = 88;
  const matriz = matrizVacia(ancho, alto);
  const centro = variante === 0 ? 126 : 194;
  const cimaPico = variante === 0 ? 12 : 21;
  for (let x = 0; x < ancho; x++) {
    const distancia = Math.abs(x - centro);
    const cima = Math.min(alto, Math.round(cimaPico + distancia * 0.29 + Math.sin(x * 0.045) * 1.5));
    for (let y = cima; y < alto; y++) {
      const nieve = y < cima + 13 && distancia < 22 - Math.floor((y - cima) * 1.3);
      const faldaClara = x > centro - 82 && x < centro - 12 && y < cima + (centro - x) * 0.42;
      matriz[y][x] = nieve ? 'N' : faldaClara ? 'H' : 'G';
    }
  }
  return guardarMatriz(matriz);
}

function crearMatrizCielo() {
  const matriz = matrizVacia(16, 16);
  for (let y = 0; y < 16; y++) matriz[y].fill('A');
  return guardarMatriz(matriz);
}

function crearTile(base) {
  const matriz = matrizVacia(16, 16);
  for (const fila of matriz) fila.fill(base);
  return guardarMatriz(matriz);
}

function crearTileCamino(variante) {
  const matriz = matrizVacia(16, 16);
  for (const fila of matriz) fila.fill('T');

  const detalles = [
    [[2, 2, 'S'], [10, 1, 'B'], [13, 5, 'S'], [3, 12, 'B'], [10, 14, 'S'], [5, 7, 'G'], [6, 7, 'H'], [6, 8, 'G']],
    [[4, 1, 'B'], [14, 3, 'S'], [8, 11, 'B'], [2, 8, 'S'], [12, 14, 'B'], [10, 4, 'G'], [11, 4, 'H'], [11, 5, 'G']],
    [[2, 6, 'S'], [7, 3, 'B'], [13, 9, 'S'], [5, 14, 'B'], [14, 2, 'S'], [4, 10, 'G'], [5, 10, 'H'], [5, 11, 'G']]
  ][variante % 3];

  for (const [x, y, tono] of detalles) matriz[y][x] = tono;
  return guardarMatriz(matriz);
}

function crearSuelo(base, variacion, semilla) {
  const ancho = 192;
  const alto = 192;
  const matriz = matrizVacia(ancho, alto);
  for (const fila of matriz) fila.fill(base);
  // Manchas grandes, suavemente irregulares y sin bordes repetidos en cada píxel.
  const manchas = [
    [24 + semilla * 3, 28, 19, 13],
    [75 - semilla * 2, 68, 23, 16]
  ];
  for (const [cx, cy, rx, ry] of manchas) {
    for (let y = Math.max(0, cy - ry); y < Math.min(alto, cy + ry); y++) {
      for (let x = Math.max(0, cx - rx); x < Math.min(ancho, cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const deformacion = Math.sin((x + semilla) * 0.16) * 0.07 + Math.cos((y - semilla) * 0.13) * 0.06;
        if (dx * dx + dy * dy < 1 + deformacion) matriz[y][x] = variacion;
      }
    }
  }
  return guardarMatriz(matriz);
}

function crearClaro(base) {
  const ancho = 384;
  const alto = 320;
  const matriz = matrizVacia(ancho, alto);
  const cx = ancho / 2;
  const cy = alto / 2;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const dx = (x - cx) / 182;
      const dy = (y - cy) / 147;
      const bordeOrganico = Math.sin(x * 0.055) * 0.035 + Math.sin((x + y) * 0.031) * 0.025;
      if (dx * dx + dy * dy < 1 + bordeOrganico) {
        matriz[y][x] = base;
      }
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
  '...M............MV...',
  '....MV.......M.VV...M',
  '..M..VV......VVV..MV.',
  '...VV.V...HHH.VV.VV..',
  '..M.VVV.HHNNHH.VVV...',
  '...VVV.HHHHHHGG.V..MV',
  '.....VHHHHGGHGGG..VV.',
  '...HHHGHGGGGGGGGG.VV.',
  '..HNHGGGGGGGGGFFVVV..',
  '.HHHHGGGFFGFFVVVVF...',
  '..GHGGFFVVMMVVFF.....',
  '...FFVVVVFFFFDDD.....'
];
const MATRIZ_ROCA_1 = [
  '...........M...V.',
  '.......HHH..V.V..',
  '.....HNNHHH.VVV..',
  '...HHHHHHGGH.VV..',
  '..HHGGHHGGGGGV.MV',
  '.HHHGGGGGGGGGVVV.',
  '..GGGGGVVGFFFVV..',
  '...FVVMMVVFFF....'
];
const MATRIZ_TRONCO = [
  '....................W....',
  '...................WB....',
  '.........V...MMV..WB..VV.',
  '........VVMVVVMMMVVVMVVVB',
  '.....SSSVVMMMVVVVVFFFWWBB',
  '...SSTTTSSVVVVFFFFWWTBB..',
  '..STWWWTTSTFFWWTTWWWBB...',
  '.STWSTTWTSTWWTTWWWBBB....',
  '.STWTBWWTSTWWWWWBBBB.....',
  '.STWWTTWTSTWWBBBVVM......',
  '..STWWWTTSTBBBBVVVV......',
  '...SSTTTSSBB..VVFF.......',
  '..VVVSSSVVFFVVF..........',
  '.FFVVVVVFFFF.............'
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
function crearMatrizOnda(variante) {
  const matriz = matrizVacia(32, 6);
  const inicio = variante === 0 ? 3 : 7;
  for (let x = inicio; x < 28; x++) {
    const curva = x < 12 ? 2 : 3;
    matriz[curva][x] = 'C';
    if (x > inicio + 2 && x < 25) matriz[curva + 1][x] = 'A';
  }
  return guardarMatriz(matriz);
}
const MATRIZ_ONDA_0 = crearMatrizOnda(0);
const MATRIZ_ONDA_1 = crearMatrizOnda(1);

export function registrarSpritesPersonaje(escena) {
  for (const [direccion, cuadros] of Object.entries(SPRITES_PERSONAJE)) {
    cuadros.forEach((matriz, indice) => {
      crearTexturaDesdeMatriz(escena, 'persona-' + direccion + '-' + indice, agregarContorno(matriz));
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
    'tronco-musgo': MATRIZ_TRONCO,
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
    'onda-0': MATRIZ_ONDA_0,
    'onda-1': MATRIZ_ONDA_1,
    'tile-camino-0': crearTileCamino(0),
    'tile-camino-1': crearTileCamino(1),
    'tile-camino-2': crearTileCamino(2),
    'tile-ribera': crearTile('T'),
    'tile-cielo': crearMatrizCielo()
  };
  for (const estado of ['sano', 'normal', 'seco']) {
    const tonos = estado === 'sano' ? ['F', 'V', 'M'] : estado === 'normal' ? ['D', 'F', 'V'] : ['D', 'G', 'B'];
    assets['tile-suelo-bosque-' + estado] = crearSuelo(tonos[0], tonos[1], estado.length);
    const baseClaro = estado === 'seco' ? 'T' : 'F';
    assets['tile-suelo-claro-' + estado] = crearClaro(baseClaro);
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







