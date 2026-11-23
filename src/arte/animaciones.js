const ANIMACIONES = {
  reposo: [2, 2, -1], caminar: [4, 8, -1], salto: [1, 1, 0],
  caida: [1, 1, 0], nado: [4, 7, -1], interactuar: [1, 1, 0]
};

export const CLAVES_ANIMACION = Object.keys(ANIMACIONES).map(pose => 'pj-' + pose);

export function registrarAnimaciones(escena) {
  for (const [pose, [total, frameRate, repeat]] of Object.entries(ANIMACIONES)) {
    const key = 'pj-' + pose;
    if (escena.anims.exists(key)) continue;
    const frames = Array.from({ length: total }, (_, i) => ({ key: total === 1 ? key : key + '-' + i }));
    escena.anims.create({ key, frames, frameRate, repeat });
  }
}
