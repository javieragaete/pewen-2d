import { CONFIG } from '../config.js';
import { aplicarIluminacion, BRILLO, cargarPreferencias, guardarPreferencias, mostrarTecla, PREFERENCIAS_BASE, teclaDesdeEvento, actualizarVolumen } from '../settings.js';

const { pantalla, colores } = CONFIG;
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
    this.cameras.main.setBackgroundColor('#202b25');
    this.add.rectangle(pantalla.ancho / 2, pantalla.alto / 2, pantalla.ancho, pantalla.alto, 0x26382e);
    this.add.text(pantalla.ancho / 2, 72, this.categoria, { fontFamily: 'monospace', fontSize: '42px', color: colores.texto }).setOrigin(0.5);
    if (this.categoria === 'Audio') this.mostrarAudio();
    else if (this.categoria === 'Iluminación') this.mostrarIluminacion();
    else this.mostrarControles();
    this.boton(160, 666, 240, 48, 'Restablecer', () => this.restablecer());
    this.boton(1120, 666, 240, 48, 'Volver', () => this.volver());
    this.estado = this.add.text(pantalla.ancho / 2, 650, '', { fontSize: '16px', color: '#d6c58b' }).setOrigin(0.5);
    this.input.keyboard.on('keydown', this.capturarTecla, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.capturarTecla, this));
  }

  mostrarAudio() {
    this.crearSlider('master', 'Volumen general', 250);
    this.crearSlider('music', 'Música', 314);
    this.crearSlider('effects', 'Efectos', 378);
    this.add.text(178, 433, 'El juego todavía no incluye música ni efectos de sonido.', { fontSize: '16px', color: colores.texto });
  }

  mostrarIluminacion() {
    this.add.text(180, 248, 'Brillo general', { fontSize: '22px', color: colores.texto });
    const valor = this.add.text(720, 262, '', { fontSize: '24px', color: colores.texto }).setOrigin(0.5);
    const actualizar = direccion => {
      const brillo = Phaser.Math.Clamp(this.preferencias.iluminacion.brillo + direccion * BRILLO.paso, BRILLO.minimo, BRILLO.maximo);
      this.preferencias.iluminacion.brillo = brillo;
      valor.setText(brillo + '%');
      aplicarIluminacion(this, this.preferencias);
      if (direccion) guardarPreferencias(this.preferencias);
    };
    this.boton(620, 262, 88, 44, '−', () => actualizar(-1));
    this.boton(820, 262, 88, 44, '+', () => actualizar(1));
    actualizar(0);
  }

  mostrarControles() {
    this.add.text(850, 212, 'Principal', { fontSize: '14px', color: '#c9d1bc' }).setOrigin(0.5);
    this.add.text(1055, 212, 'Secundaria', { fontSize: '14px', color: '#c9d1bc' }).setOrigin(0.5);
    FILAS_CONTROL.forEach(([id, etiqueta], indice) => this.crearControl(id, etiqueta, 250 + indice * 43));
  }

  crearSlider(id, etiqueta, y) {
    this.add.text(178, y, etiqueta, { fontSize: '18px', color: colores.texto }).setOrigin(0, 0.5);
    const x = 510, ancho = 480;
    const barra = this.add.rectangle(x + ancho / 2, y, ancho, 12, 0x596c4e).setInteractive({ useHandCursor: true });
    this.add.rectangle(x, y, ancho, 5, 0x596c4e).setOrigin(0, 0.5);
    const relleno = this.add.rectangle(x, y, 1, 12, 0x9daf73).setOrigin(0, 0.5);
    const perilla = this.add.circle(x, y, 11, 0xe6e7d8).setStrokeStyle(2, 0x405946);
    const valor = this.add.text(1040, y, '', { fontSize: '17px', color: colores.texto }).setOrigin(1, 0.5);
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
    this.add.text(180, y, etiqueta, { fontSize: '17px', color: colores.texto }).setOrigin(0, 0.5);
    const asignaciones = this.preferencias.controles[id];
    this.crearBotonTecla(id, 0, 850, y, asignaciones[0]);
    if (CONTROLES_MOVIMIENTO.has(id)) this.crearBotonTecla(id, 1, 1055, y, asignaciones[1]);
  }

  crearBotonTecla(id, indice, x, y, tecla) {
    const boton = this.add.rectangle(x, y, 160, 28, 0x405946).setStrokeStyle(1, 0x9daf73).setInteractive({ useHandCursor: true });
    const texto = this.add.text(x, y, tecla ? mostrarTecla(tecla) : '—', { fontSize: '15px', color: colores.texto }).setOrigin(0.5);
    boton.on('pointerdown', () => this.iniciarCaptura(id, indice, texto));
  }

  iniciarCaptura(id, indice, texto) {
    if (this.captura) this.captura.texto.setText(mostrarTecla(this.preferencias.controles[this.captura.id][this.captura.indice]) || '—');
    this.captura = { id, indice, texto };
    texto.setText('Presiona una tecla…');
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

  boton(x, y, ancho, alto, etiqueta, accion) {
    const tono = 0x405946;
    const fondo = this.add.rectangle(x, y, ancho, alto, tono).setStrokeStyle(2, 0x9daf73).setInteractive({ useHandCursor: true });
    this.add.text(x, y, etiqueta, { fontSize: '18px', color: colores.texto }).setOrigin(0.5);
    fondo.on('pointerover', () => fondo.setFillStyle(0x58734f));
    fondo.on('pointerout', () => fondo.setFillStyle(tono));
    fondo.on('pointerdown', accion);
  }
}
