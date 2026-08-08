import * as THREE from 'three';
import type { CarDefinition } from '../cars/CarTypes';
import type { CustomizationState } from '../customization/CustomizationTypes';
import { CUSTOMIZATION_DATA } from '../customization/CustomizationData';

/**
 * Procedural low-poly F1-style open-wheel car — no external model files,
 * matching the rest of the project's "zero external assets" approach. Built
 * from a narrow low chassis tub (extruded side profile), a front wing, a
 * rear wing on a strut, sidepods, a halo arch over the cockpit, and four
 * exposed (uncovered) wheels — plus cosmetic trim driven by the same
 * `CustomizationState` used by the 2D garage/customization screens. Stats,
 * roster, and customization data are unchanged; this is a geometry reskin.
 */
export interface CarMesh3D {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  bodyMaterial: THREE.MeshStandardMaterial;
  underglowLight?: THREE.PointLight;
}

const HALF_LENGTH = 2.7; // ~5.4m nose-to-tail, close to a real F1 car
const TUB_WIDTH = 0.85; // narrow central chassis — the wings/wheels extend well beyond this
const WING_SPAN = 2.0;
const WHEEL_TRACK = 1.7; // distance between left/right wheel centers — wheels sit outboard, fully exposed
export const CAR_WHEEL_RADIUS = 0.34;

function optionColor(slot: string, optionId: string): number | undefined {
  const def = CUSTOMIZATION_DATA.find((d) => d.slot === slot);
  return def?.options.find((o) => o.id === optionId)?.color;
}

function buildTubGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-HALF_LENGTH, 0.08);
  shape.lineTo(-HALF_LENGTH, 0.4);
  shape.lineTo(-1.6, 0.48);
  shape.lineTo(-0.9, 0.6);
  shape.lineTo(-0.3, 0.58);
  shape.lineTo(0.3, 0.4);
  shape.lineTo(0.9, 0.22);
  shape.lineTo(HALF_LENGTH, 0.1);
  shape.lineTo(HALF_LENGTH, 0.06);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: TUB_WIDTH, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1, curveSegments: 1 });
  geo.translate(0, 0, -TUB_WIDTH / 2);
  geo.computeVertexNormals();
  return geo;
}

function buildWheel(): THREE.Mesh {
  const tireGeo = new THREE.CylinderGeometry(CAR_WHEEL_RADIUS, CAR_WHEEL_RADIUS, 0.32, 14);
  tireGeo.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.9, metalness: 0.1 });
  const wheel = new THREE.Mesh(tireGeo, tireMat);

  const hubGeo = new THREE.CylinderGeometry(CAR_WHEEL_RADIUS * 0.5, CAR_WHEEL_RADIUS * 0.5, 0.34, 10);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, new THREE.MeshStandardMaterial({ color: 0xc9d3de, roughness: 0.35, metalness: 0.8 }));
  wheel.add(hub);
  wheel.castShadow = true;
  return wheel;
}

