import type { ThemePalette, TrackTheme, ObstacleType } from './TrackTypes';

export const THEME_PALETTES: Record<TrackTheme, ThemePalette> = {
  city: {
    surface: 0x2b2f3a, surfaceLine: 0xdedede, offTrack: 0x3c4a3c, offTrackDetail: 0x2e3a2e,
    decorationPrimary: 0x556074, decorationSecondary: 0xffc371,
    skyTop: 0x3a5a8c, skyBottom: 0x8fb3d9, fogColor: 0x9fb6cc,
  },
  desert: {
    surface: 0x4a4238, surfaceLine: 0xf0e2b6, offTrack: 0xd9b56a, offTrackDetail: 0xc79f4f,
    decorationPrimary: 0xb98546, decorationSecondary: 0x7fa8a1,
    skyTop: 0xff9a5a, skyBottom: 0xffd28c, fogColor: 0xf5c98a,
  },
  forest: {
    surface: 0x3a362f, surfaceLine: 0xe8dcb8, offTrack: 0x2d4a2a, offTrackDetail: 0x24391f,
    decorationPrimary: 0x2f5c33, decorationSecondary: 0x6b4226,
    skyTop: 0x3f6e57, skyBottom: 0x9fd6a6, fogColor: 0xbcd9bc,
  },
  mountains: {
    surface: 0x454a52, surfaceLine: 0xe9f3ff, offTrack: 0x5b6470, offTrackDetail: 0x475059,
    decorationPrimary: 0x8fa0c8, decorationSecondary: 0xe9f3ff,
    skyTop: 0x2a4570, skyBottom: 0x7fa8d9, fogColor: 0xc9dcf0,
  },
  beach: {
    surface: 0x50494a, surfaceLine: 0xf0f0e0, offTrack: 0xe8d29a, offTrackDetail: 0xd4bb78,
    decorationPrimary: 0x2f9e8f, decorationSecondary: 0xffc371,
    skyTop: 0x4fc3e8, skyBottom: 0xbdeaf5, fogColor: 0xd8f3fa,
  },
  snow: {
    surface: 0x565c66, surfaceLine: 0x2b2f3a, offTrack: 0xeef4fb, offTrackDetail: 0xd7e4f2,
    decorationPrimary: 0x3a6ea5, decorationSecondary: 0xe9f3ff,
    skyTop: 0x39456b, skyBottom: 0x9fb6d9, fogColor: 0xeaf2fb,
  },
  volcano: {
    surface: 0x2a1f1f, surfaceLine: 0xff9a3c, offTrack: 0x1c1414, offTrackDetail: 0x120d0d,
    decorationPrimary: 0x612424, decorationSecondary: 0xff5f2e,
    skyTop: 0x2a0e0e, skyBottom: 0x7a2416, fogColor: 0xaa4b2a,
  },
  nightcity: {
    surface: 0x14162a, surfaceLine: 0x7fdcff, offTrack: 0x0c0e1c, offTrackDetail: 0x090a15,
    decorationPrimary: 0x2a2f5c, decorationSecondary: 0xff5f9d,
    skyTop: 0x05061a, skyBottom: 0x181a3a, fogColor: 0x2a2f5c,
  },
  highway: {
    surface: 0x33363f, surfaceLine: 0xf5f5f5, offTrack: 0x4a5240, offTrackDetail: 0x3a4032,
    decorationPrimary: 0x6a7280, decorationSecondary: 0xffc371,
    skyTop: 0x4d6f9c, skyBottom: 0x9fc3e0, fogColor: 0xb9d3e8,
  },
  industrial: {
    surface: 0x3a3a3a, surfaceLine: 0xffc371, offTrack: 0x4a4438, offTrackDetail: 0x37332a,
    decorationPrimary: 0x60594f, decorationSecondary: 0xff5f6d,
    skyTop: 0x4a4a52, skyBottom: 0x8a8a90, fogColor: 0x9a9498,
  },
  canyon: {
    surface: 0x4a3a2e, surfaceLine: 0xf0dcb0, offTrack: 0x8a5a3a, offTrackDetail: 0x714828,
    decorationPrimary: 0xa8623a, decorationSecondary: 0xe8955a,
    skyTop: 0xd9713a, skyBottom: 0xf5c17a, fogColor: 0xeeb87e,
  },
  harbor: {
    surface: 0x3a4048, surfaceLine: 0xe9f3ff, offTrack: 0x2f5f66, offTrackDetail: 0x244a50,
    decorationPrimary: 0x3a6b74, decorationSecondary: 0xffc371,
    skyTop: 0x365a7a, skyBottom: 0x8bb6cc, fogColor: 0xb9d3dc,
  },
  airport: {
    surface: 0x3e4148, surfaceLine: 0xfafafa, offTrack: 0x4a5045, offTrackDetail: 0x393f35,
    decorationPrimary: 0x5f6670, decorationSecondary: 0x4facfe,
    skyTop: 0x5a7ba0, skyBottom: 0xb3d3e8, fogColor: 0xcfe4f0,
  },
  stadium: {
    surface: 0x2f3140, surfaceLine: 0xffffff, offTrack: 0x2a4a2f, offTrackDetail: 0x213a24,
    decorationPrimary: 0x4a4f6a, decorationSecondary: 0xffc371,
    skyTop: 0x191c30, skyBottom: 0x3a3f5c, fogColor: 0x4a4f6a,
  },
  countryside: {
    surface: 0x463f37, surfaceLine: 0xe8dcb8, offTrack: 0x6a9143, offTrackDetail: 0x557635,
    decorationPrimary: 0x7a5a3a, decorationSecondary: 0xdec25a,
    skyTop: 0x6ba0d9, skyBottom: 0xbfe0f0, fogColor: 0xd6ecf5,
  },
  f1street: {
    surface: 0x24262e, surfaceLine: 0xffffff, offTrack: 0xb9bec4, offTrackDetail: 0x9aa0a8,
    decorationPrimary: 0xc9303b, decorationSecondary: 0x2b2f3a,
    skyTop: 0x3a6fa8, skyBottom: 0x9fc7e0, fogColor: 0xc3dceb,
  },
  f1speed: {
    surface: 0x2a2c33, surfaceLine: 0xff2d2d, offTrack: 0x4a7a3a, offTrackDetail: 0x3a6430,
    decorationPrimary: 0xe9f3ff, decorationSecondary: 0xff2d2d,
    skyTop: 0x2f5a9c, skyBottom: 0x8fbde8, fogColor: 0xbcd8ee,
  },
};

export const THEME_OBSTACLES: Record<TrackTheme, ObstacleType[]> = {
  city: ['cone', 'barrier', 'crate', 'signpost'],
  desert: ['rock', 'barrel', 'signpost'],
  forest: ['tree', 'rock', 'crate'],
  mountains: ['rock', 'barrier', 'signpost'],
  beach: ['barrel', 'crate', 'puddle'],
  snow: ['puddle', 'barrier', 'signpost'],
  volcano: ['rock', 'barrel', 'crate'],
  nightcity: ['cone', 'barrier', 'signpost'],
  highway: ['barrier', 'cone', 'crate'],
  industrial: ['crate', 'barrel', 'barrier'],
  canyon: ['rock', 'signpost'],
  harbor: ['crate', 'barrel', 'puddle'],
  airport: ['cone', 'barrier', 'signpost'],
  stadium: ['cone', 'barrier'],
  countryside: ['tree', 'rock', 'signpost'],
  f1street: ['barrier', 'signpost'],
  f1speed: ['barrier', 'cone'],
};
