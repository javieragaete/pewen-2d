import { CONFIG } from './config.js';

const { mundo, partida, paletaPixel } = CONFIG;
const NEWEN_COMPLETO = 20;
const REPORTAJE = [
  'Hoy seguimos la pista de los piñones.',
  'El pewén alimenta al lof y a los animales.',
  'Deja piñones en el suelo para que broten.',
  'Desde la cordillera, informó Bodoque.'
];

const color = hex => Number.parseInt(hex.slice(1), 16);

export class ExtraHackathon {
  constructor(escena) {
    this.escena = escena;
    this.disponible = true;
    this.lineaReporte = -1;
    this.activo = false;
    this.reporteTerminado = false;

    const x = escena.puente.x - 112;
    const piesY = escena.puente.y - escena.puente.semialto - 12;
    this.tarjeta = escena.add.container(x - 194, piesY - 121)
      .setDepth(mundo.alto + 8).setVisible(false);
    this.dibujarNube();
    this.texto(this.tarjeta, 10, 7, 'Nota Verde', 12, '#365342');
    this.estado = this.texto(this.tarjeta, 10, 26, 'queda una pura', 12, paletaPixel.tinta);
    this.estado.setWordWrapWidth(148);
    this.comer = this.boton(this.tarjeta, 10, 69, 148, 24, 'Tomar completo', () => {
      if (this.disponible) this.usarCompleto();
      else this.avanzarReporte();
    });

    this.bodoque = escena.add.graphics({ x, y: piesY - 23 }).setDepth(piesY);
    this.dibujarBodoque();
    this.numeroSuelo = escena.add.text(x, piesY, '23', {
      fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#92704b'
    }).setOrigin(0.5, 1).setDepth(piesY + 0.1).setVisible(false);
  }

  dibujarBodoque() {
    const g = this.bodoque;
    g.clear();
    // Cuerpo entero. Los pies marcan el apoyo en el suelo y los brazos sostienen el completo.
    g.fillStyle(0x171a19).fillRect(-12, -8, 25, 25)
      .fillRect(-12, 15, 10, 8).fillRect(3, 15, 10, 8).fillRect(12, -2, 8, 12);
    g.fillStyle(0x9b3335).fillRect(-10, -7, 21, 22)
      .fillRect(-10, 15, 7, 6).fillRect(5, 15, 6, 6).fillRect(13, 0, 6, 7);
    g.fillStyle(0xc75b59).fillRect(-5, 0, 12, 12);
    g.fillStyle(0x743033).fillRect(-9, 15, 20, 2);
    // Silueta de conejo y completo construidos en bloques de dos píxeles.
    g.fillStyle(0x171a19).fillRect(-10, -38, 9, 24).fillRect(2, -40, 9, 25)
      .fillRect(-13, -23, 27, 20).fillRect(-11, -8, 24, 9);
    g.fillStyle(0x9b3335).fillRect(-8, -36, 5, 17).fillRect(4, -38, 5, 19)
      .fillRect(-11, -21, 23, 16).fillRect(-9, -8, 20, 7);
    g.fillStyle(0xdd7774).fillRect(-7, -34, 2, 11).fillRect(6, -35, 2, 11);
    g.fillStyle(0xf2e7d0).fillRect(-7, -17, 6, 6).fillRect(3, -17, 6, 6);
    g.fillStyle(0x202522).fillRect(-3, -16, 2, 4).fillRect(7, -16, 2, 4);
    g.fillStyle(0xe89485).fillRect(1, -10, 6, 4);
    if (!this.disponible) {
      g.fillStyle(0x202522).fillRect(3, -7, 4, 2);
      return;
    }
    const y = -10;
    g.fillStyle(0xe4a562).fillRect(6, y, 16, 7);
    g.fillStyle(0x53904d).fillRect(7, y - 2, 14, 3);
    g.fillStyle(0xe6e7d8).fillRect(9, y - 2, 3, 2).fillRect(15, y - 2, 3, 2);
  }

