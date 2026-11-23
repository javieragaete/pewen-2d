import { registrarMatrices } from './pixel.js';
import { PERSONAJE } from './personaje.js';
import { registrarAnimaciones } from './animaciones.js';

export const GRUPOS_ARTE = { Personaje: PERSONAJE };

export function registrarArteBase(escena) {
  for (const texturas of Object.values(GRUPOS_ARTE)) registrarMatrices(escena, texturas);
  registrarAnimaciones(escena);
}
