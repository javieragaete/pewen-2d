export const CONFIG = {
  menu: {
    titulo: 'Pewén',
    subtitulo: 'Una jornada en el lof',
    paleta: {
      tinta: 0x101412,
      claro: 0xf5eedb,
      amarillo: { centro: 0xf6cf43, luz: 0xffe87b, sombra: 0xbe891f },
      rojo: { centro: 0xa8242b, luz: 0xed5550, sombra: 0x651c24 },
      verde: { centro: 0x246537, luz: 0x70b657, sombra: 0x153f2a },
      azul: { centro: 0x234b83, luz: 0x75bce4, sombra: 0x172d57 },
      gris: { centro: 0x343936, luz: 0x737973, sombra: 0x242924 },
      opciones: ['rojo', 'azul']
    }
  },
  pantalla: { ancho: 1280, alto: 720 },
  mundo: { ancho: 1600, alto: 1200 },
  jugador: { inicioX: 275, inicioY: 660, velocidad: 245, radio: 14 },
  camara: { seguimiento: 0.12 },
  partida: {
    newenInicial: 100,
    equilibrioInicial: 50,
    maximoBarra: 100,
    metaPinones: 20,
    duracionJornada: 120,
    desgastePorSegundo: 1.4,
    descansoPorSegundo: 22,
    alcanceDescanso: 115,
    velocidadSinNewen: 0.45
  },
  recoleccion: {
    alcance: 82,
    pausaPermiso: 950,
    duracionAviso: 1400,
    permiso: { pinones: 3, equilibrio: 5, newen: -5 },
    directa: { pinones: 8, equilibrio: -15, newen: -10 }
  },
  mapa: {
    pewenes: [[430, 405], [720, 520], [615, 875], [1330, 640]],
    ruka: { x: 222, y: 580, ancho: 126, alto: 44 },
    semilla: 29,
    matas: 430,
    piedras: 34,
    arboles: [
      [75, 300], [136, 342], [194, 277], [295, 320], [530, 226],
      [685, 352], [760, 406], [71, 803], [150, 859], [227, 918],
      [340, 988], [431, 860], [565, 1003], [709, 1048], [1253, 399],
      [1351, 353], [1430, 402], [1534, 343], [1335, 917], [1501, 1001]
    ],
    camino: [[205, 629], [333, 645], [465, 603], [598, 635], [736, 615], [887, 561], [983, 560]],
    rio: [[1135,-40],[1090,114],[1138,262],[1110,409],[1042,554],[1066,722],[1134,858],[1139,995],[1095,1240]]
  },
  colores: {
    suelo: 0x596c4e, claro: 0x6c7b55, bosque: 0x435b48,
    montana: 0x344c45, cumbre: 0xdce1ce, hierba: 0x778762,
    camino: 0x9e9167, bordeRio: 0x3d5952, rio: 0x628e8f,
    reflejo: 0x8fb0a8, roca: 0x414b43, sombra: 0x252f29,
    hoja: 0x2f5040, hojaClara: 0x42654d, madera: 0x544835,
    techo: 0xa08a56, techoSombra: 0x796344, muro: 0x78694d,
    rojo: 0xa8403a, piel: 0xc3845e, texto: '#f3f2e3', negro: '#18231e'
  },
  paletaPixel: {
    tinta: '#202522',
    rojo: '#9b3a3a',
    bosqueOscuro: '#344c3b',
    bosque: '#4a6845',
    verde: '#70905a',
    musgo: '#9daf73',
    rocaOscura: '#59635b',
    roca: '#8b9283',
    nieve: '#e6e7d8',
    maderaOscura: '#49372b',
    madera: '#6d5139',
    tierra: '#92704b',
    tierraClara: '#b69a67',
    aguaOscura: '#477b78',
    agua: '#77a19a',
    piel: '#c3845e'
  }
};
