// Valores propios del flujo de sistemas; no alteran la configuración global.
export const AJUSTES_SISTEMAS = {
  newenInicial: 100,
  equilibrioInicial: 50,
  maximoEstado: 100,
  cantidadJornadas: 3,
  duracionJornadaMs: 120_000,
  metaPinones: 28,
  tarjetaJornadaMs: 1_500,
  resumenMs: 2_700,
  fundidoMs: 250,
  perdidaRescatePct: 30,
  multiplicadorNado: 1.8,
  alcanceInteraccion: 82,
  pausaPermisoMs: 950,
  permiso: { pinones: 3, equilibrio: 5, newen: -5 },
  directa: { pinones: 8, equilibrio: -15, newen: -10 },
  fraccionPermisosFinalBueno: 2 / 3,
  radioInteraccionPewen: 82,
  duracionCaidaPinonMs: 520,
  separacionPinonesMs: 105,
  duracionPinonSueloMs: 8_000,
  distanciaRecogerPinon: 34,
  umbralEquilibrioSano: 60,
  umbralEquilibrioBajo: 30,
  pewenesSecosExtraEquilibrioBajo: 1
};

