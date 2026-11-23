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

## Etapa 2 — Pewenes y recolección

- Añadido `src/sistemas/pewenes.js`: toma las anclas de Mundo, usa las texturas del contrato si están disponibles y dibuja placeholders propios si aún faltan. El árbol cercano muestra la indicación de interacción.
- Añadido `src/sistemas/recoleccion.js`: menú con permiso o toma directa, pausa del jugador y del reloj, ajuste de newen/equilibrio y caída de piñones individuales que se recogen al pasar sobre ellos. Los piñones del suelo vencen a los 8 segundos.
- Con equilibrio de 60 o más, cada cosecha deja un piñón adicional. Al comenzar la jornada siguiente se recuperan las tomas con permiso; las directas quedan secas esa jornada. Con equilibrio de 30 o menos se seca un pewén adicional.
- `iniciarSistemas` conecta estado, jornadas, pewenes y recolección al evento de mundo listo, sin importar módulos de otros flujos.
- Ampliado el arnés aislado con dos pewenes simulados y controles de prueba para acercarse, elegir y recoger.

### Verificación

- La página aislada arrancó con la tarjeta de jornada y dos pewenes placeholder, sin depender de las texturas de otros flujos.
- Pedir permiso aplicó la pausa de 950 ms, contó una decisión y dejó 3 piñones recogidos. La toma directa dejó 8, para 11 en total.
- Al avanzar 120 segundos se perdió la carga pendiente y apareció el resumen. La jornada 2 mostró recuperado el pewén tomado con permiso y seco el tomado directamente.
- La consola del navegador no mostró errores ni advertencias. `node --check` pasó en los módulos propios.

## Etapa 3 — HUD

- Añadido `HudSistemas`: panel compacto con marco simple, barras de newen y equilibrio, conteo de piñones y reloj. El indicador `T` aparece al agotar los pewenes de la jornada y entregar la carga.
- El reloj escucha la tecla `T` y cierra antes la jornada solo cuando todos los pewenes fueron usados y no quedan piñones cargados; esto evita perder carga por error.
- Al terminar la tercera jornada, el flujo pasa a la escena `Final` (se implementa en la etapa 4).
- Ordenada la página aislada para que sus botones de prueba no cubran el HUD.

### Verificación

- `node --check` pasó en `hud.js`, `jornadas.js` y `estado.js`.
- Prueba aislada abrió con Phaser y dos pewenes de reemplazo; la consola del navegador quedó sin errores ni advertencias.
- Se verificó el HUD en el canvas. La superposición inicial de botones de prueba ocultaba la esquina superior; se corrigió el layout del arnés para dejar el panel visible.

## Etapa 4 — Diálogos, prólogo y finales

- Centralizados los textos en `src/historia/narrativa.js`, con marcadores para meta, total entregado y cantidad faltante.
- Añadido el sistema de diálogo: caja inferior, texto progresivo, avance con E/Enter/espacio, cierre de movimiento y pausa del reloj. La primera conversación con Kimche empieza después de la tarjeta de jornada 1; Lonko y los diálogos posteriores quedan opcionales vía `dialogo:npc`.
- Añadidas las escenas exportadas `Prologo` y `Final`. El prólogo se puede saltar con Esc; el final evalúa meta, equilibrio y proporción de permisos, y ofrece R para reiniciar y M para volver al menú.
- El gestor de jornadas pasa a `Final` al concluir la tercera jornada. Ampliada la página aislada con controles para hablar y probar las escenas.

### Verificación

- Los módulos de historia, escenas y estado pasaron `node --check`.
- En el navegador local se vio el diálogo automático de Kimche y su segundo texto; se abrió la charla opcional de Lonko.
- Se probaron el prólogo centrado y su salida con Esc, el final por meta incumplida y el reinicio con R.
- No hubo errores ni advertencias en consola.

## Etapa 5 — Balance y pulido

- Se mantuvo la meta en 28 y se dejó `pewenesParaBalance: 8` como referencia ajustable. Cálculo con permiso siempre: con equilibrio inicial 50, los primeros dos pewenes dan 3 cada uno; los seis siguientes dan 4 al superar 60 de equilibrio. Total de ocho = 30. Siete dan 26, así que se necesitan casi todos los ocho para superar la meta. Una o dos tomas directas dan 8 cada una y vuelven la meta más cómoda, a costa de bajar el equilibrio.
- Añadidos cuatro iconos del HUD como matrices de 10×8 usando la paleta aprobada; barras y conteos se alinean en un marco de un borde. Los iconos usan escala x3.
- Añadido drenaje lento de newen al moverse, multiplicador al nadar y rescate al agotarse en agua con pérdida porcentual de carga. El newen se recupera 20 puntos al iniciar las jornadas 2 y 3 y 12 al entregar piñones en la ruka (ambos valores ajustables).
- Se emite `newen:cambio` con multiplicador 0.65 al llegar a cero y 1 al recuperarse; el flujo A debe consumir este evento para reducir/restaurar la velocidad del personaje.
- Los piñones que queden en el suelo se limpian al cerrar la jornada para que no puedan recogerse durante el resumen o una jornada posterior.
- Se corrigió una letra de la matriz del icono de piñón que no pertenecía a la paleta. Se validó el HUD tras el cambio.

### Verificación

- Todos los módulos propios pasaron `node --check`.
- En un tab nuevo, el arnés abrió sin errores ni advertencias. Se vio el nuevo HUD con iconos pixelados, las barras, el conteo y el reloj.
- El botón de rescate dejó 7 de 10 piñones tras aplicar la pérdida del 30%; el final favorable mostró el texto correspondiente a meta cumplida, equilibrio alto y proporción de permisos suficiente.
- Los diálogos, prólogo, finales y reinicio de la etapa 4 continuaron funcionando en pruebas de navegador.