  dibujarNube() {
    const nube = this.escena.add.graphics();
    const crema = 0xf4eedb;
    const tinta = color(paletaPixel.tinta);
    const lobulos = [[14, 18, 20, 19], [45, 6, 28, 16], [89, 3, 28, 16],
      [132, 9, 27, 17], [154, 30, 20, 23], [150, 78, 22, 23],
      [119, 93, 29, 14], [76, 94, 30, 15], [32, 91, 28, 15], [10, 69, 20, 24]];
    const dibujar = (tono, borde) => {
      nube.fillStyle(tono).fillRect(-borde, 9 - borde, 168 + 2 * borde, 85 + 2 * borde);
      for (const [x, y, rx, ry] of lobulos) {
        const alto = ry + borde;
        for (let dy = -alto; dy < alto; dy += 3) {
          const radio = 3 * Math.floor((rx + borde) * Math.sqrt(1 - (dy / alto) ** 2) / 3);
          nube.fillRect(x - radio, y + dy, 2 * radio, 3);
        }
      }
    };
    nube.fillStyle(tinta).fillTriangle(156, 65, 161, 94, 184, 102);
    dibujar(tinta, 3);
    nube.fillStyle(crema).fillTriangle(157, 70, 160, 90, 176, 96);
    dibujar(crema, 0);
    this.tarjeta.add(nube);
  }

  texto(contenedor, x, y, valor, tamano, tinta = paletaPixel.nieve) {
    const texto = this.escena.add.text(x, y, valor, {
      fontFamily: 'Consolas, monospace', fontSize: tamano + 'px', color: tinta, wordWrap: { width: 285 }
    });
    contenedor.add(texto);
    return texto;
  }

  boton(contenedor, x, y, ancho, alto, etiqueta, accion) {
    const boton = this.escena.add.rectangle(x, y, ancho, alto, 0x2d5038).setOrigin(0)
      .setStrokeStyle(2, color(paletaPixel.musgo)).setInteractive({ useHandCursor: true });
    contenedor.add(boton);
    boton.on('pointerover', () => boton.setFillStyle(0x44654b))
      .on('pointerout', () => boton.setFillStyle(0x2d5038))
      .on('pointerdown', accion);
    return this.texto(contenedor, x + 8, y + (alto - 13) / 2, etiqueta, 12);
  }

  usarCompleto() {
    if (!this.activo || !this.disponible) return;
    const recuperado = Math.min(NEWEN_COMPLETO, partida.maximoBarra - this.escena.newen);
    if (recuperado <= 0) {
      this.estado.setText('Tienes el newen lleno.');
      return;
    }
    this.escena.newen += recuperado;
    this.marcarCompletoConsumido();
    this.estado.setText('Recuperaste ' + Math.ceil(recuperado) + ' de newen.');
  }

  marcarCompletoConsumido() {
    this.disponible = false;
    this.estado.setText('¿Escuchamos la Nota Verde?');
    this.dibujarBodoque();
    this.comer.setText('Escuchar la nota');
  }

  avanzarReporte() {
    if (!this.activo) return;
    if (this.lineaReporte === REPORTAJE.length - 1) {
      this.finalizarReporte();
      return;
    }
    this.lineaReporte = (this.lineaReporte + 1) % REPORTAJE.length;
    this.estado.setText(REPORTAJE[this.lineaReporte]);
    this.comer.setText(this.lineaReporte === REPORTAJE.length - 1 ? 'Terminar' : 'Siguiente');
  }

  finalizarReporte() {
    this.reporteTerminado = true;
    this.bodoque.setVisible(false);
    this.tarjeta.setVisible(false);
    this.numeroSuelo.setVisible(true);
  }

  actualizar(activo) {
    if (activo === this.activo) return;
    this.activo = activo;
    this.tarjeta.setVisible(activo && !this.reporteTerminado);
  }
}
