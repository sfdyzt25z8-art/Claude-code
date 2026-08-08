// Runtime representation of a level, built fresh from a data definition (see levels/levelData.js)
// every time a level is loaded or fully retried. All moving/blinking objects derive their state
// purely from `runTime` (seconds since the current run/attempt began) so that live play and clone
// playback — which share the same runTime clock — always see identical geometry.
(function (global) {
  'use strict';

  function rectFromDef(d) { return { x: d.x, y: d.y, w: d.w, h: d.h }; }

  class Level {
    constructor(def) {
      this.def = def;
      this.id = def.id;
      this.name = def.name;
      this.width = def.width;
      this.height = def.height;
      this.spawn = def.spawn;
      this.maxResets = def.maxResets || Infinity;

      this.platforms = (def.platforms || []).map(function (p) {
        return {
          baseX: p.x, baseY: p.y, x: p.x, y: p.y, w: p.w, h: p.h,
          moving: !!p.moving, axis: p.axis, range: p.range, speed: p.speed,
          dx: 0, dy: 0
        };
      });

      this.hazards = (def.hazards || []).map(function (h) {
        return {
          baseX: h.x, baseY: h.y, x: h.x, y: h.y, w: h.w, h: h.h,
          mode: h.mode || 'static', axis: h.axis, range: h.range, speed: h.speed,
          onTime: h.onTime, offTime: h.offTime, phase: h.phase || 0,
          damage: h.damage !== undefined ? h.damage : 20,
          active: true
        };
      });

      this.switches = (def.switches || []).map(function (s) {
        return {
          id: s.id, x: s.x, y: s.y, w: s.w, h: s.h, mode: s.mode || 'pressure', active: false,
          // 'timed' switches: a fresh press (re)starts a countdown; the door stays open
          // until it runs out, regardless of whether anything is still standing on it.
          duration: s.duration || 5, timer: 0, wasOverlapping: false
        };
      });

      this.doors = (def.doors || []).map(function (d) {
        return { id: d.id, x: d.x, y: d.y, w: d.w, h: d.h, switchIds: d.switchIds || [], requireAll: d.requireAll !== false, open: false };
      });

      this.crystals = (def.crystals || []).map(function (c) {
        return { x: c.x, y: c.y, w: c.w || 22, h: c.h || 22, collected: false };
      });

      this.barriers = (def.barriers || []).map(function (b) {
        return { x: b.x, y: b.y, w: b.w, h: b.h, onTime: b.onTime || 2, offTime: b.offTime || 2, phase: b.phase || 0, solid: true };
      });

      this.portal = def.portal ? rectFromDef(def.portal) : null;

      this.enemies = (def.enemies || []).map(function (e) { return new Enemy(e); });

      this._staticWalls = (def.walls || []).map(rectFromDef);
    }

    resetRun() {
      this.crystals.forEach(function (c) { c.collected = false; });
      this.enemies.forEach(function (e) { e.reset(); });
      this.switches.forEach(function (s) { s.active = false; s.timer = 0; s.wasOverlapping = false; });
      this.doors.forEach(function (d) { d.open = false; });
    }

    update(dt, runTime, weightSources, game) {
      // Moving platforms: position driven purely by runTime for deterministic replay.
      this.platforms.forEach(function (p) {
        if (!p.moving) return;
        var prevX = p.x, prevY = p.y;
        var offset = Math.sin(runTime * p.speed) * p.range;
        if (p.axis === 'x') p.x = p.baseX + offset;
        else p.y = p.baseY + offset;
        p.dx = p.x - prevX;
        p.dy = p.y - prevY;
      });

      // Hazards: either oscillate (lasers that sweep) or blink on/off on a timer.
      this.hazards.forEach(function (h) {
        if (h.mode === 'move') {
          var offset = Math.sin(runTime * h.speed) * h.range;
          if (h.axis === 'x') h.x = h.baseX + offset;
          else h.y = h.baseY + offset;
          h.active = true;
        } else if (h.mode === 'blink') {
          var cycle = h.onTime + h.offTime;
          var t = (runTime + h.phase) % cycle;
          h.active = t < h.onTime;
        } else {
          h.active = true;
        }
      });

      // Barriers: solid only during their "on" window.
      this.barriers.forEach(function (b) {
        var cycle = b.onTime + b.offTime;
        var t = (runTime + b.phase) % cycle;
        b.solid = t < b.onTime;
      });

      // Pressure switches: active while any current entity (player or clone) overlaps.
      // Timed switches: a fresh press (re)starts a countdown; stays active until it expires.
      this.switches.forEach(function (sw) {
        if (sw.mode === 'lever') return; // toggled explicitly via tryInteract
        var overlapping = false;
        for (var i = 0; i < weightSources.length; i++) {
          if (Physics.rectsOverlap(sw, weightSources[i].getRect())) { overlapping = true; break; }
        }
        if (sw.mode === 'timed') {
          if (overlapping && !sw.wasOverlapping) {
            sw.timer = sw.duration;
            Audio_.switchOn();
          }
          sw.wasOverlapping = overlapping;
          if (sw.timer > 0) sw.timer = Math.max(0, sw.timer - dt);
          // Guard against a floating-point residual (e.g. 1e-14) reading as "still active"
          // for one extra frame after the countdown has effectively reached zero.
          sw.active = sw.timer > 1e-6;
        } else {
          if (overlapping && !sw.active) Audio_.switchOn();
          sw.active = overlapping;
        }
      });

      // Doors follow their linked switches.
      this.doors.forEach(function (door) {
        var wasOpen = door.open;
        if (door.switchIds.length === 0) { door.open = false; return; }
        var states = door.switchIds.map(function (id) {
          var sw = this.switches.find(function (s) { return s.id === id; });
          return sw ? sw.active : false;
        }, this);
        door.open = door.requireAll ? states.every(Boolean) : states.some(Boolean);
        if (door.open && !wasOpen) Audio_.doorOpen();
      }, this);

      // Crystals: only the live player benefits from the heal/checkpoint pulse.
      var player = game.player;
      this.crystals.forEach(function (c) {
        if (c.collected) return;
        if (player.alive && Physics.rectsOverlap(c, player.getRect())) {
          c.collected = true;
          player.heal(player.maxHealth);
          Audio_.crystal();
          game.particles.burst(c.x + c.w / 2, c.y + c.h / 2, 20, { color: '#00e5ff', life: 0.6, speed: 120, gravity: -40 });
          game.screenShake(3);
        }
      });

      this.enemies = this.enemies.filter(function (e) { return e.alive || e.deathTimer > 0; });
      this.enemies.forEach(function (e) { e.update(dt, game); });

      // Portal: reaching it (live player only) finishes the level.
      if (this.portal && player.alive && Physics.rectsOverlap(this.portal, player.getRect())) {
        game.reachPortal();
      }
    }

    tryInteract(entity) {
      var self = this;
      this.switches.forEach(function (sw) {
        if (sw.mode !== 'lever') return;
        var reach = { x: entity.x - 12, y: entity.y - 12, w: entity.w + 24, h: entity.h + 24 };
        if (Physics.rectsOverlap(reach, sw)) {
          sw.active = !sw.active;
          Audio_.switchOn();
        }
      });
    }

    getSolidRects() {
      var solids = this._staticWalls.slice();
      this.platforms.forEach(function (p) { solids.push(p); });
      this.doors.forEach(function (d) { if (!d.open) solids.push(d); });
      this.barriers.forEach(function (b) { if (b.solid) solids.push(b); });
      return solids;
    }

    render(ctx, camera) {
      // Background rift grid.
      ctx.save();
      ctx.strokeStyle = 'rgba(124, 77, 255, 0.08)';
      ctx.lineWidth = 1;
      var gridSize = 60;
      var offX = -camera.x % gridSize;
      var offY = -camera.y % gridSize;
      for (var gx = offX; gx < ctx.canvas.width; gx += gridSize) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ctx.canvas.height); ctx.stroke();
      }
      for (var gy = offY; gy < ctx.canvas.height; gy += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(ctx.canvas.width, gy); ctx.stroke();
      }
      ctx.restore();

      // Static walls / floor.
      ctx.fillStyle = '#171d3f';
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      this._staticWalls.forEach(function (w) {
        ctx.fillRect(w.x - camera.x, w.y - camera.y, w.w, w.h);
        ctx.strokeRect(w.x - camera.x + 0.5, w.y - camera.y + 0.5, w.w - 1, w.h - 1);
      });

      // Platforms.
      this.platforms.forEach(function (p) {
        ctx.fillStyle = p.moving ? '#2c2f6b' : '#1c2350';
        ctx.fillRect(p.x - camera.x, p.y - camera.y, p.w, p.h);
        ctx.strokeStyle = p.moving ? 'rgba(255, 209, 102, 0.5)' : 'rgba(124, 77, 255, 0.35)';
        ctx.strokeRect(p.x - camera.x + 0.5, p.y - camera.y + 0.5, p.w - 1, p.h - 1);
      });

      // Hazards (lasers).
      this.hazards.forEach(function (h) {
        if (!h.active) return;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 59, 92, 0.85)';
        ctx.shadowColor = '#ff3b5c';
        ctx.shadowBlur = 14;
        ctx.fillRect(h.x - camera.x, h.y - camera.y, h.w, h.h);
        ctx.restore();
      });

      // Barriers.
      this.barriers.forEach(function (b) {
        ctx.save();
        ctx.globalAlpha = b.solid ? 0.85 : 0.15;
        ctx.fillStyle = '#ff3b5c';
        ctx.shadowColor = '#ff3b5c';
        ctx.shadowBlur = b.solid ? 12 : 0;
        ctx.fillRect(b.x - camera.x, b.y - camera.y, b.w, b.h);
        ctx.restore();
      });

      // Switches.
      this.switches.forEach(function (sw) {
        ctx.save();
        ctx.fillStyle = sw.active ? '#ffd166' : '#7a6a3a';
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = sw.active ? 12 : 0;
        ctx.fillRect(sw.x - camera.x, sw.y - camera.y + sw.h * 0.4, sw.w, sw.h * 0.6);
        ctx.restore();

        // Timed switches show a shrinking bar so the player can see the door about to close.
        if (sw.mode === 'timed' && sw.active) {
          var pct = Math.max(0, sw.timer / sw.duration);
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(sw.x - camera.x, sw.y - camera.y - 8, sw.w, 4);
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(sw.x - camera.x, sw.y - camera.y - 8, sw.w * pct, 4);
        }
      });

      // Doors.
      this.doors.forEach(function (d) {
        ctx.save();
        ctx.globalAlpha = d.open ? 0.2 : 1;
        ctx.fillStyle = '#7c4dff';
        ctx.shadowColor = '#7c4dff';
        ctx.shadowBlur = d.open ? 4 : 10;
        ctx.fillRect(d.x - camera.x, d.y - camera.y, d.w, d.h);
        ctx.restore();
      });

      // Crystals.
      this.crystals.forEach(function (c) {
        if (c.collected) return;
        ctx.save();
        var cx = c.x - camera.x + c.w / 2;
        var cy = c.y - camera.y + c.h / 2;
        ctx.translate(cx, cy);
        ctx.rotate(Date.now() / 600);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(0, -c.h / 2); ctx.lineTo(c.w / 2, 0); ctx.lineTo(0, c.h / 2); ctx.lineTo(-c.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // Portal.
      if (this.portal) {
        ctx.save();
        var pcx = this.portal.x - camera.x + this.portal.w / 2;
        var pcy = this.portal.y - camera.y + this.portal.h / 2;
        var t = Date.now() / 500;
        for (var ring = 0; ring < 3; ring++) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255, 47, 214, ' + (0.5 - ring * 0.12) + ')';
          ctx.lineWidth = 3;
          ctx.arc(pcx, pcy, this.portal.w / 2 - ring * 6 + Math.sin(t + ring) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255, 47, 214, 0.25)';
        ctx.shadowColor = '#ff2fd6';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(pcx, pcy, this.portal.w / 2 - 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      this.enemies.forEach(function (e) { e.render(ctx, camera); });
    }
  }

  global.Level = Level;
})(window);
