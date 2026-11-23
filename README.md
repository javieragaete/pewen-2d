# Pewén

**Una aventura 2D para navegador sobre la reciprocidad y el cuidado del territorio.**

El invierno se acerca en la cordillera pewenche. En **Pewén**, juegas como una persona joven del lof que debe reunir piñones para alimentar a su comunidad. Cada jornada te obliga a decidir cuánto tomar del bosque y cómo cuidarlo para que siga dando fruto.

## Cómo se juega

1. **Explora la cordillera.** Busca pewenes y decide si pides permiso a los Ngen, guardianes del territorio, antes de recolectar.
2. **Recolecta piñones y vuelve a la ruka.** Entrega lo que llevas antes de que termine la jornada para sumar a las reservas del lof.
3. **Observa cómo cambia el entorno.** El paisaje y la disponibilidad de piñones en la siguiente jornada reflejan cómo trataste el bosque.

## Interfaz y controles

- El menú principal permite iniciar la partida o abrir la configuración.
- En configuración puedes ajustar los volúmenes general, de música y de efectos, reasignar movimiento e interacción, o restaurar los valores iniciales. Las preferencias se guardan en este navegador.
- Pulsa **Esc** durante la partida para pausar, continuar, abrir la configuración o volver al menú.
- La ayuda de movimiento aparece durante 15 segundos después de pulsar por primera vez una tecla de movimiento.
- Valores iniciales: flechas o **WASD** para moverte, **E** para interactuar, **1** para pedir permiso y **2** para recolectar directamente. Puedes cambiar o borrar las teclas secundarias desde Configuración.

## Efectos visuales

- Los piñones sueltan partículas al recolectarlos y el personaje recibe una animación breve.
- El sprite del jugador usa un ajuste HSL de Rex; no se aplica una luz puntual que sobreexponga el entorno.
- Raycaster comprueba la línea de visión hacia los pewenes cuando árboles bloquean el camino.
- Los complementos de terceros están guardados en `vendor/`; licencias y versiones están en `vendor/THIRD-PARTY-NOTICES.md`.

## Ambientación

El juego se ambienta en la cordillera mapuche pewenche antes de la colonización española. El diseño pone el foco en el cuidado del bosque y la vida comunitaria. Pedir permiso a los Ngen se representa mediante un gesto breve de respeto.

## Estado del proyecto

**Prototipo en desarrollo.** La primera versión contempla un mapa, tres jornadas y un desenlace que responde a tus decisiones. Está diseñada para navegador con **Phaser 3.90.0** y archivos estáticos.
