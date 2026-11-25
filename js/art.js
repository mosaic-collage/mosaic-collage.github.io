/* Mosaic — art: generated backgrounds, vector stickers, washi tape & photo frames */
(function () {
  'use strict';
  var M = window.M;

  function rr(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }
  M.rr = rr;
  function rgba(hex, a) { var c = M.hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function shade(hex, k) { var c = M.hexToRgb(hex); var f = function (v) { return Math.round(M.clamp(k < 0 ? v * (1 + k) : v + (255 - v) * k, 0, 255)); }; return 'rgb(' + f(c[0]) + ',' + f(c[1]) + ',' + f(c[2]) + ')'; }
  M.rgba = rgba; M.shade = shade;

  /* ================= BACKGROUNDS ================= */
  M.BG_TYPES = [
    { key: 'kraft', label: 'Kraft', a: '#c9a27a', b: '#7a5634' },
    { key: 'solid', label: 'Plain', a: '#f6efe0', b: '#e4572e' },
    { key: 'gradient', label: 'Gradient', a: '#ffd3b6', b: '#a8e6cf' },
    { key: 'sunset', label: 'Glow', a: '#ffe29f', b: '#ff719a' },
    { key: 'grid', label: 'Graph', a: '#fbfaf5', b: '#7fb2d6' },
    { key: 'notebook', label: 'Notebook', a: '#fffdf4', b: '#8fb3e6' },
    { key: 'dots', label: 'Polka', a: '#fde2e4', b: '#ffffff' },
    { key: 'stripes', label: 'Stripes', a: '#fff3d6', b: '#f4a261' },
    { key: 'gingham', label: 'Gingham', a: '#ffffff', b: '#e76f51' },
    { key: 'confetti', label: 'Confetti', a: '#fff8ec', b: '#e4572e' },
    { key: 'terrazzo', label: 'Terrazzo', a: '#f1ece4', b: '#2a9d8f' },
    { key: 'sunburst', label: 'Sunburst', a: '#ffd166', b: '#ef476f' },
    { key: 'blobs', label: 'Blobs', a: '#f8edeb', b: '#9d8df1' },
    { key: 'cork', label: 'Cork', a: '#b5835a', b: '#6e4a2e' }
  ];
  M.PALETTES = [
    ['#f6efe0', '#e4572e'], ['#fde2e4', '#9a8c98'], ['#e9f5db', '#4a7c59'], ['#fff1e6', '#264653'],
    ['#1d1a2f', '#f9c74f'], ['#edf6f9', '#e29578'], ['#f1faee', '#e63946'], ['#2b2d42', '#8d99ae'],
    ['#fef9ef', '#227c9d'], ['#ffe5ec', '#fb6f92']
  ];
  var CONF = ['#2a9d8f', '#f4a261', '#e9c46a', '#8ecae6', '#f28fa5', '#264653', '#e76f51'];

  var BG = {
    solid: function (c, b, W, H) { c.fillStyle = b.a; c.fillRect(0, 0, W, H); },
    gradient: function (c, b, W, H) { var g = c.createLinearGradient(0, 0, W * 0.35, H); g.addColorStop(0, b.a); g.addColorStop(1, b.b); c.fillStyle = g; c.fillRect(0, 0, W, H); },
    sunset: function (c, b, W, H) { var g = c.createRadialGradient(W * 0.5, H * 0.82, 10, W * 0.5, H * 0.6, Math.max(W, H)); g.addColorStop(0, b.a); g.addColorStop(1, b.b); c.fillStyle = g; c.fillRect(0, 0, W, H); },
    kraft: function (c, b, W, H, r) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      var g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(1, 'rgba(60,30,0,0.18)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      var n = M.lowPower ? 700 : 1600;
      for (var i = 0; i < n; i++) {
        var x = r() * W, y = r() * H, l = 4 + r() * 16, a = r() * Math.PI;
        c.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.11)' : rgba(b.b, 0.16);
        c.lineWidth = 0.6 + r(); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
      }
      for (i = 0; i < 260; i++) { c.fillStyle = rgba(b.b, 0.1 + r() * 0.2); c.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    },
    grid: function (c, b, W, H) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      for (var x = 0; x <= W; x += 25) { c.strokeStyle = rgba(b.b, x % 125 === 0 ? 0.55 : 0.28); c.lineWidth = x % 125 === 0 ? 1.6 : 0.9; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (var y = 0; y <= H; y += 25) { c.strokeStyle = rgba(b.b, y % 125 === 0 ? 0.55 : 0.28); c.lineWidth = y % 125 === 0 ? 1.6 : 0.9; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    },
    notebook: function (c, b, W, H) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      c.strokeStyle = rgba(b.b, 0.6); c.lineWidth = 1.4;
      for (var y = 120; y < H; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.strokeStyle = 'rgba(231,111,111,0.75)'; c.lineWidth = 2; c.beginPath(); c.moveTo(96, 0); c.lineTo(96, H); c.stroke(); c.beginPath(); c.moveTo(101, 0); c.lineTo(101, H); c.stroke();
      [0.18, 0.5, 0.82].forEach(function (k) {
        var g = c.createRadialGradient(44, H * k - 3, 2, 44, H * k, 16); g.addColorStop(0, 'rgba(0,0,0,0.32)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
        c.fillStyle = g; c.beginPath(); c.arc(44, H * k, 15, 0, Math.PI * 2); c.fill();
      });
    },
    dots: function (c, b, W, H) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H); c.fillStyle = b.b;
      for (var y = 0, row = 0; y < H + 60; y += 56, row++) for (var x = row % 2 ? 28 : 0; x < W + 60; x += 56) { c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill(); }
    },
    stripes: function (c, b, W, H) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H / 2); c.rotate(-Math.PI / 6); c.fillStyle = rgba(b.b, 0.85);
      var D = Math.hypot(W, H); for (var x = -D; x < D; x += 72) c.fillRect(x, -D, 30, D * 2); c.restore();
    },
    gingham: function (c, b, W, H) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H); c.fillStyle = rgba(b.b, 0.42);
      for (var x = 0; x < W; x += 80) c.fillRect(x, 0, 40, H);
      for (var y = 0; y < H; y += 80) c.fillRect(0, y, W, 40);
    },
    confetti: function (c, b, W, H, r) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      var n = M.lowPower ? 140 : 240, cols = [b.b].concat(CONF);
      for (var i = 0; i < n; i++) {
        c.save(); c.translate(r() * W, r() * H); c.rotate(r() * Math.PI * 2); c.fillStyle = cols[Math.floor(r() * cols.length)];
        var t = r();
        if (t < 0.45) c.fillRect(-9, -4, 18, 8);
        else if (t < 0.8) { c.beginPath(); c.arc(0, 0, 4 + r() * 4, 0, Math.PI * 2); c.fill(); }
        else { c.strokeStyle = c.fillStyle; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(-6, -8, 0, 0); c.quadraticCurveTo(6, 8, 12, 0); c.stroke(); }
        c.restore();
      }
    },
    terrazzo: function (c, b, W, H, r) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      var cols = [b.b, shade(b.b, -0.3), '#e9c46a', '#e76f51', '#264653', '#f4a261', '#ffffff'];
      var n = M.lowPower ? 110 : 190;
      for (var i = 0; i < n; i++) {
        var cx = r() * W, cy = r() * H, rad = 5 + Math.pow(r(), 2) * 26, k = 5 + Math.floor(r() * 3);
        c.fillStyle = cols[Math.floor(r() * cols.length)]; c.globalAlpha = 0.85; c.beginPath();
        for (var j = 0; j < k; j++) { var a = j / k * Math.PI * 2 + r() * 0.5, rd = rad * (0.6 + r() * 0.5); c[j ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rd, cy + Math.sin(a) * rd); }
        c.closePath(); c.fill();
      }
      c.globalAlpha = 1;
    },
    sunburst: function (c, b, W, H) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      var cx = W / 2, cy = H * 0.45, R = Math.hypot(W, H), n = 28; c.fillStyle = rgba(b.b, 0.55);
      for (var i = 0; i < n; i += 2) { var a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); c.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); c.closePath(); c.fill(); }
      var g = c.createRadialGradient(cx, cy, 0, cx, cy, W * 0.5); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    },
    blobs: function (c, b, W, H, r) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      var cols = [b.b, '#f7b2bd', '#a8dadc', '#ffe08a', shade(b.b, 0.4)];
      for (var i = 0; i < 8; i++) {
        var x = r() * W, y = r() * H, R = 160 + r() * 360, g = c.createRadialGradient(x, y, 0, x, y, R), col = cols[i % cols.length];
        g.addColorStop(0, rgba(col, 0.6)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
    },
    cork: function (c, b, W, H, r) {
      c.fillStyle = b.a; c.fillRect(0, 0, W, H);
      var n = M.lowPower ? 1500 : 3600;
      for (var i = 0; i < n; i++) { c.fillStyle = r() < 0.6 ? rgba(b.b, 0.25 + r() * 0.35) : 'rgba(255,230,190,' + (0.12 + r() * 0.25) + ')'; var s = 1 + r() * 3.5; c.fillRect(r() * W, r() * H, s, s * (0.6 + r())); }
      var g = c.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, Math.max(W, H) * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,20,0,0.35)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    }
  };
  M.drawBg = function (c, bg, W, H) {
    bg = bg || { type: 'kraft', a: '#c9a27a', b: '#7a5634', seed: 1 };
    var fn = BG[bg.type] || BG.solid;
    c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
    fn(c, bg, W, H, M.rng(bg.seed || 1));
    c.restore();
  };

  /* ================= WASHI TAPE ================= */
  M.drawTape = function (c, w, h, col, pat, col2, seed) {
    var r = M.rng(seed || 7), teeth = 7, j = h * 0.07;
    c.save();
    c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2);
    for (var i = 1; i <= teeth; i++) c.lineTo(w / 2 - (i % 2 ? j * (0.5 + r()) : 0), -h / 2 + h * i / teeth);
    c.lineTo(-w / 2, h / 2);
    for (i = 1; i <= teeth; i++) c.lineTo(-w / 2 + (i % 2 ? j * (0.5 + r()) : 0), h / 2 - h * i / teeth);
    c.closePath();
    c.globalAlpha = 0.86; c.fillStyle = col; c.fill(); c.clip();
    c.globalAlpha = 0.6; c.fillStyle = col2 || '#fff'; c.strokeStyle = col2 || '#fff';
    var x, y;
    if (pat === 'stripes') { c.lineWidth = h * 0.16; for (x = -w; x < w; x += h * 0.42) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + h * 1.2, -h); c.stroke(); } }
    else if (pat === 'dots') { for (y = -h / 2 + h * 0.22; y < h / 2; y += h * 0.38) for (x = -w / 2 + ((Math.round((y + h) / (h * 0.38)) % 2) ? h * 0.2 : 0); x < w / 2; x += h * 0.4) { c.beginPath(); c.arc(x, y, h * 0.07, 0, Math.PI * 2); c.fill(); } }
    else if (pat === 'grid') { c.lineWidth = h * 0.04; for (x = -w / 2; x < w / 2; x += h * 0.25) { c.beginPath(); c.moveTo(x, -h); c.lineTo(x, h); c.stroke(); } for (y = -h / 2; y < h / 2; y += h * 0.25) { c.beginPath(); c.moveTo(-w, y); c.lineTo(w, y); c.stroke(); } }
    else if (pat === 'zig') { c.lineWidth = h * 0.08; c.beginPath(); for (x = -w / 2, i = 0; x <= w / 2 + h; x += h * 0.22, i++) c.lineTo(x, i % 2 ? -h * 0.12 : h * 0.12); c.stroke(); }
    else if (pat === 'check') { for (x = -w / 2, i = 0; x < w / 2; x += h * 0.25, i++) for (y = -h / 2, j = 0; y < h / 2; y += h * 0.25, j++) if ((i + j) % 2) c.fillRect(x, y, h * 0.25, h * 0.25); }
    else if (pat === 'hearts') { for (x = -w / 2 + h * 0.3; x < w / 2; x += h * 0.6) heartPath(c, x, 0, h * 0.18), c.fill(); }
    // sheen + translucent edges
    c.globalAlpha = 1;
    var g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.06)');
    c.fillStyle = g; c.fillRect(-w, -h, w * 2, h * 2);
    c.restore();
  };
  function heartPath(c, x, y, s) {
    c.beginPath(); c.moveTo(x, y + s * 0.85);
    c.bezierCurveTo(x - s * 1.25, y - s * 0.05, x - s * 0.6, y - s * 1.05, x, y - s * 0.45);
    c.bezierCurveTo(x + s * 0.6, y - s * 1.05, x + s * 1.25, y - s * 0.05, x, y + s * 0.85); c.closePath();
  }
  function starPath(c, R, r, n) { c.beginPath(); for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * d, Math.sin(a) * d); } c.closePath(); }
  // die-cut sticker: white outline + soft shadow, then fill
  function die(c, pathFn, col, k) {
    c.save(); c.lineJoin = 'round'; c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 8 * (M._S || 1); c.shadowOffsetY = 3 * (M._S || 1);
    pathFn(); c.strokeStyle = '#fff'; c.lineWidth = k; c.stroke(); c.restore();
    pathFn(); c.fillStyle = col; c.fill();
  }
  function label(c, txt, font, size, col, y) { c.font = M.fontStr(font, size); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(txt, 0, y || 0); }

  function paperclip(c, w, h, col) {
    var g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, shade(col, -0.35)); g.addColorStop(0.45, shade(col, 0.6)); g.addColorStop(1, shade(col, -0.25));
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w * 0.12; c.strokeStyle = g;
    c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 4 * (M._S || 1); c.shadowOffsetX = 2 * (M._S || 1); c.shadowOffsetY = 3 * (M._S || 1);
    var x1 = -w * 0.35, x2 = w * 0.35, x3 = -w * 0.17, x4 = w * 0.17;
    c.beginPath(); c.moveTo(x4, -h * 0.12); c.lineTo(x4, h * 0.3); c.arc(0, h * 0.3, x4, 0, Math.PI);
    c.lineTo(x3, -h * 0.36); c.arc((x3 + x2) / 2, -h * 0.36, (x2 - x3) / 2, Math.PI, 0);
    c.lineTo(x2, h * 0.34); c.arc(0, h * 0.34, x2, 0, Math.PI); c.lineTo(x1, -h * 0.22); c.stroke(); c.restore();
  }
  function pin(c, w, h, col) {
    var R = Math.min(w, h) * 0.32;
    c.save(); c.strokeStyle = '#9aa0a6'; c.lineWidth = R * 0.18; c.lineCap = 'round'; c.beginPath(); c.moveTo(R * 0.2, R * 0.4); c.lineTo(R * 0.9, R * 1.5); c.stroke();
    c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 8 * (M._S || 1); c.shadowOffsetX = 3 * (M._S || 1); c.shadowOffsetY = 5 * (M._S || 1);
    var g = c.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R); g.addColorStop(0, shade(col, 0.6)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -0.45));
    c.fillStyle = g; c.beginPath(); c.arc(0, -R * 0.1, R, 0, Math.PI * 2); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-R * 0.35, -R * 0.45, R * 0.22, R * 0.13, -0.6, 0, Math.PI * 2); c.fill();
  }
  function binder(c, w, h, col) {
    c.save(); c.lineWidth = w * 0.05; c.strokeStyle = '#b8bcc2'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-w * 0.28, -h * 0.05); c.lineTo(-w * 0.22, -h * 0.46); c.lineTo(w * 0.22, -h * 0.46); c.lineTo(w * 0.28, -h * 0.05); c.stroke();
    c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 6 * (M._S || 1); c.shadowOffsetY = 4 * (M._S || 1);
    c.fillStyle = col; c.beginPath(); c.moveTo(-w * 0.42, h * 0.45); c.lineTo(-w * 0.3, -h * 0.05); c.lineTo(w * 0.3, -h * 0.05); c.lineTo(w * 0.42, h * 0.45); c.closePath(); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-w * 0.3, -h * 0.02, w * 0.6, h * 0.08);
  }
  function ticket(c, w, h, col, txt) {
    var rN = h * 0.14;
    var p = function () { c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, -rN); c.arc(w / 2, 0, rN, -Math.PI / 2, Math.PI / 2, true); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.lineTo(-w / 2, rN); c.arc(-w / 2, 0, rN, Math.PI / 2, -Math.PI / 2, true); c.closePath(); };
    die(c, p, col, h * 0.05);
    c.save(); c.setLineDash([h * 0.06, h * 0.05]); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = h * 0.025; c.beginPath(); c.moveTo(w * 0.24, -h / 2 + 6); c.lineTo(w * 0.24, h / 2 - 6); c.stroke(); c.restore();
    label(c, txt, 'impact', h * 0.3, 'rgba(40,20,10,0.85)', 0); c.textAlign = 'center';
  }

  M.STICKER_CATS = [{ key: 'tape', label: 'Washi' }, { key: 'clips', label: 'Clips & pins' }, { key: 'doodles', label: 'Doodles' }, { key: 'emoji', label: 'Emoji' }];
  var T = function (key, label, col, pat, col2) { return { key: key, cat: 'tape', label: label, w: 280, h: 58, color: col, draw: function (c, w, h, cc) { M.drawTape(c, w, h, cc, pat, col2, M.hash(key)); } }; };
  M.STICKERS = [
    T('tape-pink', 'Pink stripes washi', '#f7a8b8', 'stripes', '#fff'),
    T('tape-mint', 'Mint dots washi', '#9ed8d6', 'dots', '#fff'),
    T('tape-sun', 'Sunny grid washi', '#ffd86b', 'grid', '#e39b2d'),
    T('tape-kraft', 'Kraft tape', '#d6b48a', 'none'),
    T('tape-lilac', 'Lilac zigzag washi', '#cdb4db', 'zig', '#fff'),
    T('tape-check', 'Cherry check washi', '#ff8fa3', 'check', '#fff'),
    T('tape-mask', 'Masking tape', '#eee3c8', 'none'),
    T('tape-night', 'Night dots washi', '#2b2d42', 'dots', '#ffd166'),
    T('tape-hearts', 'Hearts washi', '#ffc8dd', 'hearts', '#e5383b'),
    { key: 'clip-silver', cat: 'clips', label: 'Silver paper clip', w: 52, h: 150, color: '#b9c0c8', draw: paperclip },
    { key: 'clip-gold', cat: 'clips', label: 'Gold paper clip', w: 52, h: 150, color: '#e0b04a', draw: paperclip },
    { key: 'clip-pink', cat: 'clips', label: 'Pink paper clip', w: 52, h: 150, color: '#f08fb0', draw: paperclip },
    { key: 'pin-red', cat: 'clips', label: 'Red push pin', w: 90, h: 90, color: '#e63946', draw: pin },
    { key: 'pin-blue', cat: 'clips', label: 'Blue push pin', w: 90, h: 90, color: '#3a86ff', draw: pin },
    { key: 'pin-yellow', cat: 'clips', label: 'Yellow push pin', w: 90, h: 90, color: '#ffbe0b', draw: pin },
    { key: 'binder', cat: 'clips', label: 'Binder clip', w: 130, h: 120, color: '#1f1f24', draw: binder },
    { key: 'star', cat: 'doodles', label: 'Star', w: 150, h: 150, color: '#ffd166', draw: function (c, w, h, col) { var R = Math.min(w, h) / 2 * 0.9; die(c, function () { starPath(c, R, R * 0.45, 5); }, col, R * 0.16); } },
    { key: 'heart', cat: 'doodles', label: 'Heart', w: 150, h: 150, color: '#ef476f', draw: function (c, w, h, col) { var s = Math.min(w, h) / 2 * 0.95; die(c, function () { heartPath(c, 0, 0, s); }, col, s * 0.16); } },
    { key: 'sparkle', cat: 'doodles', label: 'Sparkle', w: 130, h: 130, color: '#ffffff', draw: function (c, w, h, col) { var R = Math.min(w, h) / 2; c.save(); c.shadowColor = 'rgba(255,200,80,0.9)'; c.shadowBlur = 14 * (M._S || 1); starPath(c, R, R * 0.2, 4); c.fillStyle = col; c.fill(); c.restore(); } },
    { key: 'flower', cat: 'doodles', label: 'Flower', w: 150, h: 150, color: '#f28fa5', draw: function (c, w, h, col) {
      var R = Math.min(w, h) / 2;
      die(c, function () { c.beginPath(); for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; c.moveTo(Math.cos(a) * R * 0.52 + R * 0.4, Math.sin(a) * R * 0.52); c.arc(Math.cos(a) * R * 0.52, Math.sin(a) * R * 0.52, R * 0.4, 0, Math.PI * 2); } }, col, R * 0.14);
      c.fillStyle = '#ffd166'; c.beginPath(); c.arc(0, 0, R * 0.3, 0, Math.PI * 2); c.fill(); } },
    { key: 'sun', cat: 'doodles', label: 'Sun', w: 160, h: 160, color: '#ffb703', draw: function (c, w, h, col) {
      var R = Math.min(w, h) / 2; c.strokeStyle = col; c.lineWidth = R * 0.1; c.lineCap = 'round';
      for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.58, Math.sin(a) * R * 0.58); c.lineTo(Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92); c.stroke(); }
      die(c, function () { c.beginPath(); c.arc(0, 0, R * 0.44, 0, Math.PI * 2); }, col, R * 0.1);
      c.fillStyle = 'rgba(60,30,0,0.75)'; c.beginPath(); c.arc(-R * 0.15, -R * 0.06, R * 0.05, 0, 7); c.moveTo(R * 0.2, -R * 0.06); c.arc(R * 0.15, -R * 0.06, R * 0.05, 0, 7); c.fill();
      c.strokeStyle = 'rgba(60,30,0,0.75)'; c.lineWidth = R * 0.05; c.beginPath(); c.arc(0, R * 0.04, R * 0.17, 0.2, Math.PI - 0.2); c.stroke(); } },
    { key: 'cloud', cat: 'doodles', label: 'Cloud', w: 200, h: 120, color: '#ffffff', draw: function (c, w, h, col) {
      die(c, function () { c.beginPath(); c.arc(-w * 0.22, h * 0.08, h * 0.28, 0, 7); c.moveTo(w * 0.05 + h * 0.38, -h * 0.05); c.arc(w * 0.05, -h * 0.05, h * 0.38, 0, 7); c.moveTo(w * 0.28 + h * 0.26, h * 0.1); c.arc(w * 0.28, h * 0.1, h * 0.26, 0, 7); c.rect(-w * 0.22, h * 0.05, w * 0.5, h * 0.31); }, col, h * 0.08);
    } },
    { key: 'arrow', cat: 'doodles', label: 'Hand-drawn arrow', w: 200, h: 110, color: '#2b2420', draw: function (c, w, h, col) {
      c.strokeStyle = col; c.lineWidth = h * 0.07; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(-w * 0.44, h * 0.3); c.quadraticCurveTo(-w * 0.05, -h * 0.55, w * 0.4, -h * 0.05); c.stroke();
      c.beginPath(); c.moveTo(w * 0.2, -h * 0.14); c.lineTo(w * 0.41, -h * 0.04); c.lineTo(w * 0.28, h * 0.16); c.stroke(); } },
    { key: 'squiggle', cat: 'doodles', label: 'Squiggle', w: 220, h: 60, color: '#2a9d8f', draw: function (c, w, h, col) {
      c.strokeStyle = col; c.lineWidth = h * 0.16; c.lineCap = 'round'; c.beginPath();
      for (var i = 0; i <= 40; i++) { var x = -w * 0.45 + w * 0.9 * i / 40, y = Math.sin(i / 40 * Math.PI * 5) * h * 0.26; c[i ? 'lineTo' : 'moveTo'](x, y); } c.stroke(); } },
    { key: 'bubble', cat: 'doodles', label: 'Speech bubble', w: 210, h: 150, color: '#ffffff', draw: function (c, w, h, col) {
      die(c, function () { c.beginPath(); rr(c, -w / 2, -h / 2, w, h * 0.74, h * 0.2); c.moveTo(-w * 0.18, h * 0.22); c.lineTo(-w * 0.3, h * 0.5); c.lineTo(-w * 0.02, h * 0.22); }, col, h * 0.06);
      c.strokeStyle = '#2b2420'; c.lineWidth = h * 0.025; c.beginPath(); rr(c, -w / 2, -h / 2, w, h * 0.74, h * 0.2); c.stroke();
      label(c, 'wow!', 'marker', h * 0.32, '#e4572e', -h * 0.13); } },
    { key: 'stamp', cat: 'doodles', label: 'Rubber stamp', w: 240, h: 100, color: '#d62828', draw: function (c, w, h, col) {
      c.save(); c.globalAlpha = 0.82; c.strokeStyle = col; c.lineWidth = h * 0.06; c.beginPath(); rr(c, -w / 2 + 4, -h / 2 + 4, w - 8, h - 8, h * 0.12); c.stroke();
      c.lineWidth = h * 0.025; c.beginPath(); rr(c, -w / 2 + h * 0.14, -h / 2 + h * 0.14, w - h * 0.28, h - h * 0.28, h * 0.08); c.stroke();
      label(c, '100% CUTE', 'type', h * 0.3, col, 2); c.restore(); } },
    { key: 'tag', cat: 'doodles', label: 'Gift tag', w: 220, h: 100, color: '#d6b48a', draw: function (c, w, h, col) {
      die(c, function () { c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2 + h * 0.4, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2 + h * 0.4, h / 2); c.closePath(); }, col, h * 0.06);
      c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(-w / 2 + h * 0.36, 0, h * 0.1, 0, 7); c.fill();
      label(c, 'BEST DAY', 'type', h * 0.28, '#3a2a1a', 2); } },
    { key: 'ticket', cat: 'doodles', label: 'Ticket', w: 240, h: 100, color: '#ffd166', draw: function (c, w, h, col) { ticket(c, w, h, col, 'ADMIT ONE'); } }
  ];
  ['🌸', '✨', '📸', '🎞️', '☕', '🌈', '🍕', '🐱', '🎉', '💌', '🌙', '🍀', '🦋', '🔥', '🎈', '🌻'].forEach(function (e, i) {
    M.STICKERS.push({ key: 'emoji-' + i, cat: 'emoji', label: 'Emoji ' + e, w: 120, h: 120, emoji: e, draw: function (c, w, h) {
      c.font = Math.round(Math.min(w, h) * 0.86) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, 0, h * 0.04); } });
  });
  M.stickerByKey = function (k) { for (var i = 0; i < M.STICKERS.length; i++) if (M.STICKERS[i].key === k) return M.STICKERS[i]; return null; };
  M.drawSticker = function (c, it) {
    var s = M.stickerByKey(it.key); if (!s) return;
    s.draw(c, it.w, it.h, it.color || s.color);
  };

  /* ================= FRAMES ================= */
  M.FRAMES = [
    { key: 'none', label: 'None' }, { key: 'white', label: 'Border' }, { key: 'polaroid', label: 'Polaroid' },
    { key: 'torn', label: 'Torn paper' }, { key: 'tape', label: 'Taped' }, { key: 'clip', label: 'Clipped' },
    { key: 'film', label: 'Film strip' }, { key: 'rounded', label: 'Rounded' }, { key: 'scallop', label: 'Scalloped' }, { key: 'stamp', label: 'Postage' }
  ];
  M.frameInset = function (f, w, h) {
    var m = Math.min(w, h), k;
    switch (f) {
      case 'white': k = m * 0.045; return { l: k, t: k, r: k, b: k };
      case 'polaroid': k = m * 0.06; return { l: k, t: k, r: k, b: m * 0.22 };
      case 'torn': k = m * 0.065; return { l: k, t: k, r: k, b: k };
      case 'tape': case 'clip': k = m * 0.025; return { l: k, t: k, r: k, b: k };
      case 'film': return { l: m * 0.03, t: m * 0.13, r: m * 0.03, b: m * 0.13 };
      case 'scallop': case 'stamp': k = m * 0.075; return { l: k, t: k, r: k, b: k };
      default: return { l: 0, t: 0, r: 0, b: 0 };
    }
  };
  function tornPath(c, w, h, seed) {
    var r = M.rng(seed), m = Math.min(w, h), amp = m * 0.022, step = Math.max(6, m * 0.02);
    var x0 = -w / 2, y0 = -h / 2, x, y;
    c.beginPath(); c.moveTo(x0 + r() * amp, y0 + r() * amp);
    for (x = x0 + step; x < w / 2; x += step) c.lineTo(x, y0 + r() * amp);
    for (y = y0; y < h / 2; y += step) c.lineTo(w / 2 - r() * amp, y);
    for (x = w / 2; x > x0; x -= step) c.lineTo(x, h / 2 - r() * amp);
    for (y = h / 2; y > y0; y -= step) c.lineTo(x0 + r() * amp, y);
    c.closePath();
  }
  function scallopPath(c, w, h, inward) {
    var m = Math.min(w, h), R = m * 0.024, d = R * 2, nx = Math.max(2, Math.round(w / d)), ny = Math.max(2, Math.round(h / d)), sx = w / nx, sy = h / ny, i;
    var ccw = !!inward;
    c.beginPath(); c.moveTo(-w / 2, -h / 2);
    for (i = 0; i < nx; i++) c.arc(-w / 2 + sx * (i + 0.5), -h / 2, sx / 2, Math.PI, 0, ccw);
    for (i = 0; i < ny; i++) c.arc(w / 2, -h / 2 + sy * (i + 0.5), sy / 2, -Math.PI / 2, Math.PI / 2, ccw);
    for (i = 0; i < nx; i++) c.arc(w / 2 - sx * (i + 0.5), h / 2, sx / 2, 0, Math.PI, ccw);
    for (i = 0; i < ny; i++) c.arc(-w / 2, h / 2 - sy * (i + 0.5), sy / 2, Math.PI / 2, -Math.PI / 2, ccw);
    c.closePath();
  }
  M.drawFrameBack = function (c, it, S) {
    var f = it.frame || 'none', w = it.w, h = it.h, m = Math.min(w, h);
    c.save();
    c.shadowColor = 'rgba(40,25,10,0.34)'; c.shadowBlur = Math.max(2, m * 0.035) * S; c.shadowOffsetY = Math.max(1, m * 0.014) * S; c.shadowOffsetX = m * 0.004 * S;
    c.fillStyle = f === 'film' ? '#151413' : '#fffdf8';
    if (f === 'torn') tornPath(c, w, h, M.hash(it.id));
    else if (f === 'scallop') scallopPath(c, w, h, false);
    else if (f === 'stamp') scallopPath(c, w, h, true);
    else if (f === 'rounded') { c.beginPath(); rr(c, -w / 2, -h / 2, w, h, m * 0.08); }
    else { c.beginPath(); c.rect(-w / 2, -h / 2, w, h); }
    c.fill();
    c.restore();
    if (f === 'polaroid' || f === 'white' || f === 'stamp') { // a little paper tooth
      var g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,100,70,0.08)');
      c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
    }
  };
  M.clipInner = function (c, f, ix, iy, iw, ih, w, h) {
    c.beginPath();
    if (f === 'rounded') rr(c, ix, iy, iw, ih, Math.min(w, h) * 0.08); else c.rect(ix, iy, iw, ih);
    c.clip();
  };
  M.drawFrameFront = function (c, it, S, ix, iy, iw, ih) {
    var f = it.frame || 'none', w = it.w, h = it.h, m = Math.min(w, h), i;
    if (f !== 'none' && f !== 'rounded' && f !== 'film') { c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = Math.max(0.6, m * 0.003); c.strokeRect(ix, iy, iw, ih); }
    if (f === 'polaroid' && it.caption) {
      var fs = m * 0.075; c.font = M.fontStr('hand', fs); c.fillStyle = '#3a3330'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(it.caption, 0, iy + ih + (h / 2 - (iy + ih)) / 2, iw);
    }
    if (f === 'film') {
      c.fillStyle = 'rgba(243,238,228,0.92)'; var hw = m * 0.045, hh = m * 0.06, gap = m * 0.03, n = Math.floor(w / (hw + gap));
      var off = (w - n * (hw + gap) + gap) / 2;
      for (i = 0; i < n; i++) { var x = -w / 2 + off + i * (hw + gap); c.beginPath(); rr(c, x, -h / 2 + m * 0.035, hw, hh, hw * 0.2); rr(c, x, h / 2 - m * 0.035 - hh, hw, hh, hw * 0.2); c.fill(); }
      c.fillStyle = '#f08a24'; c.font = '700 ' + (m * 0.03) + 'px "Courier New",monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('MOSAIC 400  ▸ ' + ((M.hash(it.id) % 36) + 1) + 'A', -w / 2 + m * 0.05, h / 2 - m * 0.012);
    }
    if (f === 'tape') {
      var tw = m * 0.42, th = m * 0.11, cols = ['#f7a8b8', '#9ed8d6', '#ffd86b', '#cdb4db', '#eee3c8'], ci = M.hash(it.id) % cols.length;
      c.save(); c.translate(-w / 2 + tw * 0.22, -h / 2 + tw * 0.1); c.rotate(-0.72); M.drawTape(c, tw, th, cols[ci], ci % 2 ? 'dots' : 'stripes', '#fff', M.hash(it.id)); c.restore();
      c.save(); c.translate(w / 2 - tw * 0.22, -h / 2 + tw * 0.1); c.rotate(0.72); M.drawTape(c, tw, th, cols[(ci + 2) % cols.length], 'none', '#fff', M.hash(it.id) + 3); c.restore();
    }
    if (f === 'clip') { c.save(); c.translate(-w * 0.22, -h / 2 + m * 0.06); c.rotate(0.06); paperclip(c, m * 0.12, m * 0.34, '#b9c0c8'); c.restore(); }
  };
})();
