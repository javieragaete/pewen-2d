const CLAVE = 'pewen-preferencias';

export const PREFERENCIAS_BASE = {
  audio: { master: 0.8, music: 0.7, effects: 0.8 },
  controles: { up: ['UP', 'W'], down: ['DOWN', 'S'], left: ['LEFT', 'A'], right: ['RIGHT', 'D'], interact: ['E'], permission: ['ONE'], direct: ['TWO'] }
};

const MOVIMIENTO = ['up', 'down', 'left', 'right'];

function normalizarControles(guardados = {}) {
  const controles = {};
  for (const [id, valorBase] of Object.entries(PREFERENCIAS_BASE.controles)) {
    const valor = guardados[id];
    const asignaciones = Array.isArray(valor) ? valor : valor ? [valor] : [];
    const cantidad = MOVIMIENTO.includes(id) ? 2 : 1;
    controles[id] = Array.from({ length: cantidad }, (_, indice) => asignaciones[indice] ?? valorBase[indice] ?? '');
  }
  return controles;
}

export function cargarPreferencias() {
  try {
    const guardadas = JSON.parse(localStorage.getItem(CLAVE) || '{}');
    return {
      audio: { ...PREFERENCIAS_BASE.audio, ...guardadas.audio },
      controles: normalizarControles(guardadas.controles)
    };
  } catch {
    return structuredClone(PREFERENCIAS_BASE);
  }
}

export function guardarPreferencias(preferencias) {
  localStorage.setItem(CLAVE, JSON.stringify(preferencias));
}

export function mostrarTecla(tecla) {
  return ({ UP: '↑', DOWN: '↓', LEFT: '←', RIGHT: '→', ZERO: '0', ONE: '1', TWO: '2', THREE: '3', FOUR: '4', FIVE: '5', SIX: '6', SEVEN: '7', EIGHT: '8', NINE: '9', SPACE: 'Espacio' })[tecla] || tecla;
}

export function mostrarAsignacion(asignaciones) {
  return asignaciones.filter(Boolean).map(mostrarTecla).join(' / ') || '—';
}

export function teclaDesdeEvento(evento) {
  if (evento.code.startsWith('Key')) return evento.code.slice(3).toUpperCase();
  if (evento.code.startsWith('Digit')) return ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'][Number(evento.code.slice(5))];
  return ({ ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', Space: 'SPACE', Escape: 'ESC' })[evento.code] || null;
}

export function actualizarVolumen(escena) {
  const { audio } = cargarPreferencias();
  if (escena.sound) escena.sound.volume = audio.master;
}

export function volumenCanal(canal) {
  const { audio } = cargarPreferencias();
  return audio.master * (canal === 'music' ? audio.music : audio.effects);
}
