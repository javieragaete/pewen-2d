import { registrarMatrices } from './pixel.js';
import { PERSONAJE } from './personaje.js';
import { PEWENES } from './pewen.js';
import { TERRENO } from './tiles.js';
import { NATURALEZA } from './naturaleza.js';
import { registrarAnimaciones } from './animaciones.js';

export const GRUPOS_ARTE = { Personaje: PERSONAJE, 'Pewenes y piñones': PEWENES, Terreno: TERRENO, Naturaleza: NATURALEZA };

export function registrarArteBase(escena) {
  for (const texturas of Object.values(GRUPOS_ARTE)) registrarMatrices(escena, texturas);
  registrarAnimaciones(escena);
}
