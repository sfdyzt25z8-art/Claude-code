import type { LifestyleCategory, LifestyleItem } from '@/types/game';

export const LIFESTYLE_ITEMS: LifestyleItem[] = [
  // Clothing
  {
    id: 'designer_suit',
    name: 'Designer Suit',
    category: 'clothing',
    icon: 'Shirt',
    description: 'A tailored suit that turns heads in the boardroom.',
    cost: 800,
    reputationBoost: 1,
  },
  {
    id: 'luxury_handbag',
    name: 'Luxury Handbag',
    category: 'clothing',
    icon: 'ShoppingBag',
    description: 'Hand-stitched leather, waitlist-only.',
    cost: 3500,
    reputationBoost: 2,
  },
  {
    id: 'couture_wardrobe',
    name: 'Couture Wardrobe',
    category: 'clothing',
    icon: 'Shirt',
    description: 'A full season of runway looks, custom-fitted.',
    cost: 25000,
    reputationBoost: 4,
  },
  // Accessories & jewelry
  {
    id: 'gold_watch',
    name: 'Gold Watch',
    category: 'accessories',
    icon: 'Watch',
    description: 'Solid gold, keeps perfect time.',
    cost: 6000,
    reputationBoost: 2,
  },
  {
    id: 'diamond_cufflinks',
    name: 'Diamond Cufflinks',
    category: 'accessories',
    icon: 'Gem',
    description: 'A subtle flex for every handshake.',
    cost: 4200,
    reputationBoost: 2,
  },
  {
    id: 'diamond_necklace',
    name: 'Diamond Necklace',
    category: 'jewelry',
    icon: 'Gem',
    description: 'Cut, polished, and impossible to ignore.',
    cost: 45000,
    reputationBoost: 5,
  },
  {
    id: 'gold_bullion',
    name: 'Gold Bullion Bar',
    category: 'jewelry',
    icon: 'Coins',
    description: 'A physical bar of gold for the vault, just because.',
    cost: 15000,
    reputationBoost: 3,
  },
  // Land
  {
    id: 'countryside_estate',
    name: 'Countryside Estate',
    category: 'land',
    icon: 'Landmark',
    description: 'Acres of rolling land and a private drive.',
    cost: 400000,
    reputationBoost: 8,
  },
  {
    id: 'private_island_plot',
    name: 'Private Island Plot',
    category: 'land',
    icon: 'Landmark',
    description: 'Your own patch of coastline, deed in hand.',
    cost: 2500000,
    reputationBoost: 15,
  },
  // Vehicles
  {
    id: 'sports_car',
    name: 'Sports Car',
    category: 'vehicles',
    icon: 'Car',
    description: 'Zero to sixty before your coffee cools.',
    cost: 180000,
    reputationBoost: 6,
  },
  {
    id: 'private_jet',
    name: 'Private Jet',
    category: 'vehicles',
    icon: 'Plane',
    description: 'Skip the lines. Skip everything, really.',
    cost: 8000000,
    reputationBoost: 20,
  },
];

export const LIFESTYLE_CATEGORY_LABELS: Record<LifestyleCategory, string> = {
  clothing: 'Clothing',
  accessories: 'Accessories',
  jewelry: 'Jewelry',
  land: 'Land',
  vehicles: 'Vehicles',
};

export function getLifestyleItem(id: string): LifestyleItem | undefined {
  return LIFESTYLE_ITEMS.find((i) => i.id === id);
}
