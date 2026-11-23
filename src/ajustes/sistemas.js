export const AJUSTES_SISTEMAS = Object.freeze({
  anchoPantalla: 1280,
  altoPantalla: 720,
  metaPinones: 28,
  cantidadJornadas: 3,
  duracionJornadaMs: 120_000,
  tarjetaInicioMs: 1_500,
  resumenJornadaMs: 2_700,
  fundidoMs: 250,
  descansoRukaPorSegundo: 8,
  desgasteMovimientoPorSegundo: 0.14,
  multiplicadorDesgasteAgua: 2.5,
  newenMinimoRescate: 20,
  perdidaRescatePct: 30,
  umbralEquilibrioSano: 60,
  umbralEquilibrioSeco: 30,
  alcancePewen: 72,
  alcanceRecogerPinon: 22,
  expiraPinonSueloMs: 8_000,
  demoraPermisoMs: 950,
  duracionAvisoMs: 1_600,
  pinonesPermiso: 3,
  pinonesDirecta: 8,
  bonusEquilibrioAlto: 1,
  equilibrioPermiso: 5,
  equilibrioDirecta: -15,
  newenPermiso: -5,
  newenDirecta: -10,
  escalaSprite: 3,
  teclas: Object.freeze({ interactuar: 'E', terminarJornada: 'T', permiso: 'ONE', directa: 'TWO' })
});

// Con cuatro pewenes y tres jornadas, pedir permiso siempre da 36 piñones
// antes del bonus por equilibrio. La meta 28 exige 10 de 12 usos: 83%.
export function balancePermiso({ pewenes = 4, jornadas = 3, meta = AJUSTES_SISTEMAS.metaPinones } = {}) {
  const cosechaMaxima = pewenes * jornadas * AJUSTES_SISTEMAS.pinonesPermiso;
  const usosNecesarios = Math.ceil(meta / AJUSTES_SISTEMAS.pinonesPermiso);
  return { cosechaMaxima, usosNecesarios, totalUsos: pewenes * jornadas };
}
