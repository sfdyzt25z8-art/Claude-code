// A time clone: a past run replayed input-for-input through the same physics as the
// live Player. It is immune to damage and hazards (a ghost of a moment already survived)
// but its attacks still land on enemies, and it still trips switches just by standing on them.
(function (global) {
  'use strict';

  var ATTACK_DURATION = 0.22;
  var ATTACK_ACTIVE_WINDOW = [0.05, 0.16];
  var ATTACK_RANGE = 30;
  var ATTACK_DAMAGE = 25;

  class Clone extends Entity {
    constructor(x, y, frames, index) {
      super(x, y, 26, 42);
      this.frames = frames;
      this.tickIndex = 0;
      this.attackTimer = 0;
      this.attackActive = false;
      this.hasHitThisAttack = false;
      this.finished = false;
      this.spawnX = x;
      this.spawnY = y;
      this.index = index || 0;
    }

    update(dt, game) {
      var level = game.level;
      var frame = this.tickIndex < this.frames.length ? this.frames[this.tickIndex] : 0;
      this.tickIndex++;
      if (this.tickIndex >= this.frames.length) this.finished = true;

      var left = !!(frame & 1);
      var right = !!(frame & 2);
      var jump = !!(frame & 4);
      var attack = !!(frame & 8);
      var interact = !!(frame & 16);

      var desiredVx = 0;
      if (left && !right) desiredVx = -Physics.MOVE_SPEED;
      else if (right && !left) desiredVx = Physics.MOVE_SPEED;

      this.physicsStep(dt, level, desiredVx, jump);

      if (attack && this.attackTimer <= 0) {
        this.attackTimer = ATTACK_DURATION;
        this.hasHitThisAttack = false;
      }
      if (this.attackTimer > 0) {
        this.attackTimer -= dt;
        var elapsed = ATTACK_DURATION - this.attackTimer;
        this.attackActive = elapsed >= ATTACK_ACTIVE_WINDOW[0] && elapsed <= ATTACK_ACTIVE_WINDOW[1];
        if (this.attackActive && !this.hasHitThisAttack) {
          this.performAttackHit(game);
        }
      } else {
        this.attackActive = false;
      }

      if (interact) {
        level.tryInteract(this);
      }
    }

    performAttackHit(game) {
      var range = ATTACK_RANGE;
      var hitbox = {
        x: this.facing === 1 ? this.x + this.w : this.x - range,
        y: this.y + 6,
        w: range,
        h: this.h - 16
      };
      var hitAny = false;
      game.level.enemies.forEach(function (enemy) {
        if (!enemy.alive) return;
        if (Physics.rectsOverlap(hitbox, enemy.getRect())) {
          enemy.takeDamage(ATTACK_DAMAGE, game);
          hitAny = true;
        }
      });
      if (hitAny) this.hasHitThisAttack = true;
    }

    resetPlayback() {
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.vx = 0; this.vy = 0;
      this.onGround = false;
      this.groundPlatform = null;
      this.tickIndex = 0;
      this.finished = false;
      this.attackTimer = 0;
      this.attackActive = false;
    }

    render(ctx, camera) {
      var hue = 190 + (this.index * 35) % 140;
      drawHumanoid(ctx, this, camera, {
        color: 'hsla(' + hue + ', 90%, 65%, 0.38)',
        glow: 'hsl(' + hue + ', 90%, 60%)',
        alpha: 0.55,
        shadowBlur: 14
      });
    }
  }

  global.Clone = Clone;
})(window);
