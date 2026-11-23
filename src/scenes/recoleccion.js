import { CONFIG } from '../config.js';
import { ESCALA_PIXEL, dibujarMarcoPixel } from '../sprites.js';

const { pantalla, mundo, mapa, recoleccion, paletaPixel } = CONFIG;
const { Input, Math: Matematica } = globalThis.Phaser;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;

export class Recoleccion {
  constructor(escena, alRecolectar) {
    this.escena = escena;
    this.pinones = 0;
    this.alRecolectar = alRecolectar;
    this.estadoPewen = null;
    this.pewenes = mapa.pewenes.map(([x, y]) => this.crearPewen(x, y));
    this.teclas = escena.input.keyboard.addKeys({ interactuar: 'E', permiso: 'ONE', directa: 'TWO' });
    this.ocupaAlJugador = false;
    this.objetivo = null;
    const marcoPista = escena.add.graphics();
    dibujarMarcoPixel(marcoPista, -94, -29, 188, 29, color('tinta'), color('musgo'));
    const textoPista = escena.add.text(0, -6, '', {
      fontFamily: mono, fontSize: '15px', color: paletaPixel.nieve
    }).setOrigin(0.5, 1);
    this.pistaTexto = textoPista;
    this.pista = escena.add.container(0, 0, [marcoPista, textoPista])
      .setDepth(mundo.alto + 2).setVisible(false);

    const panel = escena.add.graphics();
    dibujarMarcoPixel(panel, -210, -70, 420, 140, color('tinta'), color('rojo'));
    const texto = escena.add.text(0, 0, '', {
      fontFamily: mono, fontSize: '18px',
      color: paletaPixel.nieve, align: 'center', lineSpacing: 6, wordWrap: { width: 370 }
    }).setOrigin(0.5);
    this.texto = texto;
    this.panel = escena.add.container(pantalla.ancho / 2, pantalla.alto / 2, [panel, texto])
      .setScrollFactor(0).setDepth(mundo.alto + 3).setVisible(false);
  }

  crearPewen(x, y) {
    const arbol = this.escena.add.image(x, y, 'pewen-normal')
      .setOrigin(0.5, 1).setScale(ESCALA_PIXEL).setDepth(y);
    const pinones = this.escena.add.container(x, y - 7, [
      this.escena.add.image(-16, 0, 'pinon').setScale(2),
      this.escena.add.image(0, -5, 'pinon').setScale(2),
      this.escena.add.image(16, 0, 'pinon').setScale(2)
    ]).setDepth(y + 1);
    return { x, y, arbol, pinones, recolectado: false };
  }

  actualizarEquilibrio(equilibrio) {
    const estado = equilibrio >= 60 ? 'sano' : equilibrio <= 30 ? 'seco' : 'normal';
    if (estado === this.estadoPewen) return;
    this.estadoPewen = estado;
    this.pewenes.forEach(pewen => {
      pewen.arbol.setTexture('pewen-' + estado);
    });
  }

  reponerPinones() {
    for (const pewen of this.pewenes) {
      pewen.recolectado = false;
      pewen.pinones.setVisible(true);
    }
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
      .setDepth(cercano.y + 2);
    this.pistaTexto.setText(cercano.recolectado ? 'Ya recolectado' : '[E] Interactuar');
    if (interactuar && !cercano.recolectado) {
      this.aviso?.remove();
      this.objetivo = cercano;
      this.ocupaAlJugador = true;
      this.pista.setVisible(false);
      this.mostrar('Pewén\n[1] Pedir permiso y tomar lo necesario\n[2] Tomar sin pedir permiso');
    }
  }

  crearDestello(pewen) {
    const destello = this.escena.add.image(pewen.x, pewen.y - 58, 'destello')
      .setScale(2).setDepth(pewen.y + 2).setAlpha(0.8);
    this.escena.tweens.add({
      targets: destello, alpha: 0, duration: 520,
      onComplete: () => destello.destroy()
    });
  }

  crearParticulas(pewen) {
    for (let i = 0; i < 4; i++) {
      const pinon = this.escena.add.image(pewen.x + (i - 1.5) * 10, pewen.y - 48 - (i % 2) * 8, 'pinon')
        .setScale(2).setDepth(pewen.y + 3);
      this.escena.tweens.add({
        targets: pinon,
        x: pinon.x + (i - 1.5) * 5,
        y: pinon.y - 22 - (i % 2) * 6,
        alpha: 0,
        duration: 320 + i * 25,
        onComplete: () => pinon.destroy()
      });
    }
  }

  elegir(pedirPermiso) {
    const pewen = this.objetivo;
    this.objetivo = null;
    if (pedirPermiso) {
      this.crearDestello(pewen);
      this.mostrar('Pides permiso al Ngen del lugar.\nHaces una pausa.');
      this.escena.time.delayedCall(recoleccion.pausaPermiso, () => {
        this.recolectar(pewen, recoleccion.permiso);
      });
    } else {
      this.recolectar(pewen, recoleccion.directa);
    }
  }

  recolectar(pewen, efecto) {
    this.crearParticulas(pewen);
    pewen.recolectado = true;
    pewen.pinones.setVisible(false);
    this.pinones += efecto.pinones;
    this.alRecolectar(efecto);
    this.ocupaAlJugador = false;
    this.mostrar('+' + efecto.pinones + ' piñones');
    this.aviso = this.escena.time.delayedCall(recoleccion.duracionAviso, () => this.panel.setVisible(false));
  }

  mostrar(mensaje) {
    this.texto.setText(mensaje);
    this.panel.setVisible(true);
  }
}

