import { AJUSTES_SISTEMAS as A } from '../ajustes/sistemas.js';
import { guardarEstado } from './estado.js';

const P = globalThis.Phaser;

// Menú de elección y piñones físicos que se pueden recoger al pasar sobre ellos.
export class Recoleccion {
  constructor(escena, estado, pewenes) {
    this.escena = escena;
    this.estado = estado;
    this.pewenes = pewenes;
    this.menuAbierto = false;
    this.objetivo = null;
    this.pinonesSuelo = [];
    this.teclas = escena.input.keyboard.addKeys({ permiso: 'ONE', directa: 'TWO' });
    this.crearInterfaz();
    escena.events.on('update', this.actualizar, this);
    escena.game.events.on('jornada:fin', this.limpiarPinonesJornada, this);
    escena.events.on('shutdown', this.destruir, this);
    pewenes.conectarRecoleccion(this);
  }

  crearInterfaz() {
    this.marco = this.escena.add.graphics().setScrollFactor(0).setDepth(10_200);
    this.textoMenu = this.escena.add.text(640, 558, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '19px',
      color: '#e6e7d8', align: 'center', lineSpacing: 8,
      wordWrap: { width: 760 }
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(10_201);
    this.marco.setVisible(false);
    this.textoMenu.setVisible(false);

    this.mensaje = this.escena.add.text(640, 620, '', {
      fontFamily: 'Consolas, "Courier New", monospace', fontSize: '17px',
      color: '#e6e7d8', backgroundColor: '#202522', padding: { x: 8, y: 5 }, align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10_202).setVisible(false);
  }

  abrir(arbol) {
    if (!arbol || arbol.recolectado || this.menuAbierto) return;
    this.objetivo = arbol;
    this.menuAbierto = true;
    this.escena.game.events.emit('jugador:bloqueado', { bloqueado: true });
    this.marco.clear();
    this.marco.fillStyle(0x202522, 0.96).fillRect(230, 500, 820, 118);
    this.marco.lineStyle(2, 0x14181a, 1).strokeRect(230, 500, 820, 118);
    this.textoMenu.setText('Pewén\n[1] Pedir permiso y tomar lo necesario\n[2] Tomar sin pedir permiso')
      .setVisible(true);
    this.marco.setVisible(true);
  }

  actualizar() {
    if (!this.menuAbierto) {
      this.actualizarPinones();
      return;
    }
    if (P.Input.Keyboard.JustDown(this.teclas.permiso)) this.elegir(true);
    else if (P.Input.Keyboard.JustDown(this.teclas.directa)) this.elegir(false);
  }

  elegir(pidioPermiso) {
    const arbol = this.objetivo;
    if (!arbol) return;
    this.objetivo = null;
    if (pidioPermiso) {
      this.estado.permisosPedidos++;
      this.mostrarMensaje('Pides permiso al Ngen del lugar. Haces una pausa.');
      this.escena.time.delayedCall(A.pausaPermisoMs, () => {
        this.aplicarToma(arbol, true);
        this.cerrarMenu();
      });
      return;
    }
    this.estado.tomasDirectas++;
    this.aplicarToma(arbol, false);
    this.cerrarMenu();
  }

  aplicarToma(arbol, pidioPermiso) {
    const efecto = pidioPermiso ? A.permiso : A.directa;
    const bonusSano = this.estado.equilibrio >= A.umbralEquilibrioSano ? 1 : 0;
    const cantidad = efecto.pinones + bonusSano;
    this.estado.newen = P.Math.Clamp(this.estado.newen + efecto.newen, 0, A.maximoEstado);
    this.estado.equilibrio = P.Math.Clamp(this.estado.equilibrio + efecto.equilibrio, 0, A.maximoEstado);
    this.pewenes.registrarToma(arbol, pidioPermiso);
    guardarEstado(this.escena.game, this.estado);
    this.escena.game.events.emit('hud:actualizar', { ...this.estado });
    this.soltarPinones(arbol, cantidad);
    this.mostrarMensaje(`Caen ${cantidad} piñones. Pasa sobre cada uno para recogerlo.`);
  }

  cerrarMenu() {
    this.menuAbierto = false;
    this.marco.setVisible(false);
    this.textoMenu.setVisible(false);
    this.escena.game.events.emit('jugador:bloqueado', { bloqueado: false });
  }

  mostrarMensaje(texto) {
    this.mensaje.setText(texto).setVisible(true);
    this.aviso?.remove();
    this.aviso = this.escena.time.delayedCall(1_800, () => this.mensaje.setVisible(false));
  }

  soltarPinones(arbol, cantidad) {
    for (let i = 0; i < cantidad; i++) {
      this.escena.time.delayedCall(i * A.separacionPinonesMs, () => this.crearPinon(arbol, i));
    }
  }

  crearPinon(arbol, indice) {
    const inicioX = arbol.x + ((indice % 3) - 1) * 11;
    const inicioY = arbol.y - (arbol.tipo === 'joven' ? 52 : 142);
    const finalX = inicioX + ((indice % 2) ? 8 : -8);
    const finalY = arbol.y - 3;
    const claveCaida = `pinon-cayendo-${indice % 2}`;
    const textura = this.escena.textures.exists(claveCaida) ? claveCaida : null;
    const pinon = textura
      ? this.escena.add.image(inicioX, inicioY, textura).setScale(3).setDepth(finalY + 1)
      : this.escena.add.rectangle(inicioX, inicioY, 12, 12, 0xf0c95a)
        .setStrokeStyle(2, 0x49372b).setDepth(finalY + 1);
    const objeto = { visual: pinon, x: finalX, y: finalY, recogible: false, vencido: false };
    this.pinonesSuelo.push(objeto);
    this.escena.tweens.add({
      targets: pinon, x: finalX, y: finalY, duration: A.duracionCaidaPinonMs,
      ease: 'Sine.easeIn', onComplete: () => {
        objeto.recogible = true;
        if (textura && this.escena.textures.exists('pinon-suelo')) pinon.setTexture('pinon-suelo');
        objeto.expira = this.escena.time.delayedCall(A.duracionPinonSueloMs, () => {
          objeto.vencido = true;
          pinon.destroy();
        });
      }
    });
  }

  actualizarPinones() {
    const jugador = this.escena.jugador;
    if (!jugador) return;
    for (const pinon of this.pinonesSuelo) {
      if (pinon.vencido || !pinon.recogible) continue;
      if (P.Math.Distance.Between(jugador.x, jugador.y, pinon.x, pinon.y) > A.distanciaRecogerPinon) continue;
      pinon.vencido = true;
      pinon.expira?.remove();
      pinon.visual.destroy();
      this.estado.pinonesLlevados++;
      guardarEstado(this.escena.game, this.estado);
      this.escena.game.events.emit('hud:actualizar', { ...this.estado });
    }
    this.pinonesSuelo = this.pinonesSuelo.filter(pinon => !pinon.vencido);
  }

  limpiarPinonesJornada() {
    for (const pinon of this.pinonesSuelo) {
      pinon.vencido = true;
      pinon.expira?.remove();
      pinon.visual.destroy();
    }
    this.pinonesSuelo = [];
  }

  destruir() {
    this.escena.events.off('update', this.actualizar, this);
    this.escena.game.events.off('jornada:fin', this.limpiarPinonesJornada, this);
    this.aviso?.remove();
    this.pinonesSuelo.forEach(pinon => { pinon.expira?.remove(); pinon.visual.destroy(); });
    this.pinonesSuelo = [];
  }
}

