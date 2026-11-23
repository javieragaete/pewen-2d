import { CONFIG } from '../config.js';
import { Recoleccion } from './recoleccion.js';
import { Hud } from './hud.js';

const { pantalla, mundo, jugador, camara, mapa, partida, colores: c } = CONFIG;
const Phaser = globalThis.Phaser;

export class EscenaJuego extends Phaser.Scene {
  constructor() {
    super('Juego');
  }

  create() {
    this.physics.world.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.dibujarMapa();
    this.crearRuka();
    this.crearJugador();
    this.newen = partida.newenInicial;
    this.equilibrio = partida.equilibrioInicial;
    this.posicionAnterior = new Phaser.Math.Vector2(this.personaje.x, this.personaje.y);
    this.recoleccion = new Recoleccion(this, efecto => this.aplicarRecoleccion(efecto));
    this.hud = new Hud(this);
    this.finJornada = null;

    this.flechas = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    this.cameras.main.setBounds(0, 0, mundo.ancho, mundo.alto);
    this.cameras.main.startFollow(this.personaje, true, camara.seguimiento, camara.seguimiento);

    this.add.text(24, pantalla.alto - 24, 'Flechas o WASD · Mover', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: c.texto,
      backgroundColor: c.negro,
      padding: { x: 12, y: 8 }
    }).setOrigin(0, 1).setScrollFactor(0).setDepth(mundo.alto + 1);
  }

  dibujarMapa() {
    const terreno = this.add.graphics().setDepth(-1);
    const azar = new Phaser.Math.RandomDataGenerator([String(mapa.semilla)]);
    terreno.fillStyle(c.suelo).fillRect(0, 0, mundo.ancho, mundo.alto);
    terreno.fillStyle(c.claro).fillEllipse(505, 622, 910, 540);
    terreno.fillStyle(c.bosque).fillEllipse(1375, 717, 570, 1080);

    // La silueta de las montañas enmarca el borde norte del mapa.
    for (const [x, y, ancho, alto] of [[0, 35, 410, 245], [260, 13, 695, 265], [720, -32, 560, 257], [1130, 32, 532, 245]]) {
      terreno.fillStyle(c.montana).fillTriangle(x, y + alto, x + ancho * 0.46, y, x + ancho, y + alto);
      terreno.fillStyle(c.cumbre).fillTriangle(x + ancho * 0.28, y + alto * 0.39, x + ancho * 0.46, y, x + ancho * 0.67, y + alto * 0.39);
    }

    for (let i = 0; i < mapa.matas; i++) {
      const x = azar.between(0, mundo.ancho);
      const y = azar.between(220, mundo.alto);
      terreno.fillStyle(c.hierba, 0.46).fillTriangle(x, y, x + 4, y - azar.between(4, 11), x + 9, y);
    }

    const camino = mapa.camino.map(([x, y]) => new Phaser.Math.Vector2(x, y));
    const rio = new Phaser.Curves.Spline(mapa.rio.map(([x, y]) => new Phaser.Math.Vector2(x, y))).getPoints(100);
    terreno.lineStyle(31, c.camino, 0.85).strokePoints(camino);
    terreno.lineStyle(87, c.bordeRio).strokePoints(rio);
    terreno.lineStyle(72, c.rio).strokePoints(rio);
    terreno.lineStyle(2, c.reflejo, 0.65);
    for (let i = 3; i < rio.length - 4; i += 6) {
      const lado = i % 4 === 1 ? 17 : -17;
      terreno.lineBetween(rio[i].x + lado, rio[i].y, rio[i + 2].x + lado, rio[i + 2].y);
    }

    // La decoración del suelo se repite en la misma posición al recargar.
    for (let i = 0; i < mapa.piedras; i++) {
      const x = azar.between(35, mundo.ancho - 35);
      const y = azar.between(280, mundo.alto - 25);
      if (x > 990 && x < 1200) continue;
      const ancho = azar.between(7, 19);
      terreno.fillStyle(c.roca).fillEllipse(x, y, ancho * 2, ancho);
      terreno.fillStyle(c.hierba, 0.65).fillEllipse(x - 3, y - 2, ancho, ancho * 0.4);
    }

    for (const [x, y] of mapa.arboles) {
      const arbol = this.add.graphics({ x, y }).setDepth(y);
      arbol.fillStyle(c.sombra, 0.35).fillEllipse(10, 2, 65, 19);
      arbol.fillStyle(c.madera).fillRect(-4, -54, 8, 56);
      arbol.fillStyle(c.hoja).fillTriangle(-31, -16, 0, -92, 32, -16);
      arbol.fillStyle(c.hojaClara).fillTriangle(-23, -35, 0, -97, 21, -35);
    }
  }

  crearRuka() {
    const { x, y, ancho, alto } = mapa.ruka;
    const ruka = this.add.graphics({ x, y }).setDepth(y + alto / 2);
    ruka.fillStyle(c.sombra, 0.45).fillEllipse(11, 20, 165, 49);
    ruka.fillStyle(c.muro).fillRoundedRect(-ancho / 2, -29, ancho, 52, 7);
    ruka.fillStyle(c.techoSombra).fillTriangle(-79, -10, -34, -69, 39, -10);
    ruka.fillStyle(c.techo).fillPoints([
      { x: -34, y: -69 }, { x: 39, y: -69 }, { x: 80, y: -10 }, { x: 7, y: -10 }
    ], true);
    ruka.lineStyle(2, c.techoSombra, 0.55);
    for (let franja = 0; franja < 4; franja++) {
      const distancia = 11 + franja * 12;
      const borde = -34 + distancia * 41 / 59;
      ruka.lineBetween(borde, -69 + distancia, borde + 73, -69 + distancia);
    }
    ruka.fillStyle(c.sombra).fillRoundedRect(10, -5, 22, 28, 5);
    this.obstaculoRuka = this.add.zone(x, y, ancho, alto);
    this.physics.add.existing(this.obstaculoRuka, true);
  }

  crearJugador() {
    const figura = this.add.graphics();
    figura.fillStyle(c.sombra, 0.48).fillEllipse(3, 7, 34, 15);
    figura.fillStyle(c.sombra).fillRoundedRect(-10, 0, 8, 9, 3).fillRoundedRect(2, 0, 8, 9, 3);
    figura.fillStyle(c.rojo).fillRoundedRect(-13, -19, 26, 23, 7);
    figura.fillStyle(c.piel).fillCircle(0, -25, 9);
    figura.fillStyle(c.sombra).fillRoundedRect(-9, -35, 18, 9, 4);
    this.personaje = this.add.container(jugador.inicioX, jugador.inicioY, [figura]);
    this.personaje.setSize(jugador.radio * 2, jugador.radio * 2);
    this.physics.add.existing(this.personaje);
    this.personaje.body.setCircle(jugador.radio);
    this.personaje.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.personaje, this.obstaculoRuka);
  }

  aplicarRecoleccion(efecto) {
    this.newen = Phaser.Math.Clamp(this.newen + efecto.newen, 0, partida.maximoBarra);
    this.equilibrio = Phaser.Math.Clamp(this.equilibrio + efecto.equilibrio, 0, partida.maximoBarra);
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
    if (this.recoleccion.ocupaAlJugador) velocidad.set(0, 0);
    personaje.setDepth(personaje.y);

    this.finJornada ??= tiempo + partida.duracionJornada * 1000;
    const segundosRestantes = Math.max(0, Math.ceil((this.finJornada - tiempo) / 1000));
    this.hud.actualizar(this.newen, this.equilibrio, this.recoleccion.pinones, segundosRestantes, descansando && this.newen < partida.maximoBarra);
  }
}


