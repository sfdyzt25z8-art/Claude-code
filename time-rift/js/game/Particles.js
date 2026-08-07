// Lightweight pooled particle system. Particles are plain objects reused via a free list
// so bursts (attacks, deaths, portals) don't churn the garbage collector.
(function (global) {
  'use strict';

  var MAX_PARTICLES = 260;

  function ParticleSystem() {
    this.particles = [];
    for (var i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', gravity: 0, fade: true });
    }
  }

  ParticleSystem.prototype.particlesEnabled = function () {
    return SaveSystem.getSettings().particles !== false;
  };

  ParticleSystem.prototype.spawn = function (x, y, opts) {
    if (!this.particlesEnabled()) return;
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x; p.y = y;
        p.vx = opts.vx !== undefined ? opts.vx : (Math.random() - 0.5) * 120;
        p.vy = opts.vy !== undefined ? opts.vy : (Math.random() - 0.5) * 120;
        p.life = 0;
        p.maxLife = opts.life || 0.6;
        p.size = opts.size || 3;
        p.color = opts.color || '#00e5ff';
        p.gravity = opts.gravity !== undefined ? opts.gravity : 0;
        p.fade = opts.fade !== false;
        return p;
      }
    }
    return null;
  };

  ParticleSystem.prototype.burst = function (x, y, count, opts) {
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (opts.speed || 80) * (0.4 + Math.random() * 0.8);
      this.spawn(x, y, Object.assign({}, opts, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
      }));
    }
  };

  ParticleSystem.prototype.update = function (dt) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) { p.active = false; continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  };

  ParticleSystem.prototype.render = function (ctx, camera) {
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      if (!p.active) continue;
      var t = p.life / p.maxLife;
      var alpha = p.fade ? (1 - t) : 1;
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      var sx = p.x - camera.x;
      var sy = p.y - camera.y;
      var size = p.size * (p.fade ? (1 - t * 0.5) : 1);
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.5, size), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  ParticleSystem.prototype.clear = function () {
    for (var i = 0; i < this.particles.length; i++) this.particles[i].active = false;
  };

  global.ParticleSystem = ParticleSystem;
})(window);
