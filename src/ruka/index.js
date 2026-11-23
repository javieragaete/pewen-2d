import { registrarExterior } from './exterior.js';
import { registrarArteInterior } from './interior-arte.js';
import { registrarNpcs } from './npcs.js';

export function registrarArteRuka(escena) {
  registrarExterior(escena);
  registrarArteInterior(escena);
  registrarNpcs(escena);
}
