/* Mosaic — editor: stage sizing, pointer/touch/pinch gestures, keyboard, history */
(function () {
  'use strict';
  var M = window.M;
  var E = M.ed = { sel: null, crop: false, S: 1, cs: 1 };
  var canvas, ctx, stage, wrap, raf = 0;

  E.init = function () {
    canvas = M.$('#stageCanvas'); ctx = canvas.getContext('2d'); stage = M.$('#stage'); wrap = M.$('#stageWrap');
    if (window.ResizeObserver) new ResizeObserver(function () { E.fit(); }).observe(wrap);
    window.addEventListener('resize', M.debounce(function () { E.fit(); }, 80));
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('lostpointercapture', function (e) { if (ptrs.has(e.pointerId)) onUp(e); });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('dblclick', onDbl);
    canvas.addEventListener('contextmenu', function (e) { if (E.sel) e.preventDefault(); });
    document.addEventListener('keydown', onKey);
  };

  E.fit = function () {
    if (!M.P || !wrap) return;
    var H = M.docH(M.P), narrow = wrap.clientWidth < 600, pad = narrow ? 16 : 40;
    var rw = Math.max(100, wrap.clientWidth - pad * 2), rh = Math.max(100, wrap.clientHeight - pad * 2 - (narrow ? 50 : 56));
    var k = Math.min(rw / M.W, rh / H);
    var cw = Math.max(80, Math.floor(M.W * k)), ch = Math.max(80, Math.floor(H * k)), d = M.dpr();
    stage.style.width = cw + 'px'; stage.style.height = ch + 'px';
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    var pw = Math.round(cw * d), ph = Math.round(ch * d);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    E.cs = cw / M.W; E.S = pw / M.W;
    E.draw();
  };
  E.draw = function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; paint(); }); };
  function paint() {
    if (!M.P) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    M.render(ctx, M.P, E.S, { sel: E.sel, crop: E.crop, hs: 12 / E.cs, lw: 1 / E.cs });
    if (M.anims.size) E.draw();
  }
  E.animate = function (id, opts) {
    if (M.reduced()) return;
    M.anims.set(id, Object.assign({ t0: performance.now(), dur: 380, from: 1.25, drop: true }, opts || {}));
    E.draw();
  };

  /* ---------- selection & item ops ---------- */
  E.item = function () { return E.sel && M.P ? M.find(M.P, E.sel) : null; };
  E.select = function (id, quiet) {
    E.sel = id || null;
    var it = E.item();
    if (!it || it.type !== 'photo') E.crop = false;
    if (M.ui) M.ui.syncSel();
    if (!quiet && it) M.announce((it.type === 'photo' ? 'Photo' : it.type === 'text' ? 'Text "' + it.text.slice(0, 30) + '"' : 'Sticker') + ' selected');
    E.draw();
  };
  E.setCrop = function (on) {
    var it = E.item(); E.crop = !!on && !!it && it.type === 'photo';
    if (M.ui) M.ui.syncSel(); E.draw();
  };
  E.add = function (it, anim) {
    M.P.items.push(it); E.select(it.id, true);
    if (anim !== false) E.animate(it.id);
    E.commit();
  };
  E.del = function () {
    var it = E.item(); if (!it) return;
    M.P.items = M.P.items.filter(function (i) { return i.id !== it.id; });
    E.sel = null; E.crop = false;
    if (it.type === 'photo') M.reflow(M.P);
    M.sfx.play('snip'); M.announce('Deleted. It has gone to the big shoebox in the sky.');
    if (M.ui) M.ui.syncSel(); E.commit(); E.draw();
  };
  E.dup = function () {
    var it = E.item(); if (!it) return;
    var c = JSON.parse(JSON.stringify(it)); c.id = M.uid(it.type[0]); c.x += 30; c.y += 30; delete c.layoutTag;
    M.P.items.splice(M.P.items.indexOf(it) + 1, 0, c);
    E.select(c.id, true); E.animate(c.id, { from: 1.1, drop: false }); M.sfx.play('pop'); E.commit();
  };
  E.order = function (dir) {
    var it = E.item(); if (!it) return;
    var a = M.P.items, i = a.indexOf(it), j = M.clamp(i + dir, 0, a.length - 1);
    if (i === j) { M.toast(dir > 0 ? 'Already on top. It can see its house from here.' : 'Already at the bottom of the pile.'); return; }
    a.splice(i, 1); a.splice(j, 0, it); E.commit(); E.draw();
  };
  E.cycle = function (d) {
    var a = M.P.items; if (!a.length) return;
    var i = E.sel ? a.indexOf(E.item()) : -1, j = ((i + d) % a.length + a.length) % a.length;
    E.select(a[j].id);
  };

  /* ---------- history ---------- */
  var hist = { stack: [], i: -1 };
  function snap() { return JSON.stringify({ items: M.P.items, bg: M.P.bg, paper: M.P.paper, layout: M.P.layout, lo: M.P.lo }); }
  E.resetHistory = function () { hist = { stack: [snap()], i: 0 }; syncUndo(); };
  E.commit = function () {
    if (!M.P) return;
    var s = snap(); if (hist.stack[hist.i] === s) { if (M.app) M.app.save(); return; }
    hist.stack = hist.stack.slice(0, hist.i + 1); hist.stack.push(s);
    if (hist.stack.length > 60) hist.stack.shift();
    hist.i = hist.stack.length - 1; syncUndo();
    if (M.app) M.app.save();
  };
  function restore(s) {
    var o = JSON.parse(s); var paperChanged = o.paper !== M.P.paper;
    M.P.items = o.items; M.P.bg = o.bg; M.P.paper = o.paper; M.P.layout = o.layout; M.P.lo = o.lo;
    if (E.sel && !M.find(M.P, E.sel)) { E.sel = null; E.crop = false; }
    if (paperChanged) E.fit(); E.draw(); if (M.ui) M.ui.syncAll(); syncUndo(); if (M.app) M.app.save();
  }
  E.undo = function () { if (hist.i > 0) { hist.i--; restore(hist.stack[hist.i]); M.sfx.play('paper'); } else M.toast('Nothing to undo. Your past is spotless.'); };
  E.redo = function () { if (hist.i < hist.stack.length - 1) { hist.i++; restore(hist.stack[hist.i]); M.sfx.play('paper'); } };
  function syncUndo() { var u = M.$('#undoBtn'), r = M.$('#redoBtn'); if (u) u.disabled = hist.i <= 0; if (r) r.disabled = hist.i >= hist.stack.length - 1; }

  /* ---------- geometry ---------- */
  function pt(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * M.W, y: (e.clientY - r.top) / r.height * M.docH(M.P) };
  }
  function center(it) { return { x: it.x + it.w / 2, y: it.y + it.h / 2 }; }
  function toLocal(it, x, y) {
    var c = center(it), a = -(it.rot || 0) * Math.PI / 180, dx = x - c.x, dy = y - c.y;
    return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
  }
  function hitItem(x, y) {
    var a = M.P.items;
    for (var i = a.length - 1; i >= 0; i--) { var it = a[i], l = toLocal(it, x, y); if (Math.abs(l.x) <= it.w / 2 && Math.abs(l.y) <= it.h / 2) return it; }
    return null;
  }
  function hitHandle(it, x, y, touch) {
    var l = toLocal(it, x, y), hs = 12 / E.cs, R = (touch ? 24 : 14) / E.cs, ry = -it.h / 2 - hs * 2.6;
    if (Math.hypot(l.x, l.y - ry) <= R) return 'rot';
    var cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (var i = 0; i < 4; i++) if (Math.hypot(l.x - cs[i][0] * it.w / 2, l.y - cs[i][1] * it.h / 2) <= R) return 'scale';
    return null;
  }
  function orig(it) { return { x: it.x, y: it.y, w: it.w, h: it.h, rot: it.rot || 0, size: it.size }; }
  function scaleItem(it, o, k) {
    var c = { x: o.x + o.w / 2, y: o.y + o.h / 2 };
    if (it.type === 'text') { it.size = M.clamp(o.size * k, 8, 600); M.measureText(it); }
    else { var mn = 24 / Math.min(o.w, o.h); k = Math.max(k, mn); k = Math.min(k, 6000 / Math.max(o.w, o.h)); it.w = o.w * k; it.h = o.h * k; }
    it.x = c.x - it.w / 2; it.y = c.y - it.h / 2;
  }
  function normDeg(d) { d = ((d + 180) % 360 + 360) % 360 - 180; return Math.round(d * 10) / 10; }
  function panCrop(it, o, dx, dy) {
    var a = -(it.rot || 0) * Math.PI / 180, lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a);
    var ir = M.innerRect(it), g = M.cropGeom(Object.assign({}, it, { crop: o }), ir.w, ir.h);
    var nc = Object.assign({}, it.crop, { cx: g.cx - lx / g.base / g.sw, cy: g.cy - ly / g.base / g.sh });
    var g2 = M.cropGeom(Object.assign({}, it, { crop: nc }), ir.w, ir.h);
    it.crop.cx = g2.cx; it.crop.cy = g2.cy;
  }

  /* ---------- pointer gestures ---------- */
  var ptrs = new Map(), g = null;
  function onDown(e) {
    if (e.button && e.button !== 0) return;
    M.sfx.unlock();
    try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
    var p = pt(e); ptrs.set(e.pointerId, p);
    if (ptrs.size === 2) { startPinch(); return; }
    if (ptrs.size > 2) return;
    var s = E.item(), touch = e.pointerType === 'touch';
    if (s && !E.crop) {
      var h = hitHandle(s, p.x, p.y, touch);
      if (h) { var c = center(s); g = { mode: h, it: s, o: orig(s), c: c, d0: Math.max(1, Math.hypot(p.x - c.x, p.y - c.y)), a0: Math.atan2(p.y - c.y, p.x - c.x) }; e.preventDefault(); return; }
    }
    var hit = hitItem(p.x, p.y);
    if (E.crop && s && s.type === 'photo' && (hit === s || !hit)) { g = { mode: 'pan', it: s, start: p, oc: Object.assign({}, s.crop) }; return; }
    if (hit) {
      if (hit.id !== E.sel) { E.select(hit.id); M.sfx.play('paper'); }
      g = { mode: 'move', it: hit, start: p, o: orig(hit), moved: false };
    } else { E.select(null); g = null; }
  }
  function startPinch() {
    var s = E.item(), v = Array.from(ptrs.values());
    if (!s) { var mid = { x: (v[0].x + v[1].x) / 2, y: (v[0].y + v[1].y) / 2 }, h = hitItem(mid.x, mid.y); if (h) { E.select(h.id, true); s = h; } }
    if (!s) { g = null; return; }
    g = { mode: 'pinch', it: s, d0: Math.max(1, Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y)), a0: Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x), o: orig(s), oc: Object.assign({}, s.crop || {}) };
  }
  function onMove(e) {
    if (!ptrs.has(e.pointerId)) {
      if (e.pointerType === 'mouse' && M.P) {
        var p0 = pt(e), s0 = E.item(), h0 = s0 && !E.crop ? hitHandle(s0, p0.x, p0.y, false) : null;
        canvas.style.cursor = h0 === 'rot' ? 'grab' : h0 === 'scale' ? 'nwse-resize' : E.crop ? 'move' : hitItem(p0.x, p0.y) ? 'move' : 'default';
      }
      return;
    }
    var p = pt(e); ptrs.set(e.pointerId, p);
    if (!g) return;
    var it = g.it;
    if (g.mode === 'move') {
      var dx = p.x - g.start.x, dy = p.y - g.start.y;
      if (!g.moved && Math.hypot(dx, dy) < 3 / E.cs) return;
      g.moved = true; it.x = g.o.x + dx; it.y = g.o.y + dy;
      // gentle snap of centre to page centre lines
      var W = M.W, H = M.docH(M.P), cx = it.x + it.w / 2, cy = it.y + it.h / 2, sn = 6 / E.cs;
      if (Math.abs(cx - W / 2) < sn) it.x = W / 2 - it.w / 2;
      if (Math.abs(cy - H / 2) < sn) it.y = H / 2 - it.h / 2;
    } else if (g.mode === 'scale') {
      scaleItem(it, g.o, Math.hypot(p.x - g.c.x, p.y - g.c.y) / g.d0);
    } else if (g.mode === 'rot') {
      var deg = g.o.rot + (Math.atan2(p.y - g.c.y, p.x - g.c.x) - g.a0) * 180 / Math.PI;
      if (e.shiftKey) deg = Math.round(deg / 15) * 15;
      else { var near = Math.round(deg / 90) * 90; if (Math.abs(deg - near) < 3) deg = near; }
      it.rot = normDeg(deg);
    } else if (g.mode === 'pan') {
      panCrop(it, g.oc, p.x - g.start.x, p.y - g.start.y);
    } else if (g.mode === 'pinch') {
      var v = Array.from(ptrs.values()); if (v.length < 2) return;
      var k = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y) / g.d0, ang = Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x) - g.a0;
      if (E.crop && it.type === 'photo') it.crop.z = M.clamp((g.oc.z || 1) * k, 1, 6);
      else { scaleItem(it, g.o, k); it.rot = normDeg(g.o.rot + ang * 180 / Math.PI); }
    }
    g.changed = true; E.draw();
    if (M.ui) M.ui.syncSel(true);
  }
  function onUp(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    try { canvas.releasePointerCapture(e.pointerId); } catch (x) {}
    if (g && g.mode === 'pinch' && ptrs.size === 1) { if (g.changed) E.commit(); g = null; return; }
    if (ptrs.size === 0) { if (g && g.changed) { E.commit(); if (g.mode === 'move') M.sfx.play('paper'); } g = null; }
  }
  var wheelCommit = M.debounce(function () { E.commit(); }, 350);
  function onWheel(e) {
    var it = E.item(); if (!it) return;
    e.preventDefault();
    var k = Math.exp(-M.clamp(e.deltaY, -100, 100) * 0.0018);
    if (E.crop && it.type === 'photo') it.crop.z = M.clamp((it.crop.z || 1) * k, 1, 6);
    else if (e.altKey) it.rot = normDeg((it.rot || 0) + (e.deltaY > 0 ? 3 : -3));
    else scaleItem(it, orig(it), k);
    E.draw(); if (M.ui) M.ui.syncSel(true); wheelCommit();
  }
  function onDbl(e) {
    var p = pt(e), it = hitItem(p.x, p.y); if (!it) return;
    E.select(it.id, true);
    if (it.type === 'photo') { E.setCrop(!E.crop); if (M.ui) M.ui.openPane('crop'); }
    else if (it.type === 'text' && M.ui) { M.ui.openPane('text'); var ti = M.$('#textInput'); if (ti) { ti.focus(); ti.select(); } }
  }
  function typing(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); }
  function onKey(e) {
    if (!M.P) return;
    var mod = e.ctrlKey || e.metaKey, k = e.key;
    if (document.querySelector('dialog[open]')) return;
    if (typing(e.target)) return;
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) E.redo(); else E.undo(); return; }
    if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); E.redo(); return; }
    var it = E.item();
    if (mod && (k === 'd' || k === 'D')) { if (it) { e.preventDefault(); E.dup(); } return; }
    if (k === ',' || k === '.') { if (e.target === canvas) { e.preventDefault(); E.cycle(k === '.' ? 1 : -1); } return; }
    if (!it) return;
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); E.del(); return; }
    if (k === 'Escape') { E.select(null); return; }
    if (k === '[' || k === ']') { E.order(k === ']' ? 1 : -1); return; }
    var step = e.shiftKey ? 10 : 2, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[k];
    if (mv && (e.target === canvas || e.target === document.body)) {
      e.preventDefault();
      if (E.crop && it.type === 'photo') panCrop(it, Object.assign({}, it.crop), -mv[0], -mv[1]);
      else { it.x += mv[0]; it.y += mv[1]; }
      E.draw(); wheelCommit();
    }
  }
})();
