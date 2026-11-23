import { CONFIG } from '../config.js';
import { textoPixel } from '../tipografia.js';
import { registrarSpritesPixel } from '../sprites.js';
import { cargarPreferencias, mostrarAsignacion } from '../settings.js';

const Phaser = globalThis.Phaser;
const { pantalla, menu, paletaPixel } = CONFIG;
const color = clave => Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;
const mono = 'Consolas, "Courier New", monospace';

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
    [[-20, 510, 4, 0], [260, 520, 4, 1], [540, 510, 4, 0], [820, 520, 4, 1], [1100, 510, 4, 0]]
      .forEach(([x, y, escala, variante]) => {
        this.add.image(x, y, 'montana-' + variante).setOrigin(0, 1).setScale(escala).setDepth(-15);
      });
    [[650, 658], [815, 690], [1010, 666], [1195, 700], [870, 622], [1070, 610]]
      .forEach(([x, y], indice) => {
        this.add.image(x, y, 'arbol-nativo-' + (indice % 2))
          .setOrigin(0.5, 1).setScale(3).setDepth(-5 + indice);
      });

    const panel = this.add.graphics();
    panel.fillStyle(color('tinta')).fillRect(0, 0, 560, alto);
    panel.fillStyle(color('rojo')).fillRect(0, 0, 6, alto);
    panel.fillStyle(color('madera')).fillRect(12, 12, 2, alto - 24);
  }

  texto(x, y, contenido, size, tint = paletaPixel.nieve) {
    return textoPixel(this, x, y, contenido, size, tint);
  }

  mostrarPrincipal() {
    this.pantallaSecundaria = false;
    this.prepararPantalla(menu.titulo, menu.subtitulo);
    this.agregarOpcion('Jugar', () => this.scene.start('Juego'));
    this.agregarOpcion('Configuración', () => this.scene.start('Configuracion', { origen: 'Menu' }));
    const { controles } = cargarPreferencias();
    this.contenido.add(this.add.text(64, 420,
      `Mover: ${mostrarAsignacion(controles.up)} ${mostrarAsignacion(controles.left)} ${mostrarAsignacion(controles.down)} ${mostrarAsignacion(controles.right)}`,
      { fontFamily: mono, fontSize: '17px', color: paletaPixel.nieve }));
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
      this.texto(64, 48, titulo, this.pantallaSecundaria ? 25 : 72),
      this.texto(69, 170, subtitulo, 19, paletaPixel.musgo)
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
    const y = 235 + indice * 74;
    const fondo = this.add.graphics({ x: 64, y });
    const indicador = this.texto(80, y + 15, '>', 25, paletaPixel.musgo).setVisible(false);
    const rotulo = this.texto(112, y + (detalle ? 2 : 14), etiqueta, 25,
      accion ? paletaPixel.nieve : paletaPixel.roca);
    this.contenido.add([fondo, indicador, rotulo]);
    if (detalle) this.contenido.add(this.texto(112, y + 34, detalle, 15, paletaPixel.roca));
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
    else if (elegir) this.opciones[this.seleccion].accion?.();
    else if (arriba || abajo) this.moverSeleccion(arriba ? -1 : 1);
  }
}
