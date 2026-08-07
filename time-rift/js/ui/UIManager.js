// Owns every DOM screen (menu, level select, how-to-play, settings, HUD, pause,
// game over, victory) and wires their buttons to Game methods. Canvas is gameplay-only;
// everything else here is plain DOM so it stays accessible and easy to style.
(function (global) {
  'use strict';

  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function UIManager() {
    this.game = null;
    this.toastTimer = null;
    this._cache();
    this._wireButtons();
    this._wireSettings();
    this._setupTouch();
  }

  UIManager.prototype._cache = function () {
    this.screens = {
      menu: $('#screen-menu'),
      levelSelect: $('#screen-level-select'),
      howToPlay: $('#screen-how-to-play'),
      settings: $('#screen-settings'),
      game: $('#screen-game')
    };
    this.overlays = {
      pause: $('#screen-pause'),
      gameover: $('#screen-gameover'),
      victory: $('#screen-victory')
    };
    this.levelGrid = $('#level-grid');
    this.hudTime = $('#hud-time');
    this.hudResets = $('#hud-resets');
    this.hudLevelName = $('#hud-level-name');
    this.healthFill = $('#health-fill');
    this.toast = $('#toast-recording');
    this.controlsHint = $('#hud-controls-hint');
    this.touchControls = $('#touch-controls');
  };

  UIManager.prototype.init = function (game) {
    this.game = game;
    this.renderLevelGrid();
    this.applySettingsToInputs();
    if (Input.isTouchDevice) {
      this.touchControls.classList.add('active', 'touch-capable');
      this.controlsHint.style.display = 'none';
    }
  };

  UIManager.prototype._wireButtons = function () {
    var self = this;
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var action = btn.getAttribute('data-action');
      self._handleAction(action);
    });
  };

  UIManager.prototype._handleAction = function (action) {
    var game = this.game;
    switch (action) {
      case 'play': this.showLevelSelectOrPlay(); break;
      case 'levels': this.showScreen('levelSelect'); break;
      case 'how-to-play': this.showScreen('howToPlay'); break;
      case 'settings': this.showScreen('settings'); break;
      case 'back-to-menu': this.showScreen('menu'); break;
      case 'main-menu': game.goToMainMenu(); this.showScreen('menu'); break;
      case 'level-select': game.goToMainMenu(); this.showScreen('levelSelect'); this.renderLevelGrid(); break;
      case 'pause': game.pause(); break;
      case 'resume': game.resume(); break;
      case 'restart-level': game.resume(); game.restartLevel(); break;
      case 'retry': this.hideAllOverlays(); game.retryLevel(); break;
      case 'next-level': this.hideAllOverlays(); game.nextLevel(); break;
      case 'reset-save':
        if (confirm('Reset all saved progress? This cannot be undone.')) {
          SaveSystem.resetAll();
          this.applySettingsToInputs();
          this.renderLevelGrid();
        }
        break;
      default: break;
    }
  };

  UIManager.prototype._wireSettings = function () {
    var self = this;
    var map = { 'opt-sound': 'sound', 'opt-music': 'music', 'opt-shake': 'shake', 'opt-particles': 'particles' };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener('change', function () {
        SaveSystem.setSetting(map[id], el.checked);
        if (map[id] === 'music') Audio_.refreshMusic();
      });
    });
  };

  UIManager.prototype.applySettingsToInputs = function () {
    var s = SaveSystem.getSettings();
    document.getElementById('opt-sound').checked = s.sound !== false;
    document.getElementById('opt-music').checked = s.music !== false;
    document.getElementById('opt-shake').checked = s.shake !== false;
    document.getElementById('opt-particles').checked = s.particles !== false;
  };

  UIManager.prototype._setupTouch = function () {
    // Input.js already binds the individual buttons; nothing extra needed here.
  };

  UIManager.prototype.showScreen = function (name) {
    Object.keys(this.screens).forEach(function (key) {
      this.screens[key].classList.toggle('active', key === name);
    }, this);
    this.hideAllOverlays();
  };

  UIManager.prototype.showLevelSelectOrPlay = function () {
    this.showScreen('levelSelect');
    this.renderLevelGrid();
  };

  UIManager.prototype.renderLevelGrid = function () {
    var self = this;
    this.levelGrid.innerHTML = '';
    LEVELS.forEach(function (lvl) {
      var unlocked = SaveSystem.isLevelUnlocked(lvl.id);
      var completed = SaveSystem.isLevelCompleted(lvl.id);
      var tile = document.createElement('div');
      tile.className = 'level-tile' + (unlocked ? '' : ' locked') + (completed ? ' completed' : '');
      tile.innerHTML = unlocked ? String(lvl.id) : '<span class="lock">&#128274;</span>';
      if (completed) tile.innerHTML += '<span class="check">&#10003;</span>';
      tile.title = lvl.name;
      if (unlocked) {
        tile.addEventListener('click', function () {
          self.showScreen('game');
          self.game.startLevel(lvl.id);
        });
      }
      self.levelGrid.appendChild(tile);
    });
  };

  UIManager.prototype.hideAllOverlays = function () {
    Object.keys(this.overlays).forEach(function (key) {
      this.overlays[key].classList.remove('active');
    }, this);
  };

  UIManager.prototype.showOverlay = function (name) {
    this.hideAllOverlays();
    this.overlays[name].classList.add('active');
  };

  UIManager.prototype.showToast = function (text) {
    var self = this;
    this.toast.textContent = text;
    this.toast.classList.add('show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () { self.toast.classList.remove('show'); }, 1600);
  };

  UIManager.prototype.updateHUD = function (state) {
    this.hudTime.textContent = state.runTime.toFixed(1) + 's';
    this.hudResets.textContent = state.resets;
    this.hudLevelName.textContent = 'LEVEL ' + state.levelId;
    var pct = Math.max(0, Math.min(100, (state.health / state.maxHealth) * 100));
    this.healthFill.style.width = pct + '%';
  };

  UIManager.prototype.showGameOver = function () {
    this.showOverlay('gameover');
  };

  UIManager.prototype.showVictory = function (stats) {
    $('#v-time').textContent = stats.time.toFixed(1) + 's';
    $('#v-resets').textContent = stats.resets;
    $('#v-clones').textContent = stats.clones;
    $('#v-enemies').textContent = stats.enemies;
    var nextBtn = document.querySelector('#screen-victory [data-action="next-level"]');
    nextBtn.style.display = stats.hasNext ? '' : 'none';
    this.showOverlay('victory');
  };

  UIManager.prototype.showPause = function () {
    this.showOverlay('pause');
  };

  global.UIManager = new UIManager();
})(window);
