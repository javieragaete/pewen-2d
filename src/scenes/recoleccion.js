import { CONFIG } from '../config.js';
import { mostrarTecla, reproducirEfectoAudio } from '../settings.js';
import { ESCALA_PIXEL, dibujarMarcoPixel } from '../sprites.js';

const { pantalla, mundo, mapa, recoleccion, paletaPixel } = CONFIG;
const { Input, Math: Matematica } = globalThis.Phaser;
const mono = 'Consolas, "Courier New", monospace';
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;
const TIPOS_PEWEN = ['pewen-adulto-a', 'pewen-adulto-b', 'pewen-joven-a'];
const DISTANCIA_CASA = 210;
const DISTANCIA_PEWENES = 205;
const escalaPewen = tipo => tipo.includes('joven') ? 0.9 : 1;

function mezclar(elementos) {
  const resultado = [...elementos];
  for (let i = resultado.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [resultado[i], resultado[j]] = [resultado[j], resultado[i]];
  }
  return resultado;
}

export class Recoleccion {
  constructor(escena, alRecolectar, controles) {
    this.escena = escena;
    this.pinones = 0;
    this.pinonesJornada = 0;
    this.alRecolectar = alRecolectar;
    this.estadoPewen = null;
    const tiposIniciales = this.crearTiposPewen(mapa.pewenes.length);
    this.pewenes = mapa.pewenes.map(([x, y], indice) => this.crearPewen(x, y, tiposIniciales[indice]));
    this.reponerPinones();
    this.asignaciones = { interactuar: controles.interact[0], permiso: controles.permission[0], directa: controles.direct[0] };
    this.teclas = escena.input.keyboard.addKeys(this.asignaciones);
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

  crearPewen(x, y, tipo) {
    const arbol = this.escena.add.image(x, y, tipo + '-normal')
      .setOrigin(0.5, 1).setScale(escalaPewen(tipo)).setDepth(y);
    this.escena.ambientarArbol(arbol);
    const pinones = this.escena.add.container(x, y - 7, [
      this.escena.add.image(-16, 0, 'pinon').setScale(2),
      this.escena.add.image(0, -5, 'pinon').setScale(2),
      this.escena.add.image(16, 0, 'pinon').setScale(2)
    ]).setDepth(y + 1);
    return { x, y, tipo, arbol, pinones, recolectado: false };
  }

  actualizarEquilibrio(equilibrio) {
    const estado = equilibrio >= 60 ? 'sano' : equilibrio <= 30 ? 'seco' : 'normal';
    if (estado === this.estadoPewen) return;
    this.estadoPewen = estado;
    this.pewenes.forEach(pewen => {
      pewen.arbol.setTexture(pewen.tipo + '-' + estado);
    });
  }

  crearTiposPewen(cantidad = mapa.pewenes.length) {
    const tipos = mezclar(TIPOS_PEWEN);
    while (tipos.length < cantidad) {
      tipos.push(TIPOS_PEWEN[Math.floor(Math.random() * TIPOS_PEWEN.length)]);
    }
    if (this.pewenes?.length && this.pewenes.every((pewen, indice) => pewen.tipo === tipos[indice])) {
      [tipos[0], tipos[1]] = [tipos[1], tipos[0]];
    }
    return tipos;
  }

  generarPosicionesPewen() {
    const nuevas = [];
    const anteriores = this.pewenes.map(({ x, y }) => ({ x, y }));
    const distanciaASegmento = (x, y, a, b) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const largo2 = dx * dx + dy * dy || 1;
      const t = Matematica.Clamp(((x - a[0]) * dx + (y - a[1]) * dy) / largo2, 0, 1);
      return Matematica.Distance.Between(x, y, a[0] + dx * t, a[1] + dy * t);
    };
    const libre = (x, y, revisarDecoracion = true) => {
      if (x < 330 || x > 940 || y < 430 || y > mundo.alto - 90) return false;
      if (Matematica.Distance.Between(x, y, mapa.ruka.x, mapa.ruka.y) < DISTANCIA_CASA) return false;
      if (mapa.camino.slice(0, -1).some((punto, indice) =>
        distanciaASegmento(x, y, punto, mapa.camino[indice + 1]) < 82)) return false;
      if (anteriores.some(punto => Matematica.Distance.Between(x, y, punto.x, punto.y) < 120)) return false;
      if (nuevas.some(punto => Matematica.Distance.Between(x, y, punto.x, punto.y) < DISTANCIA_PEWENES)) return false;
      if (revisarDecoracion && this.escena.decoracionesMapa?.some(punto =>
        Matematica.Distance.Between(x, y, punto.x, punto.y) < punto.radio + 34)) return false;
      return true;
    };

    for (let intento = 0; intento < 2600 && nuevas.length < this.pewenes.length; intento++) {
      const x = 330 + Math.floor(Math.random() * 611);
      const y = 430 + Math.floor(Math.random() * (mundo.alto - 519));
      if (libre(x, y)) nuevas.push({ x, y });
    }

    // Si la decoración ocupa por azar muchas ubicaciones, relajamos solo su
    // separación visual; la ruka, el río y las distancias entre pewenes siguen protegidos.
    for (let intento = 0; intento < 1200 && nuevas.length < this.pewenes.length; intento++) {
      const x = 330 + Math.floor(Math.random() * 611);
      const y = 430 + Math.floor(Math.random() * (mundo.alto - 519));
      if (libre(x, y, false)) nuevas.push({ x, y });
    }
    if (nuevas.length < this.pewenes.length) {
      const respaldo = [];
      for (let x = 340; x <= 930; x += 50) {
        for (let y = 440; y <= mundo.alto - 100; y += 55) {
          if (libre(x, y, false)) respaldo.push({ x, y });
        }
      }
      for (const punto of mezclar(respaldo)) {
        if (nuevas.length === this.pewenes.length) break;
        if (nuevas.every(actual => Matematica.Distance.Between(actual.x, actual.y, punto.x, punto.y) >= DISTANCIA_PEWENES)) {
          nuevas.push(punto);
        }
      }
    }
    return nuevas;
  }

