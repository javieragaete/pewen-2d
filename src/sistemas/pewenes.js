import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';

const P = globalThis.Phaser;
const colorEstado = { sano: 0x70905a, normal: 0x4a6845, seco: 0x92704b };

// Coloca los pewenes usando las anclas publicadas por la escena Mundo.
export class Pewenes {
  constructor(escena, estado) {
    this.escena = escena;
    this.estado = estado;
    this.jornadaActiva = estado.jornada;
    this.recolectar = null;
    this.teclaInteractuar = escena.input.keyboard.addKey(P.Input.Keyboard.KeyCodes.E);
    this.arboles = (escena.anclas?.pewenes ?? []).map((dato, indice) => this.crear(dato, indice));
    this.indicador = escena.add.text(0, 0, '[E] Interactuar', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '15px',
      color: '#e6e7d8', backgroundColor: '#202522', padding: { x: 6, y: 3 }
    }).setOrigin(0.5, 1).setDepth(10_000).setVisible(false);
    escena.events.on('update', this.actualizar, this);
    escena.game.events.on('jornada:inicio', this.iniciarJornada, this);
    escena.events.once('shutdown', this.destruir, this);
  }

  crear(dato, indice) {
    const x = dato.x;
    const y = dato.y;
    const arbol = {
      id: dato.id ?? `pewen-${indice + 1}`,
      x, y,
      tipo: dato.tipo === 'joven' ? 'joven' : 'adulto',
      variante: dato.variante === 'b' ? 'b' : 'a',
      recolectado: false,
      secoTemporal: false,
      secoEnJornada: null,
      recuperaEn: null
    };
    const textura = this.claveTextura(arbol, this.estado.equilibrio);
    if (this.escena.textures.exists(textura)) {
      arbol.visual = this.escena.add.image(x, y, textura)
        .setOrigin(0.5, 1).setScale(3).setDepth(y);
    } else {
      // Placeholder propio mientras el flujo de arte publica las texturas del contrato.
      arbol.visual = this.escena.add.rectangle(x, y - 54, 62, 108, colorEstado.normal)
        .setStrokeStyle(3, 0x14181a).setDepth(y);
      arbol.placeholder = true;
    }
    return arbol;
  }

  claveTextura(arbol, equilibrio, estadoForzado = null) {
    const estadoVisual = estadoForzado ?? (
      equilibrio >= A.umbralEquilibrioSano ? 'sano'
        : equilibrio <= A.umbralEquilibrioBajo ? 'seco' : 'normal'
    );
    return arbol.tipo === 'joven'
      ? `pewen-joven-a-${estadoVisual}`
      : `pewen-adulto-${arbol.variante}-${estadoVisual}`;
  }

  conectarRecoleccion(recoleccion) {
    this.recolectar = recoleccion;
  }

  actualizarApariencia(arbol) {
    const estadoVisual = arbol.secoTemporal ? 'seco'
      : arbol.recuperaEn ? 'normal'
      : this.estado.equilibrio >= A.umbralEquilibrioSano ? 'sano'
        : this.estado.equilibrio <= A.umbralEquilibrioBajo ? 'seco' : 'normal';
    if (arbol.placeholder) arbol.visual.setFillStyle(colorEstado[estadoVisual]);
    else arbol.visual.setTexture(this.claveTextura(arbol, this.estado.equilibrio, estadoVisual));
    arbol.visual.setDepth(arbol.y);
  }

  actualizarEstados() {
    this.arboles.forEach(arbol => this.actualizarApariencia(arbol));
  }

  iniciarJornada({ n } = {}) {
    const jornada = n ?? this.estado.jornada;
    if (jornada > this.jornadaActiva) {
      for (const arbol of this.arboles) {
        arbol.secoTemporal = arbol.secoEnJornada === jornada;
        if (arbol.recuperaEn === jornada) {
          arbol.secoTemporal = false;
          arbol.recuperaEn = null;
        }
        arbol.recolectado = arbol.secoTemporal;
      }
      this.jornadaActiva = jornada;
    }

    if (this.estado.equilibrio <= A.umbralEquilibrioBajo) {
      const extra = Math.min(A.pewenesSecosExtraEquilibrioBajo,
        this.arboles.filter(arbol => !arbol.recolectado).length);
      this.arboles.filter(arbol => !arbol.recolectado).slice(0, extra).forEach(arbol => {
        arbol.secoTemporal = true;
        arbol.recolectado = true;
      });
    }
    this.actualizarEstados();
  }

  registrarToma(arbol, pidioPermiso) {
    arbol.recolectado = true;
    arbol.secoTemporal = !pidioPermiso;
    arbol.secoEnJornada = pidioPermiso ? null : this.estado.jornada + 1;
    arbol.recuperaEn = pidioPermiso ? this.estado.jornada + 1 : null;
    this.estado.pewenesUsados ??= [];
    this.estado.pewenesUsados.push({ id: arbol.id, jornada: this.estado.jornada, permiso: pidioPermiso });
    this.actualizarEstados();
    this.indicador.setVisible(false);
  }

  actualizar() {
    const jugador = this.escena.jugador;
    if (!jugador || !this.recolectar || this.recolectar.menuAbierto) {
      this.indicador.setVisible(false);
      return;
    }
    let cercano = null;
    let distanciaMenor = A.radioInteraccionPewen;
    for (const arbol of this.arboles) {
      if (arbol.recolectado) continue;
      const distancia = P.Math.Distance.Between(jugador.x, jugador.y, arbol.x, arbol.y);
      if (distancia <= distanciaMenor) {
        cercano = arbol;
        distanciaMenor = distancia;
      }
    }
    this.arbolCercano = cercano;
    this.indicador.setVisible(Boolean(cercano));
    if (!cercano) return;
    this.indicador.setPosition(cercano.x, cercano.y - (cercano.tipo === 'joven' ? 120 : 210));
    if (P.Input.Keyboard.JustDown(this.teclaInteractuar)) this.recolectar.abrir(cercano);
  }

  destruir() {
    this.escena.events.off('update', this.actualizar, this);
    this.escena.game.events.off('jornada:inicio', this.iniciarJornada, this);
  }
}


