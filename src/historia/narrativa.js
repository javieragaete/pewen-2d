// Textos centrales de la historia. Los marcadores se completan con el estado actual.
export const NARRATIVA = {
  prologo: [
    'Llegó el otoño a la cordillera. Las primeras nieves ya blanquean las cumbres.',
    'Cada año, el lof depende del piñón del pewén para pasar el invierno.',
    'Este año los pewenes han dado poco. Alguien debe salir a recolectar, y recordar cómo se pide lo que la tierra da.'
  ],
  jornada1: {
    Lonko: [
      'El lof se reunió anoche y acordó lo mismo: necesitamos {meta} piñones antes de que cierre el invierno.',
      'No es una orden. Es una confianza. Sal con cuidado.'
    ],
    Kimche: [
      'Antes de tomar algo del bosque, se pide permiso. Cada lugar tiene su Ngen, que lo cuida.',
      'Lo que se toma con respeto, el bosque lo devuelve.'
    ]
  },
  jornada2: {
    Kimche: {
      alto: ['El bosque te recibe. Se nota en las hojas: están más vivas.'],
      medio: ['El bosque observa. Aún puedes ayudarlo a recuperarse.'],
      bajo: ['Hay árboles secos. El bosque está callado. Algo se tomó sin cuidado.']
    },
    Lonko: ['Tenemos {n} de {meta} piñones. Faltan {falta}.']
  },
  jornada3: {
    Lonko: ['Es el último día antes de que cierre la nieve. Lo que traigas es lo que nos alcanza.'],
    Kimche: ['Tomar con prisa no es lo mismo que tomar con respeto. Piénsalo antes de elegir.']
  },
  finales: {
    inviernoBuenoConRespeto: 'El lof pasa bien el invierno. Esa noche sueñas con el bosque y despiertas sabiendo que escuchaste algo importante. Tu camino apenas comienza.',
    inviernoBueno: 'El lof pasa bien el invierno. En la próxima reunión te piden tu opinión. Tu palabra empieza a pesar.',
    bosqueDañado: 'El lof come, pero el bosque ya no responde como antes. Kimche guarda silencio.',
    inviernoDuro: 'El invierno fue duro. El lof sigue en pie, y la próxima temporada habrá que aprender de lo ocurrido.'
  }
};

