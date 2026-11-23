import { CONFIG } from '../config.js';
import { dibujarFondoMenu } from '../paisaje-menu.js';
import { textoPixel } from '../tipografia.js';
import { aplicarIluminacion, BRILLO, cargarPreferencias, guardarPreferencias, mostrarTecla, PREFERENCIAS_BASE, teclaDesdeEvento, actualizarVolumen } from '../settings.js';

const { pantalla, colores, menu, paletaPixel } = CONFIG;
const estiloTexto = { fontFamily: 'Consolas, monospace', fontSize: '16px', color: colores.texto };
const color = valor => '#' + valor.toString(16).padStart(6, '0');
const Phaser = globalThis.Phaser;
const FILAS_CONTROL = [
  ['up', 'Mover arriba'], ['down', 'Mover abajo'], ['left', 'Mover a la izquierda'], ['right', 'Mover a la derecha'],
  ['interact', 'Interactuar'], ['permission', 'Pedir permiso'], ['direct', 'Recolectar directamente']
];
const CONTROLES_MOVIMIENTO = new Set(['up', 'down', 'left', 'right']);

export class Configuracion extends Phaser.Scene {
  constructor() { super('Configuracion'); }

  create(datos = {}) {
    this.origen = datos.origen || 'Menu';
    this.categoria = datos.categoria || 'Audio';
    this.captura = null;
    this.preferencias = datos.preferencias ?? cargarPreferencias();
    aplicarIluminacion(this, this.preferencias);
    actualizarVolumen(this);
    dibujarFondoMenu(this, pantalla.ancho, pantalla.alto);
    const panel = this.add.graphics();
    panel.fillStyle(0x202522).fillRect(0, 0, 560, pantalla.alto);
    panel.fillStyle(menu.paleta.amarillo.sombra).fillRect(556, 0, 4, pantalla.alto);
    textoPixel(this, 64, 50, this.categoria, this.categoria === 'Iluminación' ? 32 : 48, paletaPixel.nieve);
    textoPixel(this, 68, 135, 'Pewén', 19, paletaPixel.musgo);
    panel.fillStyle(menu.paleta.amarillo.sombra).fillRect(64, 176, 432, 3);
    if (this.categoria === 'Audio') this.mostrarAudio();
    else if (this.categoria === 'Iluminación') this.mostrarIluminacion();
    else this.mostrarControles();
    this.boton(165, 646, 202, 48, 'Restablecer', () => this.restablecer(), 'verde');
    this.boton(408, 646, 176, 48, 'Volver', () => this.volver(), 'azul');
    this.estado = this.add.text(64, 548, '', { ...estiloTexto, color: '#d6c58b', wordWrap: { width: 432 } });
    this.input.keyboard.on('keydown', this.capturarTecla, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.capturarTecla, this));
  }

  mostrarAudio() {
    this.crearSlider('master', 'Volumen general', 239);
    this.crearSlider('music', 'Música', 335);
    this.crearSlider('effects', 'Efectos', 431);
  }

  mostrarIluminacion() {
    textoPixel(this, 64, 224, 'Brillo general', 19, paletaPixel.musgo);
    const valor = this.add.text(280, 308, '', { ...estiloTexto, fontSize: '26px' }).setOrigin(0.5);
    const medidor = this.add.rectangle(64, 367, 432, 12, menu.paleta.tinta).setOrigin(0, 0.5);
    const nivel = this.add.rectangle(medidor.x, medidor.y, 1, 8, menu.paleta.amarillo.centro).setOrigin(0, 0.5);
    const actualizar = direccion => {
      const brillo = Phaser.Math.Clamp(this.preferencias.iluminacion.brillo + direccion * BRILLO.paso, BRILLO.minimo, BRILLO.maximo);
      this.preferencias.iluminacion.brillo = brillo;
      valor.setText(brillo + '%');
      nivel.width = medidor.width * (brillo - BRILLO.minimo) / (BRILLO.maximo - BRILLO.minimo);
      aplicarIluminacion(this, this.preferencias);
      if (direccion) guardarPreferencias(this.preferencias);
    };
    this.boton(122, 308, 116, 48, '−', () => actualizar(-1), 'azul');
    this.boton(438, 308, 116, 48, '+', () => actualizar(1), 'verde');
    actualizar(0);
  }

  mostrarControles() {
    this.add.text(350, 210, 'Principal', { fontSize: '14px', color: '#c9d1bc' }).setOrigin(0.5);
    this.add.text(451, 210, 'Secundaria', { fontSize: '14px', color: '#c9d1bc' }).setOrigin(0.5);
    FILAS_CONTROL.forEach(([id, etiqueta], indice) => this.crearControl(id, etiqueta, 246 + indice * 41));
  }

  crearSlider(id, etiqueta, y) {
    textoPixel(this, 64, y - 32, etiqueta, 19, paletaPixel.nieve);
    const x = 64, ancho = 360;
    const barra = this.add.rectangle(x + ancho / 2, y, ancho, 28, 0x596c4e, 0).setInteractive({ useHandCursor: true });
    this.add.rectangle(x, y, ancho, 5, 0x596c4e).setOrigin(0, 0.5);
    const relleno = this.add.rectangle(x, y, 1, 12, 0x9daf73).setOrigin(0, 0.5);
    const perilla = this.add.rectangle(x, y, 12, 20, menu.paleta.amarillo.centro).setStrokeStyle(2, menu.paleta.tinta);
    const valor = this.add.text(496, y, '', { fontSize: '17px', color: colores.texto }).setOrigin(1, 0.5);
    const actualizar = (punteroX) => {
      this.preferencias.audio[id] = Phaser.Math.Clamp((punteroX - x) / ancho, 0, 1);
      relleno.width = ancho * this.preferencias.audio[id];
      perilla.x = x + relleno.width;
      valor.setText(`${Math.round(this.preferencias.audio[id] * 100)}%`);
      guardarPreferencias(this.preferencias);
      actualizarVolumen(this);
    };
    actualizar(x + ancho * this.preferencias.audio[id]);
    barra.on('pointerdown', (puntero) => actualizar(puntero.x));
    barra.on('pointermove', (puntero) => { if (puntero.isDown) actualizar(puntero.x); });
  }

  crearControl(id, etiqueta, y) {
    this.add.text(64, y, etiqueta, estiloTexto).setOrigin(0, 0.5);
    const asignaciones = this.preferencias.controles[id];
    this.crearBotonTecla(id, 0, 350, y, asignaciones[0]);
    if (CONTROLES_MOVIMIENTO.has(id)) this.crearBotonTecla(id, 1, 451, y, asignaciones[1]);
  }

  crearBotonTecla(id, indice, x, y, tecla) {
    const boton = this.marcoBoton(x, y, 89, 32, 'azul');
    const texto = this.add.text(x, y, tecla ? mostrarTecla(tecla) : '—', { fontSize: '15px', color: colores.texto }).setOrigin(0.5);
    boton.on('pointerdown', () => this.iniciarCaptura(id, indice, texto));
  }

  iniciarCaptura(id, indice, texto) {
    if (this.captura) this.captura.texto.setText(mostrarTecla(this.preferencias.controles[this.captura.id][this.captura.indice]) || '—');
    this.captura = { id, indice, texto };
    texto.setText('Pulsa…');
    this.estado.setText('Esc cancela. Retroceso borra una tecla secundaria.');
  }

  capturarTecla(evento) {
    if (!this.captura) {
      if (evento.code === 'Escape') this.volver();
      return;
    }
    const { id, indice, texto } = this.captura;
    if (evento.code === 'Escape') {
      texto.setText(mostrarTecla(this.preferencias.controles[id][indice]) || '—');
      this.captura = null;
      this.estado.setText('Asignación cancelada.');
      return;
    }
    if (['Backspace', 'Delete'].includes(evento.code) && indice === 1) {
      evento.preventDefault();
      this.preferencias.controles[id][indice] = '';
      texto.setText('—');
      guardarPreferencias(this.preferencias);
      this.captura = null;
      this.estado.setText('Tecla secundaria eliminada.');
      return;
    }
    const tecla = teclaDesdeEvento(evento);
    if (!tecla || tecla === 'ESC') return;
    const duplicada = Object.entries(this.preferencias.controles).find(([otroId, valores]) =>
      valores.some((valor, otroIndice) => valor === tecla && (otroId !== id || otroIndice !== indice))
    );
    if (duplicada) {
      this.estado.setText(`Esa tecla ya está asignada a ${FILAS_CONTROL.find(([controlId]) => controlId === duplicada[0])?.[1] || duplicada[0]}.`);
      return;
    }
    this.preferencias.controles[id][indice] = tecla;
    texto.setText(mostrarTecla(tecla));
    guardarPreferencias(this.preferencias);
    this.captura = null;
    this.estado.setText('Control guardado.');
  }

  restablecer() {
    const preferencias = structuredClone(PREFERENCIAS_BASE);
    guardarPreferencias(preferencias);
    this.scene.restart({ origen: this.origen, categoria: this.categoria, preferencias });
  }

  volver() {
    this.scene.start('Menu');
  }

  marcoBoton(x, y, ancho, alto, variante) {
    const forma = this.add.graphics({ x: x - ancho / 2, y: y - alto / 2 });
    const dibujar = ({ centro, luz, sombra }) => {
      forma.clear().fillStyle(menu.paleta.tinta).fillRect(6, 0, ancho - 12, alto)
        .fillRect(0, 6, ancho, alto - 12);
      forma.fillStyle(luz).fillRect(6, 4, ancho - 12, alto - 8);
      forma.fillStyle(sombra).fillRect(6, alto - 10, ancho - 12, 6);
      forma.fillStyle(centro).fillRect(8, 8, ancho - 16, alto - 18);
    };
    dibujar(menu.paleta[variante]);
    forma.setInteractive(new Phaser.Geom.Rectangle(0, 0, ancho, alto), Phaser.Geom.Rectangle.Contains)
      .on('pointerover', () => dibujar({ ...menu.paleta[variante], centro: menu.paleta[variante].sombra }))
      .on('pointerout', () => dibujar(menu.paleta[variante]));
    forma.input.cursor = 'pointer';
    return forma;
  }

  boton(x, y, ancho, alto, etiqueta, accion, variante) {
    this.marcoBoton(x, y, ancho, alto, variante).on('pointerdown', accion);
    if (etiqueta.length === 1) {
      this.add.text(x, y, etiqueta, { ...estiloTexto, fontSize: '24px' }).setOrigin(0.5);
    } else {
      textoPixel(this, x - etiqueta.length * 6, y - 10, etiqueta, 19, color(menu.paleta.claro));
    }
  }
}