export function buildCarMesh3D(car: CarDefinition, customization: CustomizationState): CarMesh3D {
  const group = new THREE.Group();
  group.name = `car_${car.id}`;

  const paintColor = optionColor('paint', customization.paint) ?? car.colorPrimary;
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: paintColor, metalness: 0.35, roughness: 0.4 });

  const tub = new THREE.Mesh(buildTubGeometry(), bodyMaterial);
  tub.castShadow = true;
  tub.receiveShadow = true;
  group.add(tub);

  // Sidepods flanking the cockpit
  [-1, 1].forEach((side) => {
    const pod = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 0.3), bodyMaterial);
    pod.position.set(-0.3, 0.26, side * (TUB_WIDTH / 2 + 0.17));
    pod.castShadow = true;
    group.add(pod);
  });

  // Front wing + endplates
  const frontWingX = HALF_LENGTH - 0.4;
  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, WING_SPAN), bodyMaterial);
  frontWing.position.set(frontWingX, 0.12, 0);
  frontWing.castShadow = true;
  group.add(frontWing);
  [-1, 1].forEach((side) => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.03), new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.5 }));
    plate.position.set(frontWingX, 0.2, (side * WING_SPAN) / 2);
    group.add(plate);
  });

  // Rear wing on a central strut + endplates
  const rearWingX = -HALF_LENGTH + 0.3;
  const rearWingSpan = WING_SPAN * 0.82;
  const rearWing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, rearWingSpan), bodyMaterial);
  rearWing.position.set(rearWingX, 0.86, 0);
  rearWing.castShadow = true;
  group.add(rearWing);
  const strut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), new THREE.MeshStandardMaterial({ color: 0x161616 }));
  strut.position.set(rearWingX, 0.62, 0);
  group.add(strut);
  [-1, 1].forEach((side) => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.03), new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.5 }));
    plate.position.set(rearWingX, 0.78, (side * rearWingSpan) / 2);
    group.add(plate);
  });

  // Halo arch over the cockpit opening
  const haloGeo = new THREE.TorusGeometry(0.38, 0.032, 8, 12, Math.PI);
  haloGeo.rotateY(Math.PI / 2);
  const halo = new THREE.Mesh(haloGeo, new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.4, metalness: 0.6 }));
  halo.position.set(-0.55, 0.58, 0);
  halo.castShadow = true;
  group.add(halo);

  // Cockpit opening (recessed, tint-driven — repurposes the "window tint" customization as a visor/cockpit surround color)
  const tintLevel = customization.windowTint;
  const tintOpacity = tintLevel === 'clear' ? 0.55 : tintLevel === 'light' ? 0.72 : tintLevel === 'medium' ? 0.85 : 0.96;
  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.1, TUB_WIDTH - 0.15),
    new THREE.MeshStandardMaterial({ color: 0x0a0e1f, roughness: 0.2, metalness: 0.2, transparent: true, opacity: tintOpacity }),
  );
  cockpit.position.set(-0.45, 0.56, 0);
  group.add(cockpit);

  // Decal stripe down the centerline (skipped for the "none" option)
  const stripeColor = optionColor('decal', customization.decal);
  if (stripeColor !== undefined) {
    const stripeGeo = new THREE.BoxGeometry(HALF_LENGTH * 1.6, 0.03, 0.16);
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.4 }));
    stripe.position.set(0.2, 0.41, 0);
    group.add(stripe);
  }

  // Wheels — exposed/outboard, well beyond the narrow tub, no bodywork covering them
  const wheelOffsets: [number, number][] = [
    [HALF_LENGTH - 0.7, WHEEL_TRACK / 2], [HALF_LENGTH - 0.7, -WHEEL_TRACK / 2],
    [-HALF_LENGTH + 0.75, WHEEL_TRACK / 2], [-HALF_LENGTH + 0.75, -WHEEL_TRACK / 2],
  ];
  const wheels = wheelOffsets.map(([x, z]) => {
    const wheel = buildWheel();
    wheel.position.set(x, CAR_WHEEL_RADIUS, z);
    group.add(wheel);
    return wheel;
  });

  // Neon side trim (thin glowing strip along the tub, unaffected by scene lighting so it always "reads" as lit)
  const neonColor = optionColor('neon', customization.neon);
  if (neonColor !== undefined) {
    [-1, 1].forEach((side) => {
      const stripGeo = new THREE.BoxGeometry(HALF_LENGTH * 1.3, 0.03, 0.03);
      const strip = new THREE.Mesh(stripGeo, new THREE.MeshBasicMaterial({ color: neonColor }));
      strip.position.set(-0.2, 0.14, (side * TUB_WIDTH) / 2 + side * 0.2);
      group.add(strip);
    });
  }

  // Underglow: an emissive disc plus a real point light so it casts color onto the track
  let underglowLight: THREE.PointLight | undefined;
  const underglowColor = optionColor('underglow', customization.underglow);
  if (underglowColor !== undefined) {
    const discGeo = new THREE.CircleGeometry(1.4, 16);
    discGeo.rotateX(-Math.PI / 2);
    const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: underglowColor, transparent: true, opacity: 0.55 }));
    disc.position.set(0, 0.02, 0);
    group.add(disc);

    underglowLight = new THREE.PointLight(underglowColor, 1.2, 4, 2);
    underglowLight.position.set(0, 0.12, 0);
    group.add(underglowLight);
  }

  return { group, wheels, bodyMaterial, underglowLight };
}
