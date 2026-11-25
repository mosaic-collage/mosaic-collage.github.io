/* Mosaic — UI wiring: panes, controls, thumbnails, dialogs */
(function () {
  'use strict';
  var M = window.M, $ = M.$, $$ = M.$$;
  var U = M.ui = {};
  var THEMES = [
    { key: 'kraft', label: 'Kraft scrapbook', color: '#c8a27c' },
    { key: 'pastel', label: 'Pastel pinboard', color: '#f5dbe6' },
    { key: 'darkroom', label: 'Darkroom (safelight on)', color: '#17141a' },
    { key: 'zine', label: 'Photocopy zine', color: '#e9e9e6' }
  ];
  var curPane = 'photos', stickerCat = 'tape';

  function mini(w, h) { var d = M.dpr(), c = document.createElement('canvas'); c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.width = w + 'px'; c.style.height = h + 'px'; var x = c.getContext('2d'); x.scale(d, d); return { cv: c, ctx: x }; }
  function narrow() { return window.matchMedia('(max-width: 860px)').matches; }

  /* ---------- dialogs ---------- */
  U.openDlg = function (id) {
    var d = $('#' + id); if (!d) return;
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    M.sfx.play('paper');
  };
  U.closeDlg = function (d) { if (typeof d === 'string') d = $('#' + d); if (!d) return; if (typeof d.close === 'function') d.close(); else d.removeAttribute('open'); };

  /* ---------- panes ---------- */
  U.openPane = function (name, fromTab) {
    var panel = $('#panel'), studio = $('#studio');
    if (fromTab && narrow() && name === curPane && studio.classList.contains('sheet-open')) { studio.classList.remove('sheet-open'); setTimeout(function () { M.ed.fit(); }, 260); return; }
    curPane = name;
    $$('.tool').forEach(function (b) { var on = b.dataset.pane === name; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.classList.toggle('on', on); b.tabIndex = on ? 0 : -1; });
    $$('.pane').forEach(function (p) { p.hidden = p.id !== 'pane-' + name; });
    studio.classList.add('sheet-open');
    panel.scrollTop = 0;
    if (name === 'filters') refreshFilterThumbs();
    U.syncSel();
    setTimeout(function () { M.ed.fit(); }, 260);
  };

  /* ---------- selection-dependent sync ---------- */
  U.syncSel = function (light) {
    var it = M.ed.item(), isPhoto = !!it && it.type === 'photo', isText = !!it && it.type === 'text', isSt = !!it && it.type === 'sticker';
    var bar = $('#selBar'); bar.hidden = !it;
    $('#selCropBtn').hidden = !isPhoto;
    $('#selCropBtn').classList.toggle('on', M.ed.crop);
    // crop pane
    if (it) {
      $('#itemRot').value = Math.round(it.rot || 0); $('#itemRotOut').textContent = Math.round(it.rot || 0) + '°';
      var op = Math.round((it.op == null ? 1 : it.op) * 100); $('#opacityRange').value = op; $('#opacityOut').textContent = op + '%';
    }
    if (isPhoto) { var z = it.crop.z || 1; $('#cropZoom').value = Math.round(z * 100); $('#cropZoomOut').textContent = z.toFixed(1) + '×'; }
    if (light) return;
    $('#cropNeedSel').hidden = !!it;
    ['#cropToggle', '#cropZoom', '#rotLBtn', '#rotRBtn', '#flipBtn', '#resetCropBtn'].forEach(function (s) { $(s).disabled = !isPhoto; });
    ['#itemRot', '#opacityRange'].forEach(function (s) { $(s).disabled = !it; });
    var ct = $('#cropToggle'); ct.setAttribute('aria-pressed', M.ed.crop ? 'true' : 'false'); ct.querySelector('span').textContent = 'Crop mode: ' + (M.ed.crop ? 'on' : 'off'); ct.classList.toggle('on', M.ed.crop);
    // filters
    $('#filterNeedSel').hidden = isPhoto;
    $('#filterChips').classList.toggle('disabled', !isPhoto);
    ['#filterAmt', '#grainAmt', '#duoA', '#duoB'].forEach(function (s) { $(s).disabled = !isPhoto; });
    if (isPhoto) {
      var f = it.filter || M.defFilter();
      $$('#filterChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filter === f.name ? 'true' : 'false'); });
      $('#filterAmt').value = Math.round((f.amt == null ? 1 : f.amt) * 100); $('#filterAmtOut').textContent = $('#filterAmt').value + '%';
      $('#grainAmt').value = Math.round((f.grain || 0) * 100); $('#grainOut').textContent = $('#grainAmt').value + '%';
      $('#duoA').value = f.duoA || '#2b1f5c'; $('#duoB').value = f.duoB || '#ffb38a';
      $('#duoRow').hidden = f.name !== 'duotone';
      if (curPane === 'filters') refreshFilterThumbs();
    }
    // frames
    $('#frameNeedSel').hidden = isPhoto;
    $('#frameGrid').classList.toggle('disabled', !isPhoto);
    $$('#frameGrid .frame-btn').forEach(function (b) { b.setAttribute('aria-pressed', isPhoto && b.dataset.frame === (it.frame || 'none') ? 'true' : 'false'); });
    $('#captionRow').hidden = !(isPhoto && it.frame === 'polaroid');
    if (isPhoto) $('#captionInput').value = it.caption || '';
    // text
    var add = $('#addTextBtn span');
    if (isText) {
      $('#textInput').value = it.text; $('#fontSel').value = it.font; $('#textStyleSel').value = it.style; $('#textColor').value = it.color;
      $('#textBgColor').value = it.bg || '#ffe08a'; $('#textAlignSel').value = it.align || 'center';
      $('#textSize').value = M.clamp(Math.round(it.size), 16, 240); $('#textSizeOut').textContent = Math.round(it.size);
      add.textContent = 'Add another text';
    } else add.textContent = 'Add text';
    // stickers
    $('#stickerColorRow').hidden = !(isSt && !(M.stickerByKey(it.key) || {}).emoji);
    if (isSt && it.color) $('#stickerColor').value = toHex(it.color);
  };
  function toHex(c) { return /^#[0-9a-f]{6}$/i.test(c) ? c : '#f28fa5'; }
  U.syncAll = function () {
    var P = M.P; if (!P) return;
    $('#projName').value = P.name;
    $$('.layout-card').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.layout === P.layout ? 'true' : 'false'); });
    $('#paperSel').value = P.paper;
    var lo = P.lo || {};
    $('#gapRange').value = lo.gap == null ? 16 : lo.gap; $('#gapOut').textContent = $('#gapRange').value;
    $('#marginRange').value = lo.margin == null ? 40 : lo.margin; $('#marginOut').textContent = $('#marginRange').value;
    $('#colsSel').value = String(lo.cols || 0);
    $('#bgA').value = toHex(P.bg.a); $('#bgB').value = toHex(P.bg.b);
    $$('#bgGrid .bg-btn').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.bg === P.bg.type ? 'true' : 'false'); });
    U.renderTray(); U.syncEmpty(); U.syncSel();
  };
  U.syncEmpty = function () { var e = $('#emptyState'); if (e) e.hidden = !!(M.P && M.P.items.length); };

  /* ---------- photo tray ---------- */
  U.renderTray = function () {
    var tray = $('#photoTray'), recs = M.app ? M.app.images : [];
    tray.innerHTML = '';
    $('#trayEmpty').hidden = recs.length > 0;
    recs.forEach(function (r) {
      var e = M.imgs.get(r.id); if (!e) return;
      var used = M.P.items.some(function (i) { return i.img && i.img.id === r.id; });
      var wrapEl = document.createElement('div'); wrapEl.className = 'tray-item' + (used ? ' used' : '');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tray-add';
      b.setAttribute('aria-label', 'Add ' + (r.name || 'photo') + ' to the page' + (used ? ' (already on page)' : ''));
      var img = document.createElement('img'); img.src = e.url; img.alt = ''; img.loading = 'lazy'; b.appendChild(img);
      b.addEventListener('click', function () { M.app.placeImage(e); });
      var x = document.createElement('button'); x.type = 'button'; x.className = 'tray-x'; x.setAttribute('aria-label', 'Remove ' + (r.name || 'photo') + ' from project'); x.innerHTML = '<svg><use href="#i-close"/></svg>';
      x.addEventListener('click', function () { M.app.removeImage(r.id); });
      wrapEl.appendChild(b); wrapEl.appendChild(x); tray.appendChild(wrapEl);
    });
  };

  /* ---------- filter chips ---------- */
  function buildFilters() {
    var box = $('#filterChips');
    M.FILTERS.forEach(function (f) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.filter = f.key; b.setAttribute('aria-pressed', 'false');
      var m = mini(64, 64); m.cv.className = 'chip-cv'; b.appendChild(m.cv);
      var s = document.createElement('span'); s.textContent = f.label; b.appendChild(s);
      b.addEventListener('click', function () {
        var it = M.ed.item(); if (!it || it.type !== 'photo') { M.toast('Pick a photo first — filters need a face to flatter.'); return; }
        it.filter = Object.assign(M.defFilter(), it.filter || {}, { name: f.key });
        if (f.key !== 'none' && !it.filter.amt) it.filter.amt = 1;
        M.sfx.play('pop'); M.ed.draw(); U.syncSel(); M.ed.commit();
      });
      box.appendChild(b);
    });
  }
  var thumbFor = '';
  function refreshFilterThumbs(force) {
    var it = M.ed.item(), e = it && it.type === 'photo' && M.imgs.get(it.img.id);
    var key = e ? e.id + '|' + (it.filter ? it.filter.duoA + it.filter.duoB : '') : 'none';
    if (!force && key === thumbFor) return; thumbFor = key;
    var small = null;
    if (e) { small = document.createElement('canvas'); var k = 128 / Math.max(e.w, e.h); small.width = Math.max(1, Math.round(e.w * k)); small.height = Math.max(1, Math.round(e.h * k)); small.getContext('2d').drawImage(e.prev, 0, 0, small.width, small.height); }
    $$('#filterChips .chip').forEach(function (b) {
      var cv = b.querySelector('canvas'), c = cv.getContext('2d'), d = M.dpr();
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
      var src = small;
      if (!src) { src = document.createElement('canvas'); src.width = 96; src.height = 96; var sc = src.getContext('2d'), g = sc.createLinearGradient(0, 0, 0, 96); g.addColorStop(0, '#ffb38a'); g.addColorStop(0.55, '#f7a8b8'); g.addColorStop(0.56, '#4a7c59'); g.addColorStop(1, '#2a5d3b'); sc.fillStyle = g; sc.fillRect(0, 0, 96, 96); sc.fillStyle = '#fff6d6'; sc.beginPath(); sc.arc(62, 40, 13, 0, 7); sc.fill(); }
      var f = Object.assign(M.defFilter(), it && it.filter ? { duoA: it.filter.duoA, duoB: it.filter.duoB } : {}, { name: b.dataset.filter, amt: 1, grain: 0 });
      var out = M.applyFilter(src, f, 128), s = Math.max(cv.width / out.width, cv.height / out.height);
      c.drawImage(out, (cv.width - out.width * s) / 2, (cv.height - out.height * s) / 2, out.width * s, out.height * s);
      void d;
    });
  }
  U.refreshFilterThumbs = refreshFilterThumbs;

  /* ---------- stickers ---------- */
  function buildStickers() {
    var cats = $('#stickerCats');
    M.STICKER_CATS.forEach(function (c) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'seg-btn'; b.textContent = c.label; b.dataset.cat = c.key; b.setAttribute('aria-pressed', c.key === stickerCat ? 'true' : 'false');
      b.addEventListener('click', function () { stickerCat = c.key; $$('#stickerCats .seg-btn').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.cat === c.key ? 'true' : 'false'); }); fillStickers(); });
      cats.appendChild(b);
    });
    fillStickers();
  }
  function fillStickers() {
    var grid = $('#stickerGrid'); grid.innerHTML = '';
    M.STICKERS.filter(function (s) { return s.cat === stickerCat; }).forEach(function (s) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'sticker-btn'; b.setAttribute('aria-label', 'Add ' + s.label); b.title = s.label;
      var m = mini(72, 72), k = 60 / Math.max(s.w, s.h);
      M._S = M.dpr() * k;
      m.ctx.translate(36, 36); m.ctx.scale(k, k); s.draw(m.ctx, s.w, s.h, s.color);
      b.appendChild(m.cv);
      b.addEventListener('click', function () { M.app.addSticker(s); });
      grid.appendChild(b);
    });
  }

  /* ---------- frames ---------- */
  function buildFrames() {
    var grid = $('#frameGrid');
    M.FRAMES.forEach(function (f) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'frame-btn'; b.dataset.frame = f.key; b.setAttribute('aria-pressed', 'false');
      var m = mini(70, 78), c = m.ctx, it = { id: 'thumb-' + f.key, frame: f.key, w: 54, h: f.key === 'polaroid' ? 64 : 54, caption: f.key === 'polaroid' ? 'hi!' : '' };
      M._S = M.dpr();
      c.translate(35, 40); c.rotate(f.key === 'polaroid' ? -0.06 : 0);
      M.drawFrameBack(c, it, M.dpr());
      var ir = M.innerRect(it); c.save(); M.clipInner(c, f.key, ir.x, ir.y, ir.w, ir.h, it.w, it.h);
      var g = c.createLinearGradient(0, ir.y, 0, ir.y + ir.h); g.addColorStop(0, '#9ed8f0'); g.addColorStop(0.6, '#ffd3b6'); g.addColorStop(0.61, '#6aa36f'); g.addColorStop(1, '#3f7a4a');
      c.fillStyle = g; c.fillRect(ir.x, ir.y, ir.w, ir.h); c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(ir.x + ir.w * 0.68, ir.y + ir.h * 0.32, ir.w * 0.11, 0, 7); c.fill(); c.restore();
      M.drawFrameFront(c, it, M.dpr(), ir.x, ir.y, ir.w, ir.h);
      b.appendChild(m.cv); var s = document.createElement('span'); s.textContent = f.label; b.appendChild(s);
      b.addEventListener('click', function () {
        var it2 = M.ed.item(); if (!it2 || it2.type !== 'photo') { M.toast('Select a photo to frame it. Framing the void is a crime.'); return; }
        setFrame(it2, f.key); M.sfx.play(f.key === 'tape' ? 'tape' : f.key === 'clip' ? 'tink' : 'paper'); M.ed.draw(); U.syncSel(); M.ed.commit();
      });
      grid.appendChild(b);
    });
  }
  function setFrame(it, key) {
    var was = it.frame; it.frame = key;
    if (M.P.layout !== 'grid' && M.P.layout !== 'magazine') { // keep polaroids a polaroid shape
      if (key === 'polaroid' && was !== 'polaroid') { var c = it.y + it.h / 2; it.h = it.w * 1.18; it.y = c - it.h / 2; }
      else if (was === 'polaroid' && key !== 'polaroid') { var c2 = it.y + it.h / 2; it.h = it.w / 1.18; it.y = c2 - it.h / 2; }
    }
  }
  U.setFrame = setFrame;

  /* ---------- backgrounds ---------- */
  function buildBgs() {
    var grid = $('#bgGrid');
    M.BG_TYPES.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'bg-btn'; b.dataset.bg = t.key; b.setAttribute('aria-pressed', 'false');
      var m = mini(64, 80); m.ctx.scale(64 / 400, 80 / 500); M.drawBg(m.ctx, { type: t.key, a: t.a, b: t.b, seed: 5 }, 400, 500);
      b.appendChild(m.cv); var s = document.createElement('span'); s.textContent = t.label; b.appendChild(s);
      b.addEventListener('click', function () {
        var keep = M.P.bg.type === t.key;
        M.P.bg = { type: t.key, a: keep ? M.P.bg.a : t.a, b: keep ? M.P.bg.b : t.b, seed: keep ? (M.P.bg.seed + 1) : (M.P.bg.seed || 1) };
        M.sfx.play('paper'); M.ed.draw(); U.syncAll(); M.ed.commit();
      });
      grid.appendChild(b);
    });
    var row = $('#paletteRow');
    M.PALETTES.forEach(function (p, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'pal'; b.setAttribute('aria-label', 'Palette ' + (i + 1));
      b.style.background = 'linear-gradient(135deg,' + p[0] + ' 50%,' + p[1] + ' 50%)';
      b.addEventListener('click', function () { M.P.bg.a = p[0]; M.P.bg.b = p[1]; M.ed.draw(); U.syncAll(); M.ed.commit(); });
      row.appendChild(b);
    });
  }
  U.randomBg = function () {
    var t = M.BG_TYPES[Math.floor(Math.random() * M.BG_TYPES.length)], p = M.PALETTES[Math.floor(Math.random() * M.PALETTES.length)];
    var useDef = Math.random() < 0.4;
    M.P.bg = { type: t.key, a: useDef ? t.a : p[0], b: useDef ? t.b : p[1], seed: Math.floor(Math.random() * 1e6) };
    M.sfx.play('whoosh'); M.ed.draw(); U.syncAll(); M.ed.commit();
    M.toast(['Fresh paper, still warm.', 'A background so good it deserves its own collage.', 'Generated. No trees were harmed.', 'Hand-made by a very fast robot.'][Math.floor(Math.random() * 4)]);
  };

  /* ---------- themes & sound ---------- */
  U.setTheme = function (key, announce) {
    var t = THEMES.filter(function (x) { return x.key === key; })[0] || THEMES[0];
    document.documentElement.setAttribute('data-theme', t.key);
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', t.color);
    M.store.set('theme', t.key);
    if (announce) M.toast('Theme: ' + t.label);
  };
  function syncSound() {
    var on = M.sfx.isOn(), b = $('#soundBtn');
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.setAttribute('aria-label', 'Sound effects (' + (on ? 'on' : 'off') + ')'); b.classList.toggle('muted', !on);
  }

  /* ---------- export dialog ---------- */
  U.exportSizes = function (paper) {
    var P = M.PAPERS[paper] || M.PAPERS.a4p, out = [];
    if (P.print) {
      var inch = P.print.unit === 'mm' ? 25.4 : 1, wi = P.print.w / inch, hi = P.print.h / inch;
      var dpis = P.print.unit === 'mm' ? [150, 300] : [300, 600];
      dpis.forEach(function (d) { var w = Math.round(wi * d), h = Math.round(hi * d); out.push({ w: w, h: h, dpi: d, label: 'Print — ' + P.print.w + '×' + P.print.h + ' ' + P.print.unit + ' @ ' + d + ' dpi (' + w + '×' + h + ' px)' }); });
      var sw = P.ar >= 1 ? 1600 : Math.round(1600 * P.ar), sh = Math.round(sw / P.ar);
      out.unshift({ w: sw, h: sh, label: 'Screen — ' + sw + '×' + sh + ' px' });
    } else if (paper === 'sq') {
      [1080, 2048, 4000].forEach(function (s) { out.push({ w: s, h: s, label: (s === 1080 ? 'Social' : s === 2048 ? 'Large' : 'Huge') + ' — ' + s + '×' + s + ' px' }); });
    } else {
      out.push({ w: 1080, h: 1920, label: 'Phone — 1080×1920 px' }); out.push({ w: 2160, h: 3840, label: 'Ultra — 2160×3840 px' });
    }
    return out;
  };
  function fillExport() {
    var sel = $('#expSize'), sizes = U.exportSizes(M.P.paper); sel.innerHTML = '';
    sizes.forEach(function (s, i) { var o = document.createElement('option'); o.value = i; o.textContent = s.label; sel.appendChild(o); });
    sel.value = String(Math.min(sizes.length - 1, sizes.length > 2 ? 2 : 1));
    U.expSizes = sizes; syncExpInfo();
  }
  function syncExpInfo() {
    var s = U.expSizes[+$('#expSize').value] || U.expSizes[0], fmt = $('#expFormat').value, mp = (s.w * s.h / 1e6).toFixed(1);
    $('#expQualityRow').hidden = fmt !== 'jpeg';
    var txt = s.w + '×' + s.h + ' px · ' + mp + ' megapixels.';
    if (s.dpi) txt += ' The file is tagged as ' + s.dpi + ' dpi — print at 100% / "actual size" for an exact ' + M.PAPERS[M.P.paper].print.w + '×' + M.PAPERS[M.P.paper].print.h + ' ' + M.PAPERS[M.P.paper].print.unit + ' result.';
    if (s.w * s.h > 16.7e6) txt += ' Heads up: that is huge, older phones may refuse.';
    $('#expInfo').textContent = txt;
  }

  /* ---------- init ---------- */
  U.init = function () {
    // tabs
    $$('.tool').forEach(function (b) {
      b.addEventListener('click', function () { U.openPane(b.dataset.pane, true); M.sfx.play('paper'); });
      b.addEventListener('keydown', function (e) {
        var tabs = $$('.tool'), i = tabs.indexOf(b), n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); n.focus(); U.openPane(n.dataset.pane); }
      });
    });
    // paper select
    var ps = $('#paperSel');
    Object.keys(M.PAPERS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = M.PAPERS[k].label; ps.appendChild(o); });
    ps.addEventListener('change', function () { M.app.setPaper(ps.value); });
    // layout cards
    $$('.layout-card').forEach(function (b) {
      b.addEventListener('click', function () {
        var name = b.dataset.layout;
        M.applyLayout(M.P, name); M.ed.fit(); U.syncAll(); M.ed.commit();
        M.P.items.forEach(function (it, i) { if (it.type === 'photo') setTimeout(function () { M.ed.animate(it.id, { from: 0.85, drop: false, dur: 420 }); }, i * 40); });
        M.sfx.play(name === 'scatter' ? 'whoosh' : 'paper');
        M.toast({ grid: 'Grid: everything in its place. Marie would approve.', freeform: 'Freeform: drag things wherever your heart desires.', scatter: 'Polaroids scattered. Shake it like a… you know.', magazine: 'Cover star! Edit the headlines — double-tap any text.' }[name]);
      });
    });
    var lo = function () { M.P.lo = M.P.lo || {}; return M.P.lo; };
    var relayout = M.debounce(function () { M.ed.commit(); }, 300);
    $('#gapRange').addEventListener('input', function (e) { lo().gap = +e.target.value; $('#gapOut').textContent = e.target.value; if (M.P.layout === 'grid') { M.applyLayout(M.P, 'grid'); M.ed.draw(); } relayout(); });
    $('#marginRange').addEventListener('input', function (e) { lo().margin = +e.target.value; $('#marginOut').textContent = e.target.value; if (M.P.layout === 'grid') { M.applyLayout(M.P, 'grid'); M.ed.draw(); } relayout(); });
    $('#colsSel').addEventListener('change', function (e) { lo().cols = +e.target.value; M.applyLayout(M.P, 'grid'); M.ed.draw(); U.syncAll(); M.ed.commit(); });
    $('#shuffleBtn').addEventListener('click', function () { M.app.shuffle(); });

    // filters
    buildFilters();
    var fUpd = function (fn) { var it = M.ed.item(); if (!it || it.type !== 'photo') return; it.filter = Object.assign(M.defFilter(), it.filter || {}); fn(it.filter); M.ed.draw(); relayout(); };
    $('#filterAmt').addEventListener('input', function (e) { $('#filterAmtOut').textContent = e.target.value + '%'; fUpd(function (f) { f.amt = e.target.value / 100; if (f.name === 'none') f.name = 'vintage'; }); });
    $('#grainAmt').addEventListener('input', function (e) { $('#grainOut').textContent = e.target.value + '%'; fUpd(function (f) { f.grain = e.target.value / 100; }); });
    $('#duoA').addEventListener('input', function (e) { fUpd(function (f) { f.duoA = e.target.value; }); });
    $('#duoB').addEventListener('input', function (e) { fUpd(function (f) { f.duoB = e.target.value; }); });
    $('#duoA').addEventListener('change', function () { refreshFilterThumbs(true); });
    $('#duoB').addEventListener('change', function () { refreshFilterThumbs(true); });
    $('#filterAllBtn').addEventListener('click', function () {
      var it = M.ed.item(), f = it && it.type === 'photo' ? it.filter : null;
      if (!f) { M.toast('Select a photo whose filter you love, then share the love.'); return; }
      M.photos(M.P).forEach(function (p) { p.filter = Object.assign({}, f); }); M.ed.draw(); M.ed.commit(); M.toast('Filter applied to every photo. Consistency: achieved.');
    });

    // crop pane
    $('#cropToggle').addEventListener('click', function () { M.ed.setCrop(!M.ed.crop); M.sfx.play('snip'); if (M.ed.crop) M.toast('Crop mode: drag to pan, pinch or scroll to zoom.'); });
    $('#selCropBtn').addEventListener('click', function () { M.ed.setCrop(!M.ed.crop); U.openPane('crop'); });
    $('#cropZoom').addEventListener('input', function (e) { var it = M.ed.item(); if (!it || it.type !== 'photo') return; it.crop.z = e.target.value / 100; $('#cropZoomOut').textContent = it.crop.z.toFixed(1) + '×'; M.ed.draw(); relayout(); });
    var rot90 = function (d) { var it = M.ed.item(); if (!it || it.type !== 'photo') return; it.crop.r = ((it.crop.r || 0) + d + 360) % 360; it.crop.cx = 0.5; it.crop.cy = 0.5; M.sfx.play('snip'); M.ed.draw(); M.ed.commit(); };
    $('#rotLBtn').addEventListener('click', function () { rot90(-90); });
    $('#rotRBtn').addEventListener('click', function () { rot90(90); });
    $('#flipBtn').addEventListener('click', function () { var it = M.ed.item(); if (!it || it.type !== 'photo') return; it.crop.flip = !it.crop.flip; M.ed.draw(); M.ed.commit(); });
    $('#itemRot').addEventListener('input', function (e) { var it = M.ed.item(); if (!it) return; it.rot = +e.target.value; $('#itemRotOut').textContent = e.target.value + '°'; M.ed.draw(); relayout(); });
    $('#opacityRange').addEventListener('input', function (e) { var it = M.ed.item(); if (!it) return; it.op = e.target.value / 100; $('#opacityOut').textContent = e.target.value + '%'; M.ed.draw(); relayout(); });
    $('#resetCropBtn').addEventListener('click', function () { var it = M.ed.item(); if (!it || it.type !== 'photo') return; it.crop = { z: 1, cx: 0.5, cy: 0.5, r: 0, flip: false }; it.rot = 0; M.ed.draw(); U.syncSel(); M.ed.commit(); M.toast('Back to factory settings. Like it never happened.'); });

    // stickers
    buildStickers();
    $('#stickerColor').addEventListener('input', function (e) { var it = M.ed.item(); if (!it || it.type !== 'sticker') return; it.color = e.target.value; M.ed.draw(); relayout(); });

    // text
    var fs = $('#fontSel');
    Object.keys(M.FONTS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = M.FONTS[k].label; o.style.fontFamily = M.FONTS[k].css; fs.appendChild(o); });
    var tUpd = function () {
      var it = M.ed.item(); if (!it || it.type !== 'text') return;
      it.text = $('#textInput').value || ' '; it.font = fs.value; it.style = $('#textStyleSel').value; it.color = $('#textColor').value; it.bg = $('#textBgColor').value; it.align = $('#textAlignSel').value; it.size = +$('#textSize').value;
      $('#textSizeOut').textContent = it.size; M.measureText(it, true); M.ed.draw(); relayout();
    };
    ['#textInput', '#textColor', '#textBgColor', '#textSize'].forEach(function (s) { $(s).addEventListener('input', tUpd); });
    ['#fontSel', '#textStyleSel', '#textAlignSel'].forEach(function (s) { $(s).addEventListener('change', tUpd); });
    $('#textSize').addEventListener('input', function (e) { $('#textSizeOut').textContent = e.target.value; });
    $('#addTextBtn').addEventListener('click', function () { M.app.addText(); });

    // frames
    buildFrames();
    $('#captionInput').addEventListener('input', function (e) { var it = M.ed.item(); if (!it || it.type !== 'photo') return; it.caption = e.target.value; M.ed.draw(); relayout(); });
    $('#frameAllBtn').addEventListener('click', function () {
      var it = M.ed.item(); if (!it || it.type !== 'photo') { M.toast('Select a framed photo first, then we copy its style.'); return; }
      M.photos(M.P).forEach(function (p) { if (p !== it) setFrame(p, it.frame); }); M.ed.draw(); M.ed.commit(); M.toast('Every photo got the same frame. Matching outfits!');
    });

    // backgrounds
    buildBgs();
    $('#bgA').addEventListener('input', function (e) { M.P.bg.a = e.target.value; M.ed.draw(); relayout(); });
    $('#bgB').addEventListener('input', function (e) { M.P.bg.b = e.target.value; M.ed.draw(); relayout(); });
    $('#bgRandomBtn').addEventListener('click', U.randomBg);

    // selection bar
    $('#selFwdBtn').addEventListener('click', function () { M.ed.order(1); });
    $('#selBackBtn').addEventListener('click', function () { M.ed.order(-1); });
    $('#selDupBtn').addEventListener('click', function () { M.ed.dup(); });
    $('#selDelBtn').addEventListener('click', function () { M.ed.del(); });

    // top bar
    $('#undoBtn').addEventListener('click', function () { M.ed.undo(); });
    $('#redoBtn').addEventListener('click', function () { M.ed.redo(); });
    $('#projectsBtn').addEventListener('click', function () { M.app.refreshProjects(); U.openDlg('projectsDlg'); });
    $('#aboutBtn').addEventListener('click', function () { U.openDlg('aboutDlg'); });
    $('#exportBtn').addEventListener('click', function () { fillExport(); $('#expProgress').textContent = ''; U.openDlg('exportDlg'); });
    $('#themeBtn').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme'), i = THEMES.map(function (t) { return t.key; }).indexOf(cur);
      U.setTheme(THEMES[(i + 1) % THEMES.length].key, true); M.sfx.play('tink');
    });
    $('#soundBtn').addEventListener('click', function () { M.sfx.set(!M.sfx.isOn()); syncSound(); if (M.sfx.isOn()) { M.sfx.play('tape'); M.toast('Sound on. Rrrrip! (That was washi tape.)'); } });
    $('#projName').addEventListener('input', M.debounce(function (e) { M.P.name = e.target.value.trim() || 'Untitled scrapbook'; M.app.save(); }, 400));
    syncSound();

    // export
    $('#expSize').addEventListener('change', syncExpInfo);
    $('#expFormat').addEventListener('change', syncExpInfo);
    $('#expQuality').addEventListener('input', function (e) { $('#expQualityOut').textContent = e.target.value; });
    $('#expGo').addEventListener('click', function () { M.app.exportImage(U.expSizes[+$('#expSize').value], $('#expFormat').value, $('#expQuality').value / 100); });

    // dialogs
    $$('dialog').forEach(function (d) {
      d.addEventListener('click', function (e) {
        if (e.target !== d) return;
        var r = d.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) U.closeDlg(d);
      });
      $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { U.closeDlg(d); }); });
    });
    U.setTheme(M.store.get('theme', 'kraft'));
  };
})();
