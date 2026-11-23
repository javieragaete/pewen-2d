import { PALETA, crearMarcoPixel } from '../sistemas/pixel.js';
import { obtenerDialogos } from './narrativa.js';

const FUENTE = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(PALETA[clave]).color;

export class GestorDialogos {
  constructor(escena, estado, ajustes) {
    this.escena = escena;
    this.estado = estado;
    this.ajustes = ajustes;
    this.eventos = escena.game.events;
    this.lineas = [];
    this.bloqueado = false;
    this.crearInterfaz();
    this.alHablar = datos => this.iniciar(datos?.rol);
    this.eventos.on('dialogo:npc', this.alHablar);
    this.escena.events.on('update', this.actualizar, this);
    this.escena.events.once('shutdown', this.destruir, this);
  }

  crearInterfaz() {
    this.fondo = this.escena.add.graphics();
    crearMarcoPixel(this.fondo, 126, 516, 1028, 174, PALETA.K, PALETA.M);
    this.nombre = this.escena.add.text(154, 532, '', {
      fontFamily: FUENTE, fontSize: '20px', color: PALETA.M, fontStyle: 'bold'
    });
    this.texto = this.escena.add.text(154, 568, '', {
      fontFamily: FUENTE, fontSize: '19px', color: PALETA.N,
      lineSpacing: 7, wordWrap: { width: 970 }
    });
    this.avance = this.escena.add.text(1100, 662, 'E · Avanzar', {
      fontFamily: FUENTE, fontSize: '13px', color: PALETA.H
    }).setOrigin(1, 0);
    this.contenedor = this.escena.add.container(0, 0, [this.fondo, this.nombre, this.texto, this.avance])
      .setScrollFactor(0).setDepth(10_100).setVisible(false);
    this.teclas = this.escena.input.keyboard.addKeys('E,ENTER,SPACE');
  }

  iniciar(rol) {
    if (this.bloqueado || !['Lonko', 'Kimche'].includes(rol)) return;
    this.lineas = obtenerDialogos({
      jornada: this.estado.jornada,
      rol,
      equilibrio: this.estado.equilibrio,
      entregados: this.estado.pinonesEntregados,
      meta: this.ajustes.metaPinones
    });
    if (!this.lineas.length) return;
    this.rol = rol;
    this.bloqueado = true;
    this.indiceLinea = 0;
    this.mostrado = 0;
    this.textoCompleto = this.lineas[0];
    this.texto.setText('');
    this.nombre.setText(rol);
    this.contenedor.setVisible(true);
    this.eventos.emit('jugador:bloqueado', { bloqueado: true });
  }

  actualizar(_, delta) {
    if (!this.bloqueado) return;
    this.mostrado += Math.max(0, delta) * 0.12;
    this.texto.setText(this.textoCompleto.slice(0, Math.floor(this.mostrado)));
    const avanzar = ['E', 'ENTER', 'SPACE'].some(nombre =>
      globalThis.Phaser.Input.Keyboard.JustDown(this.teclas[nombre])
    );
    if (!avanzar) return;
    if (this.mostrado < this.textoCompleto.length) {
      this.mostrado = this.textoCompleto.length;
      this.texto.setText(this.textoCompleto);
      return;
    }
    this.indiceLinea += 1;
    if (this.indiceLinea >= this.lineas.length) {
      this.cerrar();
      return;
    }
    this.textoCompleto = this.lineas[this.indiceLinea];
    this.mostrado = 0;
    this.texto.setText('');
  }

  cerrar() {
    this.bloqueado = false;
    this.contenedor.setVisible(false);
    this.eventos.emit('jugador:bloqueado', { bloqueado: false });
  }

  destruir() {
    this.eventos.off('dialogo:npc', this.alHablar);
    this.escena.events.off('update', this.actualizar, this);
    if (this.bloqueado) this.eventos.emit('jugador:bloqueado', { bloqueado: false });
  }
}
