import { AJUSTES_SISTEMAS as AJUSTES } from '../ajustes/sistemas.js';
import { PALETA, crearMarcoPixel, crearTexturaDesdeMatriz } from './pixel.js';

const FUENTE = 'Consolas, "Courier New", monospace';

export class SistemaRecoleccion {
  constructor(escena, estado, pewenes, guardar) {
    this.escena = escena;
    this.estado = estado;
    this.pewenes = pewenes;
    this.guardar = guardar;
    this.eventos = escena.game.events;
    this.pinonesSuelo = [];
    this.objetivo = null;
    this.modo = '';
    this.bloqueada = false;
    this.teclas = escena.input.keyboard.addKeys({
      interactuar: AJUSTES.teclas.interactuar,
      permiso: AJUSTES.teclas.permiso,
      directa: AJUSTES.teclas.directa,
      cancelar: 'ESC'
    });
    this.crearInterfaz();
    this.eventoEntrega = datos => this.entregar(datos);
    this.eventos.on('entrega:pinones', this.eventoEntrega);
    this.escena.events.on('update', this.actualizar, this);
    this.escena.events.once('shutdown', this.destruir, this);
  }

  crearInterfaz() {
    this.pista = this.escena.add.text(0, 0, '', {
      fontFamily: FUENTE, fontSize: '15px', color: PALETA.N,
      backgroundColor: PALETA.K, padding: { x: 8, y: 5 }
    }).setOrigin(0.5, 1).setDepth(20).setVisible(false);

    const fondo = this.escena.add.graphics();
    crearMarcoPixel(fondo, -260, -92, 520, 184, PALETA.K, PALETA.M);
    this.textoMenu = this.escena.add.text(0, 0, '', {
      fontFamily: FUENTE, fontSize: '17px', color: PALETA.N,
      align: 'center', lineSpacing: 8, wordWrap: { width: 470 }
    }).setOrigin(0.5);
    this.menu = this.escena.add.container(640, 360, [fondo, this.textoMenu])
      .setScrollFactor(0).setDepth(10_000).setVisible(false);
  }

  actualizar() {
    this.recogerPinones();
    if (this.modo === 'menu') {
      this.elegirAccion();
      return;
    }
    if (this.modo) return;
    if (this.bloqueada) return;
    const jugador = this.escena.jugador;
    if (!jugador) return;
    const cercano = this.pewenes.cercanos(jugador)[0] || null;
    this.pista.setVisible(Boolean(cercano));
    if (cercano) {
      this.pista.setPosition(cercano.x, cercano.y - (cercano.imagen.displayHeight || 96) - 8);
      this.pista.setText(`[${AJUSTES.teclas.interactuar}] Interactuar`);
    }
    if (cercano && globalThis.Phaser.Input.Keyboard.JustDown(this.teclas.interactuar)) {
      this.abrirMenu(cercano);
    }
  }

  abrirMenu(pewen) {
    this.objetivo = pewen;
    this.modo = 'menu';
    this.pista.setVisible(false);
    this.textoMenu.setText(
      'Pewén\n\n[1] Pedir permiso y tomar lo necesario\n[2] Tomar sin pedir permiso\n[Esc] Cerrar'
    );
    this.menu.setVisible(true);
    this.emitirBloqueo(true);
  }

