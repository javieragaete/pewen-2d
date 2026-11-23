import { CONFIG } from '../config.js';

const { pantalla, mundo, mapa, recoleccion, colores } = CONFIG;
const { Input, Math: Matematica } = globalThis.Phaser;

export class Recoleccion {
  constructor(escena) {
    this.escena = escena;
    this.pinones = 0;
    this.pewenes = mapa.pewenes.map(([x, y]) => this.crearPewen(x, y));
    this.teclas = escena.input.keyboard.addKeys({ interactuar: 'E', permiso: 'ONE', directa: 'TWO' });
    this.ocupaAlJugador = false;
    this.objetivo = null;
    this.pista = escena.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '17px',
      color: colores.texto, backgroundColor: colores.negro, padding: { x: 10, y: 6 }
    }).setOrigin(0.5, 1).setDepth(mundo.alto + 2).setVisible(false);
    const panel = escena.add.rectangle(0, 0, 510, 162, 0x18231e, 0.97);
    const texto = escena.add.text(0, 0, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px',
      color: colores.texto, align: 'center', lineSpacing: 8, wordWrap: { width: 470 }
    }).setOrigin(0.5);
    this.texto = texto;
    this.panel = escena.add.container(pantalla.ancho / 2, pantalla.alto / 2, [panel, texto])
      .setScrollFactor(0).setDepth(mundo.alto + 3).setVisible(false);
  }

  crearPewen(x, y) {
    const arbol = this.escena.add.graphics({ x, y }).setDepth(y);
    arbol.fillStyle(colores.sombra, 0.42).fillEllipse(9, 4, 109, 26);
    arbol.fillStyle(colores.madera).fillRoundedRect(-7, -116, 14, 119, 3);
    arbol.lineStyle(6, colores.madera);
    for (const [lado, altura, alcance] of [[-1, -48, 36], [1, -62, 34], [-1, -79, 27], [1, -94, 27]]) {
      arbol.lineBetween(0, altura, lado * alcance, altura - 19);
      arbol.fillStyle(colores.hoja).fillEllipse(lado * alcance, altura - 22, 42, 23);
      arbol.fillStyle(colores.hojaClara).fillEllipse(lado * alcance, altura - 26, 32, 15);
    }
    arbol.fillStyle(colores.hoja).fillEllipse(0, -115, 61, 31);
    arbol.fillStyle(colores.hojaClara).fillEllipse(0, -122, 49, 21);
    const pinones = this.escena.add.graphics({ x, y }).setDepth(y + 1);
    pinones.fillStyle(colores.techo).fillEllipse(-16, 5, 9, 5).fillEllipse(-6, 12, 8, 5).fillEllipse(5, 7, 9, 5);
    return { x, y, pinones, recolectado: false };
  }

  actualizar(personaje) {
    // Consumir las pulsaciones incluso durante la pausa evita abrir otro menú al terminar.
    const interactuar = Input.Keyboard.JustDown(this.teclas.interactuar);
    const permiso = Input.Keyboard.JustDown(this.teclas.permiso);
    const directa = Input.Keyboard.JustDown(this.teclas.directa);
    if (this.ocupaAlJugador) {
      if (this.objetivo && (permiso || directa)) this.elegir(permiso);
      return;
    }

    let cercano = null;
    let distanciaMinima = recoleccion.alcance;
    for (const pewen of this.pewenes) {
      const distancia = Matematica.Distance.Between(personaje.x, personaje.y, pewen.x, pewen.y);
      if (distancia <= distanciaMinima) {
        cercano = pewen;
        distanciaMinima = distancia;
      }
    }
    this.pista.setVisible(Boolean(cercano));
    if (!cercano) return;
    this.pista.setPosition(cercano.x, cercano.y - 137)
      .setText(cercano.recolectado ? 'Ya recolectado' : '[E] Interactuar');
    if (interactuar && !cercano.recolectado) {
      this.aviso?.remove();
      this.objetivo = cercano;
      this.ocupaAlJugador = true;
      this.pista.setVisible(false);
      this.mostrar('Pewén\n[1] Pedir permiso y tomar lo necesario\n[2] Tomar sin pedir permiso');
    }
  }

  elegir(pedirPermiso) {
    const pewen = this.objetivo;
    this.objetivo = null;
    if (pedirPermiso) {
      this.mostrar('Pides permiso al Ngen del lugar.\nHaces una pausa.');
      this.escena.time.delayedCall(recoleccion.pausaPermiso, () => {
        this.recolectar(pewen, recoleccion.permiso);
      });
    } else {
      this.recolectar(pewen, recoleccion.directa);
    }
  }

  recolectar(pewen, efecto) {
    pewen.recolectado = true;
    pewen.pinones.setVisible(false);
    this.pinones += efecto.pinones;
    this.ocupaAlJugador = false;
    this.mostrar('+' + efecto.pinones + ' piñones');
    this.aviso = this.escena.time.delayedCall(recoleccion.duracionAviso, () => this.panel.setVisible(false));
  }

  mostrar(mensaje) {
    this.texto.setText(mensaje);
    this.panel.setVisible(true);
  }
}
