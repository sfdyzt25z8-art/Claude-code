// Wraps localStorage with an in-memory fallback so the game keeps working
// when storage is disabled (private browsing, blocked cookies, sandboxed iframes).
(function (global) {
  'use strict';

  var STORAGE_KEY = 'timerift-save-v1';

  var memoryStore = {};
  var storageAvailable = (function () {
    try {
      var testKey = '__timerift_test__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  })();

  function defaultData() {
    return {
      unlockedLevel: 1,
      completedLevels: {},
      bestTimes: {},
      settings: {
        sound: true,
        music: true,
        shake: true,
        particles: true
      }
    };
  }

  function rawRead() {
    if (storageAvailable) {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }
    return memoryStore.data || null;
  }

  function rawWrite(data) {
    if (storageAvailable) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return;
      } catch (e) {
        // fall through to memory store
      }
    }
    memoryStore.data = data;
  }

  function load() {
    var stored = rawRead();
    var data = defaultData();
    if (stored && typeof stored === 'object') {
      data.unlockedLevel = stored.unlockedLevel || 1;
      data.completedLevels = stored.completedLevels || {};
      data.bestTimes = stored.bestTimes || {};
      data.settings = Object.assign(data.settings, stored.settings || {});
    }
    return data;
  }

  var SaveSystem = {
    data: load(),

    isAvailable: function () {
      return storageAvailable;
    },

    save: function () {
      rawWrite(this.data);
    },

    getSettings: function () {
      return this.data.settings;
    },

    setSetting: function (key, value) {
      this.data.settings[key] = value;
      this.save();
    },

    isLevelUnlocked: function (levelId) {
      return levelId <= this.data.unlockedLevel;
    },

    isLevelCompleted: function (levelId) {
      return !!this.data.completedLevels[levelId];
    },

    getBestTime: function (levelId) {
      return this.data.bestTimes[levelId] || null;
    },

    completeLevel: function (levelId, timeSeconds, totalLevels) {
      this.data.completedLevels[levelId] = true;
      var best = this.data.bestTimes[levelId];
      if (best === undefined || timeSeconds < best) {
        this.data.bestTimes[levelId] = timeSeconds;
      }
      var nextLevel = Math.min(levelId + 1, totalLevels);
      if (nextLevel > this.data.unlockedLevel) {
        this.data.unlockedLevel = nextLevel;
      }
      this.save();
    },

    resetAll: function () {
      this.data = defaultData();
      this.save();
    }
  };

  global.SaveSystem = SaveSystem;
})(window);
