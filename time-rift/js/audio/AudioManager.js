// All sound is synthesized at runtime via WebAudio oscillators/noise — no external audio assets.
(function (global) {
  'use strict';

  function AudioManager() {
    this.ctx = null;
    this.musicNodes = null;
    this.musicPlaying = false;
  }

  AudioManager.prototype.ensureContext = function () {
    if (!this.ctx) {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(function () {});
    }
    return this.ctx;
  };

  AudioManager.prototype.soundEnabled = function () {
    return SaveSystem.getSettings().sound !== false;
  };

  AudioManager.prototype.musicEnabled = function () {
    return SaveSystem.getSettings().music !== false;
  };

  // Generic envelope-based tone. type: oscillator waveform.
  AudioManager.prototype.tone = function (freq, duration, opts) {
    if (!this.soundEnabled()) return;
    var ctx = this.ensureContext();
    if (!ctx) return;
    opts = opts || {};
    var type = opts.type || 'sine';
    var startFreq = freq;
    var endFreq = opts.endFreq !== undefined ? opts.endFreq : freq;
    var gainPeak = opts.gain !== undefined ? opts.gain : 0.18;
    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), now + duration);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + Math.min(0.02, duration * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  AudioManager.prototype.noiseBurst = function (duration, opts) {
    if (!this.soundEnabled()) return;
    var ctx = this.ensureContext();
    if (!ctx) return;
    opts = opts || {};
    var now = ctx.currentTime;
    var bufferSize = Math.floor(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'bandpass';
    filter.frequency.value = opts.filterFreq || 1200;
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(opts.gain || 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  };

  AudioManager.prototype.jump = function () { this.tone(340, 0.16, { type: 'square', endFreq: 620, gain: 0.12 }); };
  AudioManager.prototype.attack = function () { this.tone(180, 0.1, { type: 'sawtooth', endFreq: 90, gain: 0.16 }); };
  AudioManager.prototype.hit = function () { this.noiseBurst(0.12, { filterFreq: 900, gain: 0.22 }); };
  AudioManager.prototype.enemyDeath = function () { this.tone(500, 0.35, { type: 'sawtooth', endFreq: 60, gain: 0.16 }); };
  AudioManager.prototype.playerHurt = function () { this.tone(220, 0.22, { type: 'square', endFreq: 100, gain: 0.18 }); };
  AudioManager.prototype.switchOn = function () { this.tone(660, 0.12, { type: 'triangle', endFreq: 990, gain: 0.15 }); };
  AudioManager.prototype.doorOpen = function () { this.tone(200, 0.4, { type: 'sine', endFreq: 400, gain: 0.14 }); };
  AudioManager.prototype.restart = function () {
    this.tone(700, 0.3, { type: 'sine', endFreq: 200, gain: 0.15 });
  };
  AudioManager.prototype.portal = function () { this.tone(300, 0.5, { type: 'sine', endFreq: 900, gain: 0.14 }); };
  AudioManager.prototype.levelComplete = function () {
    var self = this;
    var notes = [523, 659, 784, 1046];
    notes.forEach(function (n, idx) {
      setTimeout(function () { self.tone(n, 0.28, { type: 'triangle', gain: 0.16 }); }, idx * 110);
    });
  };
  AudioManager.prototype.crystal = function () { this.tone(880, 0.3, { type: 'sine', endFreq: 1400, gain: 0.14 }); };

  AudioManager.prototype.startMusic = function () {
    if (this.musicPlaying) return;
    if (!this.musicEnabled()) return;
    var ctx = this.ensureContext();
    if (!ctx) return;
    this.musicPlaying = true;

    var master = ctx.createGain();
    master.gain.value = 0.05;
    master.connect(ctx.destination);

    var osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 110;
    var osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 164.8;

    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    var lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);

    osc1.connect(master);
    osc2.connect(master);
    osc1.start();
    osc2.start();
    lfo.start();

    this.musicNodes = { master: master, osc1: osc1, osc2: osc2, lfo: lfo };
  };

  AudioManager.prototype.stopMusic = function () {
    if (!this.musicPlaying || !this.musicNodes) { this.musicPlaying = false; return; }
    var nodes = this.musicNodes;
    try {
      nodes.osc1.stop();
      nodes.osc2.stop();
      nodes.lfo.stop();
    } catch (e) { /* already stopped */ }
    this.musicNodes = null;
    this.musicPlaying = false;
  };

  AudioManager.prototype.refreshMusic = function () {
    if (this.musicEnabled()) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  };

  global.Audio_ = new AudioManager();
})(window);
