export const PROLOGO = [
  'Llegó el otoño a la cordillera. Las primeras nieves ya blanquean las cumbres.',
  'Cada año, el lof depende del piñón del pewén para pasar el invierno.',
  'Este año los pewenes han dado poco. Alguien debe salir a recolectar, y recordar cómo se pide lo que la tierra da.'
];

export function obtenerDialogos({ jornada, rol, equilibrio, entregados, meta }) {
  const falta = Math.max(0, meta - entregados);
  if (jornada === 1 && rol === 'Lonko') {
    return [
      `El lof se reunió anoche y acordó lo mismo: necesitamos ${meta} piñones antes de que cierre el invierno.`,
      'No es una orden. Es una confianza. Sal con cuidado.'
    ];
  }
  if (jornada === 1 && rol === 'Kimche') {
    return [
      'Antes de tomar algo del bosque, se pide permiso. Cada lugar tiene su Ngen, que lo cuida.',
      'Lo que se toma con respeto, el bosque lo devuelve.'
    ];
  }
  if (jornada === 2 && rol === 'Kimche') {
    const estadoBosque = equilibrio >= 60
      ? 'El bosque te recibe. Se nota en las hojas: están más vivas.'
      : equilibrio <= 30
        ? 'Hay árboles secos. El bosque está callado. Algo se tomó sin cuidado.'
        : 'El bosque observa. Aún puedes ayudarlo a recuperarse.';
    return [estadoBosque];
  }
  if (jornada === 2 && rol === 'Lonko') {
    return [`Tenemos ${entregados} de ${meta} piñones. Faltan ${falta}.`];
  }
  if (jornada === 3 && rol === 'Lonko') {
    return ['Es el último día antes de que cierre la nieve. Lo que traigas es lo que nos alcanza.'];
  }
  if (jornada === 3 && rol === 'Kimche') {
    return ['Tomar con prisa no es lo mismo que tomar con respeto. Piénsalo antes de elegir.'];
  }
  return [];
}

export function resolverFinal(estado, meta) {
  const cumplida = estado.pinonesEntregados >= meta;
  if (!cumplida) {
    return 'El invierno fue duro. El lof sigue en pie, y la próxima temporada habrá que aprender de lo ocurrido.';
  }
  if (estado.equilibrio < 60) {
    return 'El lof come, pero el bosque ya no responde como antes. Kimche guarda silencio.';
  }
  const total = estado.permisosPedidos + estado.tomasDirectas;
  if (total > 0 && estado.permisosPedidos * 3 >= total * 2) {
    return 'El lof pasa bien el invierno. Esa noche sueñas con el bosque y despiertas sabiendo que escuchaste algo importante. Tu camino apenas comienza.';
  }
  return 'El lof pasa bien el invierno. En la próxima reunión te piden tu opinión. Tu palabra empieza a pesar.';
}
