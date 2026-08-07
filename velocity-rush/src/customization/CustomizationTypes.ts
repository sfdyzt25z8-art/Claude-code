export type CustomizationSlot =
  | 'paint'
  | 'decal'
  | 'wheels'
  | 'spoiler'
  | 'hood'
  | 'bodyKit'
  | 'windowTint'
  | 'neon'
  | 'underglow'
  | 'exhaust'
  | 'plate'
  | 'suspensionHeight';

export interface CustomizationOption {
  id: string;
  label: string;
  /** hex color if this option represents a color swatch (paint/decal/neon/underglow/tint) */
  color?: number;
  /** unlock cost in coins, 0 = free/default */
  price: number;
  unlockLevel?: number;
}

export interface CustomizationSlotDefinition {
  slot: CustomizationSlot;
  label: string;
  options: CustomizationOption[];
}

export type CustomizationState = Record<CustomizationSlot, string>; // slot -> selected option id

export interface LicensePlateState {
  text: string;
}
