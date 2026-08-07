import Phaser from 'phaser';

/**
 * Velocity Rush ships with zero external art files. Every sprite is a small
 * vector shape rasterised once into the global texture manager at boot time,
 * then reused (and tinted per-instance) for the rest of the session. This
 * keeps the game lightweight, loads instantly, and is trivial to re-skin.
 */

function g(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.make.graphics({ x: 0, y: 0 }, false);
}

function finalize(gr: Phaser.GameObjects.Graphics, scene: Phaser.Scene, key: string, w: number, h: number): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  gr.generateTexture(key, w, h);
  gr.destroy();
}

export const TEX = {
  carBody: 'tex_car_body',
  carStripe: 'tex_car_stripe',
  carWindow: 'tex_car_window',
  carShadow: 'tex_car_shadow',
  wheel: 'tex_wheel',
  neonGlow: 'tex_neon_glow',
  particleDot: 'tex_particle_dot',
  particleSpark: 'tex_particle_spark',
  smoke: 'tex_smoke',
  raindrop: 'tex_raindrop',
  snowflake: 'tex_snowflake',
  tree: 'tex_tree',
  palm: 'tex_palm',
  cactus: 'tex_cactus',
  rock: 'tex_rock',
  building: 'tex_building',
  cone: 'tex_cone',
  barrier: 'tex_barrier',
  crate: 'tex_crate',
  barrel: 'tex_barrel',
  puddle: 'tex_puddle',
  signpost: 'tex_signpost',
  island: 'tex_island',
  checkpointGate: 'tex_checkpoint_gate',
  cloud: 'tex_cloud',
  star: 'tex_star',
  coin: 'tex_coin',
  vignette: 'tex_vignette',
  whitePixel: 'tex_white_pixel',
} as const;

export function generateAllTextures(scene: Phaser.Scene): void {
  buildCar(scene);
  buildWheel(scene);
  buildShadow(scene);
  buildNeonGlow(scene);
  buildParticles(scene);
  buildWeatherParticles(scene);
  buildDecorations(scene);
  buildObstacles(scene);
  buildMisc(scene);
}

function buildCar(scene: Phaser.Scene): void {
  // Base body (white, tinted per-car at runtime) — rounded rect with a subtle nose taper.
  const w = 68;
  const h = 34;
  const body = g(scene);
  body.fillStyle(0xffffff, 1);
  body.fillRoundedRect(0, 0, w, h, 10);
  body.fillStyle(0xffffff, 0.9);
  body.fillTriangle(w, h * 0.18, w, h * 0.82, w + 8, h / 2);
  finalize(body, scene, TEX.carBody, w + 8, h);

  // Accent stripe overlay (tinted secondary color)
  const stripe = g(scene);
  stripe.fillStyle(0xffffff, 1);
  stripe.fillRect(0, h * 0.4, w + 8, h * 0.2);
  finalize(stripe, scene, TEX.carStripe, w + 8, h);

  // Windshield/cabin (dark, semi-transparent overlay)
  const win = g(scene);
  win.fillStyle(0x0a0e1f, 0.88);
  win.fillRoundedRect(w * 0.32, h * 0.14, w * 0.4, h * 0.72, 6);
  finalize(win, scene, TEX.carWindow, w + 8, h);
}

function buildWheel(scene: Phaser.Scene): void {
  const wheel = g(scene);
  wheel.fillStyle(0x111111, 1);
  wheel.fillRoundedRect(0, 0, 10, 18, 3);
  wheel.fillStyle(0x2c2f38, 1);
  wheel.fillRoundedRect(2, 2, 6, 14, 2);
  finalize(wheel, scene, TEX.wheel, 10, 18);
}

function buildShadow(scene: Phaser.Scene): void {
  const shadow = g(scene);
  shadow.fillStyle(0x000000, 0.4);
  shadow.fillEllipse(40, 20, 80, 40);
  finalize(shadow, scene, TEX.carShadow, 80, 40);
}