  elegirAccion() {
    const Phaser = globalThis.Phaser;
    if (Phaser.Input.Keyboard.JustDown(this.teclas.cancelar)) {
      this.cerrarMenu();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.teclas.permiso)) this.cosechar('permiso');
    else if (Phaser.Input.Keyboard.JustDown(this.teclas.directa)) this.cosechar('directa');
  }

  cosechar(modo) {
    const pewen = this.objetivo;
    if (!pewen || !this.pewenes.disponible(pewen)) return;
    this.objetivo = null;
    this.modo = modo;
    const equilibrioInicial = this.estado.equilibrio;
    const bonus = equilibrioInicial >= AJUSTES.umbralEquilibrioSano ? AJUSTES.bonusEquilibrioAlto : 0;
    const cantidad = (modo === 'permiso' ? AJUSTES.pinonesPermiso : AJUSTES.pinonesDirecta) + bonus;
    this.estado.recolecciones += 1;
    if (modo === 'permiso') {
      this.estado.permisosPedidos += 1;
      this.estado.equilibrio = Math.min(100, this.estado.equilibrio + AJUSTES.equilibrioPermiso);
      this.estado.newen = Math.max(0, this.estado.newen + AJUSTES.newenPermiso);
      this.textoMenu.setText('Pides permiso al Ngen del lugar.\nHaces una pausa.');
    } else {
      this.estado.tomasDirectas += 1;
      this.estado.equilibrio = Math.max(0, this.estado.equilibrio + AJUSTES.equilibrioDirecta);
      this.estado.newen = Math.max(0, this.estado.newen + AJUSTES.newenDirecta);
      this.textoMenu.setText('Tomas lo necesario sin pedir permiso.');
    }
    this.pewenes.registrarToma(pewen, modo);
    this.pewenes.actualizarEstado(this.estado.equilibrio);
    this.guardar();

    if (modo === 'permiso') {
      this.escena.time.delayedCall(AJUSTES.demoraPermisoMs, () => {
        this.crearCaidaPinones(pewen, cantidad);
        this.cerrarMenu();
      });
    } else {
      this.crearCaidaPinones(pewen, cantidad);
      this.escena.time.delayedCall(500, () => this.cerrarMenu());
    }
  }

  asegurarTexturasPinon() {
    const base = ['........', '...o....', '..oSo...', '.oSWS...', '..SWS...', '...W....', '...B....', '........'];
    const otra = ['........', '....o...', '...oSo..', '..oSWS..', '...SWS..', '....W...', '....B...', '........'];
    crearTexturaDesdeMatriz(this.escena, 'pinon-cayendo-0', base);
    crearTexturaDesdeMatriz(this.escena, 'pinon-cayendo-1', otra);
    crearTexturaDesdeMatriz(this.escena, 'pinon-suelo', base);
  }

  crearCaidaPinones(pewen, cantidad) {
    this.asegurarTexturasPinon();
    const alto = pewen.imagen.displayHeight || 96;
    for (let i = 0; i < cantidad; i++) {
      const separacion = (i - (cantidad - 1) / 2) * 10;
      const x = pewen.x + separacion;
      const aterrizaje = pewen.y - 8 + (i % 2) * 4;
      const inicio = pewen.y - Math.max(24, alto - 8);
      const imagen = this.escena.add.image(x, inicio, `pinon-cayendo-${i % 2}`)
        .setOrigin(0.5, 0.5).setScale(AJUSTES.escalaSprite).setDepth(pewen.y + 3);
      const objeto = { imagen, x, y: aterrizaje, listo: false, expirar: null };
      this.pinonesSuelo.push(objeto);
      this.escena.tweens.add({
        targets: imagen, y: aterrizaje, duration: 520 + (i % 3) * 90,
        ease: 'Bounce.Out', onComplete: () => {
          objeto.listo = true;
          imagen.setTexture('pinon-suelo');
          objeto.expirar = this.escena.time.delayedCall(AJUSTES.expiraPinonSueloMs, () => this.eliminarPinon(objeto));
        }
      });
    }
  }

  recogerPinones() {
    const jugador = this.escena.jugador;
    if (!jugador) return;
    const Phaser = globalThis.Phaser;
    for (const pinon of [...this.pinonesSuelo]) {
      if (!pinon.listo || Phaser.Math.Distance.Between(jugador.x, jugador.y, pinon.x, pinon.y) > AJUSTES.alcanceRecogerPinon) continue;
      this.estado.pinonesLlevados += 1;
      this.guardar();
      this.eliminarPinon(pinon);
    }
  }

  eliminarPinon(pinon) {
    pinon.expirar?.remove(false);
    pinon.imagen.destroy();
    this.pinonesSuelo = this.pinonesSuelo.filter(actual => actual !== pinon);
  }

  entregar(datos = {}) {
    const disponible = this.estado.pinonesLlevados;
    const solicitado = Number(datos.cantidad ?? datos.pinones ?? disponible);
    const cantidad = Math.min(disponible, Math.max(0, solicitado));
    this.estado.pinonesLlevados -= cantidad;
    this.estado.pinonesEntregados += cantidad;
    this.guardar();
    this.mostrarAviso(`Entregaste ${cantidad} piñones.`);
  }

  mostrarAviso(texto) {
    if (this.bloqueada) return;
    this.modo = 'aviso';
    this.textoMenu.setText(texto);
    this.menu.setVisible(true);
    this.escena.time.delayedCall(AJUSTES.duracionAvisoMs, () => {
      if (this.modo === 'aviso') {
        this.menu.setVisible(false);
        this.modo = '';
      }
    });
  }

  cerrarMenu() {
    this.menu.setVisible(false);
    this.modo = '';
    this.bloqueada = false;
    this.eventos.emit('jugador:bloqueado', { bloqueado: false });
  }

  emitirBloqueo(bloqueado) {
    this.bloqueada = bloqueado;
    this.eventos.emit('jugador:bloqueado', { bloqueado });
  }

  puedeTerminarJornada() {
    return !this.pewenes.quedanPorUsar()
      && this.estado.pinonesLlevados === 0
      && this.pinonesSuelo.length === 0
      && this.modo === '';
  }

  descartarPinonesSuelo() {
    const perdidos = this.pinonesSuelo.length;
    for (const pinon of [...this.pinonesSuelo]) this.eliminarPinon(pinon);
    return perdidos;
  }

  destruir() {
    this.eventos.off('entrega:pinones', this.eventoEntrega);
    this.escena.events.off('update', this.actualizar, this);
  }
}
