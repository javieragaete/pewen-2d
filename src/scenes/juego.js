import { banderaRuka } from '../paisaje-menu.js';
import { CONFIG } from '../config.js';
import { cargarPreferencias, mostrarAsignacion, reproducirEfectoAudio, volumenCanal } from '../settings.js';
import { Recoleccion } from './recoleccion.js';
import { Hud } from './hud.js';
import { ExtraHackathon } from '../extra-hackathon.js';
import { ESCALA_PIXEL, dibujarMarcoPixel, registrarSpritesPixel } from '../sprites.js';
import { GestorJornadas } from '../narrativa.js';
import { PEWENES as TEXTURAS_PEWEN } from '../arte/pewen.js';
import { registrarMatrices } from '../arte/pixel.js';

const { pantalla, mundo, jugador, camara, mapa, partida, paletaPixel } = CONFIG;
const Phaser = globalThis.Phaser;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;
const URL_TEMA = new URL('../../assets/audio/tema_mapuche_tribal/tema.wav', import.meta.url).href;
const ESCALA_ARBOL_NATIVO = 3;

export class EscenaJuego extends Phaser.Scene {
  constructor() {
    super('Juego');
  }

  init(datos = {}) {
    this.cargarGuardado = Boolean(datos.cargar);
  }

  preload() {
    if (!this.cache.audio.exists('tema-mapuche-tribal')) this.load.audio('tema-mapuche-tribal', URL_TEMA);
    for (const clave of ['pinon-recoger', 'tomar-sin-permiso', 'ambiente-degradar']) {
      const key = 'sfx-' + clave;
      if (!this.cache.audio.exists(key)) {
        this.load.audio(key, new URL(`../../assets/audio/efectos/${clave}.wav`, import.meta.url).href);
      }
    }
    this.load.on('loaderror', archivo => {
      if (archivo.key === 'tema-mapuche-tribal' || archivo.key.startsWith('sfx-')) {
        console.error('No se pudo cargar el audio:', archivo.src);
      }
    });
  }

  create() {
    this.iniciarMusicaDeFondo();
    registrarSpritesPixel(this);
    registrarMatrices(this, TEXTURAS_PEWEN);
    this.physics.world.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.dibujarMapa();
    this.crearObstaculosNaturales();
    this.crearRuka();
    this.crearJugador();
    this.newen = partida.newenInicial;
    this.equilibrio = partida.equilibrioInicial;
    this.posicionAnterior = new Phaser.Math.Vector2(this.personaje.x, this.personaje.y);
    const { controles } = cargarPreferencias();
    this.recoleccion = new Recoleccion(this, efecto => this.aplicarRecoleccion(efecto), controles);
    this.estadoPaisaje = 'normal';
    this.recoleccion.actualizarEquilibrio(this.equilibrio);
    this.hud = new Hud(this);
    this.jornadas = new GestorJornadas(this);
    this.extraHackathon = new ExtraHackathon(this);
    this.restaurarPartida();

    this.movimiento = Object.fromEntries(['up', 'down', 'left', 'right'].map(direccion =>
      [direccion, controles[direccion].filter(Boolean).map(tecla => this.input.keyboard.addKey(tecla))]));
    this.cameras.main.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.cameras.main.startFollow(this.personaje, true, camara.seguimiento, camara.seguimiento);

    const marcoAyuda = this.add.graphics({ x: 12, y: pantalla.alto - 48 });
    dibujarMarcoPixel(marcoAyuda, 0, 0, 380, 36, color('tinta'), color('musgo'));
    marcoAyuda.setScrollFactor(0).setDepth(mundo.alto + 1);
    const ayudaControl = this.add.text(24, pantalla.alto - 40, 'Mover: ' + ['up', 'left', 'down', 'right'].map(k => mostrarAsignacion(controles[k])).join(' '), {
      fontFamily: mono, fontSize: '16px', color: paletaPixel.nieve
    }).setScrollFactor(0).setDepth(mundo.alto + 1);
    this.crearPausa();
    this.time.delayedCall(8000, () => this.tweens.add({
      targets: [marcoAyuda, ayudaControl], alpha: 0, duration: 500,
      onComplete: () => { marcoAyuda.setVisible(false); ayudaControl.setVisible(false); }
    }));
  }

