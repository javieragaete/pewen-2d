import { registrarArteRuka } from '../ruka/index.js';
import { AJUSTES_INTERIOR as AJ } from '../ajustes/interior.js';
import { volumenCanal } from '../settings.js';

const Phaser = globalThis.Phaser;
const W = 1280, H = 720, S = AJ.escalaPixel;
const URL_TEMA = new URL('../../assets/audio/tema_mapuche_tribal/tema.wav', import.meta.url).href;

export class Interior extends Phaser.Scene {
  constructor() { super('Interior'); }

  preload() {
    if (!this.cache.audio.exists('tema-mapuche-tribal')) this.load.audio('tema-mapuche-tribal', URL_TEMA);
    this.load.on('loaderror', archivo => {
      if (archivo.key === 'tema-mapuche-tribal') console.error('No se pudo cargar la música:', archivo.src);
    });
  }

  init(data = {}) { this.pinonesLlevados = Number(data.pinonesLlevados ?? 0); }

  create() {
    this.musica = this.sound.add('tema-mapuche-tribal', {
      loop: true,
      volume: 0.24 * volumenCanal('music')
    });
    this.iniciarMusica = () => {
      if (this.sound.locked || !this.musica || this.musica.isPlaying) return;
      this.sound.off(Phaser.Sound.Events.UNLOCKED, this.iniciarMusica);
      this.musica.play();
    };
    if (this.sound.locked) this.sound.once(Phaser.Sound.Events.UNLOCKED, this.iniciarMusica);
    else this.iniciarMusica();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.off(Phaser.Sound.Events.UNLOCKED, this.iniciarMusica);
      this.musica?.stop();
    });
    registrarArteRuka(this);
    this.bloqueado = false;
    this._bloqueo = ({ bloqueado } = {}) => { this.bloqueado = Boolean(bloqueado); };
    this.game.events.on('jugador:bloqueado', this._bloqueo);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off('jugador:bloqueado', this._bloqueo));
    this.pintarEstancia();
    this.crearHabitantes();
    this.crearJugador();
    this.crearControles();
    this.crearAvisos();
    this.input.keyboard.on('keydown-E', () => this.interactuar());
    this.cameras.main.fadeIn(450, 12, 15, 13);
  }

  pintarEstancia() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x342c22,0x342c22,0x211d19,0x211d19,1); g.fillRect(0,0,W,H);
    // Pared de troncos y techo interior con vigas ahumadas.
    g.fillStyle(0x49392b,1); g.fillRect(0,75,W,445);
    g.fillStyle(0x6d5139,1); g.fillRect(0,85,W,12);
    for (let y=110; y<505; y+=38) {
      g.fillStyle(y%76===0?0x5a4431:0x513d2d,1); g.fillRect(0,y,W,28);
      g.lineStyle(3,0x30271f,.9); g.lineBetween(0,y+27,W,y+27);
      for (let x=40+(y%3)*37; x<W; x+=190) { g.fillStyle(0x342a21,1); g.fillCircle(x,y+14,3); }
    }
    g.fillStyle(0x25231e,1); g.fillTriangle(70,110,640,5,1210,110);
    g.lineStyle(15,0x33291f,1); g.lineBetween(90,106,640,13); g.lineBetween(1190,106,640,13);
    g.lineStyle(6,0x443528,1); g.lineBetween(180,100,180,510); g.lineBetween(1100,100,1100,510);
    g.fillStyle(0x34291f,1); g.fillRect(0,510,W,210);
    g.fillStyle(0x705238,1); g.fillRect(0,515,W,10);
    g.lineStyle(2,0x453526,.8); for(let x=0;x<W;x+=62) g.lineBetween(x,548,x+35,545);
    // Luz cálida aditiva sobre un ambiente oscuro.
    this.add.rectangle(W/2,H/2,W,H,AJ.colorAmbiente,.55).setDepth(15);
    this.luz = this.add.circle(640,390,230,0xffa94e,AJ.intensidadLuz).setBlendMode(Phaser.BlendModes.ADD).setDepth(16);
    this.tweens.add({targets:this.luz,alpha:{from:AJ.intensidadLuz*.78,to:AJ.intensidadLuz},scale:{from:.98,to:1.04},duration:1150,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});

    // Grupos ordenados contra los muros, dejando amplio pasillo central.
    this.objeto('interior-cama',185,484,3); this.objeto('interior-canasto',90,485,3);
    this.objeto('interior-witral',215,190,3); this.objeto('interior-colgantes',460,120,3);
    this.objeto('interior-olla',1090,490,4); this.objeto('interior-canasto',1165,488,3);
    this.objeto('interior-banco',930,487,3); this.objeto('interior-lena',1040,485,3);
    this.objeto('interior-cama',1000,270,2.4);

    this.fogon = this.add.sprite(640,445,'interior-fogon-0').setScale(9).setDepth(5);
    this.anims.create({key:'fogon-interior',frames:[0,1,2].map(i=>({key:`interior-fogon-${i}`})),frameRate:5,repeat:-1});
    this.fogon.play('fogon-interior');
    this.humo = this.add.particles(640,420,'ruka-humo-0',{frequency:370, lifespan:2600, speedY:{min:-38,max:-70},speedX:{min:-9,max:9},alpha:{start:.24,end:0},scale:{start:2.5,end:4},tint:0xaea89b,quantity:1,blendMode:Phaser.BlendModes.SCREEN}).setDepth(12);
    // Canasta destacada junto a la puerta.
    this.objeto('interior-canasto',1170,495,5).setTint(0xffce73);
    this.add.text(1093,540,`${this.pinonesLlevados} piñones`,{fontFamily:'sans-serif',fontSize:'15px',color:'#fff0cc',stroke:'#201a14',strokeThickness:4}).setDepth(25);
    this.puerta = {x:1205,y:470,w:70,h:100,tipo:'puerta',label:'salir a la puerta'};
    this.add.rectangle(1235,466,66,110,0x171510,.85).setDepth(2).setStrokeStyle(4,0x6d5139);
    this.add.text(1190,520,'Salida',{fontSize:'13px',color:'#e8cf9c'}).setDepth(4);
  }

  objeto(clave,x,y,escala) { return this.add.image(x,y,clave).setScale(escala).setDepth(y/10); }

  crearHabitantes() {
    this.npcs = [
      {rol:'Kimche',x:445,y:467,habla:AJ.mostrarAvisoKimche},
      {rol:'Lonko',x:830,y:467,habla:AJ.mostrarAvisoLonko}
    ].map(n => {
      const sprite=this.add.sprite(n.x,n.y,`npc-${n.rol.toLowerCase()}-reposo-0`).setScale(S).setOrigin(.5,1).setDepth(11);
      this.anims.create({key:`npc-${n.rol}-reposo`,frames:[0,1].map(i=>({key:`npc-${n.rol.toLowerCase()}-reposo-${i}`})),frameRate:2,repeat:-1});
      this.anims.create({key:`npc-${n.rol}-hablar`,frames:[0,1].map(i=>({key:`npc-${n.rol.toLowerCase()}-hablar-${i}`})),frameRate:4,repeat:-1});
      sprite.play(`npc-${n.rol}-reposo`);
      const aviso = this.add.text(n.x,n.y-112,'!',{fontFamily:'sans-serif',fontSize:'28px',fontStyle:'bold',color:'#f0c95a',stroke:'#202522',strokeThickness:5}).setOrigin(.5).setDepth(28).setVisible(n.habla);
      if (n.habla) this.tweens.add({targets:aviso,alpha:.25,duration:420,yoyo:true,repeat:-1});
      return {...n,sprite,aviso};
    });
  }

  crearJugador() {
    const tx=['pj-reposo-0','pj-caminar-0','pj-salto'].find(k=>this.textures.exists(k));
    this.jugador = tx ? this.add.sprite(640,490,tx) : this.add.rectangle(640,465,24,48,0x77a19a).setStrokeStyle(3,0x202522);
    this.jugador.setDepth(13);
    this.jugador.setData('velocidad', AJ.velocidadJugador);
  }

  crearControles() {
    this.keys=this.input.keyboard.addKeys('A,D,LEFT,RIGHT');
    this.pista=this.add.text(W/2,620,'',{fontFamily:'sans-serif',fontSize:'18px',color:'#fff4d6',stroke:'#201a14',strokeThickness:5}).setOrigin(.5).setDepth(40);
    this.add.text(640,688,'A / D o ← / → caminar     E interactuar',{fontSize:'14px',color:'#d2c5a9'}).setOrigin(.5).setDepth(40);
  }

  crearAvisos() { this.objetivos=[{x:1170,y:495,tipo:'canasta',label:'entregar piñones'},...this.npcs.map(n=>({x:n.x,y:n.y,tipo:'npc',rol:n.rol,label:`hablar con ${n.rol}`})),{x:1230,y:470,tipo:'puerta',label:'salir al lof'}]; }

  update(_, delta) {
    if (!this.jugador || this.bloqueado) { this.pista?.setText(''); return; }
    const izquierda=this.keys.LEFT.isDown||this.keys.A.isDown, derecha=this.keys.RIGHT.isDown||this.keys.D.isDown;
    const velocidad=AJ.velocidadJugador*delta/1000;
    if (this.jugador.setX) this.jugador.x=Phaser.Math.Clamp(this.jugador.x+(derecha-izquierda)*velocidad,36,1225);
    else this.jugador.x=Phaser.Math.Clamp(this.jugador.x+(derecha-izquierda)*velocidad,36,1225);
    const cerca=this.objetivos.map(o=>({...o,distancia:Math.abs(o.x-this.jugador.x)})).filter(o=>o.distancia<82).sort((a,b)=>a.distancia-b.distancia)[0];
    this.cercano=cerca; this.pista.setText(cerca?`[E] ${cerca.label}`:'');
  }

  interactuar() {
    const o=this.cercano; if (!o||this.bloqueado) return;
    if(o.tipo==='canasta') this.game.events.emit('entrega:pinones');
    if(o.tipo==='npc') { this.npcs.find(n=>n.rol===o.rol)?.sprite.play(`npc-${o.rol}-hablar`); this.game.events.emit('dialogo:npc',{rol:o.rol}); }
    if(o.tipo==='puerta') { this.cameras.main.fadeOut(350,12,15,13); this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,()=>this.scene.start('Mundo',{desde:'interior'})); }
  }
}

export default Interior;
