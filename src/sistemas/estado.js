import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { GestorJornadas } from './jornadas.js';
import { Pewenes } from './pewenes.js';
import { Recoleccion } from './recoleccion.js';

const CLAVE_ESTADO = 'estado';

export function crearEstadoInicial() {
  return {
    newen: A.newenInicial,
    equilibrio: A.equilibrioInicial,
    pinonesLlevados: 0,
    pinonesEntregados: 0,
    jornada: 1,
    permisosPedidos: 0,
    tomasDirectas: 0,
    pewenesUsados: []
  };
}

export function leerEstado(juego) {
  return juego.registry.get(CLAVE_ESTADO) ?? crearEstadoInicial();
}

export function guardarEstado(juego, estado) {
  juego.registry.set(CLAVE_ESTADO, estado);
  return estado;
}

// Punto de entrada del flujo D: espera la escena lateral sin importar sus módulos.
export function iniciarSistemas(escena) {
  const conectar = mundo => {
    const destino = mundo?.anclas ? mundo : escena;
    if (destino.sistemas) return;
    const estado = leerEstado(destino.game);
    guardarEstado(destino.game, estado);
    const pewenes = new Pewenes(destino, estado);
    const recoleccion = new Recoleccion(destino, estado, pewenes);
    const jornadas = new GestorJornadas(destino);
    destino.sistemas = { estado, pewenes, recoleccion, jornadas };
  };

  if (escena.anclas) conectar(escena);
  else escena.events?.once('mundo:listo', conectar);

  return () => escena.events?.off('mundo:listo', conectar);
}

