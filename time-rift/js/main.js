// Bootstraps the game: starts the menu background animation, arms audio on first user
// gesture (required by browser autoplay policies), and constructs the Game instance.
(function () {
  'use strict';

  function initMenuBackground() {
    var canvas = document.getElementById('menu-bg-canvas');
    var ctx = canvas.getContext('2d');
    var particles = [];
    var rifts = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 0.6 + Math.random() * 1.8,
        speed: 6 + Math.random() * 14,
        drift: (Math.random() - 0.5) * 10,
        hue: Math.random() < 0.5 ? 190 : 290,
        alpha: 0.3 + Math.random() * 0.5
      });
    }
    for (var j = 0; j < 3; j++) {
      rifts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 60 + Math.random() * 80,
        speed: 0.15 + Math.random() * 0.15,
        t: Math.random() * 100
      });
    }

    var last = null;
    function frame(ts) {
      requestAnimationFrame(frame);
      if (document.getElementById('screen-menu').classList.contains('active') === false) { last = ts; return; }
      if (last === null) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      rifts.forEach(function (r) {
        r.t += dt * r.speed;
        var pulse = 1 + Math.sin(r.t) * 0.12;
        var grad = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.r * pulse);
        grad.addColorStop(0, 'rgba(124, 77, 255, 0.10)');
        grad.addColorStop(0.6, 'rgba(0, 229, 255, 0.05)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      particles.forEach(function (p) {
        p.y -= p.speed * dt;
        p.x += p.drift * dt;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + p.hue + ', 90%, 70%, ' + p.alpha + ')';
        ctx.shadowColor = 'hsl(' + p.hue + ', 90%, 60%)';
        ctx.shadowBlur = 6;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    requestAnimationFrame(frame);
  }

  function armAudioOnGesture() {
    function start() {
      Audio_.ensureContext();
      Audio_.startMusic();
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    }
    window.addEventListener('pointerdown', start);
    window.addEventListener('keydown', start);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMenuBackground();
    armAudioOnGesture();
    window.TimeRiftGame = new Game();
  });
})();
