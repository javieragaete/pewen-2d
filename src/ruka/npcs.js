import { crearTexturaDesdeMatriz as crear } from './pixel.js';

const caras = {
  base: ['......NNNN......','.....NNNNNN.....','.....NkkkNN.....','.....NNPNNN.....','......NPPN......','......BBBB......'],
  pelo: ['......GGGG......','.....GGGGGG.....','.....GkkkGG.....','.....GGPGGG.....','......GPPG......','......BBBB......'],
  lonko: ['....TTTTTTTT....','.....WWWWWW.....','.....NkkkNN.....','.....NNPNNN.....','......NPPN......','......BBBB......']
};
function crearCuadro(rol, anim, n) {
  const f = rol === 'Kimche' ? caras.pelo : caras.lonko;
  const ropa = rol === 'Kimche' ? ['....BBBBBBBB....','...BWWTTWWWB....','..BWTSSSSWTWB...','..BWWWWWWWWWB...'] : ['....BBBBBBBB....','...BWTTTTWWB....','..BWSSTTTSSWB...','..BWWWWWWWWWB...'];
  const pierna = n ? ['....BB...BB.....','...BB....BB.....'] : ['...BB....BB.....','..BB......BB....'];
  const pixeles=[...f,...ropa,...pierna].map(fila=>fila.padEnd(16,'.').slice(0,16));
  // Estirar las formas a la altura contractual de 32 píxeles base.
  const repeticiones=[2,2,2,3,3,3,3,3,3,2,3,3];
  return pixeles.flatMap((fila,i)=>Array(repeticiones[i]).fill(fila));
}
export function registrarNpcs(escena) {
  for (const rol of ['Kimche','Lonko']) for (const anim of ['reposo','hablar']) for (let n=0;n<2;n++) {
    crear(escena, `npc-${rol.toLowerCase()}-${anim}-${n}`, crearCuadro(rol,anim,n));
  }
}
