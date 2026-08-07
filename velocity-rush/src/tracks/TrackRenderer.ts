import Phaser from 'phaser';
import type { TrackGeometry } from './TrackGeometry';
import { TEX } from '../assets/ProceduralTextures';
import { seededRng } from '../utils/RNG';
import { DEPTHS } from '../utils/Constants';
import type { ObstacleType, TrackObstacle } from './TrackTypes';

export interface BuiltObstacle {
  sprite: Phaser.Physics.Arcade.Sprite;
  def: TrackObstacle;
}

export interface BuiltTrack {
  bounds: Phaser.Geom.Rectangle;
  obstacles: BuiltObstacle[];
  decorationLayer: Phaser.GameObjects.Layer;
  roadImage: Phaser.GameObjects.Image;
}

const OBSTACLE_TEX: Record<ObstacleType, string> = {
  cone: TEX.cone,
  barrier: TEX.barrier,
  rock: TEX.rock,
  tree: TEX.tree,
  crate: TEX.crate,
  puddle: TEX.puddle,
  signpost: TEX.signpost,
  barrel: TEX.barrel,
};

const HARD_OBSTACLES = new Set<ObstacleType>(['cone', 'barrier', 'rock', 'tree', 'crate', 'barrel', 'signpost']);

export class TrackRenderer {
  constructor(private scene: Phaser.Scene, private geo: TrackGeometry) {}

  build(): BuiltTrack {
    const bounds = this.computeBounds();
    const roadImage = this.buildRoadTexture(bounds);
    const decorationLayer = this.buildDecorations(bounds);
    const obstacles = this.buildObstacles();
    return { bounds, obstacles, decorationLayer, roadImage };
  }

  private computeBounds(): Phaser.Geom.Rectangle {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of this.geo.densePoints) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const pad = this.geo.def.baseWidth * 2.5 + 500;
    return new Phaser.Geom.Rectangle(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
  }

