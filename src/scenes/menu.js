import { CONFIG } from '../config.js';
import { ESCALA_PIXEL, dibujarMarcoPixel, registrarSpritesPixel } from '../sprites.js';

const Phaser = globalThis.Phaser;
const { pantalla, menu, paletaPixel } = CONFIG;
const color = clave => Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;
const mono = 'Consolas, "Courier New", monospace';

export class EscenaMenu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  preload() {
    this.load.audio('sfx-boton-enfocar', new URL('../../assets/audio/efectos/boton-enfocar.wav', import.meta.url).href);
    this.load.audio('sfx-boton-activar', new URL('../../assets/audio/efectos/boton-activar.wav', import.meta.url).href);
    this.load.on('loaderror', archivo => {
      if (archivo.key.startsWith('sfx-boton-')) console.error('No se pudo cargar el sonido:', archivo.src);
    });
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
    return this.add.text(x, y, contenido, {
      fontFamily: mono,
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
      this.texto(64, 68, titulo, 48).setFontStyle('bold'),
      this.texto(69, 132, subtitulo, 20, paletaPixel.musgo)
    ]);
  }

  dibujarOpcion(fondo, tono) {
    dibujarMarcoPixel(fondo, 0, 0, 432, 60, color(tono), color('bosque'));
  }

  agregarOpcion(etiqueta, accion, detalle) {
    const indice = this.opciones.length;
    const y = 205 + indice * 72;
    const fondo = this.add.graphics({ x: 64, y });
    this.dibujarOpcion(fondo, accion ? 'tinta' : 'rocaOscura');
    const indicador = this.texto(80, y + 12, '>', 25, paletaPixel.musgo).setVisible(false);
    const rotulo = this.texto(112, y + (detalle ? 4 : 12), etiqueta, 25,
      accion ? paletaPixel.nieve : paletaPixel.roca);
    this.contenido.add([fondo, indicador, rotulo]);
    if (detalle) this.contenido.add(this.texto(112, y + 34, detalle, 15, paletaPixel.roca));
    this.opciones.push({ fondo, indicador, accion });
    if (accion) {
      fondo.setInteractive(new Phaser.Geom.Rectangle(0, 0, 432, 60), Phaser.Geom.Rectangle.Contains)
        .on('pointerover', () => this.seleccionar(indice, true))
        .on('pointerdown', () => {
          this.seleccionar(indice);
          this.reproducirSonidoBoton('activar', true);
          accion();
        });
    }
  }

  seleccionar(indice, conSonido = false) {
    this.seleccion = indice;
    if (conSonido) this.reproducirSonidoBoton('enfocar');
    this.opciones.forEach(({ fondo, indicador, accion }, i) => {
      const activa = i === indice;
      this.dibujarOpcion(fondo, activa ? 'bosqueOscuro' : accion ? 'tinta' : 'rocaOscura');
      indicador.setVisible(activa);
    });
  }

  reproducirSonidoBoton(tipo, gestoUsuario = false) {
    const opciones = {
      enfocar: { clave: 'sfx-boton-enfocar', volumen: 0.75 },
      activar: { clave: 'sfx-boton-activar', volumen: 0.85 }
    }[tipo];
    if (!opciones || !this.cache.audio.exists(opciones.clave)) return;

    const sonar = () => this.sound.play(opciones.clave, { volume: opciones.volumen });
    if (this.sound.locked) {
      if (gestoUsuario) {
        this.sound.once(Phaser.Sound.Events.UNLOCKED, sonar);
        this.sound.unlock();
      }
      return;
    }
    sonar();
  }

  moverSeleccion(paso) {
    const total = this.opciones.length;
    let indice = this.seleccion;
    do {
      indice = Phaser.Math.Wrap(indice + paso, 0, total);
    } while (!this.opciones[indice].accion);
    this.seleccionar(indice, true);
  }

  update() {
    const { UP, DOWN, W, S, ENTER, SPACE, ESC } = this.teclas;
    const pulsada = Phaser.Input.Keyboard.JustDown;
    const arriba = [UP, W].map(pulsada).some(Boolean);
    const abajo = [DOWN, S].map(pulsada).some(Boolean);
    const elegir = [ENTER, SPACE].map(pulsada).some(Boolean);
    if (pulsada(ESC) && this.pantallaSecundaria) {
      this.reproducirSonidoBoton('activar', true);
      this.mostrarPrincipal();
    } else if (elegir) {
      this.reproducirSonidoBoton('activar', true);
      this.opciones[this.seleccion].accion();
    }
    else if (arriba || abajo) this.moverSeleccion(arriba ? -1 : 1);
  }
}




