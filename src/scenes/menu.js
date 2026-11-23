import { CONFIG } from '../config.js';
import { aplicarIluminacion, actualizarVolumen } from '../settings.js';
import { textoPixel } from '../tipografia.js';
import { registrarSpritesPixel } from '../sprites.js';
import { dibujarFondoMenu } from '../paisaje-menu.js';

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
    aplicarIluminacion(this);
    actualizarVolumen(this);
    this.dibujarPaisaje();
    this.teclas = this.input.keyboard.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,ENTER,SPACE,ESC');
    this.contenido = this.add.container(0, 0);
    this.mostrarPrincipal();
  }

  dibujarPaisaje() {
    const { ancho, alto } = pantalla;
    dibujarFondoMenu(this, ancho, alto);
    const panel = this.add.graphics();
    panel.fillStyle(color('tinta')).fillRect(0, 0, 560, alto);
    panel.fillStyle(paletaMenu.amarillo.sombra).fillRect(556, 0, 4, alto);
  }

  texto(x, y, contenido, size, tint = paletaPixel.nieve) {
    return textoPixel(this, x, y, contenido, size, tint);
  }

  mostrarPrincipal() {
    this.pantallaSecundaria = false;
    this.prepararPantalla(menu.titulo, menu.subtitulo);
    this.agregarOpcion('Nuevo juego', () => {
      localStorage.removeItem('pewen-partida');
      this.scene.start('Juego', { cargar: false });
    });
    const guardada = Boolean(localStorage.getItem('pewen-partida'));
    this.agregarOpcion('Cargar partida', guardada ? () => this.scene.start('Juego', { cargar: true }) : null,
      guardada ? 'Continuar partida guardada' : 'Sin partida guardada');
    this.agregarOpcion('Cómo jugar', () => this.mostrarComoJugar());
    this.agregarOpcion('Audio', () => this.scene.start('Configuracion', { categoria: 'Audio' }));
    this.agregarOpcion('Iluminación', () => this.scene.start('Configuracion', { categoria: 'Iluminación' }));
    this.agregarOpcion('Botones', () => this.scene.start('Configuracion', { categoria: 'Botones' }));
    this.contenido.add(this.texto(124, 667, 'Desarrollado por utemsitos', 15, paletaPixel.musgo));
    this.seleccionar(0);
  }

  mostrarSecundaria(titulo) {
    this.pantallaSecundaria = true;
    this.prepararPantalla(titulo, 'Disponible en una próxima etapa.');
    this.agregarOpcion('Volver', () => this.mostrarPrincipal());
    this.seleccionar(0);
  }

  mostrarComoJugar() {
    this.pantallaSecundaria = true;
    this.prepararPantalla('Cómo jugar', '');
    this.paginasAyuda = [
      [
        ['OBJETIVO', 'Reúne piñones para el lof antes de que llegue el invierno. Tienes tres jornadas de dos minutos.'],
        ['CONTROLES', 'Muévete con las flechas o WASD. Pulsa E para interactuar con los pewenes y la ruka.'],
        ['HUD', 'Consulta aquí tu newen, equilibrio, piñones y el tiempo que queda.']
      ],
      [
        ['RECOLECTAR', 'Acércate a un pewén y pulsa E. Elige 1 para pedir permiso: recibes 3 piñones, +5 equilibrio y gastas 5 newen. Elige 2 para tomar directamente: recibes 8 piñones, pierdes 15 equilibrio y gastas 10 newen.'],
        ['ENTREGAR', 'Vuelve a la ruka. La carga se entrega automáticamente y suma a la reserva del lof; la meta es 20 piñones.']
      ],
      [
        ['NEWEN', 'Moverte consume newen. Descansa sin moverte cerca de la ruka para recuperarlo; si se agota, avanzarás más lento.'],
        ['EQUILIBRIO', 'Pedir permiso cuida el bosque. El equilibrio cambia el paisaje y también influye en el desenlace.']
      ],
      [
        ['JORNADAS', 'Cada jornada dura dos minutos. Regresa a la ruka para entregar. Puedes cerrar el día allí cuando hayas entregado la carga y no queden pewenes por recolectar. La carga que quede al agotarse el tiempo se pierde.'],
        ['PAUSA Y GUARDADO', 'Pulsa Esc o ⏸ para pausar. Guarda y vuelve al menú; “Cargar partida” conserva tu progreso en este navegador.']
      ]
    ];
    this.paginaAyuda = 0;
    this.textoAyuda = this.add.text(64, 190, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '17px', color: paletaPixel.nieve,
      lineSpacing: 7, wordWrap: { width: 450 }
    });
    this.contenido.add(this.textoAyuda);
    this.botonPagina(-1, 70, 590, '‹ Anterior');
    this.indicePagina = this.add.text(280, 597, '', { fontFamily: 'Consolas, "Courier New", monospace', fontSize: '15px', color: paletaPixel.musgo }).setOrigin(0.5);
    this.contenido.add(this.indicePagina);
    this.botonPagina(1, 354, 590, 'Siguiente ›');
    this.botonVolver = this.add.text(64, 650, '[ Esc · Volver al menú ]', { fontFamily: 'Consolas, "Courier New", monospace', fontSize: '14px', color: paletaPixel.nieve })
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.mostrarPrincipal());
    this.contenido.add(this.botonVolver);
    this.dibujarPaginaAyuda();
  }

  botonPagina(paso, x, y, etiqueta) {
    const boton = this.add.text(x, y, etiqueta, { fontFamily: 'Consolas, "Courier New", monospace', fontSize: '15px', color: paletaPixel.nieve, backgroundColor: '#234b83', padding: { x: 10, y: 6 } })
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.paginaAyuda = Phaser.Math.Clamp(this.paginaAyuda + paso, 0, this.paginasAyuda.length - 1);
        this.dibujarPaginaAyuda();
      });
    this.contenido.add(boton);
  }

  dibujarPaginaAyuda() {
    this.textoAyuda.setText(this.paginasAyuda[this.paginaAyuda].map(([titulo, texto]) => `${titulo}\n${texto}`).join('\n\n'));
    this.indicePagina.setText(`${this.paginaAyuda + 1} / ${this.paginasAyuda.length}`);
  }

  prepararPantalla(titulo, subtitulo) {
    this.contenido.removeAll(true);
    this.opciones = [];
    this.paginasAyuda = null;
    const cabecera = [this.texto(64, 55, titulo, this.pantallaSecundaria ? 25 : 48)];
    if (subtitulo) cabecera.push(this.texto(69, 132, subtitulo, 20, paletaPixel.musgo));
    this.contenido.add(cabecera);
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
        .on('pointerover', () => this.seleccionar(indice, true))
        .on('pointerdown', () => {
          this.seleccionar(indice);
          this.reproducirSonidoBoton('confirmar', true);
          accion();
        });
    }
  }

  seleccionar(indice, conSonido = false) {
    const cambio = this.seleccion !== indice;
    this.seleccion = indice;
    if (cambio && conSonido) this.reproducirSonidoBoton('mover');
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

  reproducirSonidoBoton(tipo, gestoUsuario = false) {
    const contexto = this.sound.context;
    if (!contexto?.createOscillator) return;

    const sonar = () => {
      const ahora = contexto.currentTime;
      const confirmar = tipo === 'confirmar';
      const duracion = confirmar ? 0.095 : 0.045;
      const tono = contexto.createOscillator();
      const volumen = contexto.createGain();
      tono.type = 'sine';
      tono.frequency.setValueAtTime(confirmar ? 440 : 620, ahora);
      if (confirmar) tono.frequency.exponentialRampToValueAtTime(660, ahora + duracion);
      volumen.gain.setValueAtTime(0.0001, ahora);
      volumen.gain.exponentialRampToValueAtTime(confirmar ? 0.055 : 0.025, ahora + 0.008);
      volumen.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);
      tono.connect(volumen);
      volumen.connect(this.sound.masterVolumeNode || contexto.destination);
      tono.start(ahora);
      tono.stop(ahora + duracion);
    };

    if (contexto.state === 'running') sonar();
    else if (gestoUsuario && contexto.state === 'suspended') contexto.resume().then(sonar).catch(() => {});
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
      this.reproducirSonidoBoton('confirmar', true);
      this.mostrarPrincipal();
    }
    else if (this.pantallaSecundaria && this.paginasAyuda && (pulsada(this.teclas.LEFT) || pulsada(this.teclas.A))) {
      this.paginaAyuda = Phaser.Math.Clamp(this.paginaAyuda - 1, 0, this.paginasAyuda.length - 1);
      this.dibujarPaginaAyuda();
    }
    else if (this.pantallaSecundaria && this.paginasAyuda && (pulsada(this.teclas.RIGHT) || pulsada(this.teclas.D))) {
      this.paginaAyuda = Phaser.Math.Clamp(this.paginaAyuda + 1, 0, this.paginasAyuda.length - 1);
      this.dibujarPaginaAyuda();
    }
    else if (elegir) {
      this.reproducirSonidoBoton('confirmar', true);
      this.opciones[this.seleccion].accion();
    }
    else if (arriba || abajo) this.moverSeleccion(arriba ? -1 : 1);
  }
}




