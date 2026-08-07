// Central input state. Keyboard and touch both feed the same held/justPressed flags,
// so recording and playback never need to know which device produced an action.
(function (global) {
  'use strict';

  var KEY_MAP = {
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    KeyW: 'jump', ArrowUp: 'jump', Space: 'jump',
    KeyJ: 'attack',
    KeyE: 'interact',
    KeyR: 'restart',
    Escape: 'pause'
  };

  var HOLD_ACTIONS = { left: true, right: true };
  var EDGE_ACTIONS = { jump: true, attack: true, interact: true, restart: true, pause: true };

  function Input() {
    this.held = { left: false, right: false, jump: false, attack: false, interact: false };
    this.justPressed = { jump: false, attack: false, interact: false, restart: false, pause: false };
    this._activeKeys = {};
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this._bindKeyboard();
    this._bindTouch();
  }

  Input.prototype._setPressed = function (action) {
    if (HOLD_ACTIONS[action]) this.held[action] = true;
    if (EDGE_ACTIONS[action]) {
      this.justPressed[action] = true;
      this.held[action] = true;
    }
  };

  Input.prototype._setReleased = function (action) {
    if (HOLD_ACTIONS[action]) this.held[action] = false;
    if (EDGE_ACTIONS[action]) this.held[action] = false;
  };

  Input.prototype._bindKeyboard = function () {
    var self = this;
    window.addEventListener('keydown', function (e) {
      var action = KEY_MAP[e.code];
      if (!action) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) !== -1) e.preventDefault();
      if (self._activeKeys[e.code]) return; // ignore OS key-repeat
      self._activeKeys[e.code] = true;
      self._setPressed(action);
    }, { passive: false });

    window.addEventListener('keyup', function (e) {
      var action = KEY_MAP[e.code];
      if (!action) return;
      self._activeKeys[e.code] = false;
      self._setReleased(action);
    });

    window.addEventListener('blur', function () {
      self._activeKeys = {};
      self.held.left = false;
      self.held.right = false;
    });
  };

  Input.prototype._bindTouch = function () {
    var self = this;
    var buttons = document.querySelectorAll('[data-touch]');
    buttons.forEach(function (btn) {
      var action = btn.getAttribute('data-touch');
      var press = function (e) {
        e.preventDefault();
        btn.classList.add('pressed');
        self._setPressed(action);
      };
      var release = function (e) {
        if (e) e.preventDefault();
        btn.classList.remove('pressed');
        self._setReleased(action);
      };
      btn.addEventListener('touchstart', press, { passive: false });
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
      btn.addEventListener('mousedown', press);
      btn.addEventListener('mouseup', release);
      btn.addEventListener('mouseleave', release);
    });
  };

  // Consumed once per fixed physics tick — feeds both live control and the recording buffer.
  Input.prototype.tickSnapshot = function () {
    var snap = {
      left: this.held.left,
      right: this.held.right,
      jump: this.justPressed.jump,
      attack: this.justPressed.attack,
      interact: this.justPressed.interact
    };
    this.justPressed.jump = false;
    this.justPressed.attack = false;
    this.justPressed.interact = false;
    return snap;
  };

  // Restart/pause are UI-level edge events, consumed once per animation frame.
  Input.prototype.consumeRestart = function () {
    if (this.justPressed.restart) { this.justPressed.restart = false; return true; }
    return false;
  };

  Input.prototype.consumePause = function () {
    if (this.justPressed.pause) { this.justPressed.pause = false; return true; }
    return false;
  };

  global.Input = new Input();
})(window);
