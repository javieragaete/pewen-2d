# Bitácora · Flujo C: ruka e interior

## Etapa 1 — Exterior y objetos del lof
- Añadidos generadores de texturas por matriz con la paleta y el helper del contrato.
- Preparadas texturas de ruka en tres tamaños, humo, fogón, canasto, cestería y leña.
- La variante grande se dibuja con silueta de techo a dos aguas, puerta baja y vigas.
- Página de prueba incluida en `pruebas/interior.html` para cargar la escena C.

## Etapa 2 — Interior estático
- Construida una estancia en corte lateral con pared de troncos, techo, vigas y suelo.
- Agrupados camas, witral, cestería, objetos de cocina, alimentos y leña junto a los muros.
- Reservado el centro como pasillo y fogón; se destaca la cesta de entrega junto a la salida.

## Etapa 3 — Fogón, luz, humo y habitantes
- Añadida animación de tres cuadros al fogón, luz cálida aditiva con parpadeo y humo ascendente.
- Añadidos Kimche y Lonko con texturas de reposo/habla de dos cuadros y avisos ajustables.

## Etapa 4 — Interacciones
- Movimiento lateral A/D y flechas, bloqueo por `jugador:bloqueado`, interacción con E y fundidos.
- La cesta emite `entrega:pinones`, los NPC emiten `dialogo:npc` con su rol y la puerta vuelve a `Mundo`.
- La prueba simula siete piñones y muestra en pantalla los eventos emitidos.

## Verificación pendiente
- Este checkout no contiene `vendor/phaser.min.js` ni archivos de arranque; la página usa la ruta local indicada por el contrato y muestra un error explícito mientras falte esa dependencia.
- No se ha podido confirmar visualmente la escena en navegador en este checkout.
