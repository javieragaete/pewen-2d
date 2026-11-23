export const CONFIG = {
  pantalla: { ancho: 1280, alto: 720 },
  mundo: { ancho: 1600, alto: 1200 },
  jugador: { inicioX: 275, inicioY: 660, velocidad: 245, radio: 14 },
  camara: { seguimiento: 0.12 },
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
  }
};

