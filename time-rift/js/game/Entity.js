// Base class for anything that moves through level geometry: Player, Clone, Enemy.
// Encapsulates gravity, horizontal/vertical AABB resolution, and moving-platform carrying
// so all three subclasses share exactly one physics implementation.
(function (global) {
  'use strict';

  function Entity(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.facing = 1;
    this.groundPlatform = null;
    this.alive = true;
  }

  Entity.prototype.getRect = function () {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  };

  // Advances physics by one fixed tick. `desiredVx` is the horizontal speed this tick wants
  // (already signed); `wantJump` triggers a jump if grounded.
  Entity.prototype.physicsStep = function (dt, level, desiredVx, wantJump) {
    // Carry along a moving platform we're standing on.
    if (this.onGround && this.groundPlatform && this.groundPlatform.dx !== undefined) {
      this.x += this.groundPlatform.dx;
      this.y += this.groundPlatform.dy;
    }

    this.vx = desiredVx;
    if (desiredVx > 0) this.facing = 1;
    else if (desiredVx < 0) this.facing = -1;

    if (wantJump && this.onGround) {
      this.vy = Physics.JUMP_VELOCITY;
      this.onGround = false;
      this.groundPlatform = null;
    }

    var solids = level.getSolidRects();

    var rx = Physics.resolveAxis(this, solids, 'x', this.vx * dt);
    if (rx.collided) this.vx = 0;

    this.vy += Physics.GRAVITY * dt;
    if (this.vy > Physics.MAX_FALL_SPEED) this.vy = Physics.MAX_FALL_SPEED;

    var ry = Physics.resolveAxis(this, solids, 'y', this.vy * dt);
    if (ry.landedOn) {
      this.onGround = true;
      this.groundPlatform = ry.landedOn;
    } else if (ry.collided) {
      this.onGround = false;
      this.groundPlatform = null;
    } else {
      this.onGround = false;
      this.groundPlatform = null;
    }
  };

  global.Entity = Entity;
})(window);
