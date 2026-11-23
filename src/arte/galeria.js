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

function mostrarComposicion(escena) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 720;
  canvas.setAttribute('aria-label', 'Personaje y pewenes junto a un curso de agua');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const pintar = (x, y, ancho, alto, tono) => {
    ctx.fillStyle = PALETA[tono];
    ctx.fillRect(x, y, ancho, alto);
  };
  const pegar = (clave, x, y) => {
    const img = escena.textures.get(clave).getSourceImage();
    ctx.drawImage(img, x, y, img.width * ESCALA, img.height * ESCALA);
  };
  const plantar = (clave, x, suelo) => {
    const img = escena.textures.get(clave).getSourceImage();
    pegar(clave, x - Math.floor(img.width * ESCALA / 2), suelo - img.height * ESCALA);
  };

  pintar(0, 0, 1200, 720, 'u');
  // Franjas amplias y de poco contraste simulan un fondo del mundo sin depender de otro flujo.
  for (let x = 0; x < 1200; x += 6) {
    const y = 246 + 6 * Math.floor((62 * Math.sin(x / 126) + 17 * Math.cos(x / 62)) / 6);
    pintar(x, y, 6, 720 - y, 'm');
    const yBosque = 444 + 6 * Math.floor((35 * Math.cos(x / 102)) / 6);
    pintar(x, yBosque, 6, 720 - yBosque, 'A');
  }
  for (const [clave, x, suelo] of [
    ['nat-arbol-0', 36, 672], ['nat-arbol-1', 425, 672], ['nat-arbol-1', 1090, 672],
    ['nat-arbusto-0', 390, 672], ['nat-pasto-1', 465, 672], ['nat-roca-2', 475, 672],
    ['pewen-adulto-a-normal', 668, 672], ['pewen-joven-a-sano', 977, 672],
    ['pj-reposo-0', 547, 672], ['pinon-suelo', 625, 672]
  ]) plantar(clave, x, suelo);

  for (let x = 0; x < 1200; x += 48) {
    const columna = x / 48;
    if (columna >= 2 && columna <= 6) {
      pegar('tile-agua-sup-0', x, 687);
    } else {
      const clave = columna === 1 || columna === 7 ? 'tile-arena' : 'tile-cesped-' + (columna * 7 % 3);
      pegar(clave, x, 672);
    }
  }
  document.querySelector('#composicion').replaceChildren(canvas);
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
    mostrarComposicion(this);
    mostrarMuestras(this);
  }
}

new Phaser.Game({
  type: Phaser.AUTO, width: 1230, height: 352, pixelArt: true,
  backgroundColor: PALETA.k, parent: 'animaciones', scene: Galeria
});
