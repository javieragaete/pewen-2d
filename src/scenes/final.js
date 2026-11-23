import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { NARRATIVA } from '../historia/narrativa.js';
import { crearEstadoInicial, leerEstado, guardarEstado } from '../sistemas/estado.js';

// Resultado narrativo calculado desde el estado persistido de la partida.
export class EscenaFinal extends Phaser.Scene {
  constructor() { super('Final'); }

  create() {
    const estado = leerEstado(this.game);
    const totalTomas = estado.permisosPedidos + estado.tomasDirectas;
    const fraccionPermisos = totalTomas ? estado.permisosPedidos / totalTomas : 0;
    const cumplioMeta = estado.pinonesEntregados >= A.metaPinones;
    let resultado = NARRATIVA.finales.inviernoDuro;
    if (cumplioMeta && estado.equilibrio >= 60) {
      resultado = fraccionPermisos >= A.fraccionPermisosFinalBueno
        ? NARRATIVA.finales.inviernoBuenoConRespeto : NARRATIVA.finales.inviernoBueno;
    } else if (cumplioMeta) resultado = NARRATIVA.finales.bosqueDañado;

    this.add.rectangle(640, 360, 1280, 720, 0x202522);
    this.add.rectangle(640, 360, 940, 370, 0x344c3b).setStrokeStyle(2, 0x14181a);
    this.add.text(640, 240, cumplioMeta ? 'EL LOF' : 'INVIERNO', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '36px',
      color: '#e6e7d8', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(640, 320, resultado, {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '21px',
      color: '#e6e7d8', align: 'center', lineSpacing: 9, wordWrap: { width: 760 }
    }).setOrigin(0.5, 0);
    this.add.text(640, 520, '[R] Reiniciar     [M] Volver al menú', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '17px', color: '#a9c4cc'
    }).setOrigin(0.5);
    this.input.keyboard.on('keydown', this.teclaPulsada, this);
    this.events.once('shutdown', () => this.input.keyboard.off('keydown', this.teclaPulsada, this));
  }

  teclaPulsada(evento) {
    if (evento.key.toLowerCase() === 'r') {
      guardarEstado(this.game, crearEstadoInicial());
      this.scene.start('Prologo');
    } else if (evento.key.toLowerCase() === 'm') this.scene.start('Menu');
  }
}

