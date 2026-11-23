import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';
import { crearTexturaDesdeMatriz } from './pixel.js';

const PERFIL_COPA = [
  [7, 8], [5, 10], [3, 12], [2, 13], [1, 14], [1, 14], [1, 14],
  [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15], [0, 15],
  [1, 14], [1, 14], [2, 13], [2, 13], [3, 12], [4, 11], [5, 10], [6, 9], [7, 8]
];

function matrizPlaceholder(estado, variante) {
  const hojas = estado === 'seco' ? ['q', 'c', 'p'] : estado === 'sano' ? ['D', 'F', 'V', 'M'] : ['D', 'F', 'V'];
  return Array.from({ length: 32 }, (_, y) => Array.from({ length: 16 }, (_, x) => {
    if (y < PERFIL_COPA.length) {
      const [izquierda, derecha] = PERFIL_COPA[y];
      if (x < izquierda || x > derecha) return '.';
      if (x === izquierda || x === derecha) return 'K';
      return hojas[(x + y + variante) % hojas.length];
    }
    if (y >= 22 && (x === 7 || x === 8)) return y === 22 || y === 31 ? 'K' : (x === 7 ? 'W' : 'T');
    if (y >= 29 && y <= 31 && (x === 6 || x === 9)) return 'B';
    return '.';
  }).join(''));
}

function claveTextura(ancla, estado) {
  const tipo = String(ancla.tipo || 'adulto').toLowerCase();
  if (tipo.includes('joven')) return `pewen-joven-a-${estado}`;
  const variante = ['b', '1'].includes(String(ancla.variante || '').toLowerCase()) ? 'b' : 'a';
  return `pewen-adulto-${variante}-${estado}`;
}

export class SistemaPewenes {
  constructor(escena, anclas, estado, guardar) {
    this.escena = escena;
    this.anclas = anclas || [];
    this.estado = estado;
    this.guardar = guardar;
    this.pewenes = this.anclas.map((ancla, indice) => this.crear(ancla, indice));
    this.actualizarEstado(estado.equilibrio);
  }

  crear(ancla, indice) {
    const id = String(ancla.id ?? indice);
    let registro = this.estado.pewenes.find(pewen => pewen.id === id);
    if (!registro) {
      registro = { id, jornadaToma: 0, modoToma: '', secoPermanente: false };
      this.estado.pewenes.push(registro);
      this.guardar();
    }
    const x = Number(ancla.x) || 0;
    const y = Number(ancla.y) || 0;
    const objeto = { id, ancla, registro, x, y, indice, imagen: null, zona: null, estadoVisual: '' };
    objeto.imagen = this.escena.add.image(x, y, this.resolverTextura(objeto, 'normal'))
      .setOrigin(0.5, 1).setScale(AJUSTES.escalaSprite).setDepth(y);
    objeto.zona = this.escena.add.zone(x, y - 4, 32, 16).setOrigin(0.5, 1).setVisible(false);
    return objeto;
  }

  resolverTextura(pewen, estado) {
    const clave = claveTextura(pewen.ancla, estado);
    if (!this.escena.textures.exists(clave)) {
      crearTexturaDesdeMatriz(this.escena, clave, matrizPlaceholder(estado, pewen.indice % 2));
    }
    return clave;
  }

  disponible(pewen, jornada = this.estado.jornada) {
    if (pewen.registro.secoPermanente) return false;
    if (this.estado.equilibrio <= AJUSTES.umbralEquilibrioSeco && pewen.indice % 3 === 0) return false;
    return pewen.registro.jornadaToma !== jornada;
  }

  registrarToma(pewen, modo, jornada = this.estado.jornada) {
    pewen.registro.jornadaToma = jornada;
    pewen.registro.modoToma = modo;
    if (modo === 'directa') pewen.registro.secoPermanente = true;
    this.actualizarTextura(pewen, this.estado.equilibrio);
    this.guardar();
  }

  avanzarJornada(jornada) {
    for (const pewen of this.pewenes) {
      if (pewen.registro.modoToma === 'permiso' && pewen.registro.jornadaToma < jornada) {
        pewen.registro.jornadaToma = 0;
        pewen.registro.modoToma = '';
      }
    }
    this.estado.jornada = jornada;
    this.actualizarEstado(this.estado.equilibrio);
    this.guardar();
  }

  actualizarEstado(equilibrio) {
    for (const pewen of this.pewenes) this.actualizarTextura(pewen, equilibrio);
  }

  actualizarTextura(pewen, equilibrio) {
    let visual = equilibrio >= AJUSTES.umbralEquilibrioSano ? 'sano' : 'normal';
    if (pewen.registro.secoPermanente || pewen.registro.jornadaToma === this.estado.jornada) {
      visual = 'seco';
    } else if (equilibrio <= AJUSTES.umbralEquilibrioSeco && pewen.indice % 3 === 0) {
      visual = 'seco';
    }
    if (visual === pewen.estadoVisual) return;
    pewen.estadoVisual = visual;
    pewen.imagen.setTexture(this.resolverTextura(pewen, visual));
  }

  cercanos(jugador, alcance = AJUSTES.alcancePewen) {
    const Phaser = globalThis.Phaser;
    return this.pewenes
      .filter(pewen => this.disponible(pewen))
      .map(pewen => ({ pewen, distancia: Phaser.Math.Distance.Between(jugador.x, jugador.y, pewen.x, pewen.y) }))
      .filter(({ distancia }) => distancia <= alcance)
      .sort((a, b) => a.distancia - b.distancia)
      .map(({ pewen }) => pewen);
  }

  quedanPorUsar() {
    return this.pewenes.some(pewen => this.disponible(pewen));
  }

  restaurarPorPermiso() {
    for (const pewen of this.pewenes) {
      if (pewen.registro.modoToma === 'permiso') {
        pewen.registro.jornadaToma = 0;
        pewen.registro.modoToma = '';
      }
    }
    this.actualizarEstado(this.estado.equilibrio);
    this.guardar();
  }
}
