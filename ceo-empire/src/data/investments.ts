import type { InvestmentAsset } from '@/types/game';
import { BUSINESS_TEMPLATES } from '@/data/businesses';

const HAND_AUTHORED_ASSETS: InvestmentAsset[] = [
  // Stocks — medium volatility, modest steady drift
  {
    id: 'vtx',
    name: 'Vertex Dynamics',
    symbol: 'VTX',
    category: 'stock',
    basePrice: 42,
    volatility: 0.02,
    drift: 0.004,
    icon: 'LineChart',
  },
  {
    id: 'nmb',
    name: 'Nimbus Cloud',
    symbol: 'NMB',
    category: 'stock',
    basePrice: 128,
    volatility: 0.025,
    drift: 0.006,
    icon: 'Cloud',
  },
  {
    id: 'orb',
    name: 'Orbital Foods',
    symbol: 'ORB',
    category: 'stock',
    basePrice: 18,
    volatility: 0.015,
    drift: 0.003,
    icon: 'Wheat',
  },
  {
    id: 'nike',
    name: 'Nike',
    symbol: 'NKE',
    category: 'stock',
    basePrice: 95,
    volatility: 0.018,
    drift: 0.0045,
    icon: 'Footprints',
  },
  {
    id: 'adidas',
    name: 'Adidas',
    symbol: 'ADS',
    category: 'stock',
    basePrice: 78,
    volatility: 0.019,
    drift: 0.004,
    icon: 'Footprints',
  },
  // Real estate — low volatility, slow steady drift
  {
    id: 'downtown_loft',
    name: 'Downtown Loft',
    symbol: 'RE-DTL',
    category: 'real_estate',
    basePrice: 2200,
    volatility: 0.006,
    drift: 0.0035,
    icon: 'Building2',
  },
  {
    id: 'suburban_complex',
    name: 'Suburban Complex',
    symbol: 'RE-SUB',
    category: 'real_estate',
    basePrice: 5400,
    volatility: 0.005,
    drift: 0.003,
    icon: 'Home',
  },
  {
    id: 'industrial_park',
    name: 'Industrial Park',
    symbol: 'RE-IND',
    category: 'real_estate',
    basePrice: 12000,
    volatility: 0.004,
    drift: 0.0028,
    icon: 'Warehouse',
  },
  {
    id: 'housing_market',
    name: 'Housing Market Index',
    symbol: 'HOUSE',
    category: 'real_estate',
    basePrice: 850,
    volatility: 0.007,
    drift: 0.0032,
    icon: 'Landmark',
  },
  // Commodities — low-to-medium volatility, slow steady drift
  {
    id: 'gold',
    name: 'Gold',
    symbol: 'GOLD',
    category: 'commodity',
    basePrice: 260,
    volatility: 0.008,
    drift: 0.0025,
    icon: 'Gem',
  },
  // Crypto — high volatility, wildly variable
  {
    id: 'bitcore',
    name: 'BitCore',
    symbol: 'BTC',
    category: 'crypto',
    basePrice: 340,
    volatility: 0.04,
    drift: 0.005,
    icon: 'Bitcoin',
  },
  {
    id: 'etherlink',
    name: 'EtherLink',
    symbol: 'ETL',
    category: 'crypto',
    basePrice: 96,
    volatility: 0.045,
    drift: 0.0045,
    icon: 'Hexagon',
  },
  {
    id: 'moonpup',
    name: 'MoonPup',
    symbol: 'MOON',
    category: 'crypto',
    basePrice: 0.4,
    volatility: 0.065,
    drift: 0.002,
    icon: 'Rocket',
  },
  // Startups — high risk, high potential reward
  {
    id: 'neuralbyte',
    name: 'NeuralByte AI',
    symbol: 'NBYT',
    category: 'startup',
    basePrice: 60,
    volatility: 0.05,
    drift: 0.012,
    icon: 'BrainCircuit',
  },
  {
    id: 'greenvolt',
    name: 'GreenVolt Energy',
    symbol: 'GVLT',
    category: 'startup',
    basePrice: 34,
    volatility: 0.045,
    drift: 0.009,
    icon: 'Zap',
  },
];

const BUSINESS_STOCK_SYMBOLS: Record<string, string> = {
  lemonade_stand: 'LEMN',
  coffee_shop: 'BREW',
  bakery: 'BAKE',
  clothing_store: 'THRD',
  restaurant: 'DINE',
  tech_startup: 'TECH',
  game_studio: 'GAME',
  software_company: 'SOFT',
  airline: 'FLY',
  car_company: 'AUTO',
};

/**
 * A steady, low-volatility "public stock" for every business tier, so players can invest
 * in businesses (including ones they don't personally operate) the same way they would
 * a real company. Price scales with the business's real-world cost tier.
 */
const BUSINESS_STOCK_ASSETS: InvestmentAsset[] = BUSINESS_TEMPLATES.map((template) => ({
  id: `stock_${template.id}`,
  name: `${template.name} Inc.`,
  symbol: BUSINESS_STOCK_SYMBOLS[template.id] ?? template.id.slice(0, 4).toUpperCase(),
  category: 'business',
  basePrice: Math.max(1, Math.round(template.baseCost / 50)),
  volatility: 0.009,
  drift: 0.0035,
  icon: template.icon,
}));

export const INVESTMENT_ASSETS: InvestmentAsset[] = [
  ...HAND_AUTHORED_ASSETS,
  ...BUSINESS_STOCK_ASSETS,
];

export function getInvestmentAsset(id: string): InvestmentAsset | undefined {
  return INVESTMENT_ASSETS.find((a) => a.id === id);
}
