// Top-level orchestrator: owns the canvas, the fixed-timestep loop, the current level
// session (player, clones, stats) and the transitions between playing/paused/dead/won.
(function (global) {
  'use strict';

  var CANVAS_W = 960, CANVAS_H = 540;
  var CLONE_CAP = 10;

  function Game() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = new ParticleSystem();

    this.state = 'inactive'; // inactive | playing | paused | gameover | victory
    this.active = false;
    this.levelId = 1;
    this.level = null;
    this.player = null;
    this.clones = [];
    this.resets = 0;
    this.runTime = 0;
    this.enemiesDefeatedTotal = 0;
    this.levelCompleted = false;

    this.camera = { x: 0, y: 0 };
    this.shakeTimer = 0;
    this.shakeMag = 0;

    this._lastTime = null;
    this._accumulator = 0;

    this._resizeCanvas();
    window.addEventListener('resize', this._resizeCanvas.bind(this));
    window.addEventListener('orientationchange', this._resizeCanvas.bind(this));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this._resizeCanvas.bind(this));
    }

    UIManager.init(this);
    requestAnimationFrame(this._loop.bind(this));
  }

  Game.prototype._resizeCanvas = function () {
    // visualViewport tracks the actual visible area on iOS Safari, where
    // innerWidth/innerHeight can lag behind the on-screen keyboard or the
    // dynamic toolbar collapsing/expanding.
    var vv = window.visualViewport;
    var maxW = vv ? vv.width : window.innerWidth;
    var maxH = vv ? vv.height : window.innerHeight;
    var scale = Math.min(maxW / CANVAS_W, maxH / CANVAS_H);
    var cssW = Math.floor(CANVAS_W * scale);
    var cssH = Math.floor(CANVAS_H * scale);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    var dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(CANVAS_W * dpr);
    this.canvas.height = Math.floor(CANVAS_H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // ---------------------------------------------------------- level lifecycle

  Game.prototype.startLevel = function (id) {
    var def = LEVELS[id - 1];
    if (!def) return;
    this.levelId = id;
    this.level = new Level(def);
    this.player = new Player(def.spawn.x, def.spawn.y);
    this.clones = [];
    this.resets = 0;
    this.runTime = 0;
    this.enemiesDefeatedTotal = 0;
    this.levelCompleted = false;
    this.particles.clear();
    this.state = 'playing';
    this.active = true;
    UIManager.hideAllOverlays();
    Audio_.startMusic();
  };

  // Clone-preserving restart: saves the run just performed as a new time clone, then
  // respawns the player at the start. This is the core time-rift mechanic (R key, dying,
  // or retrying from Game Over / Victory all funnel through here).
  Game.prototype.retryLevel = function () {
    if (!this.level) return;

    if (this.resets >= this.level.maxResets) {
      // Out of attempts for this "time collapse" — the rift resets entirely.
      this.restartLevel();
      UIManager.showToast('TIME COLLAPSED — CLONES LOST');
      Audio_.restart();
      this.screenShake(8);
      return;
    }

    if (this.player.recordedFrames.length > 0 && this.clones.length < CLONE_CAP) {
      var spawn = this.level.spawn;
      this.clones.push(new Clone(spawn.x, spawn.y, this.player.recordedFrames.slice(), this.clones.length));
    }

    this._respawn();
    this.resets++;
    this.state = 'playing';
    UIManager.hideAllOverlays();
    UIManager.showToast('TIME RECORDING SAVED');
    Audio_.restart();
    this.screenShake(4);
  };

  // Full wipe: clears every clone and the reset counter, starting the level session over.
  Game.prototype.restartLevel = function () {
    if (!this.level) return;
    this.clones = [];
    this.resets = 0;
    this.enemiesDefeatedTotal = 0;
    this._respawn();
    this.state = 'playing';
    UIManager.hideAllOverlays();
  };

  Game.prototype._respawn = function () {
    var spawn = this.level.spawn;
    this.player.reset(spawn.x, spawn.y);
    this.level.resetRun();
    this.clones.forEach(function (c) { c.resetPlayback(); });
    this.runTime = 0;
    this.levelCompleted = false;
    this.particles.burst(spawn.x + 13, spawn.y + 20, 16, { color: '#00e5ff', life: 0.5, speed: 100 });
  };

  Game.prototype.nextLevel = function () {
    var next = this.levelId + 1;
    if (next > LEVELS.length) {
      UIManager.showScreen('levelSelect');
      UIManager.renderLevelGrid();
      this.active = false;
      this.state = 'inactive';
      return;
    }
    UIManager.showScreen('game');
    this.startLevel(next);
  };

  Game.prototype.goToMainMenu = function () {
    this.active = false;
    this.state = 'inactive';
    UIManager.hideAllOverlays();
  };

  Game.prototype.pause = function () {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    UIManager.showPause();
  };

  Game.prototype.resume = function () {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    UIManager.hideAllOverlays();
  };

  Game.prototype.reachPortal = function () {
    if (this.levelCompleted) return;
    this.levelCompleted = true;
    this.state = 'victory';
    SaveSystem.completeLevel(this.levelId, this.runTime, LEVELS.length);
    Audio_.levelComplete();
    var p = this.level.portal;
    this.particles.burst(p.x + p.w / 2, p.y + p.h / 2, 46, { color: '#ff2fd6', life: 0.9, speed: 200, gravity: 0 });
    UIManager.showVictory({
      time: this.runTime,
      resets: this.resets,
      clones: this.clones.length,
      enemies: this.enemiesDefeatedTotal,
      hasNext: this.levelId < LEVELS.length
    });
  };

  Game.prototype.onEnemyDefeated = function () {
    this.enemiesDefeatedTotal++;
  };

  Game.prototype.onPlayerDeath = function () {
    this.state = 'gameover';
    UIManager.showGameOver();
  };

  Game.prototype.screenShake = function (mag) {
    if (SaveSystem.getSettings().shake === false) return;
    this.shakeMag = mag;
    this.shakeTimer = 0.25;
  };

  // ---------------------------------------------------------- loop

  Game.prototype._loop = function (timestamp) {
    requestAnimationFrame(this._loop.bind(this));

    if (this._lastTime === null) this._lastTime = timestamp;
    var frameDt = (timestamp - this._lastTime) / 1000;
    this._lastTime = timestamp;
    if (frameDt > 0.25) frameDt = 0.25;

    if (this.active && (this.state === 'playing' || this.state === 'paused')) {
      if (Input.consumePause()) {
        if (this.state === 'playing') this.pause();
        else this.resume();
      }
    }
    if (this.active && this.state === 'playing' && Input.consumeRestart()) {
      this.retryLevel();
    }

    if (this.active && this.state === 'playing') {
      this._accumulator += frameDt;
      var maxSteps = 8;
      while (this._accumulator >= Physics.FIXED_DT && maxSteps > 0) {
        this._fixedUpdate(Physics.FIXED_DT);
        this._accumulator -= Physics.FIXED_DT;
        maxSteps--;
      }
    }

    if (this.shakeTimer > 0) this.shakeTimer -= frameDt;

    if (this.active) this._render();
  };

  Game.prototype._fixedUpdate = function (dt) {
    this.runTime += dt;
    this.player.update(dt, this);
    this.clones.forEach(function (c) { c.update(dt, this); }, this);

    var weightSources = [this.player].concat(this.clones);
    this.level.update(dt, this.runTime, weightSources, this);
    this.particles.update(dt);

    if (!this.player.alive && this.state === 'playing') {
      this.onPlayerDeath();
    }
  };

  Game.prototype._updateCamera = function () {
    var target = this.player;
    var cx = target.x + target.w / 2 - CANVAS_W / 2;
    var cy = target.y + target.h / 2 - CANVAS_H / 2;
    var maxX = Math.max(0, this.level.width - CANVAS_W);
    var maxY = Math.max(0, this.level.height - CANVAS_H);
    this.camera.x = Math.max(0, Math.min(maxX, cx));
    this.camera.y = Math.max(0, Math.min(maxY, cy));

    if (this.shakeTimer > 0) {
      this.camera.x += (Math.random() - 0.5) * this.shakeMag;
      this.camera.y += (Math.random() - 0.5) * this.shakeMag;
    }
  };

  Game.prototype._render = function () {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#05060f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (!this.level) return;
    this._updateCamera();

    this.level.render(ctx, this.camera);
    this.clones.forEach(function (c) { c.render(ctx, this.camera); }, this);
    if (this.player) this.player.render(ctx, this.camera);
    this.particles.render(ctx, this.camera);

    if (this.player) {
      UIManager.updateHUD({
        runTime: this.runTime,
        resets: this.resets,
        levelId: this.levelId,
        health: this.player.health,
        maxHealth: this.player.maxHealth
      });
    }
  };

  global.Game = Game;
})(window);
