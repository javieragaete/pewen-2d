import { CONFIG } from '../config.js';
import { Recoleccion } from './recoleccion.js';
import { Hud } from './hud.js';
import { ESCALA_PIXEL, registrarSpritesPixel } from '../sprites.js';

const { pantalla, mundo, jugador, camara, mapa, partida, paletaPixel } = CONFIG;
const Phaser = globalThis.Phaser;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;

export class EscenaJuego extends Phaser.Scene {
  constructor() {
    super('Juego');
  }

  create() {
    registrarSpritesPixel(this);
    this.physics.world.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.dibujarMapa();
    this.crearRuka();
    this.crearJugador();
    this.newen = partida.newenInicial;
    this.equilibrio = partida.equilibrioInicial;
    this.posicionAnterior = new Phaser.Math.Vector2(this.personaje.x, this.personaje.y);
    this.recoleccion = new Recoleccion(this, efecto => this.aplicarRecoleccion(efecto));
    this.estadoPaisaje = 'normal';
    this.recoleccion.actualizarEquilibrio(this.equilibrio);
    this.hud = new Hud(this);
    this.finJornada = null;

    this.flechas = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.cameras.main.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.cameras.main.startFollow(this.personaje, true, camara.seguimiento, camara.seguimiento);

    const marcoAyuda = this.add.graphics({ x: 12, y: pantalla.alto - 54 });
    marcoAyuda.fillStyle(color('tinta')).fillRect(0, 0, 264, 40);
    marcoAyuda.fillStyle(color('musgo')).fillRect(0, 0, 264, 3);
    marcoAyuda.fillRect(0, 37, 264, 3).fillRect(0, 0, 3, 40).fillRect(261, 0, 3, 40);
    marcoAyuda.setScrollFactor(0).setDepth(mundo.alto + 1);
    this.add.text(26, pantalla.alto - 44, 'Flechas o WASD · Mover', {
      fontFamily: mono, fontSize: '16px', color: paletaPixel.nieve
    }).setScrollFactor(0).setDepth(mundo.alto + 1);
  }

