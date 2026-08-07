// Three simple enemy archetypes, all sharing Entity physics so they respect gravity and
// platform collision like everything else. AI only ever reacts to the live Player, never
// to clones, keeping clone playback fully deterministic.
(function (global) {
  'use strict';

  var CONTACT_DAMAGE_COOLDOWN = 0.5;
  var DEATH_FADE = 0.45;

  var TYPE_DEFAULTS = {
    walker: { health: 40, damage: 12, speed: 70, color: '#ff9f4f', w: 28, h: 34 },
    chaser: { health: 30, damage: 15, speed: 130, color: '#ff4f7d', w: 26, h: 30, detectRadius: 220 },
    guardian: { health: 90, damage: 20, speed: 0, color: '#b45fff', w: 40, h: 46 }
  };

  class Enemy extends Entity {
    constructor(config) {
      var defaults = TYPE_DEFAULTS[config.type] || TYPE_DEFAULTS.walker;
      super(config.x, config.y, config.w || defaults.w, config.h || defaults.h);
      this.type = config.type;
      this.spawnX = config.x;
      this.spawnY = config.y;
      this.maxHealth = config.health || defaults.health;
      this.health = this.maxHealth;
      this.damage = config.damage || defaults.damage;
      this.speed = config.speed !== undefined ? config.speed : defaults.speed;
      this.color = config.color || defaults.color;
      this.detectRadius = config.detectRadius || defaults.detectRadius || 200;
      this.patrolMinX = config.patrolMinX !== undefined ? config.patrolMinX : this.x - 80;
      this.patrolMaxX = config.patrolMaxX !== undefined ? config.patrolMaxX : this.x + 80;
      this.alive = true;
      this.deathTimer = 0;
      this.contactCooldown = 0;
      this.hitFlash = 0;
      this._dir = 1;
    }

    reset() {
      this.x = this.spawnX;
      this.y = this.spawnY;
      this.vx = 0; this.vy = 0;
      this.onGround = false;
      this.groundPlatform = null;
      this.health = this.maxHealth;
      this.alive = true;
      this.deathTimer = 0;
      this.contactCooldown = 0;
      this.hitFlash = 0;
      this._dir = 1;
    }

    takeDamage(amount, game) {
      if (!this.alive) return;
      this.health -= amount;
      this.hitFlash = 0.15;
      Audio_.hit();
      if (this.health <= 0) {
        this.alive = false;
        this.deathTimer = DEATH_FADE;
        Audio_.enemyDeath();
        if (game) {
          game.particles.burst(this.x + this.w / 2, this.y + this.h / 2, 18, {
            color: this.color, life: 0.5, speed: 140, gravity: 200
          });
          game.onEnemyDefeated();
        }
      }
    }

    update(dt, game) {
      if (!this.alive) {
        this.deathTimer -= dt;
        return;
      }
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.contactCooldown > 0) this.contactCooldown -= dt;

      var player = game.player;
      var desiredVx = 0;

      if (this.type === 'walker') {
        if (this.x <= this.patrolMinX) this._dir = 1;
        else if (this.x + this.w >= this.patrolMaxX) this._dir = -1;
        desiredVx = this._dir * this.speed;
      } else if (this.type === 'chaser') {
        var dx = (player.x + player.w / 2) - (this.x + this.w / 2);
        var dist = Math.abs(dx);
        if (dist < this.detectRadius) {
          desiredVx = (dx > 0 ? 1 : -1) * this.speed;
        } else {
          if (this.x <= this.patrolMinX) this._dir = 1;
          else if (this.x + this.w >= this.patrolMaxX) this._dir = -1;
          desiredVx = this._dir * this.speed * 0.5;
        }
      } else if (this.type === 'guardian') {
        desiredVx = 0;
      }

      this.physicsStep(dt, game.level, desiredVx, false);

      if (player.alive && this.contactCooldown <= 0 && Physics.rectsOverlap(this.getRect(), player.getRect())) {
        player.takeDamage(this.damage);
        this.contactCooldown = CONTACT_DAMAGE_COOLDOWN;
      }
    }

    render(ctx, camera) {
      var sx = this.x - camera.x;
      var sy = this.y - camera.y;
      ctx.save();
      if (!this.alive) {
        ctx.globalAlpha = Math.max(0, this.deathTimer / DEATH_FADE);
      }
      ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(sx, sy, this.w, this.h);
      ctx.fillStyle = '#05060f';
      var eyeX = this._dir === 1 ? sx + this.w - 9 : sx + 4;
      ctx.fillRect(eyeX, sy + 7, 5, 4);
      ctx.restore();

      if (this.alive && this.health < this.maxHealth) {
        var barW = this.w;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(sx, sy - 8, barW, 4);
        ctx.fillStyle = '#ff4f7d';
        ctx.fillRect(sx, sy - 8, barW * Math.max(0, this.health / this.maxHealth), 4);
      }
    }
  }

  global.Enemy = Enemy;
})(window);
