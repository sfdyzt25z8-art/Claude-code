import * as THREE from 'three';
import type { CarDefinition } from '../cars/CarTypes';
import type { CustomizationState } from '../customization/CustomizationTypes';
import { CUSTOMIZATION_DATA } from '../customization/CustomizationData';

/**
 * Procedural low-poly 3D car — no external model files, matching the rest of
 * the project's "zero external assets" approach. Built from a hand-tuned
 * side-profile silhouette (extruded to give it width) plus a glass
 * greenhouse, four wheels, and cosmetic trim driven by the same
 * `CustomizationState` used by the 2D garage/customization screens.
 */
export interface CarMesh3D {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  bodyMaterial: THREE.MeshStandardMaterial;
  underglowLight?: THREE.PointLight;
}

const HALF_LENGTH = 2.1;
const WIDTH = 1.9;
export const CAR_WHEEL_RADIUS = 0.34;

function optionColor(slot: string, optionId: string): number | undefined {
  const def = CUSTOMIZATION_DATA.find((d) => d.slot === slot);
  return def?.options.find((o) => o.id === optionId)?.color;
}

function buildBodyGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-HALF_LENGTH, 0.15);
  shape.lineTo(-HALF_LENGTH, 0.5);
  shape.lineTo(-1.4, 0.75);
  shape.lineTo(-0.7, 1.0);
  shape.lineTo(0.5, 1.0);
  shape.lineTo(1.0, 0.6);
  shape.lineTo(1.6, 0.45);
  shape.lineTo(HALF_LENGTH, 0.35);
  shape.lineTo(HALF_LENGTH, 0.15);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: WIDTH, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 1 });
  geo.translate(0, 0, -WIDTH / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildWheel(): THREE.Mesh {
  const tireGeo = new THREE.CylinderGeometry(CAR_WHEEL_RADIUS, CAR_WHEEL_RADIUS, 0.26, 14);
  tireGeo.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.9, metalness: 0.1 });
  const wheel = new THREE.Mesh(tireGeo, tireMat);

  const hubGeo = new THREE.CylinderGeometry(CAR_WHEEL_RADIUS * 0.55, CAR_WHEEL_RADIUS * 0.55, 0.28, 8);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0xc9d3de, roughness: 0.4, metalness: 0.7 }));
  wheel.add(hub);
  wheel.castShadow = true;
  return wheel;
}

export function buildCarMesh3D(car: CarDefinition, customization: CustomizationState): CarMesh3D {
  const group = new THREE.Group();
  group.name = `car_${car.id}`;

  const paintColor = optionColor('paint', customization.paint) ?? car.colorPrimary;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: paintColor, metalness: 0.55, roughness: 0.35 });
  const body = new THREE.Mesh(buildBodyGeometry(), bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Decal stripe down the centerline (skipped for the "none" option)
  const stripeColor = optionColor('decal', customization.decal);
  if (stripeColor !== undefined) {
    const stripeGeo = new THREE.BoxGeometry(HALF_LENGTH * 2 - 0.1, 0.03, 0.34);
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.4 }));
    stripe.position.set(0, 1.001, 0);
    group.add(stripe);
  }

  // Glass greenhouse
  const tintLevel = customization.windowTint;
  const tintOpacity = tintLevel === 'clear' ? 0.55 : tintLevel === 'light' ? 0.72 : tintLevel === 'medium' ? 0.85 : 0.96;
  const glassGeo = new THREE.BoxGeometry(1.15, 0.32, WIDTH - 0.24);
  const glass = new THREE.Mesh(glassGeo, new THREE.MeshStandardMaterial({ color: 0x0a0e1f, roughness: 0.15, metalness: 0.2, transparent: true, opacity: tintOpacity }));
  glass.position.set(-0.1, 0.92, 0);
  group.add(glass);

  // Spoiler (skipped for the "none" option)
  if (customization.spoiler !== 'none') {
    const wingGeo = new THREE.BoxGeometry(0.9, 0.05, WIDTH - 0.2);
    const wing = new THREE.Mesh(wingGeo, bodyMaterial);
    wing.position.set(-1.75, 0.95, 0);
    group.add(wing);
    [-1, 1].forEach((side) => {
      const strutGeo = new THREE.BoxGeometry(0.06, 0.32, 0.06);
      const strut = new THREE.Mesh(strutGeo, new THREE.MeshStandardMaterial({ color: 0x222222 }));
      strut.position.set(-1.75, 0.78, (side * (WIDTH - 0.4)) / 2);
      group.add(strut);
    });
  }

  // Wheels
  const wheelOffsets: [number, number][] = [
    [1.35, WIDTH / 2 - 0.1], [1.35, -(WIDTH / 2 - 0.1)],
    [-1.35, WIDTH / 2 - 0.1], [-1.35, -(WIDTH / 2 - 0.1)],
  ];
  const wheels = wheelOffsets.map(([x, z]) => {
    const wheel = buildWheel();
    wheel.position.set(x, CAR_WHEEL_RADIUS, z);
    group.add(wheel);
    return wheel;
  });

  // Neon side trim (thin glowing strip, unaffected by scene lighting so it always "reads" as lit)
  const neonColor = optionColor('neon', customization.neon);
  if (neonColor !== undefined) {
    [-1, 1].forEach((side) => {
      const stripGeo = new THREE.BoxGeometry(HALF_LENGTH * 1.7, 0.03, 0.03);
      const strip = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: neonColor }));
      strip.position.set(0, 0.18, (side * WIDTH) / 2 + side * 0.02);
      group.add(strip);
    });
  }

  // Underglow: an emissive disc plus a real point light so it casts color onto the road
  let underglowLight: THREE.PointLight | undefined;
  const underglowColor = optionColor('underglow', customization.underglow);
  if (underglowColor !== undefined) {
    const discGeo = new THREE.CircleGeometry(1.6, 16);
    discGeo.rotateX(-Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: underglowColor, transparent: true, opacity: 0.55 }));
    disc.position.set(0, 0.03, 0);
    group.add(disc);

    underglowLight = new THREE.PointLight(underglowColor, 1.2, 4, 2);
    underglowLight.position.set(0, 0.15, 0);
    group.add(underglowLight);
  }

  return { group, wheels, bodyMaterial, underglowLight };
}
