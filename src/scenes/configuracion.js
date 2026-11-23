import { CONFIG } from '../config.js';
import { cargarPreferencias, guardarPreferencias, mostrarTecla, mostrarAsignacion, teclaDesdeEvento, actualizarVolumen } from '../settings.js';

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
    actualizarVolumen(this);
    this.preferencias = cargarPreferencias();
    this.cameras.main.setBackgroundColor('#202b25');
    this.add.rectangle(pantalla.ancho / 2, pantalla.alto / 2, pantalla.ancho, pantalla.alto, 0x26382e);
    this.add.text(pantalla.ancho / 2, 52, 'Configuración', { fontFamily: 'Georgia, serif', fontSize: '42px', color: colores.texto }).setOrigin(0.5);
    this.add.text(145, 120, 'Audio', { fontSize: '24px', color: '#e6e7d8' });
    this.crearSlider('master', 'Volumen general', 164);
    this.crearSlider('music', 'Música', 220);
    this.crearSlider('effects', 'Efectos', 276);
    this.add.text(178, 308, 'El repositorio todavía no incluye música ni efectos de sonido.', { fontSize: '14px', color: '#c9d1bc' });
    this.add.text(145, 340, 'Controles', { fontSize: '24px', color: '#e6e7d8' });
    this.add.text(850, 366, 'Principal', { fontSize: '14px', color: '#c9d1bc' }).setOrigin(0.5);
    this.add.text(1055, 366, 'Secundaria', { fontSize: '14px', color: '#c9d1bc' }).setOrigin(0.5);
    FILAS_CONTROL.forEach(([id, etiqueta], indice) => this.crearControl(id, etiqueta, 394 + indice * 33));
    this.boton(160, 666, 240, 48, 'Restablecer', () => this.restablecer());
    this.boton(1120, 666, 240, 48, 'Volver', () => this.volver());
    this.estado = this.add.text(pantalla.ancho / 2, 650, '', { fontSize: '16px', color: '#d6c58b' }).setOrigin(0.5);
    this.input.keyboard.on('keydown', this.capturarTecla, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.capturarTecla, this));
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
    this.estado.setText('Esc pausa. Para vaciar una tecla secundaria, presiona Retroceso.');
  }

  capturarTecla(evento) {
    if (!this.captura) return;
    const { id, indice, texto } = this.captura;
    if (evento.code === 'Escape') {
      texto.setText(mostrarTecla(this.preferencias.controles[id][indice]) || '—');
      this.captura = null;
      this.estado.setText('Esc está reservado para pausar.');
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
    localStorage.removeItem('pewen-preferencias');
    this.scene.restart({ origen: this.origen });
  }

  volver() {
    if (this.origen === 'Pausa') {
      this.scene.get('Juego').actualizarControles();
      this.scene.stop();
      this.scene.resume('Pausa');
    } else {
      this.scene.start('Menu');
    }
  }

  boton(x, y, ancho, alto, etiqueta, accion) {
    const fondo = this.add.rectangle(x, y, ancho, alto, 0x405946).setStrokeStyle(2, 0x9daf73).setInteractive({ useHandCursor: true });
    this.add.text(x, y, etiqueta, { fontSize: '18px', color: colores.texto }).setOrigin(0.5);
    fondo.on('pointerover', () => fondo.setFillStyle(0x58734f));
    fondo.on('pointerout', () => fondo.setFillStyle(0x405946));
    fondo.on('pointerdown', accion);
  }
}