  moverPewen(pewen, x, y, tipo = pewen.tipo) {
    pewen.x = x;
    pewen.y = y;
    pewen.tipo = TIPOS_PEWEN.includes(tipo) ? tipo : TIPOS_PEWEN[0];
    pewen.arbol.setTexture(pewen.tipo + '-' + (this.estadoPewen || 'normal'))
      .setScale(escalaPewen(pewen.tipo)).setPosition(x, y).setDepth(y);
    pewen.pinones.setPosition(x, y - 7).setDepth(y + 1);
    pewen.recolectado = false;
    pewen.pinones.setVisible(true);
  }

  restaurarDistribucion(distribucion) {
    if (!Array.isArray(distribucion)) return;
    distribucion.forEach((punto, indice) => {
      const pewen = this.pewenes[indice];
      if (!pewen || !Number.isFinite(punto?.x) || !Number.isFinite(punto?.y)) return;
      this.moverPewen(pewen, punto.x, punto.y, punto.tipo);
    });
  }

  reponerPinones() {
    const posiciones = this.generarPosicionesPewen();
    const tipos = this.crearTiposPewen(this.pewenes.length);
    if (posiciones.length !== this.pewenes.length) return;
    this.pinonesJornada = 0;
    this.pewenes.forEach((pewen, indice) => this.moverPewen(pewen, posiciones[indice].x, posiciones[indice].y, tipos[indice]));
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
    const limite = CONFIG.partida.metaPinones;
    const limiteJornada = CONFIG.partida.maximoCosechaJornada;
    const cargaCompleta = this.pinones >= limite;
    const jornadaCompleta = this.pinonesJornada >= limiteJornada;
    this.pistaTexto.setText(cercano.recolectado ? 'Ya recolectado' : cargaCompleta
      ? `Meta completa ${limite}/${limite}`
      : jornadaCompleta ? `Límite jornada ${limiteJornada}/${limiteJornada}`
      : '[' + mostrarTecla(this.asignaciones.interactuar) + '] Interactuar');
    if (interactuar && !cercano.recolectado) {
      this.aviso?.remove();
      if (cargaCompleta) {
        this.mostrar('No puedes recoger más piñones.\nLímite de carga: ' + limite + '. Vuelve a la ruka.');
        this.aviso = this.escena.time.delayedCall(recoleccion.duracionAviso, () => this.panel.setVisible(false));
        return;
      }
      if (jornadaCompleta) {
        this.mostrar('Ya recogiste 7 piñones en esta jornada.\nVuelve en la siguiente jornada.');
        this.aviso = this.escena.time.delayedCall(recoleccion.duracionAviso, () => this.panel.setVisible(false));
        return;
      }
      this.objetivo = cercano;
      this.ocupaAlJugador = true;
      this.pista.setVisible(false);
      this.mostrar('Pewén\n[' + mostrarTecla(this.asignaciones.permiso) + '] Pedir permiso y tomar lo necesario\n[' + mostrarTecla(this.asignaciones.directa) + '] Tomar sin pedir permiso');
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

  crearParticulas(pewen, cantidad) {
    for (let i = 0; i < cantidad; i++) {
      const centro = (cantidad - 1) / 2;
      const pinon = this.escena.add.image(pewen.x + (i - centro) * 10, pewen.y - 48 - (i % 2) * 8, 'pinon')
        .setScale(2).setDepth(pewen.y + 3);
      this.escena.tweens.add({
        targets: pinon,
        x: pinon.x + (i - centro) * 5,
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
      reproducirEfectoAudio(this.escena, 'sfx-tomar-sin-permiso', 0.78);
      this.recolectar(pewen, recoleccion.directa);
    }
  }

  recolectar(pewen, efecto) {
    reproducirEfectoAudio(this.escena, 'sfx-pinon-recoger', 0.9);
    pewen.recolectado = true;
    pewen.pinones.setVisible(false);
    const limite = CONFIG.partida.metaPinones;
    const limiteJornada = CONFIG.partida.maximoCosechaJornada;
    const recursosDelLof = this.escena.jornadas?.totalLof ?? 0;
    const cantidad = Math.min(
      efecto.pinones,
      Math.max(0, limite - this.pinones - recursosDelLof),
      Math.max(0, limiteJornada - this.pinonesJornada)
    );
    this.crearParticulas(pewen, cantidad);
    this.pinones += cantidad;
    this.pinonesJornada += cantidad;
    this.alRecolectar(efecto);
    this.ocupaAlJugador = false;
    const mensaje = this.pinones >= limite && cantidad < efecto.pinones
      ? `+${cantidad} piñones\nCarga completa: ${limite}/${limite}`
      : `+${cantidad} piñones`;
    this.mostrar(mensaje);
    this.aviso = this.escena.time.delayedCall(recoleccion.duracionAviso, () => this.panel.setVisible(false));
  }

  mostrar(mensaje) {
    this.texto.setText(mensaje);
    this.panel.setVisible(true);
  }
}

