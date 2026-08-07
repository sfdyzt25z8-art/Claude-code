import Phaser from 'phaser';
import type { CarDefinition } from '../cars/CarTypes';
import type { CustomizationState } from '../customization/CustomizationTypes';
import { CUSTOMIZATION_DATA } from '../customization/CustomizationData';
import { TEX } from '../assets/ProceduralTextures';

export interface CarVisual {
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  wheels: Phaser.GameObjects.Image[];
  underglow: Phaser.GameObjects.Image;
  neon: Phaser.GameObjects.Image;
}

function optionColor(slot: string, optionId: string): number | undefined {
  const def = CUSTOMIZATION_DATA.find((d) => d.slot === slot);
  return def?.options.find((o) => o.id === optionId)?.color;
}

/**
 * Builds a car's visual representation (shadow, wheels, body, stripe, window,
 * underglow, neon) from procedural textures tinted per the car's paint and
 * the player's chosen customization. Shared by the Garage/Customization
 * previews and the actual in-race vehicle sprite so they always match.
 */
export function buildCarVisual(
  scene: Phaser.Scene,
  car: CarDefinition,
  customization: CustomizationState,
  detailed = true,
): CarVisual {
  const container = scene.add.container(0, 0);

  const underglowColor = optionColor('underglow', customization.underglow) ?? 0;
  const underglow = scene.add.image(-4, 4, TEX.neonGlow);
  underglow.setScale(1.6, 0.5);
  underglow.setBlendMode(Phaser.BlendModes.ADD);
  underglow.setTint(underglowColor || 0x000000);
  underglow.setAlpha(underglowColor ? 0.55 : 0);

  const shadow = scene.add.image(2, 8, TEX.carShadow).setAlpha(0.5);

  const wheelOffsets = [
    { x: -19, y: -15 }, { x: -19, y: 15 }, { x: 18, y: -15 }, { x: 18, y: 15 },
  ];
  const wheels = wheelOffsets.map((o) => {
    const wheel = scene.add.image(o.x, o.y, TEX.wheel);
    wheel.setOrigin(0.5, 0.5);
    return wheel;
  });

  const body = scene.add.image(0, 0, TEX.carBody).setTint(car.colorPrimary);
  const decalId = customization.decal;
  const stripeColor = decalId && decalId !== 'none' ? optionColor('decal', decalId) : undefined;
  const stripe = scene.add.image(0, 0, TEX.carStripe).setTint(stripeColor ?? car.colorSecondary);
  stripe.setAlpha(stripeColor !== undefined || !decalId ? 0.85 : 0);

  const tintLevel = customization.windowTint;
  const tintAlpha = tintLevel === 'clear' ? 0.5 : tintLevel === 'light' ? 0.7 : tintLevel === 'medium' ? 0.85 : 0.97;
  const windowImg = scene.add.image(0, 0, TEX.carWindow).setAlpha(tintAlpha);

  const neonColor = optionColor('neon', customization.neon) ?? 0;
  const neon = scene.add.image(0, 14, TEX.neonGlow);
  neon.setScale(1.3, 0.25);
  neon.setBlendMode(Phaser.BlendModes.ADD);
  neon.setTint(neonColor || 0x000000);
  neon.setAlpha(neonColor ? 0.65 : 0);

  container.add([underglow, shadow, ...wheels.slice(0, 2), body, stripe, windowImg, neon, ...wheels.slice(2)]);

  if (detailed) {
    const paintColor = optionColor('paint', customization.paint);
    if (paintColor !== undefined) body.setTint(paintColor);
  }

  return { container, body, wheels, underglow, neon };
}
