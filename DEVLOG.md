# DEVLOG

## Etapa 1 — Base de pixel art

- Activado `pixelArt: true` y `roundPixels: true` en la configuración de Phaser.
- Añadida una paleta central de 16 colores en `src/config.js`, sin cambiar los valores de jugabilidad existentes.
- Creado `src/sprites.js` con un conversor de matrices de caracteres a texturas nativas de Phaser.
- Arte, fuentes y sonidos de terceros: ninguno añadido.

### Verificación

- La sintaxis de `main.js`, `config.js` y `sprites.js` pasó `node --check`.
- El generador de matrices pasó una comprobación aislada con una textura simulada.
- GitHub Pages devuelve 404 porque aún no hay un sitio publicado; no se pudo ejecutar la versión remota en el navegador.

## Etapa 2 — Personaje pixel art

- Reemplazado el personaje geométrico por sprites de 16x16 píxeles generados desde matrices y ampliados x2.
- Añadidas cuatro direcciones, con dos cuadros de caminata por dirección. La derecha se genera espejando la izquierda.
- Conservados el contenedor físico, el radio, la velocidad y la lógica de movimiento existentes.
- Corregida una fila de matriz que medía 17 píxeles; todas las filas ahora miden 16.
- Sin recursos de terceros.

### Verificación

- La sintaxis de `juego.js` y `sprites.js` pasó `node --check`.
- Una comprobación aislada confirmó ocho texturas de 16x16, sus filas y sus colores de paleta.
- No se pudo abrir la versión actual en navegador porque GitHub Pages todavía responde 404; falta revisar la consola y nitidez visual en una ejecución real.

## Menú principal · etapa 1

- La escena de inicio abre antes de Juego. El nombre y el subtítulo se cambian en `src/config.js` y el fondo usa formas de Phaser y la paleta existente.
- El foco se mueve con flechas o W/S y se activa con Enter, espacio o clic. La carga deshabilitada se salta al navegar. Las pantallas en preparación permiten volver con Esc o clic.
- En Edge comprobamos la navegación, el estado deshabilitado, la recarga de la página y el paso a Juego. También verificamos la recolección, el HUD, el reloj y el descanso con la consola sin errores. Las pruebas de persistencia quedan para las etapas 2 y 3.

## Etapa 3 — Pewenes y ruka

- Añadidos pewenes sanos, normales y secos con matrices de píxeles generadas por código; su apariencia cambia por umbrales discretos del equilibrio.
- La ruka incorpora techo de paja, puerta baja y humo de dos cuadros.
- Conservadas las zonas físicas existentes de interacción.

## Etapa 4 — Suelo y entorno

- Añadidos tiles repetibles de suelo, cielo y agua, junto con árboles nativos, montañas, rocas, arbustos y variaciones de pasto.
- Río con animación leve y paisaje con variación discreta según el equilibrio.
- Todos los elementos usan la paleta de `src/config.js`.

## Etapa 5 — Interfaz

- Rediseñados HUD, barras, iconos, textos de ayuda y menú de interacción con marco pixelado y fuente monoespaciada del sistema.
- Conservados los textos, opciones y valores funcionales de las interacciones.

## Etapa 6 — Efectos y pulido

- Añadidos destello breve de permiso y partículas de piñón al recolectar.
- Ajustado el tamaño de los tiles y el detalle del suelo tras revisión visual para reducir ruido.
- Simplificado el cielo del menú tras la comprobación visual para que el patrón repetido no generara motas excesivas.
- Corregido un error de ejecución del menú: `setSize` no estaba disponible en el objeto de fondo tileado y se eliminó esa llamada.
- Todo el arte continúa siendo generado desde matrices y código; no se añadieron recursos de terceros.

### Verificación final

- `node --check` pasó en módulos de configuración, sprites y escenas.
- La comprobación aislada registró 41 texturas generadas.
- En navegador local se verificaron el menú, el juego, el menú de interacción y la recolección; el HUD reflejó la recolección y no se observaron errores de consola.
- La publicación de GitHub Pages todavía no está disponible (404); la verificación se hizo en servidor local.
- No se modificaron controles ni valores de configuración o mecánicas.

## Reducción de ruido visual · Etapa 1

- Reemplacé las 430 matas dispersas por 13 manchones de 7 (91 en total), agrupados con semilla fija y separados del camino, la ruka, los pewenes y el río.
- Reduje las piedras de 34 a 12; cuatro pares y cuatro rocas aisladas. Los arbustos aparecen junto a algunas rocas.
- Reduje los árboles decorativos de 20 a 8 y los distribuí en grupos, manteniendo libres las zonas de camino e interacción.
- Añadí constantes visuales ajustables en `CONFIG.mapa.decoracion` para número de manchones, matas por manchón, piedras y radios despejados.
- Verificación local: partida abierta en navegador, decoración agrupada visible y consola sin errores. No se tocaron mecánicas ni valores jugables.

## Reducción de ruido visual · Etapas 2 a 5

### Etapa 2 — Suelo y río

- Reemplacé los puntos repetidos del suelo por manchas grandes y sutiles de paleta; el claro central ahora es una sola forma de borde orgánico, sin mosaico visible.
- Reconstruí el río como bandas continuas de ribera y agua en dos tonos. Añadí ondas largas y escasas en dos grupos alternados cada 1,4 segundos; ya no hay cuadrícula de tiles ni parpadeo sincronizado.

### Etapa 3 — Contraste de objetos

- Añadí contorno de tinta de un píxel al pewén, la ruka y el personaje. Los tres estados del pewén conservan la misma escala y ahora separan mejor su luminosidad del suelo.
- Apagué los árboles nativos y reemplacé los puntos de brillo por sombreado agrupado.

### Etapa 4 — Cerros y escala

- Reduje los cerros de juego y menú a tres, con dos tonos de roca y nieve sin moteado.
- Unifiqué la escala de sprites del mundo a x2; redibujé los cerros a mayor resolución para conservar sus dimensiones.

### Etapa 5 — Interfaz y menú

- Unifiqué los marcos de HUD, ayuda, interacción y avisos: relleno plano y un borde de 2 px.
- Compacté el HUD a iconos, barras, conteo y tiempo; el indicador de descanso ahora aparece junto al personaje.
- La ayuda se desvanece después de 8 segundos. Simplifiqué el menú a tres cerros, cuatro árboles, panel lateral liso y selección por relleno y marcador.

### Verificación

- Sintaxis de módulos validada con `node --check`.
- Menú y partida ejecutados en servidor local; se revisó visualmente el cauce continuo, la escala y el HUD. Consola sin errores.
- Las mecánicas, controles, tiempos y valores jugables permanecen iguales; solo se modificaron colores y constantes de presentación.

## Historia del lof · Etapa 1 — Jornadas y entrega

- Añadí `src/narrativa.js` como gestor aislado de jornadas: 3 jornadas, tarjetas breves y reloj basado en `partida.duracionJornada`.
- La carga se entrega automáticamente al acercarse a la ruka dentro de `partida.alcanceDescanso`; el total entregado se conserva para todo el lof.
- Al vencer el reloj, la carga que quede se pierde y se informa en el resumen. Con los cuatro pewenes usados y la carga entregada, `[E] Terminar jornada` permite avanzar antes.
- El HUD diferencia la carga actual del total/meta. Los tiempos nuevos de tarjeta, resumen y fundido están centralizados en `CONFIG.jornadas`.
- No se modificaron las cantidades de recolección ni otros valores jugables existentes.