function buildNeonGlow(scene: Phaser.Scene): void {
  const glow = g(scene);
  glow.fillStyle(0xffffff, 1);
  glow.fillCircle(32, 32, 32);
  finalize(glow, scene, TEX.neonGlow, 64, 64);
}

function buildParticles(scene: Phaser.Scene): void {
  const dot = g(scene);
  dot.fillStyle(0xffffff, 1);
  dot.fillCircle(6, 6, 6);
  finalize(dot, scene, TEX.particleDot, 12, 12);

  const spark = g(scene);
  spark.fillStyle(0xffffff, 1);
  spark.fillTriangle(4, 0, 8, 8, 0, 8);
  finalize(spark, scene, TEX.particleSpark, 8, 8);

  const smoke = g(scene);
  smoke.fillStyle(0xffffff, 0.5);
  smoke.fillCircle(16, 16, 16);
  finalize(smoke, scene, TEX.smoke, 32, 32);

  const white = g(scene);
  white.fillStyle(0xffffff, 1);
  white.fillRect(0, 0, 4, 4);
  finalize(white, scene, TEX.whitePixel, 4, 4);

  const coin = g(scene);
  coin.fillStyle(0xffc371, 1);
  coin.fillCircle(10, 10, 10);
  coin.lineStyle(2, 0xcf9a3f, 1);
  coin.strokeCircle(10, 10, 8);
  finalize(coin, scene, TEX.coin, 20, 20);

  const star = g(scene);
  star.fillStyle(0xffffff, 1);
  const cx = 10;
  const cy = 10;
  const spikes = 5;
  const outerR = 10;
  const innerR = 4.5;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  star.beginPath();
  star.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerR;
    let y = cy + Math.sin(rot) * outerR;
    star.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    star.lineTo(x, y);
    rot += step;
  }
  star.closePath();
  star.fillPath();
  finalize(star, scene, TEX.star, 20, 20);
}

function buildWeatherParticles(scene: Phaser.Scene): void {
  const rain = g(scene);
  rain.fillStyle(0xbcd9ff, 0.8);
  rain.fillRect(0, 0, 2, 16);
  finalize(rain, scene, TEX.raindrop, 2, 16);

  const snow = g(scene);
  snow.fillStyle(0xffffff, 0.95);
  snow.fillCircle(4, 4, 4);
  finalize(snow, scene, TEX.snowflake, 8, 8);

  const cloud = g(scene);
  cloud.fillStyle(0xffffff, 0.5);
  cloud.fillEllipse(30, 20, 60, 26);
  cloud.fillEllipse(55, 16, 40, 22);
  cloud.fillEllipse(15, 16, 36, 20);
  finalize(cloud, scene, TEX.cloud, 90, 40);
}

function buildDecorations(scene: Phaser.Scene): void {
  const tree = g(scene);
  tree.fillStyle(0x6b4226, 1);
  tree.fillRect(13, 22, 6, 14);
  tree.fillStyle(0xffffff, 1);
  tree.fillCircle(16, 14, 15);
  finalize(tree, scene, TEX.tree, 32, 36);

  const palm = g(scene);
  palm.fillStyle(0x8a6a3a, 1);
  palm.fillRect(15, 18, 4, 22);
  palm.fillStyle(0xffffff, 1);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2;
    palm.fillEllipse(17 + Math.cos(ang) * 10, 14 + Math.sin(ang) * 6, 18, 7);
  }
  finalize(palm, scene, TEX.palm, 34, 40);

  const cactus = g(scene);
  cactus.fillStyle(0xffffff, 1);
  cactus.fillRoundedRect(10, 4, 8, 28, 4);
  cactus.fillRoundedRect(2, 12, 8, 16, 4);
  cactus.fillRoundedRect(18, 8, 8, 20, 4);
  finalize(cactus, scene, TEX.cactus, 28, 32);

  const rock = g(scene);
  rock.fillStyle(0xffffff, 1);
  rock.fillPoints(
    [
      { x: 2, y: 20 }, { x: 6, y: 6 }, { x: 16, y: 2 }, { x: 26, y: 8 },
      { x: 28, y: 20 }, { x: 20, y: 26 }, { x: 8, y: 26 },
    ] as Phaser.Types.Math.Vector2Like[],
    true,
  );
  finalize(rock, scene, TEX.rock, 30, 28);

  const building = g(scene);
  building.fillStyle(0xffffff, 1);
  building.fillRect(0, 0, 40, 90);
  building.fillStyle(0x0a0e1f, 0.5);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 3; col++) {
      building.fillRect(4 + col * 12, 6 + row * 11, 7, 7);
    }
  }
  finalize(building, scene, TEX.building, 40, 90);
}

