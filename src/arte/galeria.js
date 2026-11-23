import { GRUPOS_ARTE, registrarArteBase } from './index.js';
import { CLAVES_ANIMACION } from './animaciones.js';
import { PALETA } from './pixel.js';

const ESCALA = 3;
const FONDOS = [PALETA.N, PALETA.d, PALETA.u];
const Phaser = globalThis.Phaser;

function mostrarMuestras(escena) {
  const destino = document.querySelector('#muestras');
  destino.replaceChildren();
  for (const [grupo, texturas] of Object.entries(GRUPOS_ARTE)) {
    const seccion = document.createElement('section');
    const titulo = document.createElement('h2');
    titulo.textContent = grupo;
    const muestras = document.createElement('div');
    muestras.className = 'muestras';
    seccion.append(titulo, muestras);
    destino.append(seccion);
    for (const clave of Object.keys(texturas)) {
      const figura = document.createElement('figure');
      const comparacion = document.createElement('div');
      comparacion.className = 'comparacion';
      const textura = escena.textures.get(clave).getSourceImage();
      for (const fondo of FONDOS) {
        const canvas = document.createElement('canvas');
        canvas.width = textura.width * ESCALA;
        canvas.height = textura.height * ESCALA;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = fondo;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(textura, 0, 0, canvas.width, canvas.height);
        comparacion.append(canvas);
      }
      const nombre = document.createElement('figcaption');
      nombre.textContent = clave;
      figura.append(comparacion, nombre);
      muestras.append(figura);
    }
  }
}

class Galeria extends Phaser.Scene {
  create() {
    registrarArteBase(this);
    CLAVES_ANIMACION.forEach((clave, indice) => {
      FONDOS.forEach((fondo, fila) => {
        const x = indice * 205 + 100;
        const y = fila * 108;
        this.add.rectangle(x, y + 50, 198, 100, Phaser.Display.Color.HexStringToColor(fondo).color);
        this.add.sprite(x, y + 98, this.anims.get(clave).frames[0].textureKey)
          .setScale(ESCALA).setOrigin(0.5, 1).play(clave);
      });
      this.add.text(indice * 205 + 100, 326, clave, { fontFamily: 'monospace', fontSize: '16px', color: PALETA.N })
        .setOrigin(0.5, 0);
    });
    mostrarMuestras(this);
  }
}

new Phaser.Game({
  type: Phaser.AUTO, width: 1230, height: 352, pixelArt: true,
  backgroundColor: PALETA.k, parent: 'animaciones', scene: Galeria
});
