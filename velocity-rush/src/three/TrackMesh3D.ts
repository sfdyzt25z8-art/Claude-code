import * as THREE from 'three';
import type { TrackGeometry } from '../tracks/TrackGeometry';
import type { TrackTheme } from '../tracks/TrackTypes';
import { seededRng } from '../utils/RNG';
import { WORLD_SCALE } from './Scale3D';

/**
 * `position`/`radius` are in raw simulation-space `Vec2` units (matching
 * `CollisionSystem`'s `StaticObstacleCollider`, `AIController`'s
 * `AIObstacleRef`, and `RaceVehicleCore.radius`) so the same physics/AI code
 * the 2D view uses works unchanged — only `object`'s Three.js transform is in
 * meter-scale world units. `position.y` here is the simulation's ground-plane
 * axis, rendered as the 3D scene's Z.
 */
export interface ObstacleCollider3D {
  object: THREE.Object3D;
  position: { x: number; y: number };
  radius: number;
  hard: boolean;
}

export interface BuiltTrack3D {
  group: THREE.Group;
  obstacles: ObstacleCollider3D[];
  boundsRadius: number;
  center: { x: number; z: number };
}

function decorationKindsFor(theme: TrackTheme): ('tree' | 'palm' | 'cactus' | 'rock' | 'building')[] {
  const map: Record<TrackTheme, ('tree' | 'palm' | 'cactus' | 'rock' | 'building')[]> = {
    city: ['building', 'tree'], desert: ['cactus', 'rock'], forest: ['tree', 'rock'], mountains: ['rock', 'tree'],
    beach: ['palm', 'rock'], snow: ['tree', 'rock'], volcano: ['rock'], nightcity: ['building'],
    highway: ['tree'], industrial: ['building'], canyon: ['rock'], harbor: ['building'],
    airport: ['building'], stadium: ['building'], countryside: ['tree', 'rock'],
    f1street: ['building'], f1speed: ['building', 'tree'],
  };
  return map[theme];
}

function buildDecorationPrototype(kind: 'tree' | 'palm' | 'cactus' | 'rock' | 'building', color: number): THREE.Object3D {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  switch (kind) {
    case 'tree': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x6b4226, roughness: 0.9 }));
      trunk.position.y = 0.6;
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 7), mat);
      leaves.position.y = 2.1;
      group.add(trunk, leaves);
      break;
    }
    case 'palm': {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 }));
      trunk.position.y = 1.2;
      trunk.rotation.z = 0.12;
      const frondMat = mat;
      for (let i = 0; i < 5; i++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.6, 4), frondMat);
        frond.position.set(0, 2.5, 0);
        frond.rotation.z = Math.PI / 2.2;
        frond.rotation.y = (i / 5) * Math.PI * 2;
        group.add(frond);
      }
      group.add(trunk);
      break;
    }
    case 'cactus': {
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.2, 2, 6), mat);
      body.position.y = 0.9;
      group.add(body);
      break;
    }
    case 'rock': {
      const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), mat);
      rock.position.y = 0.4;
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(rock);
      break;
    }
    case 'building': {
      const h = 4 + Math.random() * 8;
      const bldg = new THREE.Mesh(new THREE.BoxGeometry(2.5, h, 2.5), mat);
      bldg.position.y = h / 2;
      group.add(bldg);
      break;
    }
  }
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return group;
}


/**
 * Builds the 3D road ribbon, ground plane, theme-appropriate scenery, and
 * obstacle meshes from the same `TrackGeometry` (centerline + width +
 * obstacle/jump/shortcut data) that drives the 2D track renderer — so all 15
 * tracks work in 3D automatically with no per-track authoring.
 */