  dibujarMapa() {
    const anchoTile = 32;
    this.fondoSuelo = this.add.tileSprite(0, 0, mundo.ancho, mundo.alto, 'tile-suelo-bosque-normal')
      .setOrigin(0).setDepth(-20);
    this.fondoSuelo.tileScaleX = 2;
    this.fondoSuelo.tileScaleY = 2;
    this.terrenoClaro = [];

    // Baldosas de 16x16 ampliadas x2; el borde común de cada tile evita costuras.
    for (let y = 320; y < mundo.alto; y += anchoTile) {
      for (let x = 32; x < 1024; x += anchoTile) {
        const dx = (x + anchoTile / 2 - 500) / 500;
        const dy = (y + anchoTile / 2 - 690) / 360;
        if (dx * dx + dy * dy <= 1) {
          const tile = this.add.image(x, y, 'tile-suelo-claro-normal')
            .setOrigin(0).setScale(2).setDepth(-19);
          this.terrenoClaro.push(tile);
        }
      }
    }

    // Siluetas de montaña hechas con píxeles de la paleta.
    [[0, 260, 4, 0], [300, 210, 4, 1], [650, 255, 4, 0], [1010, 230, 4, 1], [1330, 275, 4, 0]]
      .forEach(([x, y, escala, variante]) => {
        this.add.image(x, y, 'montana-' + variante).setOrigin(0, 1).setScale(escala).setDepth(-15);
      });

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
    for (const clave of caminoTiles) {
      const [x, y] = clave.split(',').map(Number);
      this.add.image(x, y, 'tile-camino').setOrigin(0).setScale(2).setDepth(-10);
    }

    // El río se construye con losetas y conserva una animación de agua sutil.
    this.aguaAnimada = [];
    const curva = new Phaser.Curves.Spline(mapa.rio.map(([x, y]) => new Phaser.Math.Vector2(x, y)));
    const puntos = curva.getPoints(180);
    const aguaTiles = new Set();
    const riberaTiles = new Set();
    for (let i = 1; i < puntos.length - 1; i += 2) {
      const antes = puntos[i - 1];
      const despues = puntos[i + 1];
      const dx = despues.x - antes.x;
      const dy = despues.y - antes.y;
      const largo = Math.hypot(dx, dy) || 1;
      const nx = -dy / largo;
      const ny = dx / largo;
      for (const offset of [-32, 0, 32]) {
        const x = Math.floor((puntos[i].x + nx * offset) / anchoTile) * anchoTile;
        const y = Math.floor((puntos[i].y + ny * offset) / anchoTile) * anchoTile;
        aguaTiles.add(x + ',' + y);
      }
      for (const offset of [-64, 64]) {
        const x = Math.floor((puntos[i].x + nx * offset) / anchoTile) * anchoTile;
        const y = Math.floor((puntos[i].y + ny * offset) / anchoTile) * anchoTile;
        riberaTiles.add(x + ',' + y);
      }
    }
    for (const clave of riberaTiles) {
      const [x, y] = clave.split(',').map(Number);
      this.add.image(x, y, 'tile-ribera').setOrigin(0).setScale(2).setDepth(-9);
    }
    for (const clave of aguaTiles) {
      const [x, y] = clave.split(',').map(Number);
      this.aguaAnimada.push(this.add.image(x, y, 'agua-0').setOrigin(0).setScale(2).setDepth(-8));
    }
    this.aguaFrame = 0;
    this.time.addEvent({
      delay: 760,
      loop: true,
      callback: () => {
        this.aguaFrame = 1 - this.aguaFrame;
        this.aguaAnimada.forEach(tile => tile.setTexture('agua-' + this.aguaFrame));
      }
    });

    const azar = new Phaser.Math.RandomDataGenerator([String(mapa.semilla)]);
    const decoracion = mapa.decoracion;
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
      this.add.image(x, y, 'roca-' + (indice % 2)).setOrigin(0.5, 1).setScale(2).setDepth(y);
      if (indice % 3 === 0) {
        this.add.image(x + 14, y + 3, 'arbusto').setOrigin(0.5, 1).setScale(2).setDepth(y + 1);
      }
      // Cuatro pares visuales; los otros cuatro elementos quedan aislados.
      if (indice < 8 && indice % 2 === 0 && rocasPuestas.length < decoracion.piedras) {
        const parX = x + 28;
        const parY = y + 5;
        if (despejado(parX, parY)) {
          rocasPuestas.push([parX, parY]);
          this.add.image(parX, parY, 'roca-1').setOrigin(0.5, 1).setScale(2).setDepth(parY);
        }
      }
    }
    mapa.arboles.forEach(([x, y], indice) => {
      this.add.image(x, y, 'arbol-nativo-' + (indice % 2))
        .setOrigin(0.5, 1).setScale(3).setDepth(y);
    });
  }

  actualizarEstadoPaisaje(equilibrio) {
    const estado = equilibrio >= 60 ? 'sano' : equilibrio <= 30 ? 'seco' : 'normal';
    if (estado === this.estadoPaisaje) return;
    this.estadoPaisaje = estado;
    this.fondoSuelo?.setTexture('tile-suelo-bosque-' + estado);
    this.terrenoClaro?.forEach(tile => tile.setTexture('tile-suelo-claro-' + estado));
    this.recoleccion?.actualizarEquilibrio(equilibrio);
  }

  crearRuka() {
    const { x, y, ancho, alto } = mapa.ruka;
    const base = y + alto / 2;
    this.rukaVisual = this.add.image(x, base, 'ruka')
      .setOrigin(0.5, 1).setScale(3).setDepth(base);
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

  crearJugador() {
    this.figuraJugador = this.add.sprite(0, 0, 'persona-abajo-0')
      .setOrigin(0.5, 0.5)
      .setScale(ESCALA_PIXEL);
    this.direccionJugador = 'abajo';
    this.personaje = this.add.container(jugador.inicioX, jugador.inicioY, [this.figuraJugador]);
    this.personaje.setSize(jugador.radio * 2, jugador.radio * 2);
    this.physics.add.existing(this.personaje);
    this.personaje.body.setCircle(jugador.radio);
    this.personaje.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.personaje, this.obstaculoRuka);
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
    const { left, right, up, down } = this.flechas;
    const { W, A, S, D } = this.wasd;
    const x = Number(right.isDown || D.isDown) - Number(left.isDown || A.isDown);
    const y = Number(down.isDown || S.isDown) - Number(up.isDown || W.isDown);
    const personaje = this.personaje;
    const moviendose = !this.posicionAnterior.equals(personaje);
    this.posicionAnterior.set(personaje.x, personaje.y);
    const cercaDeRuka = Phaser.Math.Distance.Between(personaje.x, personaje.y, mapa.ruka.x, mapa.ruka.y)
      <= partida.alcanceDescanso;
    const descansando = cercaDeRuka && !moviendose && x === 0 && y === 0 && this.newen < partida.maximoBarra;

    // La energía se actualiza por segundo, independientemente de los fotogramas.
    const cambio = moviendose ? -partida.desgastePorSegundo : descansando ? partida.descansoPorSegundo : 0;
    this.newen = Phaser.Math.Clamp(this.newen + cambio * delta / 1000, 0, partida.maximoBarra);
    this.recoleccion.actualizar(personaje);

    const velocidad = personaje.body.velocity;
    const factor = this.newen === 0 ? partida.velocidadSinNewen : 1;
    // Normalizar mantiene la misma velocidad en línea recta y en diagonal.
    velocidad.set(x, y).normalize().scale(jugador.velocidad * factor);
    const bloqueado = this.recoleccion.ocupaAlJugador;
    if (bloqueado) velocidad.set(0, 0);
    this.actualizarAnimacionJugador(x, y, tiempo, bloqueado);
    personaje.setDepth(personaje.y);

    this.finJornada ??= tiempo + partida.duracionJornada * 1000;
    const segundosRestantes = Math.max(0, Math.ceil((this.finJornada - tiempo) / 1000));
    this.hud.actualizar(this.newen, this.equilibrio, this.recoleccion.pinones, segundosRestantes, descansando && this.newen < partida.maximoBarra);
  }
}





