import { CONFIG } from '../config.js';

const Phaser = globalThis.Phaser;
const { pantalla, menu, paletaPixel } = CONFIG;
const color = clave => Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;

export class EscenaMenu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.dibujarPaisaje();
    this.teclas = this.input.keyboard.addKeys('UP,DOWN,W,S,ENTER,SPACE,ESC');
    this.contenido = this.add.container(0, 0);
    this.mostrarPrincipal();
  }

  dibujarPaisaje() {
    const { ancho, alto } = pantalla;
    const fondo = this.add.graphics();
    fondo.fillStyle(color('aguaOscura')).fillRect(0, 0, ancho, alto);
    fondo.fillStyle(color('nieve'), 0.9).fillCircle(ancho - 175, 135, 48);
    for (const [x, cima, base, anchoMonte] of [[290, 120, 510, 500], [570, 64, 550, 570], [850, 170, 532, 470]]) {
      fondo.fillStyle(color('rocaOscura')).fillTriangle(x, base, x + anchoMonte / 2, cima, x + anchoMonte, base);
      fondo.fillStyle(color('nieve')).fillTriangle(
        x + anchoMonte * 0.36, cima + (base - cima) * 0.28,
        x + anchoMonte / 2, cima, x + anchoMonte * 0.64, cima + (base - cima) * 0.28
      );
    }
    fondo.fillStyle(color('bosque')).fillEllipse(ancho * 0.74, alto + 2, ancho, 510);
    fondo.fillStyle(color('bosqueOscuro')).fillEllipse(ancho * 0.92, alto + 35, ancho, 360);
    for (const [x, y, escala] of [[695, 550, 0.82], [987, 607, 1.3], [1142, 630, 1.55], [858, 675, 1.35], [1238, 560, 0.92]]) {
      const arbol = this.add.graphics({ x, y }).setScale(escala);
      arbol.fillStyle(color('maderaOscura')).fillRect(-5, -112, 10, 112);
      arbol.lineStyle(5, color('maderaOscura'));
      for (const [lado, altura] of [[-1, -45], [1, -62], [-1, -79], [1, -98]]) {
        arbol.lineBetween(0, altura, 28 * lado, altura - 14);
        arbol.fillStyle(color('bosqueOscuro')).fillRoundedRect(28 * lado - 22, altura - 25, 44, 16, 4);
        arbol.fillStyle(color('verde')).fillRect(28 * lado - 16, altura - 26, 32, 6);
      }
      arbol.fillStyle(color('verde')).fillRoundedRect(-25, -133, 50, 16, 4);
    }
    fondo.fillStyle(color('tinta')).fillRect(0, 0, 560, alto);
  }

  texto(x, y, contenido, size, tint = paletaPixel.nieve) {
    return this.add.text(x, y, contenido, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: size,
      color: tint
    });
  }

  mostrarPrincipal() {
    this.pantallaSecundaria = false;
    this.prepararPantalla(menu.titulo, menu.subtitulo);
    this.agregarOpcion('Nuevo juego', () => this.scene.start('Juego'));
    this.agregarOpcion('Cargar partida', null, 'Sin partida guardada');
    this.agregarOpcion('Cómo jugar', () => this.mostrarSecundaria('Cómo jugar'));
    this.agregarOpcion('Opciones', () => this.mostrarSecundaria('Opciones'));
    this.agregarOpcion('Créditos', () => this.mostrarSecundaria('Créditos'));
    this.seleccionar(0);
  }

  mostrarSecundaria(titulo) {
    this.pantallaSecundaria = true;
    this.prepararPantalla(titulo, 'Disponible en una próxima etapa.');
    this.agregarOpcion('Volver', () => this.mostrarPrincipal());
    this.seleccionar(0);
  }

  prepararPantalla(titulo, subtitulo) {
    this.contenido.removeAll(true);
    this.opciones = [];
    this.contenido.add([
      this.texto(64, 68, titulo, 72).setFontStyle('bold'),
      this.texto(69, 164, subtitulo, 23, paletaPixel.musgo)
    ]);
  }

  agregarOpcion(etiqueta, accion, detalle) {
    const indice = this.opciones.length;
    const y = 235 + indice * 74;
    const fondo = this.add.rectangle(64, y, 432, 60, color('bosqueOscuro')).setOrigin(0);
    const indicador = this.texto(80, y + 12, '▸', 25, paletaPixel.musgo).setVisible(false);
    const rotulo = this.texto(112, y + (detalle ? 4 : 12), etiqueta, 25,
      accion ? paletaPixel.nieve : paletaPixel.roca);
    this.contenido.add([fondo, indicador, rotulo]);
    if (detalle) this.contenido.add(this.texto(112, y + 34, detalle, 15, paletaPixel.roca));
    this.opciones.push({ fondo, indicador, accion });
    if (accion) {
      fondo.setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.seleccionar(indice))
        .on('pointerdown', () => {
          this.seleccionar(indice);
          accion();
        });
    }
  }

  seleccionar(indice) {
    this.seleccion = indice;
    this.opciones.forEach(({ fondo, indicador, accion }, i) => {
      const activa = i === indice;
      fondo.setFillStyle(color(activa ? 'bosque' : accion ? 'bosqueOscuro' : 'tinta'));
      indicador.setVisible(activa);
    });
  }

  moverSeleccion(paso) {
    const total = this.opciones.length;
    let indice = this.seleccion;
    // Las opciones deshabilitadas no reciben el foco.
    do {
      indice = Phaser.Math.Wrap(indice + paso, 0, total);
    } while (!this.opciones[indice].accion);
    this.seleccionar(indice);
  }

  update() {
    const { UP, DOWN, W, S, ENTER, SPACE, ESC } = this.teclas;
    const pulsada = Phaser.Input.Keyboard.JustDown;
    const arriba = [UP, W].map(pulsada).some(Boolean);
    const abajo = [DOWN, S].map(pulsada).some(Boolean);
    const elegir = [ENTER, SPACE].map(pulsada).some(Boolean);
    if (pulsada(ESC) && this.pantallaSecundaria) this.mostrarPrincipal();
    else if (elegir) this.opciones[this.seleccion].accion();
    else if (arriba || abajo) this.moverSeleccion(arriba ? -1 : 1);
  }
}