export function buildTrackMesh3D(geo: TrackGeometry): BuiltTrack3D {
  const def = geo.def;
  const group = new THREE.Group();

  // Road ribbon (a flat strip mesh following the centerline, width-aware for shortcut zones).
  // `geo` operates in simulation-space (pixel-scale) units shared with the 2D view and physics;
  // everything below is converted to meter-scale Three.js world units via WORLD_SCALE.
  const pts = geo.densePoints;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const progress = i / pts.length;
    const width = geo.getWidthAtProgress(progress) * WORLD_SCALE;
    const normal = geo.getNormalAtProgress(progress);
    const p = pts[i];
    const px = p.x * WORLD_SCALE;
    const pz = p.y * WORLD_SCALE;
    const leftX = px + normal.x * (width / 2);
    const leftZ = pz + normal.y * (width / 2);
    const rightX = px - normal.x * (width / 2);
    const rightZ = pz - normal.y * (width / 2);
    positions.push(leftX, 0, leftZ, rightX, 0, rightZ);
    if (i < pts.length) {
      const next = (i + 1) % pts.length;
      const a = i * 2, b = i * 2 + 1, c = next * 2, d = next * 2 + 1;
      // Wound so the strip's front face (and its computed normal) points +Y — i.e. up,
      // toward the chase camera — matching left/right/tangent's handedness (see getNormalAtProgress).
      indices.push(a, c, b, b, c, d);
    }
  }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();
  const roadMat = new THREE.MeshStandardMaterial({ color: def.palette.surface, roughness: 0.85, metalness: 0.05 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.receiveShadow = true;
  group.add(road);

  // Edge lines
  const edgeMat = new THREE.LineBasicMaterial({ color: def.palette.surfaceLine, transparent: true, opacity: 0.7 });
  for (const side of [1, -1] as const) {
    const linePts: THREE.Vector3[] = [];
    for (let i = 0; i <= pts.length; i++) {
      const idx = i % pts.length;
      const progress = idx / pts.length;
      const width = geo.getWidthAtProgress(progress) * WORLD_SCALE;
      const normal = geo.getNormalAtProgress(progress);
      const p = pts[idx];
      const px = p.x * WORLD_SCALE;
      const pz = p.y * WORLD_SCALE;
      linePts.push(new THREE.Vector3(px + normal.x * side * (width / 2), 0.02, pz + normal.y * side * (width / 2)));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
    group.add(new THREE.Line(lineGeo, edgeMat));
  }

  // Bounds
  let minX = Infinity, minZ = Infinity, maxX = -Infinity, maxZ = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); minZ = Math.min(minZ, p.y);
    maxX = Math.max(maxX, p.x); maxZ = Math.max(maxZ, p.y);
  }
  const center = { x: ((minX + maxX) / 2) * WORLD_SCALE, z: ((minZ + maxZ) / 2) * WORLD_SCALE };
  const boundsRadius = (Math.max(maxX - minX, maxZ - minZ) / 2 + def.baseWidth * 3) * WORLD_SCALE;

  // Ground plane
  const groundGeo = new THREE.CircleGeometry(boundsRadius, 48);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: def.palette.offTrack, roughness: 1 }));
  ground.position.set(center.x, -0.02, center.z);
  ground.receiveShadow = true;
  group.add(ground);

  // Scenery — scattered outside the track, avoiding the road, seeded per track for stable variety.
  // Sampled in raw simulation-space (matching `geo`'s own units) so worldToTrack's off-road
  // check is correct, then converted to Three.js world units only when placing the mesh.
  const rawCenter = { x: center.x / WORLD_SCALE, z: center.z / WORLD_SCALE };
  const rawBoundsRadius = boundsRadius / WORLD_SCALE;
  const rng = seededRng(def.id + '-3d-deco');
  const kinds = decorationKindsFor(def.theme);
  let placed = 0;
  let attempts = 0;
  while (placed < 90 && attempts < 90 * 8) {
    attempts++;
    const x = rawCenter.x + (rng() * 2 - 1) * rawBoundsRadius;
    const z = rawCenter.z + (rng() * 2 - 1) * rawBoundsRadius;
    const { progress, distanceFromCenter } = geo.worldToTrack({ x, y: z });
    const width = geo.getWidthAtProgress(progress);
    if (distanceFromCenter < width / 2 + 8) continue;
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const deco = buildDecorationPrototype(kind, rng() > 0.5 ? def.palette.decorationPrimary : def.palette.decorationSecondary);
    const scale = 0.8 + rng() * 0.8;
    deco.position.set(x * WORLD_SCALE, 0, z * WORLD_SCALE);
    deco.scale.setScalar(scale);
    deco.rotation.y = rng() * Math.PI * 2;
    group.add(deco);
    placed++;
  }

  // Obstacles are intentionally not built — this is a clean racing line, F1-style.
  const obstacles: ObstacleCollider3D[] = [];

  return { group, obstacles, boundsRadius, center };
}
