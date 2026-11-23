import { CONFIG } from '../config.js';
import { Recoleccion } from './recoleccion.js';
import { Hud } from './hud.js';
import { ESCALA_PIXEL, dibujarMarcoPixel, registrarSpritesPixel } from '../sprites.js';
import { GestorJornadas } from '../narrativa.js';

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
    this.jornadas = new GestorJornadas(this);

    this.flechas = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.cameras.main.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.cameras.main.startFollow(this.personaje, true, camara.seguimiento, camara.seguimiento);

    const marcoAyuda = this.add.graphics({ x: 12, y: pantalla.alto - 48 });
    dibujarMarcoPixel(marcoAyuda, 0, 0, 250, 36, color('tinta'), color('musgo'));
    marcoAyuda.setScrollFactor(0).setDepth(mundo.alto + 1);
    const ayudaControl = this.add.text(24, pantalla.alto - 40, 'Flechas o WASD · Mover', {
      fontFamily: mono, fontSize: '16px', color: paletaPixel.nieve
    }).setScrollFactor(0).setDepth(mundo.alto + 1);
    this.time.delayedCall(8000, () => this.tweens.add({
      targets: [marcoAyuda, ayudaControl], alpha: 0, duration: 500,
      onComplete: () => { marcoAyuda.setVisible(false); ayudaControl.setVisible(false); }
    }));
  }

  dibujarMapa() {
    const anchoTile = 32;
    this.fondoSuelo = this.add.tileSprite(0, 0, mundo.ancho, mundo.alto, 'tile-suelo-bosque-normal')
      .setOrigin(0).setDepth(-20);
    this.fondoSuelo.tileScaleX = 2;
    this.fondoSuelo.tileScaleY = 2;
    // Un único claro con borde orgánico evita la silueta de una cuadrícula de tiles.
    this.terrenoClaro = this.add.image(80, 320, 'tile-suelo-claro-normal')
      .setOrigin(0).setScale(ESCALA_PIXEL).setDepth(-19);

    // Siluetas de montaña hechas con píxeles de la paleta.
    [[-20, 260, 0], [580, 260, 1], [1180, 260, 0]]
      .forEach(([x, y, variante]) => {
        this.add.image(x, y, 'montana-' + variante).setOrigin(0, 1).setScale(ESCALA_PIXEL).setDepth(-15);
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

    this.ondasAgua = [[], []];
    for (let i = 14, indice = 0; i < puntos.length - 14; i += 28, indice++) {
      const antes = puntos[i - 2];
      const despues = puntos[i + 2];
      const dx = despues.x - antes.x;
      const dy = despues.y - antes.y;
      const largo = Math.hypot(dx, dy) || 1;
      const ux = dx / largo;
      const uy = dy / largo;
      const nx = -uy;
      const ny = ux;
      const punto = puntos[i];
      const ola = this.add.graphics().setDepth(-6);
      ola.lineStyle(2, color('agua'), 0.78).beginPath();
      ola.moveTo(Math.round(punto.x - ux * 18 - nx * 5), Math.round(punto.y - uy * 18 - ny * 5));
      ola.lineTo(Math.round(punto.x - ux * 5 - nx * 5), Math.round(punto.y - uy * 5 - ny * 5));
      ola.lineTo(Math.round(punto.x + ux * 7 + nx * 4), Math.round(punto.y + uy * 7 + ny * 4));
      ola.lineTo(Math.round(punto.x + ux * 18 + nx * 4), Math.round(punto.y + uy * 18 + ny * 4));
      ola.strokePath();
      const grupo = indice % 2;
      ola.setVisible(grupo === 0);
      this.ondasAgua[grupo].push(ola);
    }
    this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => {
        this.ondasAgua[0].forEach(ola => ola.setVisible(!ola.visible));
        this.ondasAgua[1].forEach(ola => ola.setVisible(!ola.visible));
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
        .setOrigin(0.5, 1).setScale(ESCALA_PIXEL).setDepth(y);
    });
  }

  actualizarEstadoPaisaje(equilibrio) {
    const estado = equilibrio >= 60 ? 'sano' : equilibrio <= 30 ? 'seco' : 'normal';
    if (estado === this.estadoPaisaje) return;
    this.estadoPaisaje = estado;
    this.fondoSuelo?.setTexture('tile-suelo-bosque-' + estado);
    this.terrenoClaro?.setTexture('tile-suelo-claro-' + estado);
    this.recoleccion?.actualizarEquilibrio(equilibrio);
  }

  crearRuka() {
    const { x, y, ancho, alto } = mapa.ruka;
    const base = y + alto / 2;
    this.rukaVisual = this.add.image(x, base, 'ruka')
      .setOrigin(0.5, 1).setScale(ESCALA_PIXEL).setDepth(base);
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
    const reloj = this.jornadas.actualizar(tiempo);
    if (!reloj.libre) {
      this.personaje.body.setVelocity(0, 0);
      this.indicadorDescanso.setVisible(false);
      this.hud.actualizar(this.newen, this.equilibrio, this.recoleccion.pinones, reloj.segundos, this.jornadas.totalLof);
      return;
    }

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
    if (bloqueado) velocidad.set(0, 0);
    this.actualizarAnimacionJugador(x, y, tiempo, bloqueado);
    personaje.setDepth(personaje.y);

    this.hud.actualizar(this.newen, this.equilibrio, this.recoleccion.pinones, reloj.segundos, this.jornadas.totalLof);
  }
}





