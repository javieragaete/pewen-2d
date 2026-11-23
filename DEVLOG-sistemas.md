# Bitácora D · Sistemas e historia

## Contrato de integración

- La entrada pública es `iniciarSistemas(escena)`. Se conecta cuando la escena de mundo emite `mundo:listo` y consume `escena.anclas`, `escena.suelo` y `escena.jugador`.
- El estado se guarda en `game.registry` con la clave `estado`.
- Los módulos no importan archivos de arte, mundo o ruka. Si una textura de B no existe, el flujo D genera un placeholder pixelado.
- La prueba aislada se ejecuta desde `pruebas/sistemas.html`; no necesita que Mundo, Interior ni otros flujos estén terminados.

## Etapa 1 · Estado, jornadas y reloj

- Estado inicial: newen 100, equilibrio 50, 0 piñones llevados/entregados, jornada 1 y contadores de decisiones.
- Implementadas tres jornadas de 120 segundos, tarjeta inicial de 1,5 s, resumen y fundido de 250 ms.
- Los eventos `jugador:bloqueado` suspenden el reloj durante diálogos, elecciones y tarjetas.
- Se emiten `jornada:inicio` y `jornada:fin`. La carga sin entregar se pierde al vencer el tiempo y el resumen informa cuántos piñones se perdieron.
- `agua:cambio` acelera el desgaste de newen. Al llegar a cero en el agua se emite `rescate:orilla` con pérdida del 30% de la carga; el sistema deja 20 de newen para evitar un rescate inmediato repetido.
- Interior: `ruka:interior` inicia recuperación continua y `ruka:exterior` la detiene. `entrega:pinones` recupera el newen y registra la carga entregada.

## Etapa 2 · Pewenes y recolección

- Pewenes colocados desde `anclas.pewenes`; las claves de B se usan si existen. Si faltan, se genera una matriz placeholder local de 16×32 y se escala x3.
- La toma con permiso entrega tres piñones, suma 5 de equilibrio, resta 5 de newen y pausa 950 ms. La toma directa entrega ocho, resta 15 de equilibrio y 10 de newen.
- Los piñones caen desde la copa al pie y se cuentan de uno en uno al pasar cerca. Cada piñón del suelo expira a los ocho segundos.
- Los árboles tomados con permiso vuelven a crecer en la siguiente jornada. Una toma directa deja seco e inactivo ese árbol; con equilibrio de 30 o menos, un tercio de los restantes queda seco temporalmente.
- En equilibrio de 60 o más, una recolección produce un piñón extra.

## Etapa 3 · HUD

- Panel compacto con iconos, barras de newen y equilibrio, carga actual, total entregado, meta y reloj.
- El HUD muestra `T: terminar jornada` cuando todos los pewenes disponibles se usaron y no hay carga ni piñones en el suelo.

## Etapa 4 · Diálogos, prólogo y finales

- Prólogo de tres pantallas; avanza con E, Enter o espacio y Esc lo salta.
- Los diálogos de Lonko y Kimche responden a la jornada, el equilibrio y la carga entregada. La caja usa un nombre, texto rápido y un máximo visual de tres líneas.
- Finales basados en meta, equilibrio y proporción de permisos; `R` reinicia el estado y vuelve a Mundo.
- Todo el texto jugable está en español y conserva las frases solicitadas.

## Etapa 5 · Balance

- Con cuatro pewenes, tres jornadas y permiso siempre, la base es 4 × 3 × 3 = 36 piñones. La meta 28 necesita 10 de 12 usos (83%) si no se cuenta el bonus de equilibrio: se requiere casi todo el bosque.
- Al alcanzar equilibrio 60, el bonus de +1 reduce el número necesario; una ruta cuidadosa puede llegar a 30 con ocho usos (dos cosechas de 3 y seis de 4). Una o dos tomas directas hacen la meta más cómoda, a cambio de equilibrio y de los finales asociados.

## Prueba aislada

- `pruebas/sistemas.html` contiene suelo, jugador rectángulo, cuatro pewenes placeholder y botones para agua, entrega y conversación.
- Controles dentro del canvas: flechas o WASD para moverse, E para interactuar, 1/2 para elegir y T para cerrar la jornada cuando se cumplen los requisitos.
