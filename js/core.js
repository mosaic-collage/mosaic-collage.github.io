/* Mosaic — core: namespace, utilities, sound, IndexedDB storage */
(function () {
  'use strict';
  var M = window.M = window.M || {};

  M.W = 1000; // logical document width (all papers)
  M.PAPERS = {
    a4p:   { label: 'A4 portrait (210×297 mm)', ar: 210 / 297, print: { w: 210, h: 297, unit: 'mm' } },
    a4l:   { label: 'A4 landscape (297×210 mm)', ar: 297 / 210, print: { w: 297, h: 210, unit: 'mm' } },
    p46:   { label: '4×6 in photo, portrait', ar: 4 / 6, print: { w: 4, h: 6, unit: 'in' } },
    l64:   { label: '6×4 in photo, landscape', ar: 6 / 4, print: { w: 6, h: 4, unit: 'in' } },
    sq:    { label: 'Square (social post)', ar: 1 },
    story: { label: 'Story / phone wallpaper (9:16)', ar: 9 / 16 }
  };
  M.docH = function (P) { var p = M.PAPERS[(P && P.paper) || 'a4p'] || M.PAPERS.a4p; return Math.round(M.W / p.ar); };

  M.uid = function (pre) { return (pre || 'i') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); };
  M.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  M.lerp = function (a, b, t) { return a + (b - a) * t; };
  M.rng = function (seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  M.hash = function (str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  M.$ = function (s, r) { return (r || document).querySelector(s); };
  M.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  M.debounce = function (fn, ms) { var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); }; };
  M.esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  M.fmtBytes = function (b) {
    if (!isFinite(b) || b < 0) return '?';
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0;
    while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
    return (b >= 100 || i === 0 ? Math.round(b) : b.toFixed(1)) + ' ' + u[i];
  };
  M.timeAgo = function (t) {
    var s = (Date.now() - t) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' h ago';
    var d = Math.floor(s / 86400);
    return d === 1 ? 'yesterday' : d + ' days ago';
  };
  M.hexToRgb = function (h) {
    h = String(h || '#000').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  M.reduced = function () { return !!(mq && mq.matches); };
  M.lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  M.dpr = function () { return Math.min(2, window.devicePixelRatio || 1); };

  M.store = {
    get: function (k, d) { try { var v = localStorage.getItem('mosaic.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('mosaic.' + k, JSON.stringify(v)); } catch (e) { /* private mode: fine */ } }
  };

  M.FONTS = {
    hand:    { label: 'Scribble',        css: '"Segoe Print","Bradley Hand","Chalkboard SE","Comic Sans MS","Marker Felt",cursive', weight: 400 },
    marker:  { label: 'Marker',          css: '"Marker Felt","Segoe Print","Chalkboard SE","Comic Sans MS",cursive', weight: 700 },
    serif:   { label: 'Editorial serif', css: 'Didot,"Bodoni 72","Bodoni MT","Playfair Display",Georgia,"Times New Roman",serif', weight: 700 },
    classic: { label: 'Classic serif',   css: 'Georgia,"Times New Roman",Times,serif', weight: 400 },
    sans:    { label: 'Clean sans',      css: 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif', weight: 700 },
    impact:  { label: 'Headline',        css: 'Impact,Haettenschweiler,"Arial Narrow Bold","Franklin Gothic Bold","Helvetica Neue",Arial,sans-serif', weight: 900 },
    type:    { label: 'Typewriter',      css: '"American Typewriter","Courier New",Courier,monospace', weight: 400 },
    round:   { label: 'Rounded',         css: '"Arial Rounded MT Bold","Trebuchet MS",Verdana,sans-serif', weight: 700 }
  };
  M.fontStr = function (key, size) { var f = M.FONTS[key] || M.FONTS.hand; return f.weight + ' ' + size + 'px ' + f.css; };

  /* ---------- Toasts ---------- */
  M.toast = function (msg, kind) {
    var box = M.$('#toasts'); if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 400); }, 3200);
  };
  M.announce = function (msg) { var s = M.$('#srStatus'); if (s) { s.textContent = ''; setTimeout(function () { s.textContent = msg; }, 30); } };

  /* ---------- Sound (Web Audio, synthesized, off by default) ---------- */
  M.sfx = (function () {
    var ctx = null, on = !!M.store.get('sound', false), master = null;
    function ensure() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
      }
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      return ctx;
    }
    function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); }
    function noise(dur) {
      var len = Math.max(1, Math.floor(ctx.sampleRate * dur)), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      var s = ctx.createBufferSource(); s.buffer = b; return s;
    }
    function env(g, t, a, peak, dec) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
    }
    function tone(type, f0, f1, t, dur, vol) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env(g, t, 0.006, vol, dur); chain(o, g, master); o.start(t); o.stop(t + dur + 0.05);
    }
    var S = {
      tape: function () { // the satisfying rrrrip of washi tape
        var t = ctx.currentTime, n = noise(0.42), f = ctx.createBiquadFilter(), g = ctx.createGain(), am = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(1500, t + 0.38);
        lfo.frequency.value = 55; lg.gain.value = 0.5; am.gain.value = 0.5; chain(lfo, lg); lg.connect(am.gain);
        env(g, t, 0.01, 0.5, 0.36); chain(n, f, am, g, master); lfo.start(t); lfo.stop(t + 0.45); n.start(t); n.stop(t + 0.43);
      },
      pop: function () { var t = ctx.currentTime; tone('sine', 420, 980, t, 0.12, 0.35); tone('triangle', 1400, 700, t + 0.02, 0.08, 0.08); },
      paper: function () {
        var t = ctx.currentTime, n = noise(0.3), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'highpass'; f.frequency.value = 2400; env(g, t, 0.03, 0.18, 0.25); chain(n, f, g, master); n.start(t); n.stop(t + 0.31);
      },
      shutter: function () {
        var t = ctx.currentTime;
        [0, 0.085].forEach(function (dt, i) {
          var n = noise(0.05), f = ctx.createBiquadFilter(), g = ctx.createGain();
          f.type = 'bandpass'; f.frequency.value = i ? 2200 : 3400; f.Q.value = 1.4;
          env(g, t + dt, 0.002, 0.6, 0.045); chain(n, f, g, master); n.start(t + dt); n.stop(t + dt + 0.06);
        });
        tone('sine', 180, 90, t, 0.08, 0.2);
      },
      tink: function () { var t = ctx.currentTime; tone('sine', 2637, 0, t, 0.35, 0.16); tone('sine', 3951, 0, t, 0.22, 0.07); },
      snip: function () {
        var t = ctx.currentTime;
        [0, 0.07].forEach(function (dt) { var n = noise(0.03), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'highpass'; f.frequency.value = 5000; env(g, t + dt, 0.001, 0.4, 0.03); chain(n, f, g, master); n.start(t + dt); n.stop(t + dt + 0.04); });
      },
      whoosh: function () {
        var t = ctx.currentTime, n = noise(0.5), f = ctx.createBiquadFilter(), g = ctx.createGain();
        f.type = 'lowpass'; f.Q.value = 3; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.22); f.frequency.exponentialRampToValueAtTime(260, t + 0.48);
        env(g, t, 0.12, 0.3, 0.35); chain(n, f, g, master); n.start(t); n.stop(t + 0.5);
      },
      chime: function () { var t = ctx.currentTime; [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone('triangle', f, 0, t + i * 0.07, 0.5, 0.12); }); }
    };
    return {
      isOn: function () { return on; },
      set: function (v) { on = !!v; M.store.set('sound', on); if (on) ensure(); },
      unlock: function () { if (on) ensure(); },
      play: function (name) { if (!on || !ensure() || !S[name]) return; try { S[name](); } catch (e) { /* audio hiccup, ignore */ } }
    };
  })();

  /* ---------- IndexedDB: originals as Blobs + project JSON ---------- */
  M.db = (function () {
    var dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise(function (res, rej) {
        if (!('indexedDB' in window) || !window.indexedDB) { rej(new Error('IndexedDB unavailable')); return; }
        var r;
        try { r = indexedDB.open('mosaic-scrapbook', 1); } catch (e) { rej(e); return; }
        r.onupgradeneeded = function () {
          var d = r.result;
          if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' });
          if (!d.objectStoreNames.contains('images')) {
            var s = d.createObjectStore('images', { keyPath: 'id' });
            s.createIndex('project', 'project', { unique: false });
          }
        };
        r.onsuccess = function () { res(r.result); };
        r.onerror = function () { rej(r.error || new Error('open failed')); };
        r.onblocked = function () { rej(new Error('IndexedDB blocked by another tab')); };
      });
      dbp.catch(function () {});
      return dbp;
    }
    function tx(store, mode, fn) {
      return open().then(function (d) {
        return new Promise(function (res, rej) {
          var t = d.transaction(store, mode), s = t.objectStore(store), out, r = fn(s);
          if (r) r.onsuccess = function () { out = r.result; };
          t.oncomplete = function () { res(out); };
          t.onerror = function () { rej(t.error); };
          t.onabort = function () { rej(t.error || new Error('aborted')); };
        });
      });
    }
    return {
      open: open,
      put: function (st, v) { return tx(st, 'readwrite', function (s) { return s.put(v); }); },
      get: function (st, k) { return tx(st, 'readonly', function (s) { return s.get(k); }); },
      del: function (st, k) { return tx(st, 'readwrite', function (s) { return s.delete(k); }); },
      all: function (st) { return tx(st, 'readonly', function (s) { return s.getAll(); }); },
      imagesOf: function (pid) { return tx('images', 'readonly', function (s) { return s.index('project').getAll(pid); }); },
      delProject: function (pid) {
        return open().then(function (d) {
          return new Promise(function (res, rej) {
            var t = d.transaction(['projects', 'images'], 'readwrite');
            t.objectStore('projects').delete(pid);
            var imgs = t.objectStore('images'), r = imgs.index('project').openCursor(IDBKeyRange.only(pid));
            r.onsuccess = function () { var c = r.result; if (c) { c.delete(); c.continue(); } };
            t.oncomplete = function () { res(); };
            t.onerror = function () { rej(t.error); };
          });
        });
      }
    };
  })();
})();
