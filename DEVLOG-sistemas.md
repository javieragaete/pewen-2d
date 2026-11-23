# Bitácora — Sistemas e historia

## Etapa 1 — Estado, jornadas y reloj

- Añadidos ajustes propios en `src/ajustes/sistemas.js`, sin tocar la configuración global.
- Añadido estado del lof en `game.registry` bajo la clave `estado`, con newen, equilibrio, carga, entrega, jornada y contadores de decisiones.
- Añadido el gestor de jornadas con tarjeta inicial, reloj de 120 segundos, pausa por `jugador:bloqueado`, evento de entrega, pérdida de carga al vencer el tiempo, resumen y avance entre tres jornadas.
- El resumen muestra cuántos piñones se entregaron durante la jornada y el total del lof sobre la meta.
- Agregados el helper de píxeles del contrato y una prueba aislada con escena lateral simulada y botones para carga, entrega, pausa y avance del reloj.
- No se modificaron archivos antiguos ni archivos de otros flujos.

### Verificación

- La página aislada abrió en servidor local con Phaser 3.90.0 y mostró la tarjeta inicial.
- Se probó carga y entrega: 3 piñones pasaron de la carga al total del lof.
- Se pausó el reloj por el evento `jugador:bloqueado`; el avance simulado de 120 segundos no consumió tiempo mientras estuvo pausado.
- Al reanudar y avanzar 120 segundos, apareció el resumen de jornada con el total actualizado.
- `node --check` pasó en los módulos propios y en el arnés de prueba. No se observaron fallos durante la ejecución aislada.

