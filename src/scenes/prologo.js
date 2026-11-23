import { NARRATIVA } from '../historia/narrativa.js';
import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { crearEstadoInicial, guardarEstado } from '../sistemas/estado.js';

// Escena independiente de bienvenida; A la registra en main.js al integrar el flujo.
export class EscenaPrologo extends Phaser.Scene {
  constructor() { super('Prologo'); }

  create() {
    this.pagina = 0;
    this.add.rectangle(640, 360, 1280, 720, 0x202522);
    this.add.rectangle(640, 360, 850, 260, 0x344c3b).setStrokeStyle(2, 0x14181a);
    this.titulo = this.add.text(640, 285, 'PEWÉN', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '42px',
      color: '#e6e7d8', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.cuerpo = this.add.text(640, 360, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '22px',
      color: '#e6e7d8', align: 'center', lineSpacing: 10, wordWrap: { width: 740 }
    }).setOrigin(0.5, 0);
    this.ayuda = this.add.text(640, 548, 'E / Enter / espacio · continuar      Esc · saltar', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '15px', color: '#a9c4cc'
    }).setOrigin(0.5);
    this.actualizarTexto();
    this.input.keyboard.on('keydown', this.teclaPulsada, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.teclaPulsada, this));
  }

  actualizarTexto() { this.cuerpo.setText(NARRATIVA.prologo[this.pagina]); }

  teclaPulsada(evento) {
    if (evento.key === 'Escape') { this.comenzar(); return; }
    if (!['e', 'Enter', ' '].includes(evento.key)) return;
    this.pagina++;
    if (this.pagina >= NARRATIVA.prologo.length) this.comenzar();
    else this.actualizarTexto();
  }

  comenzar() {
    guardarEstado(this.game, crearEstadoInicial());
    this.scene.start('Mundo', { nuevaPartida: true });
  }
}

