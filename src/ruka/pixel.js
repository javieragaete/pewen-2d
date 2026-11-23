// Paleta compartida del flujo de la ruka.
export const PALETA = {
  K:'#202522',R:'#9b3a3a',D:'#344c3b',F:'#4a6845',V:'#70905a',M:'#9daf73',G:'#59635b',H:'#8b9283',
  N:'#e6e7d8',B:'#49372b',W:'#6d5139',T:'#92704b',S:'#b69a67',A:'#477b78',C:'#77a19a',P:'#c3845e',
  k:'#14181a',d:'#25382b',l:'#a3bd7c',r:'#6e2a2c',o:'#d2bd7a',p:'#9a8450',c:'#6b5a4c',q:'#4a3e36',
  g:'#a8a597',e:'#a06a49',a:'#b9d6cf',f:'#d9822b',y:'#f0c95a',s:'#a9c4cc',u:'#7fa3b3',m:'#6f8c8a'
};

export function crearTexturaDesdeMatriz(escena, clave, filas) {
  if (escena.textures.exists(clave)) return;
  const ancho = filas[0]?.length ?? 0;
  if (!ancho || filas.some(fila => fila.length !== ancho)) throw new Error('Matriz irregular: ' + clave);
  const tex = escena.textures.createCanvas(clave, ancho, filas.length);
  const ctx = tex.getContext();
  filas.forEach((fila, y) => [...fila].forEach((caracter, x) => {
    if (caracter === '.') return;
    if (!PALETA[caracter]) throw new Error('Carácter sin color: ' + caracter + ' en ' + clave);
    ctx.fillStyle = PALETA[caracter]; ctx.fillRect(x, y, 1, 1);
  }));
  tex.refresh();
}
