import { CONFIG } from './config.js';
import { AJUSTES_MUNDO } from './ajustes/mundo.js';
import { iniciarSistemas } from './sistemas/estado.js';

const Phaser = globalThis.Phaser;
document.title = CONFIG.menu.titulo;

async function importarOpcional(ruta) {
  try { return await import(ruta); }
  catch (error) {
    console.info(`Escena opcional aún no disponible: ${ruta}`, error);
    return null;
  }
}

if (Phaser) {
  const { EscenaMenu } = await import('./scenes/menu.js');
  const { EscenaJuego } = await import('./scenes/juego.js');
  const [prologo, final, moduloMundo] = await Promise.all([
    importarOpcional('./scenes/prologo.js'),
    importarOpcional('./scenes/final.js'),
    importarOpcional('./scenes/mundo.js')
  ]);

  // La escena principal de Mundo se conecta al evento de listo sin editar su implementación.
  const BaseMundo = moduloMundo?.EscenaMundo ?? moduloMundo?.Mundo;
  let EscenaMundoConSistemas = null;
  if (BaseMundo) {
    EscenaMundoConSistemas = class extends BaseMundo {
      create(...args) {
        this.events.once('mundo:listo', mundo => iniciarSistemas(mundo?.anclas ? mundo : this));
        this.game.events.on('newen:cambio', this.actualizarVelocidadPorNewen, this);
        this.events.once('shutdown', () => this.game.events.off('newen:cambio', this.actualizarVelocidadPorNewen, this));
        return super.create(...args);
      }

      actualizarVelocidadPorNewen({ newen } = {}) {
        const velocidadBase = CONFIG.jugador.velocidad;
        const factor = newen <= 0 ? AJUSTES_MUNDO.velocidadSinNewen : 1;
        const velocidad = velocidadBase * factor;
        this.jugador?.body?.setMaxVelocity?.(velocidad, velocidad);
        this.velocidadJugadorActual = velocidad;
      }
    };
  }

  const escenas = [EscenaMenu, EscenaMundoConSistemas ?? EscenaJuego];
  if (prologo?.EscenaPrologo) escenas.push(prologo.EscenaPrologo);
  if (final?.EscenaFinal) escenas.push(final.EscenaFinal);

  new Phaser.Game({
    type: Phaser.AUTO,
    pixelArt: true,
    roundPixels: true,
    parent: 'juego',
    width: CONFIG.pantalla.ancho,
    height: CONFIG.pantalla.alto,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade' },
    scene: escenas
  });
} else {
  const estado = document.querySelector('#estado');
  estado.textContent = 'Falta cargar Phaser. Comprueba que vendor/phaser.min.js esté disponible.';
  estado.hidden = false;
}

