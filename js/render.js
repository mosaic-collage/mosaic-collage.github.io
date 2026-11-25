/* Mosaic — scene rendering, image cache, text, layouts */
(function () {
  'use strict';
  var M = window.M;

  /* ---------- image cache ---------- */
  M.imgs = new Map();          // imageId -> {id, rec, url, img, w, h, prev}
  var fcache = new Map();      // preview filtered canvases (LRU)
  var hcache = new Map();      // hi-res filtered canvases (cleared after export)
  M.anims = new Map();

  function loadImg(url) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.decoding = 'async';
      im.onload = function () { res(im); };
      im.onerror = function () { rej(new Error('Could not decode image')); };
      im.src = url;
    });
  }
  M.loadImageRecord = function (rec) {
    if (M.imgs.has(rec.id)) return Promise.resolve(M.imgs.get(rec.id));
    var url = URL.createObjectURL(rec.blob);
    return loadImg(url).then(function (img) {
      var w = img.naturalWidth, h = img.naturalHeight, prev = img, k = 1400 / Math.max(w, h);
      if (k < 1) {
        prev = document.createElement('canvas'); prev.width = Math.round(w * k); prev.height = Math.round(h * k);
        var c = prev.getContext('2d'); c.imageSmoothingQuality = 'high'; c.drawImage(img, 0, 0, prev.width, prev.height);
      }
      var e = { id: rec.id, rec: rec, url: url, img: img, w: w, h: h, prev: prev };
      M.imgs.set(rec.id, e);
      return e;
    }, function (err) { URL.revokeObjectURL(url); throw err; });
  };
  M.forgetImage = function (id) {
    var e = M.imgs.get(id); if (!e) return;
    try { URL.revokeObjectURL(e.url); } catch (x) {}
    M.imgs.delete(id);
    fcache.forEach(function (v, k) { if (k.indexOf(id + '|') === 0) fcache.delete(k); });
  };
  M.clearImages = function () { M.imgs.forEach(function (e) { try { URL.revokeObjectURL(e.url); } catch (x) {} }); M.imgs.clear(); fcache.clear(); hcache.clear(); };
  M.clearHiCache = function () { hcache.clear(); };

  M.getSource = function (it, hi) {
    var e = it.img && M.imgs.get(it.img.id); if (!e) return null;
    if (M.isPlain(it.filter)) return hi ? e.img : e.prev;
    var key = e.id + '|' + M.filterSig(it.filter), cache = hi ? hcache : fcache, cv = cache.get(key);
    if (cv) { cache.delete(key); cache.set(key, cv); return cv; }
    cv = M.applyFilter(hi ? e.img : e.prev, it.filter, hi ? 4096 : 1400);
    cache.set(key, cv);
    if (!hi && cache.size > 36) cache.delete(cache.keys().next().value);
    return cv;
  };

  /* ---------- text ---------- */
  var mcv = document.createElement('canvas'), mctx = mcv.getContext('2d');
  function padFor(it) {
    var s = it.size;
    switch (it.style) {
      case 'tape': return { x: s * 0.6, y: s * 0.32 };
      case 'tag': return { x: s * 0.8, y: s * 0.34 };
      case 'highlight': return { x: s * 0.28, y: s * 0.14 };
      case 'outline': return { x: s * 0.22, y: s * 0.16 };
      default: return { x: s * 0.14, y: s * 0.1 };
    }
  }
  M.measureText = function (it, keepCenter) {
    var cx = it.x + (it.w || 0) / 2, cy = it.y + (it.h || 0) / 2;
    mctx.font = M.fontStr(it.font, it.size);
    var lines = String(it.text || ' ').split('\n'), mw = 0;
    lines.forEach(function (l) { mw = Math.max(mw, mctx.measureText(l || ' ').width); });
    var pad = padFor(it);
    it.w = Math.max(20, mw + pad.x * 2);
    it.h = Math.max(20, lines.length * it.size * 1.2 + pad.y * 2);
    if (keepCenter) { it.x = cx - it.w / 2; it.y = cy - it.h / 2; }
    return it;
  };
  M.makeText = function (o) {
    var it = Object.assign({ id: M.uid('t'), type: 'text', text: 'hello', font: 'hand', size: 64, color: '#2b2420', bg: '#ffe08a', style: 'plain', align: 'center', x: 0, y: 0, w: 0, h: 0, rot: 0, op: 1 }, o);
    M.measureText(it);
    if (o.cx != null) { it.x = o.cx - it.w / 2; delete it.cx; }
    if (o.cy != null) { it.y = o.cy - it.h / 2; delete it.cy; }
    return it;
  };
  function drawText(c, it, S) {
    var lines = String(it.text || ' ').split('\n'), s = it.size, lh = s * 1.2, pad = padFor(it), w = it.w, h = it.h;
    var font = M.fontStr(it.font, s);
    if (it.style === 'tape') M.drawTape(c, w, h, it.bg, 'none', '#fff', M.hash(it.id));
    else if (it.style === 'tag') {
      c.save(); c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = s * 0.15 * S; c.shadowOffsetY = s * 0.05 * S;
      c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2 + h * 0.4, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2 + h * 0.4, h / 2); c.closePath();
      c.fillStyle = it.bg; c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(-w / 2 + h * 0.38, 0, Math.min(h * 0.1, s * 0.16), 0, Math.PI * 2); c.fill();
    }
    c.font = font; c.textBaseline = 'middle';
    var al = it.align || 'center', tx = al === 'left' ? -w / 2 + pad.x : al === 'right' ? w / 2 - pad.x : 0;
    if (it.style === 'tag' && al !== 'right') tx += al === 'left' ? s * 0.2 : s * 0.18;
    c.textAlign = al;
    lines.forEach(function (ln, i) {
      var y = -h / 2 + pad.y + lh * (i + 0.5);
      if (it.style === 'highlight' && ln) {
        var lw = c.measureText(ln).width, x0 = al === 'left' ? tx : al === 'right' ? tx - lw : tx - lw / 2;
        c.save(); c.fillStyle = M.rgba(it.bg, 0.75); c.translate(x0 + lw / 2, y + s * 0.12); c.rotate(-0.015 + (i % 2) * 0.02);
        c.beginPath(); M.rr(c, -lw / 2 - s * 0.18, -s * 0.3, lw + s * 0.36, s * 0.58, s * 0.1); c.fill(); c.restore();
      }
    });
    if (it.style === 'shadow') { c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = s * 0.14 * S; c.shadowOffsetY = s * 0.05 * S; }
    lines.forEach(function (ln, i) {
      var y = -h / 2 + pad.y + lh * (i + 0.5);
      if (it.style === 'outline') { c.save(); c.lineJoin = 'round'; c.strokeStyle = it.bg; c.lineWidth = s * 0.24; c.strokeText(ln, tx, y); c.restore(); }
      c.fillStyle = it.color; c.fillText(ln, tx, y);
    });
    c.shadowColor = 'transparent';
  }
  M.drawText = drawText;

  /* ---------- photo ---------- */
  M.cropGeom = function (it, iw, ih) {
    var m = it.img, cr = it.crop || {}, r = (((cr.r || 0) % 360) + 360) % 360;
    var sw = (r === 90 || r === 270) ? m.h : m.w, sh = (r === 90 || r === 270) ? m.w : m.h;
    var base = Math.max(iw / sw, ih / sh) * (cr.z || 1);
    var hvx = iw / base / sw / 2, hvy = ih / base / sh / 2;
    var cx = M.clamp(cr.cx == null ? 0.5 : cr.cx, hvx, 1 - hvx), cy = M.clamp(cr.cy == null ? 0.5 : cr.cy, hvy, 1 - hvy);
    return { r: r, sw: sw, sh: sh, base: base, cx: cx, cy: cy };
  };
  M.innerRect = function (it) {
    var ins = M.frameInset(it.frame, it.w, it.h);
    return { x: -it.w / 2 + ins.l, y: -it.h / 2 + ins.t, w: Math.max(1, it.w - ins.l - ins.r), h: Math.max(1, it.h - ins.t - ins.b) };
  };
  function drawPhoto(c, it, S, opt) {
    M.drawFrameBack(c, it, S);
    var ir = M.innerRect(it);
    c.save();
    M.clipInner(c, it.frame, ir.x, ir.y, ir.w, ir.h, it.w, it.h);
    var src = M.getSource(it, opt.hi);
    if (!src) {
      c.fillStyle = '#d9d1c1'; c.fillRect(ir.x, ir.y, ir.w, ir.h);
      c.fillStyle = 'rgba(60,45,30,0.55)'; c.font = M.fontStr('hand', Math.min(ir.w, ir.h) * 0.08); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('developing…', 0, ir.y + ir.h / 2);
    } else {
      var g = M.cropGeom(it, ir.w, ir.h);
      c.translate(ir.x + ir.w / 2, ir.y + ir.h / 2);
      c.scale(g.base, g.base);
      c.translate(-g.cx * g.sw + g.sw / 2, -g.cy * g.sh + g.sh / 2);
      c.rotate(g.r * Math.PI / 180);
      if (it.crop && it.crop.flip) c.scale(-1, 1);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(src, -it.img.w / 2, -it.img.h / 2, it.img.w, it.img.h);
    }
    c.restore();
    M.drawFrameFront(c, it, S, ir.x, ir.y, ir.w, ir.h);
  }

  /* ---------- scene ---------- */
  var bgc = { key: '', cv: null };
  function bgLayer(ctx, P, S, W, H) {
    var pw = Math.max(1, Math.round(W * S)), ph = Math.max(1, Math.round(H * S)), b = P.bg || {};
    var key = [b.type, b.a, b.b, b.seed, pw, ph].join(',');
    if (bgc.key !== key) {
      var cv = bgc.cv || document.createElement('canvas'); cv.width = pw; cv.height = ph;
      var c = cv.getContext('2d'); c.setTransform(S, 0, 0, S, 0, 0); M.drawBg(c, P.bg, W, H);
      bgc = { key: key, cv: cv };
    }
    ctx.drawImage(bgc.cv, 0, 0, W, H);
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function drawItem(c, it, S, opt) {
    var k = 1, a = !opt.hi && !opt.direct && M.anims.get(it.id), dy = 0;
    if (a) {
      var t = (performance.now() - a.t0) / a.dur;
      if (t >= 1) M.anims.delete(it.id);
      else { var e = ease(Math.max(0, t)); k = 1 + (a.from - 1) * (1 - e); dy = -40 * (1 - e) * (a.drop ? 1 : 0); }
    }
    c.save();
    c.translate(it.x + it.w / 2, it.y + it.h / 2 + dy);
    c.rotate((it.rot || 0) * Math.PI / 180);
    if (k !== 1) c.scale(k, k);
    if (it.op != null && it.op < 1) c.globalAlpha = it.op;
    if (it.type === 'photo') drawPhoto(c, it, S, opt);
    else if (it.type === 'text') drawText(c, it, S);
    else M.drawSticker(c, it);
    c.restore();
  }
  function drawSel(c, it, S, opt) {
    var hs = opt.hs, lw = opt.lw;
    c.save();
    c.translate(it.x + it.w / 2, it.y + it.h / 2); c.rotate((it.rot || 0) * Math.PI / 180);
    if (opt.crop && it.type === 'photo') {
      var ir = M.innerRect(it);
      c.strokeStyle = '#ff5a36'; c.lineWidth = lw * 2; c.strokeRect(ir.x, ir.y, ir.w, ir.h);
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = lw;
      for (var i = 1; i < 3; i++) {
        c.beginPath(); c.moveTo(ir.x + ir.w * i / 3, ir.y); c.lineTo(ir.x + ir.w * i / 3, ir.y + ir.h); c.stroke();
        c.beginPath(); c.moveTo(ir.x, ir.y + ir.h * i / 3); c.lineTo(ir.x + ir.w, ir.y + ir.h * i / 3); c.stroke();
      }
      c.restore(); return;
    }
    var w = it.w, h = it.h;
    c.strokeStyle = '#ffffff'; c.lineWidth = lw * 3.2; c.strokeRect(-w / 2, -h / 2, w, h);
    c.strokeStyle = '#2f6bff'; c.lineWidth = lw * 1.4; c.setLineDash([lw * 6, lw * 4]); c.strokeRect(-w / 2, -h / 2, w, h); c.setLineDash([]);
    var ry = -h / 2 - hs * 2.6;
    c.beginPath(); c.moveTo(0, -h / 2); c.lineTo(0, ry); c.strokeStyle = '#2f6bff'; c.lineWidth = lw * 1.4; c.stroke();
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (p) {
      c.beginPath(); c.arc(p[0] * w / 2, p[1] * h / 2, hs * 0.75, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill(); c.lineWidth = lw * 1.6; c.strokeStyle = '#2f6bff'; c.stroke();
    });
    c.beginPath(); c.arc(0, ry, hs * 0.85, 0, Math.PI * 2); c.fillStyle = '#2f6bff'; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = lw * 1.4; c.beginPath(); c.arc(0, ry, hs * 0.42, -Math.PI * 0.9, Math.PI * 0.4); c.stroke();
    c.restore();
  }
  M.render = function (ctx, P, S, opt) {
    opt = opt || {};
    var W = M.W, H = M.docH(P);
    M._S = S;
    ctx.save();
    ctx.setTransform(S, 0, 0, opt.Sy || S, 0, 0);
    if (opt.hi || opt.direct) M.drawBg(ctx, P.bg, W, H); else bgLayer(ctx, P, S, W, H);
    for (var i = 0; i < P.items.length; i++) { if (!P.items[i].hidden) drawItem(ctx, P.items[i], S, opt); }
    if (opt.sel) { var it = M.find(P, opt.sel); if (it) drawSel(ctx, it, S, opt); }
    ctx.restore();
  };
  M.find = function (P, id) { for (var i = 0; i < P.items.length; i++) if (P.items[i].id === id) return P.items[i]; return null; };
  M.renderToCanvas = function (P, pxW, opt) {
    var H = M.docH(P), S = pxW / M.W, cv = document.createElement('canvas');
    cv.width = Math.round(pxW); cv.height = Math.round(H * S);
    var c = cv.getContext('2d');
    M.render(c, P, S, opt || {});
    return cv;
  };

  /* ---------- layouts ---------- */
  function photos(P) { return P.items.filter(function (i) { return i.type === 'photo'; }); }
  M.photos = photos;
  M.layouts = {
    grid: function (P, o) {
      var ph = photos(P), n = ph.length; if (!n) return;
      var W = M.W, H = M.docH(P), m = o.margin == null ? 40 : o.margin, g = o.gap == null ? 16 : o.gap, cols = o.cols | 0;
      if (!cols) {
        var best = 1, bs = 1e9;
        for (var cc = 1; cc <= n; cc++) {
          var rows0 = Math.ceil(n / cc), cw0 = (W - 2 * m - (cc - 1) * g) / cc, ch0 = (H - 2 * m - (rows0 - 1) * g) / rows0;
          var sc = Math.abs(Math.log(cw0 / ch0)) + (rows0 * cc - n) * 0.12;
          if (sc < bs) { bs = sc; best = cc; }
        }
        cols = best;
      }
      cols = Math.min(cols, n);
      var rows = Math.ceil(n / cols), ch = (H - 2 * m - (rows - 1) * g) / rows, k = 0;
      for (var r = 0; r < rows; r++) {
        var inRow = Math.min(cols, n - k), cw = (W - 2 * m - (inRow - 1) * g) / inRow;
        for (var c = 0; c < inRow; c++, k++) {
          var it = ph[k];
          it.x = m + c * (cw + g); it.y = m + r * (ch + g); it.w = Math.max(10, cw); it.h = Math.max(10, ch); it.rot = 0;
          if (it.frame === 'polaroid' || it.frame === 'film') it.frame = 'none';
        }
      }
    },
    freeform: function () { /* you're the boss */ },
    scatter: function (P, o) {
      var ph = photos(P), n = ph.length; if (!n) return;
      var W = M.W, H = M.docH(P), r = M.rng(o.seed || 1);
      var cols = Math.max(1, Math.round(Math.sqrt(n * W / H))), rows = Math.ceil(n / cols);
      var cw = W / cols, chh = H / rows, s = M.clamp(Math.min(cw, chh / 1.18) * 1.12, 160, 520);
      ph.forEach(function (it, i) {
        var col = i % cols, row = Math.floor(i / cols);
        it.frame = 'polaroid'; it.w = s; it.h = s * 1.18;
        var cx = cw * (col + 0.5) + (r() - 0.5) * cw * 0.3, cy = chh * (row + 0.5) + (r() - 0.5) * chh * 0.25;
        it.x = M.clamp(cx - it.w / 2, -it.w * 0.1, W - it.w * 0.9); it.y = M.clamp(cy - it.h / 2, -it.h * 0.08, H - it.h * 0.92);
        it.rot = Math.round((r() - 0.5) * 26);
      });
    },
    magazine: function (P, o) {
      var ph = photos(P), W = M.W, H = M.docH(P), r = M.rng(o.seed || 3);
      if (ph.length) {
        var a = ph[0];
        Object.assign(a, { x: 0, y: 0, w: W, h: H, rot: 0, frame: 'none' });
        P.items.splice(P.items.indexOf(a), 1); P.items.unshift(a);
        var s = Math.min(230, W * 0.24);
        ph.slice(1).forEach(function (it, i) {
          var col = i % 3, row = Math.floor(i / 3);
          if (it.frame === 'none' || it.frame === 'film') it.frame = 'white';
          it.w = s; it.h = s * (it.frame === 'polaroid' ? 1.18 : 1);
          it.x = W - 36 - s - col * s * 0.62; it.y = H * 0.5 + row * s * 0.42 + col * s * 0.3;
          it.rot = Math.round((r() - 0.5) * 16);
        });
      }
      if (!P.items.some(function (i) { return i.layoutTag === 'mag'; })) {
        var add = function (o2) { o2.layoutTag = 'mag'; P.items.push(M.makeText(o2)); };
        add({ text: 'MOSAIC', font: 'serif', size: Math.round(W * 0.2), color: '#ffffff', style: 'shadow', cx: W / 2, y: 18 });
        add({ text: 'THE SCRAPBOOK ISSUE  ·  NO. 01', font: 'sans', size: 24, color: '#ffffff', style: 'shadow', cx: W / 2, y: 18 + W * 0.25 });
        add({ text: '37 MOMENTS\nYOU FORGOT\nTO POST', font: 'impact', size: 62, color: '#ffe066', style: 'shadow', align: 'left', x: 30, y: H * 0.42 });
        add({ text: 'EXCLUSIVE: your camera roll finally speaks', font: 'type', size: 24, color: '#1b1b1b', bg: '#ffe08a', style: 'tape', x: 34, y: H - 110, rot: -3 });
      }
    }
  };
  M.applyLayout = function (P, name, extra) {
    if (!M.layouts[name]) name = 'freeform';
    P.layout = name;
    if (name !== 'magazine') P.items = P.items.filter(function (i) { return i.layoutTag !== 'mag'; });
    var o = Object.assign({}, P.lo || {}, extra || {});
    M.layouts[name](P, o);
  };
  M.reflow = function (P) { if (P.layout === 'grid' || P.layout === 'magazine') M.applyLayout(P, P.layout); };
})();