  private buildRoadTexture(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Image {
    const key = `track_${this.geo.def.id}_${Date.now()}`;
    const gfx = this.scene.make.graphics({ x: 0, y: 0 }, false);
    const palette = this.geo.def.palette;

    // Off-track ground fill
    gfx.fillStyle(palette.offTrack, 1);
    gfx.fillRect(0, 0, bounds.width, bounds.height);

    // Subtle ground texture (scattered dots) for depth without an image asset
    const groundRng = seededRng(this.geo.def.id + '-ground');
    gfx.fillStyle(palette.offTrackDetail, 0.5);
    for (let i = 0; i < 900; i++) {
      const x = groundRng() * bounds.width;
      const y = groundRng() * bounds.height;
      gfx.fillCircle(x, y, 2 + groundRng() * 4);
    }

    const offset = (x: number, y: number) => ({ x: x - bounds.x, y: y - bounds.y });

    // Road ribbon polygon (outer edge forward, inner edge backward)
    const pts = this.geo.densePoints;
    const outer: { x: number; y: number }[] = [];
    const inner: { x: number; y: number }[] = [];
    for (let i = 0; i < pts.length; i++) {
      const progress = i / pts.length;
      const width = this.geo.getWidthAtProgress(progress);
      const normal = this.geo.getNormalAtProgress(progress);
      const p = pts[i];
      outer.push(offset(p.x + normal.x * (width / 2), p.y + normal.y * (width / 2)));
      inner.push(offset(p.x - normal.x * (width / 2), p.y - normal.y * (width / 2)));
    }
    const ribbon = [...outer, ...inner.reverse()];
    gfx.fillStyle(palette.surface, 1);
    gfx.fillPoints(ribbon as Phaser.Types.Math.Vector2Like[], true);

    // Edge lines
    gfx.lineStyle(4, palette.surfaceLine, 0.85);
    gfx.beginPath();
    outer.forEach((p, i) => (i === 0 ? gfx.moveTo(p.x, p.y) : gfx.lineTo(p.x, p.y)));
    gfx.closePath();
    gfx.strokePath();
    gfx.beginPath();
    inner.forEach((p, i) => (i === 0 ? gfx.moveTo(p.x, p.y) : gfx.lineTo(p.x, p.y)));
    gfx.closePath();
    gfx.strokePath();

    // Dashed centerline
    gfx.fillStyle(palette.surfaceLine, 0.9);
    for (let i = 0; i < pts.length; i += 2) {
      if (Math.floor(i / 2) % 2 !== 0) continue;
      const p = offset(pts[i].x, pts[i].y);
      gfx.fillCircle(p.x, p.y, 3.5);
    }

    // Start/finish checker line at progress 0
    this.drawCheckerLine(gfx, 0, offset);
    // Checkpoint markers (thin lines) at each checkpoint fraction
    for (const cp of this.geo.checkpoints) {
      if (cp === 0) continue;
      this.drawCheckpointLine(gfx, cp, offset);
    }

    gfx.generateTexture(key, bounds.width, bounds.height);
    gfx.destroy();

    const image = this.scene.add.image(bounds.x, bounds.y, key).setOrigin(0, 0);
    image.setDepth(DEPTHS.trackSurface);
    return image;
  }

  private drawCheckerLine(
    gfx: Phaser.GameObjects.Graphics,
    progress: number,
    offset: (x: number, y: number) => { x: number; y: number },
  ): void {
    const p = this.geo.getPointAtProgress(progress);
    const normal = this.geo.getNormalAtProgress(progress);
    const width = this.geo.getWidthAtProgress(progress);
    const squares = 10;
    const sqSize = width / squares;
    const tangent = this.geo.getTangentAtProgress(progress);
    for (let i = 0; i < squares; i++) {
      const t = -width / 2 + i * sqSize;
      const cx = p.x + normal.x * t;
      const cy = p.y + normal.y * t;
      const c1 = offset(cx - tangent.x * 6, cy - tangent.y * 6);
      const c2 = offset(cx + tangent.x * 6, cy + tangent.y * 6);
      gfx.fillStyle(i % 2 === 0 ? 0xffffff : 0x111111, 1);
      gfx.fillRect(Math.min(c1.x, c2.x) - 3, Math.min(c1.y, c2.y) - 3, Math.abs(c2.x - c1.x) + 6, Math.abs(c2.y - c1.y) + 6);
    }
  }

  private drawCheckpointLine(
    gfx: Phaser.GameObjects.Graphics,
    progress: number,
    offset: (x: number, y: number) => { x: number; y: number },
  ): void {
    const p = this.geo.getPointAtProgress(progress);
    const normal = this.geo.getNormalAtProgress(progress);
    const width = this.geo.getWidthAtProgress(progress);
    const a = offset(p.x + normal.x * width / 2, p.y + normal.y * width / 2);
    const b = offset(p.x - normal.x * width / 2, p.y - normal.y * width / 2);
    gfx.lineStyle(3, this.geo.def.palette.surfaceLine, 0.3);
    gfx.lineBetween(a.x, a.y, b.x, b.y);
  }

  private buildDecorations(bounds: Phaser.Geom.Rectangle): Phaser.GameObjects.Layer {
    const layer = this.scene.add.layer();
    layer.setDepth(DEPTHS.trackDecoration);
    const rng = seededRng(this.geo.def.id + '-deco');
    const themeSets: Record<string, string[]> = {
      city: [TEX.building, TEX.signpost],
      desert: [TEX.cactus, TEX.rock],
      forest: [TEX.tree, TEX.rock],
      mountains: [TEX.rock, TEX.tree],
      beach: [TEX.palm, TEX.rock],
      snow: [TEX.tree, TEX.rock],
      volcano: [TEX.rock],
      nightcity: [TEX.building, TEX.signpost],
      highway: [TEX.signpost, TEX.tree],
      industrial: [TEX.building, TEX.crate],
      canyon: [TEX.rock],
      harbor: [TEX.crate, TEX.building],
      airport: [TEX.signpost, TEX.building],
      stadium: [TEX.building],
      countryside: [TEX.tree, TEX.rock],
    };
    const set = themeSets[this.geo.def.theme] ?? [TEX.rock];
    const palette = this.geo.def.palette;
    const count = 160;
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < count * 8) {
      attempts++;
      const x = bounds.x + rng() * bounds.width;
      const y = bounds.y + rng() * bounds.height;
      const { progress, distanceFromCenter } = this.geo.worldToTrack({ x, y });
      const width = this.geo.getWidthAtProgress(progress);
      if (distanceFromCenter < width / 2 + 60) continue;
      const texKey = set[Math.floor(rng() * set.length)];
      const img = this.scene.add.image(x, y, texKey);
      img.setScale(0.8 + rng() * 0.9);
      img.setTint(rng() > 0.5 ? palette.decorationPrimary : palette.decorationSecondary);
      img.setAlpha(0.92);
      img.setDepth(DEPTHS.trackDecoration + (y % 10));
      layer.add(img);
      placed++;
    }
    return layer;
  }

  private buildObstacles(): BuiltObstacle[] {
    const built: BuiltObstacle[] = [];
    for (const obstacle of this.geo.def.obstacles) {
      const p = this.geo.getPointAtProgress(obstacle.at);
      const normal = this.geo.getNormalAtProgress(obstacle.at);
      const width = this.geo.getWidthAtProgress(obstacle.at);
      const x = p.x + normal.x * obstacle.offset * (width / 2 - obstacle.radius);
      const y = p.y + normal.y * obstacle.offset * (width / 2 - obstacle.radius);
      const texKey = OBSTACLE_TEX[obstacle.type];
      const sprite = this.scene.physics.add.sprite(x, y, texKey);
      sprite.setDepth(DEPTHS.obstacles);
      sprite.setImmovable(HARD_OBSTACLES.has(obstacle.type));
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setCircle(obstacle.radius, sprite.width / 2 - obstacle.radius, sprite.height / 2 - obstacle.radius);
      body.pushable = false;
      if (obstacle.type === 'puddle') {
        sprite.setAlpha(0.75);
      }
      built.push({ sprite, def: obstacle });
    }
    return built;
  }
}
