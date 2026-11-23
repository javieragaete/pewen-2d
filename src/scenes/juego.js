import { CONFIG } from '../config.js';
import { Recoleccion } from './recoleccion.js';
import { Hud } from './hud.js';
import { ESCALA_PIXEL, registrarSpritesPixel } from '../sprites.js';
import { cargarPreferencias, mostrarAsignacion, actualizarVolumen } from '../settings.js';
import PhaserJuice from '../../vendor/phaserJuice.min.js';

const { pantalla, mundo, jugador, camara, mapa, partida, paletaPixel } = CONFIG;
const Phaser = globalThis.Phaser;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;

export class EscenaJuego extends Phaser.Scene {
  constructor() {
    super('Juego');
  }

  create() {
    actualizarVolumen(this);
    this.preferencias = cargarPreferencias();
    registrarSpritesPixel(this);
    this.physics.world.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.dibujarMapa();
    this.crearRuka();
    this.crearJugador();
    this.crearEfectosVisuales();
    this.newen = partida.newenInicial;
    this.equilibrio = partida.equilibrioInicial;
    this.posicionAnterior = new Phaser.Math.Vector2(this.personaje.x, this.personaje.y);
    this.recoleccion = new Recoleccion(this, efecto => this.aplicarRecoleccion(efecto), this.preferencias.controles);
    this.estadoPaisaje = 'normal';
    this.recoleccion.actualizarEquilibrio(this.equilibrio);
    this.hud = new Hud(this);
    this.finJornada = null;
    this.avisoControlesTermina = 0;
    this.avisoControlesMostrado = false;

    this.actualizarControles();
    this.cameras.main.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.cameras.main.startFollow(this.personaje, true, camara.seguimiento, camara.seguimiento);

    this.input.keyboard.on('keydown-ESC', this.abrirPausa, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown-ESC', this.abrirPausa, this));

  }

  abrirPausa() {
    if (this.scene.isActive('Pausa') || this.scene.isActive('Configuracion')) return;
    this.scene.launch('Pausa');
    this.scene.pause();
  }

  actualizarControles() {
    this.preferencias = cargarPreferencias();
    const codigo = Phaser.Input.Keyboard.KeyCodes;
    const crearTecla = nombre => this.input.keyboard.addKey(codigo[nombre]);
    this.teclasMovimiento = Object.fromEntries(['up', 'down', 'left', 'right'].map(direccion => [
      direccion, this.preferencias.controles[direccion].filter(Boolean).map(crearTecla)
    ]));
    this.recoleccion?.actualizarControles(this.preferencias.controles);
  }

  crearEfectosVisuales() {
    this.juice = new PhaserJuice(this);
    if (!this.textures.exists('particula-pinon')) {
      const pixel = this.make.graphics({ x: 0, y: 0, add: false });
      pixel.fillStyle(color('madera')).fillRect(0, 1, 4, 3);
      pixel.fillStyle(color('musgo')).fillRect(1, 0, 2, 1);
      pixel.generateTexture('particula-pinon', 4, 4);
      pixel.destroy();
    }
    this.particulasPinones = this.add.particles(0, 0, 'particula-pinon', {
      emitting: false, maxParticles: 48,
      lifespan: { min: 350, max: 620 }, speed: { min: 42, max: 115 },
      angle: { min: 235, max: 305 }, gravityY: 115,
      scale: { start: 1.4, end: 0.15 }, alpha: { start: 0.95, end: 0 },
      tint: [color('madera'), color('musgo'), color('roca')]
    }).setDepth(mundo.alto + 1);

    if (this.rexHslAdjust && this.game.renderer.type === Phaser.WEBGL) {
      this.filtroRex = this.rexHslAdjust.add(this.figuraJugador, { satAdjust: 1.05, lumAdjust: 0.51 });
    }
    if (this.raycasterPlugin && this.arbolesOclusion?.length) {
      this.raycaster = this.raycasterPlugin.createRaycaster({
        boundingBox: new Phaser.Geom.Rectangle(0, 0, mundo.ancho, mundo.alto), debug: false
      });
      this.raycaster.mapGameObjects(this.arbolesOclusion, false);
      this.rayoVision = this.raycaster.createRay();
    }
  }

  hayLineaDeVista(origen, destino) {
    if (!this.rayoVision) return true;
    const distancia = Phaser.Math.Distance.Between(origen.x, origen.y, destino.x, destino.y);
    this.rayoVision.setOrigin(origen.x, origen.y)
      .setAngle(Phaser.Math.Angle.Between(origen.x, origen.y, destino.x, destino.y))
      .setRayRange(distancia).setDetectionRange(distancia);
    const impacto = this.rayoVision.cast();
    if (!impacto || !impacto.object) return true;
    return Phaser.Math.Distance.Between(origen.x, origen.y, impacto.x, impacto.y) >= distancia - 5;
  }

  animarRecoleccion(pewen) {
    this.particulasPinones.explode(14, pewen.x, pewen.y - 18);
    this.juice.pulse(this.figuraJugador, {
      scaleX: ESCALA_PIXEL * 1.08, scaleY: ESCALA_PIXEL * 1.08,
      duration: 125, repeat: 1, yoyo: true, ease: 'Quad.easeOut'
    });
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
    for (let i = 0; i < mapa.matas; i++) {
      const x = azar.between(20, mundo.ancho - 20);
      const y = azar.between(300, mundo.alto - 20);
      if (x > 990 && x < 1200) continue;
      const variante = i % 3;
      this.add.image(x, y, 'pasto-' + variante).setOrigin(0.5, 1).setScale(2).setDepth(y - 1);
    }
    for (let i = 0; i < mapa.piedras; i++) {
      const x = azar.between(35, mundo.ancho - 35);
      const y = azar.between(300, mundo.alto - 20);
      if (x > 990 && x < 1200) continue;
      this.add.image(x, y, 'roca-' + (i % 2)).setOrigin(0.5, 1).setScale(2).setDepth(y);
      if (i % 3 === 0) this.add.image(x + 16, y, 'arbusto').setOrigin(0.5, 1).setScale(2).setDepth(y + 1);
    }
    this.arbolesOclusion = mapa.arboles.map(([x, y], indice) => {
      return this.add.image(x, y, 'arbol-nativo-' + (indice % 2))
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
    const { left, right, up, down } = this.teclasMovimiento;
    const x = Number(right.some(tecla => tecla.isDown)) - Number(left.some(tecla => tecla.isDown));
    const y = Number(down.some(tecla => tecla.isDown)) - Number(up.some(tecla => tecla.isDown));
    if (!this.avisoControlesMostrado && (x !== 0 || y !== 0)) {
      this.avisoControlesMostrado = true;
      this.avisoControlesTermina = tiempo + 15000;
    }
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
    const mostrarControles = this.avisoControlesMostrado && tiempo < this.avisoControlesTermina;
    const controles = this.preferencias.controles;
    const aviso = `Movimiento: ${mostrarAsignacion(controles.up)} arriba · ${mostrarAsignacion(controles.left)} izquierda · ${mostrarAsignacion(controles.down)} abajo · ${mostrarAsignacion(controles.right)} derecha · ${mostrarAsignacion(controles.interact)} interactuar`;
    this.hud.actualizar(this.newen, this.equilibrio, this.recoleccion.pinones, segundosRestantes,
      descansando && this.newen < partida.maximoBarra, mostrarControles, aviso);
  }
}
