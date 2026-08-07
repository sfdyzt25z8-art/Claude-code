import type { CustomizationSlotDefinition, CustomizationState } from './CustomizationTypes';

const PAINT_COLORS: [string, number][] = [
  ['Arctic White', 0xe9f3ff], ['Jet Black', 0x111111], ['Racing Red', 0xff5f6d],
  ['Solar Gold', 0xffc371], ['Volt Green', 0x38ef7d], ['Ocean Blue', 0x4facfe],
  ['Neon Cyan', 0x7fdcff], ['Blood Orange', 0xff7a2e], ['Royal Purple', 0x8a4fff],
  ['Chrome Silver', 0xc9d3de],
];

const DECAL_STYLES: [string, number][] = [
  ['None', 0x000000], ['Racing Stripes', 0xffffff], ['Flame Kit', 0xff7a2e],
  ['Tribal', 0x4facfe], ['Camo', 0x556b45], ['Checkerboard', 0x111111],
];

const NEON_COLORS: [string, number][] = [
  ['Off', 0x000000], ['Cyan', 0x7fdcff], ['Magenta', 0xff5f9d], ['Lime', 0x38ef7d], ['Amber', 0xffc371],
];

const NO_COLOR_LABELS = new Set(['None', 'Off']);

function colorOptions(list: [string, number][], priceStep = 400): { id: string; label: string; color?: number; price: number; unlockLevel?: number }[] {
  return list.map(([label, color], i) => ({
    id: label.toLowerCase().replace(/\s+/g, '_'),
    label,
    color: NO_COLOR_LABELS.has(label) ? undefined : color,
    price: i === 0 ? 0 : priceStep * i,
    unlockLevel: i > 6 ? Math.min(60, i * 5) : undefined,
  }));
}

export const CUSTOMIZATION_DATA: CustomizationSlotDefinition[] = [
  { slot: 'paint', label: 'Paint Color', options: colorOptions(PAINT_COLORS, 300) },
  { slot: 'decal', label: 'Decals', options: colorOptions(DECAL_STYLES, 500) },
  {
    slot: 'wheels', label: 'Wheels',
    options: ['Stock', 'Sport Alloy', 'Deep Dish', 'Drift Spec', 'Off-Road', 'Forged Carbon'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: i === 0 ? 0 : 600 * i,
    })),
  },
  {
    slot: 'spoiler', label: 'Spoiler',
    options: ['None', 'Lip Spoiler', 'Sport Wing', 'GT Wing', 'Drift Wing'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: i === 0 ? 0 : 700 * i,
    })),
  },
  {
    slot: 'hood', label: 'Hood',
    options: ['Stock', 'Vented', 'Carbon Cowl', 'Scooped'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: i === 0 ? 0 : 500 * i,
    })),
  },
  {
    slot: 'bodyKit', label: 'Body Kit',
    options: ['Stock', 'Street', 'Track', 'Widebody'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: i === 0 ? 0 : 1200 * i,
    })),
  },
  {
    slot: 'windowTint', label: 'Window Tint',
    options: ['Clear', 'Light', 'Medium', 'Limo Black'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: i === 0 ? 0 : 250 * i,
    })),
  },
  { slot: 'neon', label: 'Neon Lights', options: colorOptions(NEON_COLORS, 450) },
  { slot: 'underglow', label: 'Underglow', options: colorOptions(NEON_COLORS, 450) },
  {
    slot: 'exhaust', label: 'Exhaust',
    options: ['Stock', 'Sport Dual', 'Titanium Tip', 'Race Straight-Pipe'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: i === 0 ? 0 : 350 * i,
    })),
  },
  {
    slot: 'plate', label: 'License Plate',
    options: ['VELOCITY', 'RUSH-01', 'DRIFT-KG', 'NIGHT-RCR', 'BLANK'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: 0,
    })),
  },
  {
    slot: 'suspensionHeight', label: 'Suspension Height',
    options: ['Stock', 'Lowered', 'Slammed', 'Lifted'].map((label, i) => ({
      id: label.toLowerCase().replace(/\s+/g, '_'), label, price: i === 0 ? 0 : 300 * i,
    })),
  },
];

export function getSlotDefinition(slot: string): CustomizationSlotDefinition | undefined {
  return CUSTOMIZATION_DATA.find((s) => s.slot === slot);
}

export function createDefaultCustomization(): CustomizationState {
  const state = {} as CustomizationState;
  for (const def of CUSTOMIZATION_DATA) {
    state[def.slot] = def.options[0].id;
  }
  return state;
}
