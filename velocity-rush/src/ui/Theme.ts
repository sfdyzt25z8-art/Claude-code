import { FONT_FAMILY } from '../utils/Constants';

export function hexToCss(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

export const FONT = {
  family: FONT_FAMILY,
  h1: { fontFamily: FONT_FAMILY, fontSize: '48px', fontStyle: '800', color: hexToCss(0xe9f3ff) },
  h2: { fontFamily: FONT_FAMILY, fontSize: '32px', fontStyle: '700', color: hexToCss(0xe9f3ff) },
  h3: { fontFamily: FONT_FAMILY, fontSize: '24px', fontStyle: '700', color: hexToCss(0xe9f3ff) },
  body: { fontFamily: FONT_FAMILY, fontSize: '18px', color: hexToCss(0xe9f3ff) },
  small: { fontFamily: FONT_FAMILY, fontSize: '14px', color: hexToCss(0x8fa0c8) },
  button: { fontFamily: FONT_FAMILY, fontSize: '20px', fontStyle: '700', color: hexToCss(0xe9f3ff) },
} as const;
