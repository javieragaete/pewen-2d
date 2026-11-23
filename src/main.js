import { CONFIG } from './config.js';
import { Configuracion } from './scenes/configuracion.js';
import { Pausa } from './scenes/pausa.js';

const Phaser = globalThis.Phaser;
document.title = CONFIG.menu.titulo;
if (Phaser) {
  const { EscenaMenu } = await import('./scenes/menu.js');
  const { EscenaJuego } = await import('./scenes/juego.js');
  const pluginsEscena = [];
  const pluginsGlobales = [];
  if (globalThis.PhaserRaycaster) {
    pluginsEscena.push({ key: 'PhaserRaycaster', plugin: globalThis.PhaserRaycaster, mapping: 'raycasterPlugin' });
  }
  if (globalThis.rexhsladjustpipelineplugin) {
    pluginsGlobales.push({ key: 'rexHslAdjust', plugin: globalThis.rexhsladjustpipelineplugin, start: true, mapping: 'rexHslAdjust' });
  }
  new Phaser.Game({
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    parent: 'juego',
    width: CONFIG.pantalla.ancho,
    height: CONFIG.pantalla.alto,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade' },
    plugins: { global: pluginsGlobales, scene: pluginsEscena },
    scene: [EscenaMenu, Configuracion, EscenaJuego, Pausa]
  });
} else {
  const estado = document.querySelector('#estado');
  estado.textContent = 'Falta cargar Phaser. Comprueba que vendor/phaser.min.js esté disponible.';
  estado.hidden = false;
}