function buildObstacles(scene: Phaser.Scene): void {
  const cone = g(scene);
  cone.fillStyle(0xff6a2e, 1);
  cone.fillTriangle(10, 0, 0, 24, 20, 24);
  cone.fillStyle(0xffffff, 1);
  cone.fillRect(2, 15, 16, 4);
  finalize(cone, scene, TEX.cone, 20, 24);

  const barrier = g(scene);
  barrier.fillStyle(0xe9f3ff, 1);
  barrier.fillRoundedRect(0, 0, 44, 14, 3);
  barrier.fillStyle(0xff5f6d, 1);
  barrier.fillRect(4, 2, 10, 10);
  barrier.fillRect(18, 2, 10, 10);
  barrier.fillRect(32, 2, 10, 10);
  finalize(barrier, scene, TEX.barrier, 44, 14);

  const crate = g(scene);
  crate.fillStyle(0xb98546, 1);
  crate.fillRect(0, 0, 26, 26);
  crate.lineStyle(2, 0x7a5a30, 1);
  crate.strokeRect(1, 1, 24, 24);
  crate.lineBetween(0, 0, 26, 26);
  crate.lineBetween(26, 0, 0, 26);
  finalize(crate, scene, TEX.crate, 26, 26);

  const barrel = g(scene);
  barrel.fillStyle(0xff5f6d, 1);
  barrel.fillRoundedRect(0, 0, 22, 28, 6);
  barrel.fillStyle(0xffffff, 1);
  barrel.fillRect(0, 8, 22, 3);
  barrel.fillRect(0, 18, 22, 3);
  finalize(barrel, scene, TEX.barrel, 22, 28);

  const puddle = g(scene);
  puddle.fillStyle(0x4facfe, 0.55);
  puddle.fillEllipse(20, 12, 40, 18);
  finalize(puddle, scene, TEX.puddle, 40, 24);

  const sign = g(scene);
  sign.fillStyle(0x8a8a8a, 1);
  sign.fillRect(9, 10, 4, 26);
  sign.fillStyle(0xffc371, 1);
  sign.fillRoundedRect(0, 0, 24, 16, 3);
  finalize(sign, scene, TEX.signpost, 24, 36);

  const island = g(scene);
  island.fillStyle(0xffffff, 1);
  island.fillRoundedRect(0, 0, 120, 40, 16);
  finalize(island, scene, TEX.island, 120, 40);

  const gate = g(scene);
  gate.fillStyle(0xffffff, 0.9);
  gate.fillRect(0, 0, 8, 120);
  gate.fillRect(0, 0, 60, 8);
  gate.fillRect(0, 112, 60, 8);
  finalize(gate, scene, TEX.checkpointGate, 60, 120);
}

function buildMisc(scene: Phaser.Scene): void {
  // True radial gradient via an offscreen canvas texture (Graphics can't do radial fills).
  const w = 512;
  const h = 512;
  const key = TEX.vignette;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const canvasTexture = scene.textures.createCanvas(key, w, h)!;
  const ctx = canvasTexture.getContext()!;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = Math.hypot(cx, cy);
  const gradient = ctx.createRadialGradient(cx, cy, maxR * 0.45, cx, cy, maxR);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.75)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  canvasTexture.refresh();
}
