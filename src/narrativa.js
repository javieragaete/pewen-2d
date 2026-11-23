import { mostrarTecla } from './settings.js';
import { CONFIG } from './config.js';
import { dibujarMarcoPixel } from './sprites.js';

const { pantalla, mundo, mapa, partida, jornadas, paletaPixel } = CONFIG;
const color = clave => globalThis.Phaser.Display.Color.HexStringToColor(paletaPixel[clave]).color;
const mono = 'Consolas, "Courier New", monospace';

// Administra el reloj, la carga que lleva el personaje y los resúmenes de cada jornada.
export class GestorJornadas {
  constructor(escena) {
    this.escena = escena;
    this.jornada = 1;
    this.totalLof = 0;
    this.entregadoJornada = 0;
    this.estado = 'sinIniciar';
    this.finJornada = null;
    this.tarjetaFin = 0;
    this.salidaIniciada = false;
    this.resultado = null;
    this.crearTarjetas();
    this.crearIndicadores();
  }

  crearTarjetas() {
    const fondo = this.escena.add.graphics();
    fondo.fillStyle(0x000000, 0.78).fillRect(0, 0, pantalla.ancho, pantalla.alto);
    const marco = this.escena.add.graphics();
    dibujarMarcoPixel(marco, 210, 238, 860, 244, color('tinta'), color('musgo'));
    this.tituloTarjeta = this.escena.add.text(pantalla.ancho / 2, 284, '', {
      fontFamily: mono, fontSize: '30px', color: paletaPixel.nieve,
      align: 'center', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.textoTarjeta = this.escena.add.text(pantalla.ancho / 2, 350, '', {
      fontFamily: mono, fontSize: '20px', color: paletaPixel.nieve,
      align: 'center', lineSpacing: 10, wordWrap: { width: 760 }
    }).setOrigin(0.5, 0);
    this.tarjeta = this.escena.add.container(0, 0, [fondo, marco, this.tituloTarjeta, this.textoTarjeta])
      .setScrollFactor(0).setDepth(mundo.alto + 20).setVisible(false);
  }

  crearIndicadores() {
    const pistaFondo = this.escena.add.graphics();
    dibujarMarcoPixel(pistaFondo, -118, -22, 236, 32, color('tinta'), color('musgo'));
    const pistaTexto = this.escena.add.text(0, -14, '[' + mostrarTecla(this.escena.recoleccion.asignaciones.interactuar) + '] Terminar jornada', {
      fontFamily: mono, fontSize: '14px', color: paletaPixel.nieve
    }).setOrigin(0.5, 0.5);
    this.pistaFin = this.escena.add.container(mapa.ruka.x, mapa.ruka.y - 118, [pistaFondo, pistaTexto])
      .setDepth(mundo.alto + 5).setVisible(false);

    const avisoFondo = this.escena.add.graphics();
    dibujarMarcoPixel(avisoFondo, -135, -20, 270, 30, color('tinta'), color('musgo'));
    this.avisoTexto = this.escena.add.text(0, -5, '', {
      fontFamily: mono, fontSize: '14px', color: paletaPixel.nieve
    }).setOrigin(0.5, 0.5);
    this.avisoEntrega = this.escena.add.container(mapa.ruka.x, mapa.ruka.y - 75, [avisoFondo, this.avisoTexto])
      .setDepth(mundo.alto + 6).setVisible(false);
  }

  mostrarTarjeta(titulo, texto, duracion, tiempo, estado, alTerminar) {
    this.estado = estado;
    this.tarjeta.setVisible(true).setAlpha(estado === 'resumen' ? 0 : 1);
    this.tituloTarjeta.setText(titulo);
    this.textoTarjeta.setText(texto);
    this.tarjetaFin = tiempo + duracion;
    this.salidaIniciada = false;
    this.alTerminarTarjeta = alTerminar;
    if (estado === 'resumen') {
      this.escena.tweens.add({ targets: this.tarjeta, alpha: 1, duration: jornadas.fundidoMs });
    }
  }

  iniciarJornada(tiempo) {
    this.segundosRestantes = partida.duracionJornada;
    this.mostrarTarjeta(`Jornada ${this.jornada} de ${jornadas.cantidad}`, '', jornadas.tarjetaMs, tiempo,
      'tarjetaInicio', () => {
        this.estado = 'libre';
        this.finJornada = this.escena.time.now + partida.duracionJornada * 1000;
      });
  }

  actualizarTarjeta(tiempo) {
    if (tiempo < this.tarjetaFin || this.salidaIniciada) return;
    this.salidaIniciada = true;
    this.escena.tweens.add({
      targets: this.tarjeta,
      alpha: 0,
      duration: jornadas.fundidoMs,
      onComplete: () => {
        this.tarjeta.setVisible(false).setAlpha(1);
        const continuar = this.alTerminarTarjeta;
        this.alTerminarTarjeta = null;
        continuar?.();
      }
    });
  }

  entregarCarga() {
    const carga = this.escena.recoleccion.pinones;
    if (carga <= 0) return;
    this.escena.recoleccion.pinones = 0;
    this.totalLof += carga;
    this.entregadoJornada += carga;
    this.avisoTexto.setText(`Entregaste ${carga} piñones.`);
    this.avisoEntrega.setVisible(true);
    this.escena.time.delayedCall(2200, () => this.avisoEntrega.setVisible(false));
  }

  puedeCerrarJornada() {
    return this.escena.recoleccion.pinones === 0
      && this.escena.recoleccion.pewenes.every(pewen => pewen.recolectado);
  }

  cerrarJornada(tiempo, perdidos = 0) {
    this.pistaFin.setVisible(false);
    const partes = [`Entregaste ${this.entregadoJornada} piñones.`];
    if (perdidos > 0) partes.push(`Se perdieron ${perdidos} que llevabas.`);
    partes.push(`El lof tiene ${this.totalLof} de ${partida.metaPinones}.`);
    const resumen = partes.join(' ');
    this.resultado = { jornada: this.jornada, totalLof: this.totalLof, meta: partida.metaPinones };
    this.segundosRestantes = 0;
    this.mostrarTarjeta('Resumen de jornada', resumen, jornadas.resumenMs, tiempo, 'resumen', () => {
      if (this.jornada < jornadas.cantidad) {
        this.jornada++;
        this.entregadoJornada = 0;
        this.escena.recoleccion.reponerPinones();
        this.iniciarJornada(this.escena.time.now);
      } else {
        this.estado = 'completa';
        this.tituloTarjeta.setText('Jornadas completadas');
        this.textoTarjeta.setText(resumen);
        this.tarjeta.setVisible(true).setAlpha(1);
        this.escena.resultadoHistoria = {
          totalLof: this.totalLof,
          meta: partida.metaPinones,
          newen: this.escena.newen,
          equilibrio: this.escena.equilibrio
        };
      }
    });
  }

  actualizar(tiempo) {
    if (this.estado === 'sinIniciar') {
      this.iniciarJornada(tiempo);
      return { libre: false, segundos: this.segundosRestantes };
    }
    if (this.estado === 'tarjetaInicio' || this.estado === 'resumen') {
      this.actualizarTarjeta(tiempo);
      return { libre: false, segundos: this.segundosRestantes };
    }
    if (this.estado === 'completa') return { libre: false, segundos: 0 };

    if (this.finJornada === null) this.finJornada = tiempo + partida.duracionJornada * 1000;
    const distanciaRuka = globalThis.Phaser.Math.Distance.Between(
      this.escena.personaje.x, this.escena.personaje.y, mapa.ruka.x, mapa.ruka.y
    );
    const cercaRuka = distanciaRuka <= partida.alcanceDescanso;
    if (cercaRuka) this.entregarCarga();

    const segundos = Math.max(0, Math.ceil((this.finJornada - tiempo) / 1000));
    this.segundosRestantes = segundos;
    if (segundos === 0) {
      const perdidos = this.escena.recoleccion.pinones;
      this.escena.recoleccion.pinones = 0;
      this.cerrarJornada(tiempo, perdidos);
      return { libre: false, segundos: 0 };
    }

    const puedeCerrar = cercaRuka && this.puedeCerrarJornada();
    this.pistaFin.setVisible(puedeCerrar);
    if (puedeCerrar && globalThis.Phaser.Input.Keyboard.JustDown(this.escena.recoleccion.teclas.interactuar)) {
      this.cerrarJornada(tiempo);
      return { libre: false, segundos };
    }
    return { libre: true, segundos };
  }
}

