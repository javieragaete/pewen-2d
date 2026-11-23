import { crearTexturaDesdeMatriz as crear } from './pixel.js';

const formas = {
  'interior-cama':['kkkkkkkkkkkkkkkk','kBBBBBBBBBBBBBBk','kWTTTTWWTTTTTTWk','kSSSSSSSSSSSSSSk','kkkkkkkkkkkkkkkk'],
  'interior-canasto':['.kkkkkk.','kBBBBBBk','kWTWTWWk','kTWTWTTk','kBBBBBBk','kkkkkkkk'],
  'interior-olla':['.kkkk.','kBBBBk','kBWWBk','kBTTBk','.kkkk.'],
  'interior-banco':['kkkkkkkkkkkk','BWWWWWWWWWWB','kkkk....kkkk'],
  'interior-witral':['kB.....B.k','kBW...WB.k','kBW.W.WB.k','kBWSWSWB.k','kBWWSWWB.k','kBWWWWWB.k','kB.....B.k','kkkkkkkkkk'],
  'interior-colgantes':['k...k...k...k','B...T...P...B','W...S...e...W','k...k...k...k'],
  'interior-lena':['.kkkk.','kBBBBk','BBWWBB','WWBBBB','.BBBB.'],
  'interior-fogon-0':['..f..','.fYf.','fYyYf','.BBB.','kkkkk'],
  'interior-fogon-1':['..y..','.yFy.','fYfYf','.BBB.','kkkkk'],
  'interior-fogon-2':['..f..','.fYf.','yYyYy','.BBB.','kkkkk']
};
export function registrarArteInterior(escena) {
  for (const [clave, filas] of Object.entries(formas)) crear(escena, clave, filas);
}
