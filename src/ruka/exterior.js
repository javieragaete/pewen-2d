import { crearTexturaDesdeMatriz as crear } from './pixel.js';

const M = {
  grande: [
    '................................................................................................................................',
    '........................................................oo........................................................',
    '......................................................oooooo......................................................',
    '....................................................oooopppooo....................................................',
    '..................................................ooooppppppoooo..................................................',
    '................................................oooopppSSpppppoooo................................................',
    '..............................................ooooppppSSSpppppppoooo..............................................',
    '............................................oooopppppSSSSpppppppppoooo............................................',
    '..........................................ooooppppppSSSSSpppppppppppoooo..........................................',
    '........................................oooopppppppSSSSSSpppppppppppppoooo........................................',
    '......................................ooooppppppppSSSSSSSpppppppppppppppoooo......................................',
    '....................................oooopppppppppSSSSSSSSpppppppppppppppppoooo....................................',
    '..................................ooooppppppppppSSSSSSSSSpppppppppppppppppppoooo..................................',
    '................................oooopppppppppppSSSSSSSSSSpppppppppppppppppppppoooo................................',
    '..............................ooooppppppppppppSSSSSSSSSSSpppppppppppppppppppppppoooo..............................',
    '............................oooopppppppppppppSSSSSSSSSSSSpppppppppppppppppppppppppoooo............................',
    '..........................ooooppppppppppppppSSSSSSSSSSSSSpppppppppppppppppppppppppppoooo..........................',
    '........................oooopppppppppppppppSSSSSSSSSSSSSSpppppppppppppppppppppppppppppoooo........................',
    '......................ooooppppppppppppppppSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppoooo......................',
    '....................oooopppppppppppppppppSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppoooo....................',
    '..................ooooppppppppppppppppppSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppoooo..................',
    '................oooopppppppppppppppppppSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppoooo................',
    '..............ooooppppppppppppppppppppSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppoooo..............',
    '............oooopppppppppppppppppppSSSSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppppoooo............',
    '..........ooooppppppppppppppppppppSSSSSSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppppppoooo..........',
    '........oooopppppppppppppppppppSSSSSSSSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppppppppoooo........',
    '......ooooppppppppppppppppppppSSSSSSSSSSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppppppppppoooo......',
    '....oooopppppppppppppppppppSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppppppppppppoooo....',
    '..ooooppppppppppppppppppppSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppppppppppppppoooo..',
    'oooopppppppppppppppppppSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSpppppppppppppppppppppppppppppppppppppppppppppppppppppoooo',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'k......................................................................................................................k',
    'k..........................................................BBBBBBBBBBBB..................................................k',
    'k..........................................................BWWWWWWWWWWB..................................................k',
    'k..........................................................BWTTTTTTTTWB..................................................k',
    'k..........................................................BWTWWWWWWTWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTW....TWB..................................................k',
    'k..........................................................BWTWWWWWWTWB..................................................k',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk'
  ]
};

// Las variantes conservan la silueta tradicional y cambian remates y proporciones.
function matrizVariante(tam) {
  const ancho = { grande:128, mediana:104, pequena:80 }[tam];
  const alto = { grande:96, mediana:80, pequena:64 }[tam];
  const filas = Array.from({length: alto}, (_, y) => {
    const borde = Math.max(2, Math.floor((y < alto * .58 ? y : alto * .58) * ancho / (alto * 1.2)));
    if (y < alto * .58) {
      return Array.from({length:ancho}, (_,x) => {
        const dx = Math.abs(x - (ancho-1)/2);
        const techo = y < alto*.13 ? dx < ancho*.05 : dx < ancho*.48 - (y-alto*.13)*.15;
        if (!techo) return '.';
        if (dx < ancho*.08 && y < alto*.18) return 'o';
        if (dx < ancho*.09 || (y % 9 < 2 && dx < ancho*.4)) return 'S';
        return dx < ancho*.25 ? 'p' : 'o';
      }).join('');
    }
    const paredTop = Math.floor(alto*.54);
    return Array.from({length:ancho}, (_,x) => {
      if (y===alto-1) return 'k';
      const wall = x>=borde && x<ancho-borde;
      if (!wall) return '.';
      const puerta = x>=ancho*.44 && x<ancho*.56 && y>=alto*.75;
      if (puerta) return x===Math.floor(ancho*.44)||x===Math.ceil(ancho*.56)-1 ? 'B' : y===alto-2?'T':'.';
      if (y===paredTop||x===borde||x===ancho-borde-1) return 'k';
      if (y%11===0) return x%2?'T':'W';
      if (x%17===0) return 'B';
      return 'W';
    }).join('');
  });
  return filas;
}

const extras = {
  'ruka-humo-0':['....','..g.','.g..','....'], 'ruka-humo-1':['....','.g..','..g.','....'],
  'fogon-ext-0':['..f..','.fYf.','fYyYf','kBBBk'], 'fogon-ext-1':['..y..','.yFy.','fYfYf','kBBBk'],
  'canasto-ext':['.BBBB.','BWTWWB','BWTWWB','BSSSSB','.kkkk.'],
  'cesteria-ext':['BBBB','WTWT','TWTW','BBBB'],
  'lena-ext':['.BBBB.','BBWWBB','WWBBBB','.BBBB.']
};

export function registrarExterior(escena) {
  for (const tam of ['grande','mediana','pequena']) crear(escena, `ruka-ext-${tam}`, matrizVariante(tam));
  for (const [clave, filas] of Object.entries(extras)) crear(escena, clave, filas);
}
