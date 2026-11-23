# Informe de integración — Pewén

Fecha de auditoría: 23-11-2026  
Repositorio: `javieragaete/pewen-2d`  
Rama objetivo: `lateral` (`9bbdc08837519122139b88db0c82837dd6cf3e35`)

## Resultado previo a cambios

La rama `lateral` no contiene los cuatro flujos unidos descritos en la solicitud. Su árbol solo incluye la versión anterior de `src/config.js`, `src/main.js`, `src/scenes/{menu,juego,hud,recoleccion}.js`, `src/sprites.js` y Phaser. No existen `src/mundo`, `src/jugador`, `src/arte`, `src/ruka`, `src/sistemas`, `src/historia`, `Interior`, `Prologo` ni `Final` en esa rama.

La inspección de ramas confirma que las piezas están separadas y con revisiones distintas: `main` tiene sistemas e historia, `ruka` tiene Interior y sus generadores, pero `mundo` y `arte` apuntan al mismo commit antiguo que `lateral`. Por eso no se puede enlazar un mundo lateral que no está publicado. No se modificó código de juego durante esta auditoría.

## (a) Texturas del contrato ausentes o con tamaño/nombre distinto

En `lateral`, `src/sprites.js` registra la nomenclatura anterior:

| Contrato | Encontrado en `lateral` | Diferencia |
|---|---|---|
| `pj-*` (16×32) | `persona-{abajo,arriba,izquierda,derecha}-{0,1}` | Nombre distinto; las matrices antiguas son 16×16 y se escalan x2. |
| `pewen-adulto-{a,b}-{sano,normal,seco}` (64×224), `pewen-joven-a-*` (40×112) | `pewen-{sano,normal,seco}` | Solo tres claves; matrices 32×40. |
| `pinon-suelo`, `pinon-cayendo-0..1` | `pinon` | Clave única con otro nombre; faltan cuadros de caída. |
| `tile-cesped-*`, `tile-tierra-*`, `tile-roca-*`, `tile-arena`, `tile-nieve`, `tile-agua-*`, `tile-agua-sup-*` (16×16) | `tile-camino`, `tile-ribera`, `tile-cielo`, `tile-suelo-bosque-*`, `tile-suelo-claro-*` | No coinciden las claves; los fondos de suelo son matrices grandes de 192×192. |
| `nat-roca-*`, `nat-arbusto-*`, `nat-pasto-*`, `nat-arbol-*`, tronco y huertas | `roca-*`, `arbusto`, `pasto-*`, `arbol-nativo-*` | Nombres y tamaños distintos; el árbol nativo antiguo es 24×32 frente a 48×64. |
| `ruka-ext-{grande,mediana,pequena}` y extras de C | `ruka` (48×32) | Las claves de C sí están generadas en la rama `ruka`: exterior 128×96, 104×80, 80×64; humo, fogón, canasto, cestería y leña también tienen claves compatibles. No están copiadas a `lateral`. |
| `npc-{kimche,lonko}-{reposo,hablar}-{0,1}` (16×32) | C genera las claves y cuadros de 16×32 en `ruka` | Coinciden en la rama `ruka`, pero no existen en `lateral`. |

## (b) Eventos entre flujos sin emisor o receptor

La auditoría compara los contratos con los árboles publicados, no presupone que las ramas separadas ya estén conectadas.

| Evento | Emisor disponible | Receptor disponible | Estado en `lateral` |
|---|---|---|---|
| `agua:cambio` `{dentro}` | Ninguno | Sistemas lo escucha en `main` | Sin emisor. |
| `rescate:orilla` `{perdidaPct}` | Sistemas lo emite en `main` y `sistemas` | Ninguno | Sin receptor Mundo. |
| `jugador:bloqueado` `{bloqueado}` | Sistemas lo emite en `main` | Interior lo escucha en `ruka`; Mundo no está publicado | Sin receptor en el mundo. |
| `entrega:pinones` | Interior lo emite en `ruka` | Sistemas lo escucha en `main` | Compatibles solo al integrar ramas. |
| `dialogo:npc` `{rol}` | Interior lo emite en `ruka` | Sistemas lo escucha en `main` | Compatibles solo al integrar ramas. |
| `jornada:inicio` `{n}` | Sistemas lo emite y sus módulos lo escuchan | Sistemas | Interno a Sistemas. |
| `jornada:fin` `{n}` | Sistemas lo emite y Recolección lo escucha | Sistemas | Interno a Sistemas. |
| `mundo:listo` | Ninguno publicado | `iniciarSistemas` lo escucha en `main` | Sin emisor porque falta `Mundo`. |
| `newen:cambio` `{newen}` | Sistemas lo emite en `main` | Ninguno | Sin consumidor de movimiento. |
| `jornada:terminar` | HUD de Sistemas lo emite | Gestor de jornadas lo escucha | Interno a Sistemas. |
| `ruka:interior`, `ruka:exterior` | Sistemas de `main` los escucha | Interior no los emite | Suscriptores sin emisor. |
| `historia:final`, `sistemas:listos` | Sistemas de `main` los emite | No se encontraron suscriptores | Eventos sin consumidor; Final ya se lanza directamente. |

