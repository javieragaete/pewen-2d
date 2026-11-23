import { CONFIG } from '../config.js';
import { textoPixel } from '../tipografia.js';
import { ESCALA_PIXEL, registrarSpritesPixel } from '../sprites.js';

const Phaser = globalThis.Phaser;
const { pantalla, menu, paletaPixel } = CONFIG;
const color = clave => Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;
const paletaMenu = menu.paleta;

export class EscenaMenu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    registrarSpritesPixel(this);
    this.dibujarPaisaje();
    this.teclas = this.input.keyboard.addKeys('UP,DOWN,W,S,ENTER,SPACE,ESC');
    this.contenido = this.add.container(0, 0);
    this.mostrarPrincipal();
  }

  dibujarPaisaje() {
    const { ancho, alto } = pantalla;
    const cielo = this.add.tileSprite(0, 0, ancho, alto, 'tile-cielo').setOrigin(0).setDepth(-20);
    cielo.tileScaleX = 2;
    cielo.tileScaleY = 2;
    const suelo = this.add.tileSprite(0, 490, ancho, alto - 490, 'tile-suelo-bosque-normal')
      .setOrigin(0).setDepth(-10);
    suelo.tileScaleX = 2;
    suelo.tileScaleY = 2;
    [[-55, 510, 0], [385, 510, 1], [825, 510, 0]]
      .forEach(([x, y, variante]) => {
        this.add.image(x, y, 'montana-' + variante).setOrigin(0, 1).setScale(ESCALA_PIXEL).setDepth(-15);
      });
    [[700, 680], [900, 700], [1080, 670], [1210, 710]]
      .forEach(([x, y], indice) => {
        this.add.image(x, y, 'arbol-nativo-' + (indice % 2))
          .setOrigin(0.5, 1).setScale(ESCALA_PIXEL).setDepth(-5 + indice);
      });

    const panel = this.add.graphics();
    panel.fillStyle(color('tinta')).fillRect(0, 0, 560, alto);
  }

  texto(x, y, contenido, size, tint = paletaPixel.nieve) {
    return textoPixel(this, x, y, contenido, size, tint);
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
      this.texto(64, 55, titulo, this.pantallaSecundaria ? 25 : 48),
      this.texto(69, 132, subtitulo, 20, paletaPixel.musgo)
    ]);
  }

  dibujarBoton(fondo, { centro, luz, sombra }) {
    fondo.clear();
    // Las franjas rectas forman esquinas escalonadas sin suavizar el borde.
    fondo.fillStyle(paletaMenu.tinta)
      .fillRect(12, 0, 408, 60)
      .fillRect(6, 6, 420, 48)
      .fillRect(0, 12, 432, 36);
    fondo.fillStyle(luz)
      .fillRect(12, 5, 408, 50)
      .fillRect(6, 12, 420, 36);
    fondo.fillStyle(sombra)
      .fillRect(12, 46, 408, 9)
      .fillRect(414, 13, 12, 35);
    fondo.fillStyle(centro)
      .fillRect(16, 12, 398, 37)
      .fillRect(11, 17, 408, 26);
  }

  agregarOpcion(etiqueta, accion, detalle) {
    const indice = this.opciones.length;
    const y = 205 + indice * 72;
    const fondo = this.add.graphics({ x: 64, y });
    const indicador = this.texto(80, y + 15, '>', 25, paletaPixel.musgo).setVisible(false);
    const rotulo = this.texto(112, y + (detalle ? 2 : 14), etiqueta, 25,
      accion ? paletaPixel.nieve : paletaPixel.roca);
    this.contenido.add([fondo, indicador, rotulo]);
    if (detalle) this.contenido.add(this.texto(112, y + 34, detalle, 15, paletaPixel.nieve));
    this.opciones.push({ fondo, indicador, accion, rotulo });
    if (accion) {
      fondo.setInteractive(new Phaser.Geom.Rectangle(0, 0, 432, 60), Phaser.Geom.Rectangle.Contains)
        .on('pointerover', () => this.seleccionar(indice))
        .on('pointerdown', () => {
          this.seleccionar(indice);
          accion();
        });
    }
  }

  seleccionar(indice) {
    this.seleccion = indice;
    this.opciones.forEach(({ fondo, indicador, accion, rotulo }, i) => {
      const activa = i === indice;
      const normal = this.pantallaSecundaria ? 'azul' : paletaMenu.opciones[i];
      const estilo = activa ? paletaMenu.amarillo : accion ? paletaMenu[normal] : paletaMenu.gris;
      this.dibujarBoton(fondo, estilo);
      rotulo.setColor(activa ? paletaPixel.tinta : accion ? paletaPixel.nieve : '#c4c8c3');
      indicador.setColor(paletaPixel.tinta);
      indicador.setVisible(activa);
    });
  }

  moverSeleccion(paso) {
    const total = this.opciones.length;
    let indice = this.seleccion;
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




