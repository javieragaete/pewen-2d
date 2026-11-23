import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';
import { GestorDialogos } from '../historia/dialogo.js';
import { resolverFinal } from '../historia/narrativa.js';
import { EscenaFinal } from '../scenes/final.js';
import { EscenaPrologo } from '../scenes/prologo.js';
import { SistemaEstado, guardarEstado, obtenerEstado } from './estado.js';
import { SistemaHud } from './hud.js';
import { SistemaJornadas } from './jornadas.js';
import { SistemaPewenes } from './pewenes.js';
import { SistemaRecoleccion } from './recoleccion.js';

export function iniciarSistemas(escena) {
  if (escena.__sistemasPendientes) return;
  escena.__sistemasPendientes = true;

  const iniciar = datos => {
    const mundo = datos?.anclas ? datos : escena;
    const game = mundo.game;
    const manager = game.scene;
    if (!manager.getScene('Prologo')) manager.add('Prologo', EscenaPrologo);
    if (!manager.getScene('Final')) manager.add('Final', EscenaFinal);

    const estado = obtenerEstado(game);
    const guardar = () => guardarEstado(game, estado);
    const anclas = mundo.anclas || { pewenes: [] };
    const pewenes = new SistemaPewenes(mundo, anclas.pewenes || [], estado, guardar);
    const recoleccion = new SistemaRecoleccion(mundo, estado, pewenes, guardar);
    const hud = new SistemaHud(mundo, estado);
    const sistemaEstado = new SistemaEstado(mundo, estado, guardar);
    const dialogos = new GestorDialogos(mundo, estado, AJUSTES);
    let jornadas;

    const finalizarHistoria = resultado => {
      const texto = resolverFinal(resultado, AJUSTES.metaPinones);
      game.events.emit('historia:final', { estado: resultado, texto });
      mundo.scene.launch('Final', { estado: resultado, texto });
      mundo.scene.pause();
    };
    jornadas = new SistemaJornadas(mundo, estado, pewenes, recoleccion, hud, AJUSTES, guardar, finalizarHistoria);

    const iniciarJornadas = () => jornadas.iniciar();
    game.events.once('prologo:fin', iniciarJornadas);
    const limpiarPrologo = () => game.events.off('prologo:fin', iniciarJornadas);
    escena.events.once('shutdown', limpiarPrologo);
    mundo.scene.launch('Prologo');
    mundo.scene.pause();
    game.events.emit('sistemas:listos', {
      estado,
      sistemas: { sistemaEstado, pewenes, recoleccion, hud, dialogos, jornadas },
      suelo: mundo.suelo,
      jugador: mundo.jugador
    });
    mundo.__sistemas = { estado, sistemaEstado, pewenes, recoleccion, hud, dialogos, jornadas };
  };

  escena.events.once('mundo:listo', iniciar);
  escena.events.once('shutdown', () => {
    escena.__sistemasPendientes = false;
  });
}