  crearPausa() {
    const fondo = this.add.rectangle(pantalla.ancho / 2, pantalla.alto / 2, pantalla.ancho, pantalla.alto, 0x101412, 0.82);
    const titulo = this.add.text(pantalla.ancho / 2, 270, 'Juego en pausa', { fontFamily: mono, fontSize: '32px', color: paletaPixel.nieve }).setOrigin(0.5);
    const guardar = this.add.text(pantalla.ancho / 2, 360, '[ Guardar y volver al menú ]', { fontFamily: mono, fontSize: '22px', color: paletaPixel.musgo }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const seguir = this.add.text(pantalla.ancho / 2, 420, '[ Continuar ]', { fontFamily: mono, fontSize: '20px', color: paletaPixel.nieve }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const zonaGuardar = this.add.zone(pantalla.ancho / 2, 360, 520, 58).setInteractive({ useHandCursor: true });
    const zonaSeguir = this.add.zone(pantalla.ancho / 2, 420, 300, 54).setInteractive({ useHandCursor: true });
    this.panelPausa = this.add.container(0, 0, [fondo, titulo, zonaGuardar, zonaSeguir, guardar, seguir]).setScrollFactor(0).setDepth(mundo.alto + 30).setVisible(false);
    this.pausado = false;
    this.manejarEsc = () => this.alternarPausa();
    this.input.keyboard.on('keydown-ESC', this.manejarEsc);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown-ESC', this.manejarEsc));
    this.manejarClickPausa = pointer => {
      if (!this.pausado && pointer.x >= pantalla.ancho - 112 && pointer.y <= 76) {
        this.alternarPausa(true);
      } else if (this.pausado && pointer.x >= 340 && pointer.x <= 940) {
        if (pointer.y >= 320 && pointer.y <= 395) this.guardarYSalir();
        else if (pointer.y >= 396 && pointer.y <= 465) this.alternarPausa(false);
      }
    };
    this.input.on('pointerdown', this.manejarClickPausa);
    this.events.once('shutdown', () => this.input.off('pointerdown', this.manejarClickPausa));
    this.botonPausa = this.add.text(pantalla.ancho - 54, 22, 'Ⅱ', { fontFamily: mono, fontSize: '22px', color: paletaPixel.nieve, backgroundColor: paletaPixel.tinta, padding: { x: 10, y: 5 } })
      .setScrollFactor(0).setDepth(mundo.alto + 10).setInteractive({ useHandCursor: true });
  }

  alternarPausa(forzar = !this.pausado) {
    if (forzar === this.pausado) return;
    if (forzar) {
      this.inicioPausa = this.time.now;
      this.personaje.body.setVelocity(0, 0);
    } else if (this.inicioPausa !== undefined && this.jornadas.finJornada !== null) {
      this.jornadas.finJornada += this.time.now - this.inicioPausa;
      this.inicioPausa = undefined;
    }
    this.pausado = forzar;
    if (this.pausado) this.extraHackathon.actualizar(false);
    this.panelPausa.setVisible(this.pausado);
  }

  guardarPartida() {
    const datos = {
      jornada: this.jornadas.jornada,
      totalLof: this.jornadas.totalLof,
      entregadoJornada: this.jornadas.entregadoJornada,
      segundosRestantes: this.jornadas.segundosRestantes ?? partida.duracionJornada,
      newen: this.newen,
      equilibrio: this.equilibrio,
      pinones: this.recoleccion.pinones,
      pinonesJornada: this.recoleccion.pinonesJornada,
      distribucionPewenes: this.recoleccion.pewenes.map(({ x, y, tipo }) => ({ x, y, tipo })),
      completoConsumido: !this.extraHackathon.disponible,
      reporteTerminado: this.extraHackathon.reporteTerminado,
      recolectados: this.recoleccion.pewenes.map(pewen => pewen.recolectado)
    };
    try {
      localStorage.setItem('pewen-partida', JSON.stringify(datos));
      return true;
    } catch (error) {
      console.error('No se pudo guardar la partida:', error);
      return false;
    }
  }

  restaurarPartida() {
    if (!this.cargarGuardado) return;
    try {
      const datos = JSON.parse(localStorage.getItem('pewen-partida'));
      if (!datos) return;
      this.newen = datos.newen;
      if (datos.completoConsumido === true) this.extraHackathon.marcarCompletoConsumido();
      if (datos.reporteTerminado === true) this.extraHackathon.finalizarReporte();
      this.equilibrio = datos.equilibrio;
      this.recoleccion.pinones = datos.pinones;
      this.recoleccion.pinonesJornada = datos.pinonesJornada ?? (datos.entregadoJornada || 0) + (datos.pinones || 0);
      this.recoleccion.restaurarDistribucion(datos.distribucionPewenes);
      this.recoleccion.pewenes.forEach((pewen, i) => {
        pewen.recolectado = Boolean(datos.recolectados?.[i]);
        pewen.pinones.setVisible(!pewen.recolectado);
      });
      Object.assign(this.jornadas, {
        jornada: datos.jornada,
        totalLof: datos.totalLof,
        entregadoJornada: datos.entregadoJornada,
        estado: 'libre',
        segundosRestantes: datos.segundosRestantes,
        finJornada: this.time.now + datos.segundosRestantes * 1000
      });
    } catch {
      localStorage.removeItem('pewen-partida');
    }
  }

  guardarYSalir() {
    if (!this.guardarPartida()) return;
    this.scene.start('Menu');
  }

  iniciarMusicaDeFondo() {
    this.musica = this.sound.add('tema-mapuche-tribal', {
      loop: true,
      volume: 0.24 * volumenCanal('music')
    });
    this._iniciarMusica = () => {
      if (this.sound.locked || !this.musica || this.musica.isPlaying) return;
      this.sound.off(Phaser.Sound.Events.UNLOCKED, this._iniciarMusica);
      this.musica.play();
    };
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, this._iniciarMusica);
    else this._iniciarMusica();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.off(Phaser.Sound.Events.UNLOCKED, this._iniciarMusica);
      this.musica?.stop();
    });
  }

  dibujarMapa() {
    this.obstaculosNaturales = [];
    this.arbolesAlViento = [];
    this.segundosViento = 0;
    const anchoTile = 32;
    this.fondoSuelo = this.add.tileSprite(0, 0, mundo.ancho, mundo.alto, 'tile-suelo-bosque-normal')
      .setOrigin(0).setDepth(-20);
    this.fondoSuelo.tileScaleX = 2;
    this.fondoSuelo.tileScaleY = 2;
    // Un único claro con borde orgánico evita la silueta de una cuadrícula de tiles.
    this.terrenoClaro = this.add.image(80, 320, 'tile-suelo-claro-normal')
      .setOrigin(0).setScale(ESCALA_PIXEL).setDepth(-19);

    // Franja del cielo detrás de la cordillera. Cada nube vuelve por el borde opuesto.
    this.add.rectangle(0, 0, mundo.ancho, 200, 0x779da1).setOrigin(0).setDepth(-18);
    this.nubes = [[60, 55, 2, 8], [470, 22, 3, 11], [920, 74, 2, 7], [1310, 38, 3, 9]]
      .map(([x, y, escala, velocidad], i) => {
        const dibujo = this.add.graphics().setPosition(x, y).setScale(escala).setDepth(-17);
        dibujo.fillStyle(0xb8d0cf).fillRect(1, 8, 42, 4).fillRect(6, 12, 33, 2);
        dibujo.fillStyle(0xebeadd).fillRect(0, 7, 41, 3).fillRect(5, 4, 30, 4)
          .fillRect(10 + i * 2, 0, 9, 6).fillRect(20, 3, 9, 5);
        return { dibujo, x, velocidad };
      });

    // Siluetas de montaña hechas con píxeles de la paleta.
    [[-20, 260, 0], [580, 260, 1], [1180, 260, 0]]
      .forEach(([x, y, variante]) => {
        this.add.image(x, y, 'montana-' + variante).setOrigin(0, 1).setScale(ESCALA_PIXEL).setDepth(-15);
      });

    this.nevada = this.add.graphics().setDepth(-14);

    // Camino discreto en una cuadrícula pixelada de 32 unidades.
    const caminoTiles = new Set();
    for (let i = 0; i < mapa.camino.length - 1; i++) {
      const [ax, ay] = mapa.camino[i];
      const [bx, by] = mapa.camino[i + 1];
      const distancia = Phaser.Math.Distance.Between(ax, ay, bx, by);
      const pasos = Math.max(1, Math.ceil(distancia / 18));
      for (let paso = 0; paso <= pasos; paso++) {
        const t = paso / pasos;
        const x = Math.round((ax + (bx - ax) * t) / anchoTile) * anchoTile;
        const y = Math.round((ay + (by - ay) * t) / anchoTile) * anchoTile;
        caminoTiles.add(x + ',' + y);
      }
    }
    const caminoOrdenado = [...caminoTiles].map(clave => clave.split(',').map(Number));
    caminoOrdenado.forEach(([x, y], indice) => {
      const variante = Math.abs(Math.trunc((x / anchoTile) * 7 + (y / anchoTile) * 13)) % 3;
      this.add.image(x, y, 'tile-camino-' + variante).setOrigin(0).setScale(2).setDepth(-10);

      if (indice % 5 !== 2) return;
      const anterior = caminoOrdenado[Math.max(0, indice - 1)];
      const siguiente = caminoOrdenado[Math.min(caminoOrdenado.length - 1, indice + 1)];
      const dx = siguiente[0] - anterior[0];
      const dy = siguiente[1] - anterior[1];
      const largo = Math.hypot(dx, dy) || 1;
      const lado = Math.floor(indice / 5) % 2 === 0 ? 1 : -1;
      const piedraX = x + anchoTile / 2 - (dy / largo) * 7 * lado;
      const piedraY = y + anchoTile / 2 + (dx / largo) * 7 * lado;
      this.add.image(piedraX, piedraY, 'roca-' + (indice % 2))
        .setOrigin(0.5).setScale(1).setAlpha(0.9).setDepth(-9);
    });

    // Cauce continuo: una ribera sobria, dos tonos de agua y ondas largas espaciadas.
    const curva = new Phaser.Curves.Spline(mapa.rio.map(([x, y]) => new Phaser.Math.Vector2(x, y)));
    const puntos = curva.getPoints(240);
    const dibujarBanda = (anchoMedio, claveColor, profundidad, alpha = 1) => {
      const izquierda = [];
      const derecha = [];
      puntos.forEach((punto, i) => {
        const antes = puntos[Math.max(0, i - 1)];
        const despues = puntos[Math.min(puntos.length - 1, i + 1)];
        const dx = despues.x - antes.x;
        const dy = despues.y - antes.y;
        const largo = Math.hypot(dx, dy) || 1;
        const nx = -dy / largo;
        const ny = dx / largo;
        izquierda.push(new Phaser.Math.Vector2(Math.round(punto.x + nx * anchoMedio), Math.round(punto.y + ny * anchoMedio)));
        derecha.push(new Phaser.Math.Vector2(Math.round(punto.x - nx * anchoMedio), Math.round(punto.y - ny * anchoMedio)));
      });
      const poligono = izquierda.concat(derecha.reverse());
      const grafico = this.add.graphics().setDepth(profundidad);
      grafico.fillStyle(color(claveColor), alpha).beginPath();
      grafico.moveTo(poligono[0].x, poligono[0].y);
      for (let i = 1; i < poligono.length; i++) grafico.lineTo(poligono[i].x, poligono[i].y);
      grafico.closePath().fillPath();
      return grafico;
    };
    dibujarBanda(64, 'bosqueOscuro', -9);
    dibujarBanda(50, 'aguaOscura', -8);
    dibujarBanda(27, 'agua', -7, 0.32);

    this.cauce = puntos;
    this.reflejosRio = this.add.graphics().setDepth(-6);
    const extremoCamino = mapa.camino[mapa.camino.length - 1];
    const centro = puntos.reduce((a, b) => Math.abs(a.y - extremoCamino[1]) < Math.abs(b.y - extremoCamino[1]) ? a : b);
    this.puente = { x: Math.round(centro.x), y: Math.round(centro.y), semialto: 25 };
    this.dibujarPuente();

    const azar = new Phaser.Math.RandomDataGenerator([String(mapa.semilla)]);
    const decoracion = mapa.decoracion;
    this.decoracionesMapa = [];
    const distanciaSegmento = (x, y, a, b) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const largo2 = dx * dx + dy * dy || 1;
      const t = Phaser.Math.Clamp(((x - a[0]) * dx + (y - a[1]) * dy) / largo2, 0, 1);
      return Phaser.Math.Distance.Between(x, y, a[0] + dx * t, a[1] + dy * t);
    };
    const cercaDelCamino = (x, y) => mapa.camino.slice(0, -1)
      .some((punto, i) => distanciaSegmento(x, y, punto, mapa.camino[i + 1]) < 58);
    const despejado = (x, y) => {
      if (x < 24 || x > mundo.ancho - 24 || y < 300 || y > mundo.alto - 24) return false;
      if (cercaDelCamino(x, y)) return false;
      if (Phaser.Math.Distance.Between(x, y, mapa.ruka.x, mapa.ruka.y) < decoracion.radioLibreRuka) return false;
      if (mapa.pewenes.some(([px, py]) => Phaser.Math.Distance.Between(x, y, px, py) < decoracion.radioLibrePewen)) return false;
      // Conserva libre el cauce y su ribera visual.
      if (x > 980 && x < 1200) return false;
      return true;
    };

    // El pasto aparece en 13 manchones de 7 matas, no repartido por toda la escena.
    let manchonesPlantados = 0;
    for (let intento = 0; intento < decoracion.manchonesPasto * 80 && manchonesPlantados < decoracion.manchonesPasto; intento++) {
      const centroX = azar.between(30, mundo.ancho - 30);
      const centroY = azar.between(320, mundo.alto - 30);
      const matas = [];
      for (let i = 0; i < decoracion.matasPorManchon; i++) {
        const angulo = azar.frac() * Math.PI * 2;
        const radio = azar.between(8, 34);
        const x = Math.round(centroX + Math.cos(angulo) * radio);
        const y = Math.round(centroY + Math.sin(angulo) * radio);
        if (!despejado(x, y)) break;
        matas.push([x, y]);
      }
      if (matas.length !== decoracion.matasPorManchon) continue;
      matas.forEach(([x, y], i) => {
        this.add.image(x, y, 'pasto-' + (i % 3)).setOrigin(0.5, 1).setScale(2).setDepth(y - 1);
        this.decoracionesMapa.push({ x, y, radio: 10 });
      });
      manchonesPlantados++;
    }

    // Doce rocas en pequeños grupos o aisladas; algunos arbustos acompañan una roca.
    const rocasPuestas = [];
    for (let intento = 0; intento < decoracion.piedras * 40 && rocasPuestas.length < decoracion.piedras; intento++) {
      const x = azar.between(35, mundo.ancho - 35);
      const y = azar.between(320, mundo.alto - 25);
      if (!despejado(x, y) || rocasPuestas.some(([rx, ry]) => Phaser.Math.Distance.Between(x, y, rx, ry) < 48)) continue;
      rocasPuestas.push([x, y]);
      const indice = rocasPuestas.length - 1;
      this.crearObstaculoDecorativo(this.add.image(x, y, 'roca-' + (indice % 2)).setOrigin(0.5, 1).setScale(2).setDepth(y));
      this.decoracionesMapa.push({ x, y, radio: 15 });
      if (indice % 3 === 0) {
        this.add.image(x + 14, y + 3, 'arbusto').setOrigin(0.5, 1).setScale(2).setDepth(y + 1);
        this.decoracionesMapa.push({ x: x + 14, y: y + 3, radio: 20 });
      }
      // Cuatro pares visuales; los otros cuatro elementos quedan aislados.
      if (indice < 8 && indice % 2 === 0 && rocasPuestas.length < decoracion.piedras) {
        const parX = x + 28;
        const parY = y + 5;
        if (despejado(parX, parY)) {
          rocasPuestas.push([parX, parY]);
          this.crearObstaculoDecorativo(this.add.image(parX, parY, 'roca-1').setOrigin(0.5, 1).setScale(2).setDepth(parY));
          this.decoracionesMapa.push({ x: parX, y: parY, radio: 15 });
        }
      }
    }
    let troncos = 0;
    for (let intento = 0; intento < 240 && troncos < 7; intento++) {
      const x = azar.between(45, mundo.ancho - 45);
      const y = azar.between(330, mundo.alto - 35);
      if (!despejado(x, y) || rocasPuestas.some(([rx, ry]) => Math.hypot(x - rx, y - ry) < 68)) continue;
      this.crearObstaculoDecorativo(this.add.image(x, y, 'tronco-musgo').setOrigin(0.5, 1).setScale(2).setFlipX(troncos % 2 === 1).setDepth(y));
      rocasPuestas.push([x, y]);
      this.decoracionesMapa.push({ x, y, radio: 28 });
      troncos++;
    }
    mapa.arboles.forEach(([x, y], indice) => {
      const arbol = this.add.image(x, y, 'arbol-nativo-' + (indice % 2))
        .setOrigin(0.5, 1).setScale(ESCALA_ARBOL_NATIVO).setDepth(y);
      this.decoracionesMapa.push({ x, y, radio: 50 });
      this.ambientarArbol(arbol);
    });
  }

  crearObstaculoDecorativo(imagen) {
    // La huella sólida sigue la base, dejando libres las puntas de los helechos.
    const ancho = imagen.displayWidth * 0.83;
    const alto = imagen.displayHeight * 0.55;
    const base = this.add.zone(imagen.x, imagen.y - alto / 2 - 2, ancho, alto);
    this.physics.add.existing(base, true);
    this.obstaculosNaturales.push(base);
  }

  dibujarPuente() {
    const { x, y, semialto } = this.puente;
    const g = this.add.graphics().setPosition(x, y).setDepth(-4);
    g.fillStyle(0x243333, 0.45).fillRect(-87, -14, 184, 53);
    for (const poste of [-76, -29, 28, 75]) {
      g.fillStyle(0x453328).fillRect(poste, 12, 9, 28);
      g.fillStyle(0x93633f).fillRect(poste + 1, 16, 3, 22);
    }
    for (let i = 0; i < 18; i++) {
      const borde = -90 + i * 10;
      const arco = Math.round(4 * Math.sin(Math.PI * i / 17));
      const arriba = -semialto - arco;
      g.fillStyle(0x553c2d).fillRect(borde, arriba, 10, 2 * semialto + 6);
      g.fillStyle(i % 3 ? 0xb37e48 : 0xa46e42).fillRect(borde, arriba, 9, 2 * semialto);
      g.fillStyle(0xd49e60).fillRect(borde + 1, arriba, 7, 2)
        .fillRect(borde + 2, arriba + 6 + i % 5, 2, 12);
      g.fillStyle(0x875737).fillRect(borde + 6, arriba + 30 - i % 7, 1, 10);
    }
  }

  animarRio() {
    const g = this.reflejosRio.clear();
    const largo = this.cauce.length - 1;
    for (let i = 0; i < 62; i++) {
      const fase = (i * 17.3 + this.segundosViento * (4 + i % 3)) % largo;
      const indice = Math.floor(fase);
      const a = this.cauce[indice], b = this.cauce[indice + 1];
      const t = fase - indice;
      const x = Math.round(a.x + (b.x - a.x) * t + (i * 31 % 83) - 41);
      const y = Math.round(a.y + (b.y - a.y) * t);
      g.fillStyle(i % 4 ? 0x8cbfc0 : 0xc6dedd, 0.78)
        .fillRect(x, y, 4 + i % 9, 2).fillRect(x + 3, y + 2, 3, 2);
    }
  }

  ambientarArbol(arbol) {
    const { x, y, displayWidth: ancho } = arbol;
    const sombra = this.add.graphics().setPosition(x, y).setDepth(-2);
    // Franjas escalonadas proyectadas hacia la derecha, por debajo de los personajes.
    sombra.fillStyle(0x182c25, 0.35);
    sombra.fillRect(-4, -2, ancho * 0.45, 4);
    sombra.fillRect(3, 2, ancho * 0.58, 4);
    sombra.fillRect(10, 6, ancho * 0.44, 3);
    this.arbolesAlViento.push(arbol);
  }

  actualizarAmbiente(delta) {
    this.segundosViento += delta / 1000;
    this.animarRio();
    const faseFuego = Math.floor(this.segundosViento * 6) % 4;
    if (faseFuego !== this.faseFuego) this.dibujarLlama(faseFuego);
    // Chubasco breve sobre la cordillera, con entrada y salida graduales.
    const fase = this.segundosViento % 45 - 6;
    this.nevada.clear();
    if (fase > 0 && fase < 14) {
      this.nevada.fillStyle(0xf4f4df, Math.min(1, fase / 2, (14 - fase) / 2) * 0.85);
      for (let i = 0; i < 150; i++) {
        const x = (i * 297 + fase * 12 + 4 * Math.sin(fase + i)) % mundo.ancho;
        const y = 48 + (i * 73 + fase * (17 + i % 7)) % 206;
        this.nevada.fillRect(Math.round(x), Math.round(y), i % 4 ? 2 : 3, 2);
      }
    }
    for (const arbol of this.arbolesAlViento) {
      arbol.angle = 1.3 * Math.sin(this.segundosViento * 1.6 + arbol.x / 140 + arbol.y / 240);
    }
    for (const nube of this.nubes) {
      nube.x += nube.velocidad * delta / 1000;
      if (nube.x > mundo.ancho) nube.x = -140;
      nube.dibujo.x = Math.round(nube.x);
    }
  }

  actualizarEstadoPaisaje(equilibrio) {
    const estado = equilibrio >= 60 ? 'sano' : equilibrio <= 30 ? 'seco' : 'normal';
    if (estado === this.estadoPaisaje) return;
    const nivelesEstado = { seco: 0, normal: 1, sano: 2 };
    const ambienteSeDegrada = nivelesEstado[estado] < nivelesEstado[this.estadoPaisaje];
    this.estadoPaisaje = estado;
    this.fondoSuelo?.setTexture('tile-suelo-bosque-' + estado);
    this.terrenoClaro?.setTexture('tile-suelo-claro-' + estado);
    this.recoleccion?.actualizarEquilibrio(equilibrio);
    if (ambienteSeDegrada) {
      this.time.delayedCall(180, () => reproducirEfectoAudio(this, 'sfx-ambiente-degradar', 0.72));
    }
  }

  dibujarLlama(fase) {
    this.faseFuego = fase;
    const g = this.llama.clear();
    const punta = [-3, -1, 1, -1][fase];
    g.fillStyle(0xbb4b2f).fillRect(-8,-8,16,7).fillRect(-6,-14,12,9)
      .fillRect(punta,-20 - fase,4,9).fillRect(4,-12 - fase,3,8);
    g.fillStyle(0xf39b3b).fillRect(-5,-9,10,7).fillRect(punta,-15,4,10);
    g.fillStyle(0xffda73).fillRect(-2,-6,5,4).fillRect(0,-9,2,4);
    g.fillStyle(0xffbc53).fillRect(4 + fase,-20 - fase * 2,2,2);
  }

  crearRuka() {
    const { x, y, ancho, alto } = mapa.ruka;
    const base = y + alto / 2;
    this.rukaVisual = this.add.image(x, base, 'ruka')
      .setOrigin(0.5, 1).setScale(ESCALA_PIXEL).setDepth(base);
    const brasero = this.add.graphics().setPosition(x - 75, base + 21).setDepth(base + 21);
    brasero.fillStyle(0x29332b).fillRect(-15, -3, 32, 8);
    for (const [dx, dy] of [[-15,-4],[-9,-8],[2,-8],[10,-5],[10,1],[-2,3],[-12,1]]) {
      brasero.fillStyle(0x60665d).fillRect(dx, dy, 7, 4);
      brasero.fillStyle(0x989a82).fillRect(dx, dy, 5, 1);
    }
    brasero.fillStyle(0x653d2a).fillRect(-10,-4,20,5);
    brasero.fillStyle(0xb97b45).fillRect(-9,-3,5,3);
    this.llama = this.add.graphics().setPosition(brasero.x, brasero.y - 3).setDepth(brasero.depth + 0.1);
    this.dibujarLlama(0);
    banderaRuka(this, x + 43, base - 90, true).setDepth(base - 1);
    this.humoRuka = this.add.image(x + 8, base - 88, 'humo-0')
      .setOrigin(0.5, 1).setScale(2).setDepth(base - 1);
    this.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => this.humoRuka.setTexture(this.humoRuka.texture.key === 'humo-0' ? 'humo-1' : 'humo-0')
    });

    // La zona física permanece igual que antes del cambio visual.
    this.obstaculoRuka = this.add.zone(x, y, ancho, alto);
    this.physics.add.existing(this.obstaculoRuka, true);
  }

  crearObstaculosNaturales() {
    // La base visible de la cordillera está a y=260; este muro impide subir
    // por la ladera sin cerrar el paso por el resto del claro.
    const barreraMontana = this.add.zone(mundo.ancho / 2, 246, mundo.ancho, 28);
    this.physics.add.existing(barreraMontana, true);
    this.obstaculosNaturales.push(barreraMontana);

    // Franjas contiguas siguen el cauce y dejan libre solo el tablero.
    const { y, semialto } = this.puente;
    let indice = 0;
    for (let cima = 0; cima < mundo.alto;) {
      const fondo = Math.min(cima + 12, mundo.alto,
        cima < y - semialto ? y - semialto : cima < y + semialto ? y + semialto : Infinity);
      const medio = (cima + fondo) / 2;
      while (indice + 1 < this.cauce.length - 1 && this.cauce[indice + 1].y < medio) indice++;
      if (medio < y - semialto || medio > y + semialto) {
        const a = this.cauce[indice], b = this.cauce[indice + 1];
        const x = a.x + (b.x - a.x) * (medio - a.y) / (b.y - a.y);
        const zona = this.add.zone(x, medio, 124, fondo - cima);
        this.physics.add.existing(zona, true);
        this.obstaculosNaturales.push(zona);
      }
      cima = fondo;
    }
  }

  crearJugador() {
    this.figuraJugador = this.add.sprite(0, 0, 'persona-abajo-0')
      .setOrigin(0.5, 0.5)
      .setScale(ESCALA_PIXEL);
    this.indicadorDescanso = this.add.text(17, -20, 'z', {
      fontFamily: mono, fontSize: '16px', color: paletaPixel.musgo,
      backgroundColor: paletaPixel.tinta, padding: { x: 3, y: 0 }
    }).setVisible(false);
    this.direccionJugador = 'abajo';
    this.personaje = this.add.container(jugador.inicioX, jugador.inicioY, [this.figuraJugador, this.indicadorDescanso]);
    this.personaje.setSize(jugador.radio * 2, jugador.radio * 2);
    this.physics.add.existing(this.personaje);
    this.personaje.body.setCircle(jugador.radio);
    this.personaje.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.personaje, this.obstaculoRuka);
    this.obstaculosNaturales.forEach(obstaculo => this.physics.add.collider(this.personaje, obstaculo));
  }

  actualizarAnimacionJugador(x, y, tiempo, bloqueado) {
    if (!bloqueado && (x !== 0 || y !== 0)) {
      if (Math.abs(x) > Math.abs(y)) {
        this.direccionJugador = x < 0 ? 'izquierda' : 'derecha';
      } else {
        this.direccionJugador = y < 0 ? 'arriba' : 'abajo';
      }
    }

    const caminando = !bloqueado && (x !== 0 || y !== 0);
    const cuadro = caminando ? Math.floor(tiempo / 180) % 2 : 0;
    this.figuraJugador.setTexture(`persona-${this.direccionJugador}-${cuadro}`);
  }

  aplicarRecoleccion(efecto) {
    this.newen = Phaser.Math.Clamp(this.newen + efecto.newen, 0, partida.maximoBarra);
    this.equilibrio = Phaser.Math.Clamp(this.equilibrio + efecto.equilibrio, 0, partida.maximoBarra);
    this.actualizarEstadoPaisaje(this.equilibrio);
  }

  update(tiempo, delta) {
    if (this.pausado) {
      this.personaje.body.setVelocity(0, 0);
      return;
    }
    this.actualizarAmbiente(delta);
    const reloj = this.jornadas.actualizar(tiempo);
    if (!reloj.libre) {
      this.extraHackathon.actualizar(false);
      this.personaje.body.setVelocity(0, 0);
      this.indicadorDescanso.setVisible(false);
      this.hud.actualizar(this.newen, this.equilibrio, this.recoleccion.pinones, reloj.segundos, this.jornadas.totalLof);
      return;
    }

    const pulsado = direccion => Number(this.movimiento[direccion].some(tecla => tecla.isDown));
    const x = pulsado('right') - pulsado('left');
    const y = pulsado('down') - pulsado('up');
    const personaje = this.personaje;
    const moviendose = !this.posicionAnterior.equals(personaje);
    this.posicionAnterior.set(personaje.x, personaje.y);
    const cercaDeRuka = Phaser.Math.Distance.Between(personaje.x, personaje.y, mapa.ruka.x, mapa.ruka.y)
      <= partida.alcanceDescanso;
    const descansando = cercaDeRuka && !moviendose && x === 0 && y === 0 && this.newen < partida.maximoBarra;
    this.indicadorDescanso.setVisible(descansando);

    // La energía se actualiza por segundo, independientemente de los fotogramas.
    const cambio = moviendose ? -partida.desgastePorSegundo : descansando ? partida.descansoPorSegundo : 0;
    this.newen = Phaser.Math.Clamp(this.newen + cambio * delta / 1000, 0, partida.maximoBarra);
    this.recoleccion.actualizar(personaje);

    const velocidad = personaje.body.velocity;
    const factor = this.newen === 0 ? partida.velocidadSinNewen : 1;
    // Normalizar mantiene la misma velocidad en línea recta y en diagonal.
    velocidad.set(x, y).normalize().scale(jugador.velocidad * factor);
    const bloqueado = this.recoleccion.ocupaAlJugador;
    this.extraHackathon.actualizar(!bloqueado);
    if (bloqueado) velocidad.set(0, 0);
    this.actualizarAnimacionJugador(x, y, tiempo, bloqueado);
    personaje.setDepth(personaje.y);

    this.hud.actualizar(this.newen, this.equilibrio, this.recoleccion.pinones, reloj.segundos, this.jornadas.totalLof);
  }
}





