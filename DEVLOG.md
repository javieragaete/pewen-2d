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

## Interfaz, controles y pausa

- El menú pixel art conserva su presentación y ofrece **Jugar** y **Configuración**.
- La configuración guarda volúmenes y controles; flechas y WASD funcionan como asignaciones principal y secundaria. **Esc** abre la pausa, desde la que se puede continuar, configurar o volver al menú.
- El HUD presenta las teclas seleccionadas durante 15 segundos después del primer movimiento.
- Las partículas de recolección y la pulsación del personaje se conservan. Se retiró la luz puntual del jugador porque sobreexponía el mapa; el ajuste HSL de Rex solo se aplica con WebGL y Raycaster comprueba la línea de visión.
- La configuración local del menú vuelve a `Menu` al cerrar, con los controles y el arte más recientes de `origin/main` integrados.
