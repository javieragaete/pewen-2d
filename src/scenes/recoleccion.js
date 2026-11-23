import { CONFIG } from '../config.js';
import { mostrarTecla } from '../settings.js';

const { pantalla, mundo, mapa, recoleccion, paletaPixel } = CONFIG;
const { Input, Math: Matematica } = globalThis.Phaser;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;

export class Recoleccion {
  constructor(escena, alRecolectar, controles) {
    this.escena = escena;
    this.controles = controles;
    this.pinones = 0;
    this.alRecolectar = alRecolectar;
    this.estadoPewen = null;
    this.pewenes = mapa.pewenes.map(([x, y]) => this.crearPewen(x, y));
    this.actualizarControles(controles);
    this.ocupaAlJugador = false;
    this.objetivo = null;
    this.pista = escena.add.text(0, 0, '', {
      fontFamily: mono, fontSize: '17px',
      color: paletaPixel.nieve, backgroundColor: paletaPixel.tinta, padding: { x: 10, y: 6 }
    }).setOrigin(0.5, 1).setDepth(mundo.alto + 2).setVisible(false);

    const panel = escena.add.graphics();
    panel.fillStyle(color('tinta')).fillRect(-255, -81, 510, 162);
    panel.fillStyle(color('rojo')).fillRect(-255, -81, 510, 4);
    panel.fillRect(-255, 77, 510, 4).fillRect(-255, -81, 4, 162).fillRect(251, -81, 4, 162);
    panel.fillStyle(color('madera')).fillRect(-247, -73, 494, 2);
    panel.fillRect(-247, 71, 494, 2).fillRect(-247, -73, 2, 146).fillRect(245, -73, 2, 146);
    const texto = escena.add.text(0, 0, '', {
      fontFamily: mono, fontSize: '20px',
      color: paletaPixel.nieve, align: 'center', lineSpacing: 8, wordWrap: { width: 470 }
    }).setOrigin(0.5);
    this.texto = texto;
    this.panel = escena.add.container(pantalla.ancho / 2, pantalla.alto / 2, [panel, texto])
      .setScrollFactor(0).setDepth(mundo.alto + 3).setVisible(false);
  }

  actualizarControles(controles) {
    const codigo = Input.Keyboard.KeyCodes;
    this.controles = controles;
    this.teclas = {
      interactuar: this.escena.input.keyboard.addKey(codigo[controles.interact[0]]),
      permiso: this.escena.input.keyboard.addKey(codigo[controles.permission[0]]),
      directa: this.escena.input.keyboard.addKey(codigo[controles.direct[0]])
    };
  }

  crearPewen(x, y) {
    const arbol = this.escena.add.image(x, y, 'pewen-normal')
      .setOrigin(0.5, 1).setScale(3).setDepth(y);
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
    const escala = estado === 'sano' ? 3 : 2;
    this.pewenes.forEach(pewen => {
      pewen.arbol.setTexture('pewen-' + estado).setScale(escala);
    });
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
      if (distancia <= distanciaMinima && this.escena.hayLineaDeVista(personaje, pewen)) {
        cercano = pewen;
        distanciaMinima = distancia;
      }
    }
    this.pista.setVisible(Boolean(cercano));
    if (!cercano) return;
    this.pista.setPosition(cercano.x, cercano.y - 137)
      .setText(cercano.recolectado ? 'Ya recolectado' : `[${mostrarTecla(this.controles.interact[0])}] Interactuar`);
    if (interactuar && !cercano.recolectado) {
      this.aviso?.remove();
      this.objetivo = cercano;
      this.ocupaAlJugador = true;
      this.pista.setVisible(false);
      this.mostrar(`Pewén\n[${mostrarTecla(this.controles.permission[0])}] Pedir permiso y tomar lo necesario\n[${mostrarTecla(this.controles.direct[0])}] Tomar sin pedir permiso`);
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
    this.escena.animarRecoleccion(pewen);
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

