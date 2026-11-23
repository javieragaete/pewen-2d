const GLIFOS = {
  A: [14, 27, 27, 31, 27, 27, 27], B: [30, 27, 27, 30, 27, 27, 30],
  C: [15, 24, 24, 24, 24, 24, 15], D: [30, 27, 27, 27, 27, 27, 30],
  E: [31, 24, 24, 30, 24, 24, 31], F: [31, 24, 24, 30, 24, 24, 24],
  G: [15, 24, 24, 27, 27, 27, 15], H: [27, 27, 27, 31, 27, 27, 27],
  I: [31, 14, 14, 14, 14, 14, 31], J: [7, 3, 3, 3, 27, 27, 14],
  K: [27, 27, 30, 28, 30, 27, 27], L: [24, 24, 24, 24, 24, 24, 31],
  M: [17, 27, 31, 31, 27, 27, 27], N: [19, 27, 31, 31, 27, 27, 25],
  O: [14, 27, 27, 27, 27, 27, 14], P: [30, 27, 27, 30, 24, 24, 24],
  Q: [14, 27, 27, 27, 31, 30, 15], R: [30, 27, 27, 30, 30, 27, 27],
  S: [15, 24, 24, 14, 3, 3, 30], T: [31, 14, 14, 14, 14, 14, 14],
  U: [27, 27, 27, 27, 27, 27, 14], V: [27, 27, 27, 27, 27, 14, 4],
  W: [27, 27, 27, 31, 31, 27, 17], X: [27, 27, 14, 4, 14, 27, 27],
  Y: [27, 27, 27, 14, 4, 4, 4], Z: [31, 3, 6, 12, 24, 24, 31],
  ' ': [], '.': [0, 0, 0, 0, 0, 4, 4], '>': [16, 8, 4, 2, 4, 8, 16]
};

const ACENTOS = { '\u0301': [2, 4], '\u0303': [10, 20], '\u0308': [10, 0] };

// Cada fila guarda los cinco píxeles del glifo. Las tildes se dibujan encima.
export function textoPixel(escena, x, y, texto, tamano, color) {
  const grafico = escena.add.graphics({ x, y });
  const pixel = tamano >= 60 ? 11 : tamano >= 25 ? 3 : tamano >= 20 ? 3 : 2;
  const paso = 6 * pixel;
  const puntos = [];
  let columna = 0;
  let fila = 0;
  for (const letra of texto.toLocaleUpperCase('es').split('')) {
    if (letra === '\n') {
      columna = 0;
      fila++;
      continue;
    }
    const [base, acento] = letra.normalize('NFD');
    const filas = [...(ACENTOS[acento] ?? [0, 0]), ...(GLIFOS[base] ?? GLIFOS[' '])];
    filas.forEach((bits, dy) => {
      for (let dx = 0; dx < 5; dx++) {
        if (bits & (16 >> dx)) puntos.push([columna * paso + dx * pixel, (fila * 11 + dy) * pixel]);
      }
    });
    columna++;
  }

  grafico.setColor = tinta => {
    grafico.clear();
    if (tamano >= 60) {
      grafico.fillStyle(0x492d38);
      for (const [px, py] of puntos) grafico.fillRect(px - 3, py - 3, pixel + 13, pixel + 15);
    }
    grafico.fillStyle(Phaser.Display.Color.HexStringToColor(tinta).color);
    for (const [px, py] of puntos) grafico.fillRect(px, py, pixel, pixel);
    return grafico;
  };
  return grafico.setColor(color);
}