## (c) Imports, escenas y nombres distintos

- `lateral/src/main.js` solo importa y registra `Menu` y `Juego`; no registra las cinco escenas requeridas.
- El mundo publicado en `lateral` es `EscenaJuego` con clave `Juego`. No existen `src/scenes/mundo.js`, `src/mundo/` ni `src/jugador/`; el contrato pide la escena `Mundo` y `escena.anclas`.
- Sistemas está en otra rama. `main` ofrece `iniciarSistemas` desde `src/sistemas/index.js`, mientras `sistemas` también mantiene una versión que lo exporta desde `src/sistemas/estado.js`. Debe elegirse una sola entrada antes de integrar.
- Hay dos contratos D concurrentes: la rama `main` usa `Sistema*`/`obtenerEstado`; `sistemas` usa clases/`leerEstado`. No deben mezclarse escenas de una versión con los módulos de la otra.
- `Interior` exporta `Interior` y tiene la clave correcta, pero solo en la rama `ruka`; importa `src/ruka/index.js` y `src/ajustes/interior.js`, que tampoco están en `lateral`.
- Prólogo y Final están en `main`, no en `lateral`. El menú de `lateral` inicia `Juego`, no `Prologo`.
- No se encontraron `DEVLOG-arte.md` ni `DEVLOG-mundo.md` en sus ramas. Las bitácoras accesibles son `DEVLOG.md` en lateral/main, `DEVLOG-ruka.md` en ruka y `DEVLOG-sistemas.md` en main/sistemas.
- Interior carga `assets/audio/tema_mapuche_tribal/tema.wav`; la bitácora Ruka no documenta su procedencia y no se encontró `CREDITS.md` que aclare la autoría.

## (d) Placeholders que siguen en las piezas disponibles

- Sistemas de la rama `sistemas` dibuja un rectángulo para cada pewén si no encuentra la clave `pewen-*` y otro rectángulo para piñones si faltan `pinon-cayendo-*`.
- Interior de la rama `ruka` usa un rectángulo como jugador si faltan sus claves `pj-*`. El generador viejo de `lateral` produce `persona-*`, por lo que esa ruta de reemplazo se activa si se mezclan sin corregir el contrato.
- La escena Interior comprueba `pj-*`; el generador viejo produce `persona-*`, así que conserva el rectángulo de respaldo si se combina sin alinear claves.
- Sistemas usa placeholders intencionales durante pruebas aisladas. No son un sustituto del registro de B/C en el juego integrado.

## (e) Archivos de la vista anterior que continúan importándose

`src/main.js` importa `src/scenes/juego.js`; este importa `src/scenes/recoleccion.js`, `src/scenes/hud.js` y `src/sprites.js`. Los cuatro archivos continúan siendo el juego ejecutado por `lateral`; no se deben mover ni eliminar hasta que Mundo y sus imports los reemplacen.

## Recomendación de integración mínima

Primero publicar en sus ramas A y B los módulos reales `src/mundo`, `src/jugador`, `src/scenes/mundo.js` y `src/arte` con las claves del contrato. Después integrar las revisiones actuales de C y D, escoger una sola versión de `iniciarSistemas`, registrar cada generador de texturas una vez y enlazar escenas/eventos. Mantener `Juego` intacto hasta que el flujo lateral pase la prueba de principio a fin; recién entonces mover los cuatro archivos anteriores a `legacy/`. Completar README, licencia, créditos y bitácora unificada con el comportamiento real de esa versión.

