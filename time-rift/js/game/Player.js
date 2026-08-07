// The live, player-controlled character. Every fixed tick it reads the current input
// snapshot, applies it to physics, and (while recording) appends the exact same snapshot
// to a frame buffer. That buffer is later handed to a Clone, which replays it through the
// identical physics code — so clones are genuine input-replays, not scripted animations.
(function (global) {
  'use strict';

  var ATTACK_DURATION = 0.22;
  var ATTACK_ACTIVE_WINDOW = [0.05, 0.16];
  var ATTACK_COOLDOWN = 0.28;
  var ATTACK_RANGE = 30;
  var ATTACK_DAMAGE = 25;
  var HURT_INVULN = 0.9;

  function encodeFrame(snap) {
    return (snap.left ? 1 : 0) | (snap.right ? 2 : 0) | (snap.jump ? 4 : 0) | (snap.attack ? 8 : 0) | (snap.interact ? 16 : 0);
  }

  // Shared humanoid renderer used by both Player and Clone so ghosts look like past selves.
  global.drawHumanoid = function (ctx, e, camera, opts) {
    opts = opts || {};
    var sx = e.x - camera.x;
    var sy = e.y - camera.y;
    var alpha = opts.alpha !== undefined ? opts.alpha : 1;
    var bodyColor = opts.color || '#4fd6ff';
    var glow = opts.glow || bodyColor;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = glow;
    ctx.shadowBlur = opts.shadowBlur !== undefined ? opts.shadowBlur : 10;

    ctx.fillStyle = bodyColor;
    ctx.fillRect(sx, sy, e.w, e.h);

    // Visor / eye indicating facing direction.
    ctx.fillStyle = opts.eyeColor || '#05060f';
    var eyeX = e.facing === 1 ? sx + e.w - 8 : sx + 3;
    ctx.fillRect(eyeX, sy + 8, 5, 4);

    if (e.attackActive) {
      ctx.fillStyle = opts.attackColor || 'rgba(255, 47, 214, 0.75)';
      var ax = e.facing === 1 ? sx + e.w : sx - ATTACK_RANGE;
      ctx.shadowBlur = 14;
      ctx.fillRect(ax, sy + 6, ATTACK_RANGE, e.h - 16);
    }

    ctx.restore();
  };

  class Player extends Entity {
    constructor(x, y) {
      super(x, y, 26, 42);
      this.maxHealth = 100;
      this.health = this.maxHealth;
      this.attackTimer = 0;
      this.attackCooldownTimer = 0;
      this.attackActive = false;
      this.invulnTimer = 0;
      this.recordedFrames = [];
      this.recording = true;
      this.hasHitThisAttack = false;
    }

    reset(x, y) {
      this.x = x; this.y = y;
      this.vx = 0; this.vy = 0;
      this.onGround = false;
      this.groundPlatform = null;
      this.facing = 1;
      this.health = this.maxHealth;
      this.attackTimer = 0;
      this.attackCooldownTimer = 0;
      this.attackActive = false;
      this.invulnTimer = 0;
      this.recordedFrames = [];
      this.recording = true;
      this.alive = true;
    }

    takeDamage(amount) {
      if (this.invulnTimer > 0 || !this.alive) return;
      this.health = Math.max(0, this.health - amount);
      this.invulnTimer = HURT_INVULN;
      Audio_.playerHurt();
      if (this.health <= 0) {
        this.alive = false;
      }
    }

    heal(amount) {
      this.health = Math.min(this.maxHealth, this.health + amount);
    }

    update(dt, game) {
      var level = game.level;
      var snap = Input.tickSnapshot();

      if (this.recording) this.recordedFrames.push(encodeFrame(snap));

      var desiredVx = 0;
      if (snap.left && !snap.right) desiredVx = -Physics.MOVE_SPEED;
      else if (snap.right && !snap.left) desiredVx = Physics.MOVE_SPEED;

      this.physicsStep(dt, level, desiredVx, snap.jump);

      if (snap.jump && this.vy === Physics.JUMP_VELOCITY) Audio_.jump();

      if (this.attackCooldownTimer > 0) this.attackCooldownTimer -= dt;
      if (snap.attack && this.attackCooldownTimer <= 0) {
        this.attackTimer = ATTACK_DURATION;
        this.attackCooldownTimer = ATTACK_COOLDOWN;
        this.hasHitThisAttack = false;
        Audio_.attack();
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

      if (snap.interact) {
        level.tryInteract(this);
      }

      if (this.invulnTimer > 0) this.invulnTimer -= dt;

      if (this.y > level.height + 200) {
        this.alive = false;
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

    render(ctx, camera) {
      var flashing = this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0;
      drawHumanoid(ctx, this, camera, {
        color: flashing ? '#ff8fae' : '#4fd6ff',
        glow: '#00e5ff',
        alpha: 1
      });
    }
  }

  global.Player = Player;
})(window);
