# DEVLOG

## Etapa 1 — Base de pixel art

- Activado `pixelArt: true` y `roundPixels: true` en la configuración de Phaser.
- Añadida una paleta central de 16 colores en `src/config.js`, sin cambiar los valores de jugabilidad existentes.
- Creado `src/sprites.js` con el conversor de matrices de caracteres a texturas nativas de Phaser y escala entera sugerida de x4.
- El juego todavía usa los gráficos geométricos existentes: la integración visual se hará en las siguientes etapas.
- Arte, fuentes y sonidos de terceros: ninguno añadido.

### Verificación

- Pendiente de iniciar el juego y revisar la consola después de desplegar esta etapa.
