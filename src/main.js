import { CONFIG } from './config.js';

const Phaser = globalThis.Phaser;
if (Phaser) {
  const { EscenaJuego } = await import('./scenes/juego.js');
  new Phaser.Game({
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    parent: 'juego',
    width: CONFIG.pantalla.ancho,
    height: CONFIG.pantalla.alto,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade' },
    scene: [EscenaJuego]
  });
} else {
  const estado = document.querySelector('#estado');
  estado.textContent = 'Falta cargar Phaser. Comprueba que vendor/phaser.min.js esté disponible.';
  estado.hidden = false;
}
