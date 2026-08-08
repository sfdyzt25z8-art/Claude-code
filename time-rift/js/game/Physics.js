// Shared physics constants and AABB collision helpers used by every moving entity
// (Player, Clone, Enemy) so live play and clone playback run through identical code.
(function (global) {
  'use strict';

  var Physics = {
    GRAVITY: 2000,
    MAX_FALL_SPEED: 1100,
    MOVE_SPEED: 230,
    JUMP_VELOCITY: -680,
    FIXED_DT: 1 / 60
  };

  Physics.rectsOverlap = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  // Resolves collisions along a single axis against a list of solid rects.
  // Returns { collided, landedOn } where landedOn is the platform stood on (y-axis, moving down).
  Physics.resolveAxis = function (entity, solids, axis, delta) {
    var result = { collided: false, landedOn: null };
    if (delta === 0) return result;

    if (axis === 'x') entity.x += delta;
    else entity.y += delta;

    for (var i = 0; i < solids.length; i++) {
      var s = solids[i];
      if (!Physics.rectsOverlap(entity, s)) continue;

      if (axis === 'x') {
        if (delta > 0) entity.x = s.x - entity.w;
        else entity.x = s.x + s.w;
        entity.vx = 0;
        result.collided = true;
      } else {
        if (delta > 0) {
          entity.y = s.y - entity.h;
          result.landedOn = s;
        } else {
          entity.y = s.y + s.h;
        }
        entity.vy = 0;
        result.collided = true;
      }
    }
    return result;
  };

  global.Physics = Physics;
})(window);
