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
