import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { NARRATIVA } from './narrativa.js';

const P = globalThis.Phaser;
const AVANCE = new Set(['e', 'enter', ' ']);

// Caja de diálogo que bloquea al jugador y detiene el reloj mientras se lee.
export class Dialogo {
  constructor(escena, estado) {
    this.escena = escena;
    this.estado = estado;
    this.cola = [];
    this.activo = false;
    this.mostrado = new Set();
    this.crearCaja();
    this.tecla = escena.input.keyboard.addKeys({ e: 'E', enter: 'ENTER', espacio: 'SPACE' });
    escena.game.events.on('dialogo:npc', this.hablarCon, this);
    escena.game.events.on('jornada:inicio', this.inicioJornada, this);
    escena.events.on('update', this.actualizar, this);
    escena.events.once('shutdown', this.destruir, this);
  }

  crearCaja() {
    this.marco = this.escena.add.graphics().setScrollFactor(0).setDepth(11_000);
    this.nombre = this.escena.add.text(158, 548, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '20px',
      color: '#f0c95a', fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(11_001);
    this.texto = this.escena.add.text(158, 580, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '19px',
      color: '#e6e7d8', lineSpacing: 5, wordWrap: { width: 965 }
    }).setScrollFactor(0).setDepth(11_001);
    this.aviso = this.escena.add.text(1110, 650, 'E  continuar', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '14px', color: '#a9c4cc'
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(11_001);
    this.ocultar();
  }

  inicioJornada({ n } = {}) {
    if (n === 1) {
      this.esperaInicio?.remove();
      this.esperaInicio = this.escena.time.delayedCall(A.tarjetaJornadaMs, () => {
        const clave = 'j1-Kimche';
        if (this.mostrado.has(clave)) return;
        this.mostrado.add(clave);
        this.mostrar('Kimche', NARRATIVA.jornada1.Kimche, clave);
      });
    }
  }

  hablarCon({ rol } = {}) {
    if (!['Lonko', 'Kimche'].includes(rol)) return;
    const jornada = this.estado.jornada;
    const clave = `j${jornada}-${rol}`;
    if (this.mostrado.has(clave)) return;
    let lineas;
    if (jornada === 1) {
      lineas = NARRATIVA.jornada1[rol];
    } else if (jornada === 2 && rol === 'Kimche') {
      const eq = this.estado.equilibrio;
      const nivel = eq >= 60 ? 'alto' : eq <= 30 ? 'bajo' : 'medio';
      lineas = NARRATIVA.jornada2.Kimche[nivel];
    } else if (jornada === 2 && rol === 'Lonko') {
      lineas = NARRATIVA.jornada2.Lonko;
    } else if (jornada === 3) {
      lineas = NARRATIVA.jornada3[rol];
    }
    if (!lineas) return;
    this.mostrado.add(clave);
    this.mostrar(rol, lineas, clave);
  }

  mostrar(rol, lineas, clave) {
    this.cola = [...lineas];
    this.rol = rol;
    this.clave = clave;
    this.activo = true;
    this.completo = false;
    this.nombre.setText(rol);
    this.textoCompleto = this.resolver(this.cola.shift());
    this.texto.setText('');
    this.indice = 0;
    this.siguienteCaracter = this.escena.time.now;
    this.marco.clear().fillStyle(0x202522, 0.97).fillRect(136, 530, 1008, 160)
      .lineStyle(2, 0x14181a, 1).strokeRect(136, 530, 1008, 160);
    this.marco.setVisible(true);
    this.nombre.setVisible(true); this.texto.setVisible(true); this.aviso.setVisible(true);
    this.escena.game.events.emit('jugador:bloqueado', { bloqueado: true });
  }

  resolver(texto) {
    const n = this.estado.pinonesEntregados;
    return texto.replaceAll('{meta}', String(A.metaPinones))
      .replaceAll('{n}', String(n)).replaceAll('{falta}', String(Math.max(0, A.metaPinones - n)));
  }

  actualizar() {
    if (!this.activo) return;
    if (!this.completo && this.escena.time.now >= this.siguienteCaracter) {
      this.indice = Math.min(this.textoCompleto.length, this.indice + 2);
      this.texto.setText(this.textoCompleto.slice(0, this.indice));
      this.siguienteCaracter = this.escena.time.now + 22;
      if (this.indice >= this.textoCompleto.length) this.completo = true;
    }
    const avance = P.Input.Keyboard.JustDown(this.tecla.e)
      || P.Input.Keyboard.JustDown(this.tecla.enter)
      || P.Input.Keyboard.JustDown(this.tecla.espacio);
    if (!avance) return;
    if (!this.completo) {
      this.texto.setText(this.textoCompleto);
      this.completo = true;
      return;
    }
    if (this.cola.length) {
      this.textoCompleto = this.resolver(this.cola.shift());
      this.texto.setText(''); this.indice = 0; this.completo = false;
      this.siguienteCaracter = this.escena.time.now;
      return;
    }
    this.activo = false;
    this.ocultar();
    this.escena.game.events.emit('jugador:bloqueado', { bloqueado: false });
  }

  ocultar() {
    this.marco.setVisible(false); this.nombre.setVisible(false);
    this.texto.setVisible(false); this.aviso.setVisible(false);
  }

  destruir() {
    this.escena.game.events.off('dialogo:npc', this.hablarCon, this);
    this.escena.game.events.off('jornada:inicio', this.inicioJornada, this);
    this.escena.events.off('update', this.actualizar, this);
    this.esperaInicio?.remove();
  }
}

