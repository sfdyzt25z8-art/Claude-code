// Data-driven level definitions. Each level is plain geometry + object placement — the
// Level class (game/Level.js) turns this into a live, simulated level. Keeping levels as
// data (rather than 10 separate classes) keeps new-level authoring to "add an entry here".
(function (global) {
  'use strict';

  var GY = 500; // ground top (y coordinate of the floor surface)
  var W = 960, H = 540;
  var WW = 1600; // wide levels (8, 10) that use camera scroll

  // Ceiling + left/right boundary walls. Floors are defined per-level as platforms so
  // levels can freely include pits/gaps in the ground.
  function boundary(width) {
    return [
      { x: 0, y: -20, w: width, h: 20 },
      { x: -20, y: -20, w: 20, h: 2000 },
      { x: width, y: -20, w: 20, h: 2000 }
    ];
  }

  function floor(x, w) {
    return { x: x, y: GY, w: w, h: 140 };
  }

  var LEVELS = [

    // ---------------------------------------------------------------- Level 1: The Beginning
    {
      id: 1, name: 'The Beginning', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(W),
      platforms: [
        floor(0, 300),
        floor(420, W - 420)
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 2: The Button
    {
      id: 2, name: 'The Button', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(W),
      platforms: [floor(0, W)],
      switches: [
        { id: 'sw1', x: 140, y: GY - 16, w: 60, h: 16 }
      ],
      doors: [
        { id: 'door1', x: 620, y: GY - 120, w: 30, h: 120, switchIds: ['sw1'] }
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 3: Two Doors
    {
      id: 3, name: 'Two Doors', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(W),
      platforms: [floor(0, W)],
      switches: [
        { id: 'swA', x: 120, y: GY - 16, w: 56, h: 16 },
        { id: 'swB', x: 420, y: GY - 16, w: 56, h: 16 }
      ],
      doors: [
        { id: 'doorA', x: 320, y: GY - 120, w: 30, h: 120, switchIds: ['swA'] },
        { id: 'doorB', x: 620, y: GY - 120, w: 30, h: 120, switchIds: ['swB'] }
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 4: Laser Room
    {
      id: 4, name: 'Laser Room', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(W),
      platforms: [floor(0, W)],
      hazards: [
        { x: 260, y: GY - 200, w: 18, h: 200, mode: 'blink', onTime: 1.1, offTime: 1.1, phase: 0, damage: 34 },
        { x: 460, y: GY - 200, w: 18, h: 200, mode: 'blink', onTime: 1.1, offTime: 1.1, phase: 0.55, damage: 34 },
        { x: 660, y: GY - 200, w: 18, h: 200, mode: 'blink', onTime: 1.1, offTime: 1.1, phase: 0, damage: 34 }
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 5: Moving Platforms
    {
      id: 5, name: 'Moving Platforms', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(W),
      platforms: [
        floor(0, 220),
        floor(W - 140, 140),
        { x: 260, y: GY - 40, w: 90, h: 20, moving: true, axis: 'x', range: 90, speed: 1.1 },
        { x: 520, y: GY - 110, w: 90, h: 20, moving: true, axis: 'y', range: 70, speed: 1.4 },
        { x: 760, y: GY - 40, w: 90, h: 20, moving: true, axis: 'x', range: 60, speed: 1.6 }
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 6: Combat
    {
      id: 6, name: 'Combat', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(W),
      platforms: [floor(0, W)],
      enemies: [
        { type: 'walker', x: 340, y: GY - 34, patrolMinX: 300, patrolMaxX: 480 },
        { type: 'chaser', x: 650, y: GY - 30, patrolMinX: 600, patrolMaxX: 760 }
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 7: Clone Combat
    {
      id: 7, name: 'Clone Combat', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(W),
      platforms: [floor(0, W)],
      enemies: [
        { type: 'guardian', x: 380, y: GY - 46, patrolMinX: 380, patrolMaxX: 380 }
      ],
      switches: [
        { id: 'sw1', x: 430, y: GY - 16, w: 60, h: 16 }
      ],
      doors: [
        { id: 'door1', x: 700, y: GY - 120, w: 30, h: 120, switchIds: ['sw1'] }
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 8: Multiple Paths
    {
      id: 8, name: 'Multiple Paths', width: WW, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(WW),
      platforms: [
        floor(0, WW),
        { x: 500, y: GY - 130, w: 140, h: 20 },
        { x: 900, y: GY - 200, w: 140, h: 20 }
      ],
      switches: [
        { id: 'swLow', x: 260, y: GY - 16, w: 56, h: 16 },
        { id: 'swMid', x: 540, y: GY - 146, w: 56, h: 16 },
        { id: 'swHigh', x: 940, y: GY - 216, w: 56, h: 16 }
      ],
      doors: [
        { id: 'gate1', x: 760, y: GY - 120, w: 30, h: 120, switchIds: ['swLow', 'swMid'], requireAll: true },
        { id: 'gate2', x: 1360, y: GY - 120, w: 30, h: 120, switchIds: ['swHigh'], requireAll: true }
      ],
      enemies: [
        { type: 'chaser', x: 1100, y: GY - 30, patrolMinX: 1040, patrolMaxX: 1300 }
      ],
      crystals: [
        { x: 1200, y: GY - 60 }
      ],
      portal: { x: WW - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 9: Time Collapse
    {
      id: 9, name: 'Time Collapse', width: W, height: H,
      spawn: { x: 40, y: GY - 42 },
      maxResets: 5,
      walls: boundary(W),
      platforms: [
        floor(0, W),
        { x: 300, y: GY - 60, w: 100, h: 20, moving: true, axis: 'y', range: 50, speed: 1.6 },
        { x: 560, y: GY - 60, w: 100, h: 20, moving: true, axis: 'y', range: 50, speed: 2.0 }
      ],
      hazards: [
        { x: 0, y: GY - 260, w: 40, h: 40, mode: 'move', axis: 'x', range: 400, speed: 1.3, damage: 40 },
        { x: 760, y: GY - 200, w: 18, h: 200, mode: 'blink', onTime: 0.8, offTime: 0.8, damage: 40 }
      ],
      switches: [
        { id: 'sw1', x: 460, y: GY - 16, w: 56, h: 16 }
      ],
      doors: [
        { id: 'door1', x: 700, y: GY - 120, w: 30, h: 120, switchIds: ['sw1'] }
      ],
      barriers: [
        { x: 820, y: GY - 120, w: 26, h: 120, onTime: 1.2, offTime: 1.2, phase: 0.6 }
      ],
      portal: { x: W - 100, y: GY - 90, w: 56, h: 90 }
    },

    // ---------------------------------------------------------------- Level 10: The Rift
    {
      id: 10, name: 'The Rift', width: WW, height: H,
      spawn: { x: 40, y: GY - 42 },
      walls: boundary(WW),
      platforms: [
        floor(0, WW),
        { x: 420, y: GY - 50, w: 110, h: 20, moving: true, axis: 'x', range: 80, speed: 1.2 },
        { x: 780, y: GY - 140, w: 110, h: 20, moving: true, axis: 'y', range: 60, speed: 1.5 },
        { x: 1100, y: GY - 60, w: 120, h: 20 }
      ],
      hazards: [
        { x: 640, y: GY - 220, w: 18, h: 220, mode: 'blink', onTime: 1, offTime: 1, damage: 40 },
        { x: 960, y: GY - 220, w: 18, h: 220, mode: 'blink', onTime: 1, offTime: 1, phase: 0.5, damage: 40 }
      ],
      switches: [
        { id: 'swA', x: 240, y: GY - 16, w: 56, h: 16 },
        { id: 'swB', x: 1140, y: GY - 106, w: 56, h: 16 }
      ],
      doors: [
        { id: 'gateA', x: 340, y: GY - 120, w: 30, h: 120, switchIds: ['swA'] },
        { id: 'gateFinal', x: 1400, y: GY - 120, w: 30, h: 120, switchIds: ['swA', 'swB'], requireAll: true }
      ],
      barriers: [
        { x: 1310, y: GY - 120, w: 26, h: 120, onTime: 1, offTime: 1, phase: 0 }
      ],
      enemies: [
        { type: 'walker', x: 500, y: GY - 34, patrolMinX: 460, patrolMaxX: 620 },
        { type: 'guardian', x: 1250, y: GY - 46, patrolMinX: 1250, patrolMaxX: 1250 },
        { type: 'chaser', x: 1500, y: GY - 30, patrolMinX: 1420, patrolMaxX: 1560 }
      ],
      crystals: [
        { x: 900, y: GY - 60 }
      ],
      portal: { x: WW - 100, y: GY - 90, w: 56, h: 90 }
    }
  ];

  global.LEVELS = LEVELS;
})(window);
