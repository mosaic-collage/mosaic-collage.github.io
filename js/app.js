/* Mosaic — app: projects, IndexedDB persistence, uploads, samples, export, easter eggs */
(function () {
  'use strict';
  var M = window.M, $ = M.$, $$ = M.$$;
  var A = M.app = { images: [], dbOk: true };

  function newProject(paper) {
    return {
      id: M.uid('p'), name: 'Untitled scrapbook', created: Date.now(), updated: Date.now(), opened: Date.now(),
      paper: paper || 'a4p', layout: 'grid', lo: { gap: 16, margin: 40, cols: 0, seed: 1 },
      bg: { type: 'kraft', a: '#c9a27a', b: '#7a5634', seed: 1 }, items: []
    };
  }
  function status(t, cls) { var s = $('#saveStatus'); if (!s) return; s.textContent = t; s.className = 'save-status' + (cls ? ' ' + cls : ''); }

  /* ---------- saving ---------- */
  var saveTimer = 0, saving = false, again = false;
  A.save = function () {
    if (!M.P) return;
    status('Glue drying…', 'busy');
    clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 700);
  };
  function doSave() {
    if (!M.P) return;
    if (saving) { again = true; return; }
    saving = true;
    var P = M.P; P.updated = Date.now();
    var rec = JSON.parse(JSON.stringify(P));
    var finish = function (thumb) {
      rec.thumb = thumb || null;
      M.db.put('projects', rec).then(function () {
        status('Saved ✓ stuck fast', 'ok'); M.store.set('last', P.id);
      }).catch(function () {
        A.dbOk = false; status('Not saved — export a backup', 'err');
      }).then(function () { saving = false; if (again) { again = false; doSave(); } });
    };
    try {
      var cv = M.renderToCanvas(P, 300, { direct: true });
      if (cv.toBlob) cv.toBlob(function (b) { finish(b); }, 'image/jpeg', 0.72); else finish(null);
    } catch (e) { finish(null); }
  }
  A.flush = function () { if (saveTimer) { clearTimeout(saveTimer); doSave(); } };

  /* ---------- loading ---------- */
  A.open = function (rec) {
    M.clearImages();
    var P = rec; delete P.thumb; P.opened = Date.now(); P.lo = P.lo || {};
    M.P = P; M.ed.sel = null; M.ed.crop = false; A.images = [];
    $('#projName').value = P.name;
    M.ed.fit(); M.ui.syncAll();
    var load = A.dbOk ? M.db.imagesOf(P.id) : Promise.resolve([]);
    return load.then(function (recs) {
      recs.sort(function (a, b) { return a.added - b.added; });
      return Promise.all(recs.map(function (r) { return M.loadImageRecord(r).then(function () { return r; }, function () { return null; }); }));
    }).then(function (recs) {
      A.images = recs.filter(Boolean);
      M.ed.resetHistory(); M.ui.syncAll(); M.ed.draw(); status('Saved ✓ stuck fast', 'ok');
      M.store.set('last', P.id);
    }).catch(function () { M.ed.resetHistory(); M.ui.syncAll(); M.ed.draw(); });
  };
  A.create = function (paper) {
    A.flush();
    var P = newProject(paper);
    return A.open(P).then(function () { A.save(); });
  };

  /* ---------- photos ---------- */
  A.addFiles = function (files) {
    if (!M.P) { M.toast('One sec — still unpacking the scrapbook…'); return Promise.resolve(); }
    files = Array.prototype.slice.call(files || []).filter(function (f) { return f && (/^image\//.test(f.type) || /\.(jpe?g|png|gif|webp|avif|bmp)$/i.test(f.name || '')); });
    if (!files.length) { M.toast('That did not look like a photo. We only glue pictures.', 'warn'); return Promise.resolve(); }
    status('Developing ' + files.length + ' photo' + (files.length > 1 ? 's' : '') + '…', 'busy');
    var P = M.P, added = [];
    return files.reduce(function (pr, f) {
      return pr.then(function () {
        var rec = { id: M.uid('m'), project: P.id, blob: f, name: f.name || 'photo', type: f.type || 'image/jpeg', size: f.size || 0, added: Date.now() };
        return M.loadImageRecord(rec).then(function (e) {
          rec.w = e.w; rec.h = e.h;
          A.images.push(rec); added.push(e);
          if (A.dbOk) return M.db.put('images', rec).catch(function (err) {
            A.dbOk = false; M.toast('Storage is full or blocked — this photo lives only until you close the tab. Export a backup!', 'warn'); void err;
          });
        }, function () { M.toast('Couldn\'t read "' + (f.name || 'file') + '". HEIC/RAW? Try JPEG or PNG.', 'warn'); });
      });
    }, Promise.resolve()).then(function () {
      if (P !== M.P) return;
      added.forEach(function (e) { A.placeImage(e, true); });
      if (added.length) {
        M.reflow(M.P);
        M.ed.commit(); M.ed.fit(); M.ui.syncAll(); M.sfx.play('tape');
        M.toast(added.length === 1 ? 'Photo stuck on. Looking sharp!' : added.length + ' photos stuck on. That\'s a lot of glue.');
      } else status(A.dbOk ? 'Saved ✓ stuck fast' : 'Not saved — export a backup', A.dbOk ? 'ok' : 'err');
    });
  };
  A.placeImage = function (e, batch) {
    var P = M.P, W = M.W, H = M.docH(P), ar = e.w / e.h, s = W * (P.layout === 'scatter' ? 0.4 : 0.46);
    var w = ar >= 1 ? s : s * ar, h = ar >= 1 ? s / ar : s, r = Math.random;
    var frame = P.layout === 'scatter' ? 'polaroid' : P.layout === 'grid' ? 'none' : 'white';
    if (frame === 'polaroid') { w = s; h = s * 1.18; }
    var it = {
      id: M.uid('ph'), type: 'photo', img: { id: e.id, w: e.w, h: e.h }, x: W / 2 - w / 2 + (r() - 0.5) * W * 0.3, y: H / 2 - h / 2 + (r() - 0.5) * H * 0.3,
      w: w, h: h, rot: P.layout === 'freeform' ? 0 : Math.round((r() - 0.5) * 20), frame: frame, caption: '', filter: M.defFilter(),
      crop: { z: 1, cx: 0.5, cy: 0.5, r: 0, flip: false }, op: 1
    };
    if (P.layout === 'magazine') { it.w = it.h = 230; it.frame = 'white'; }
    // keep new photos below text & stickers so captions stay readable
    var firstDeco = P.items.findIndex(function (i) { return i.type !== 'photo'; });
    if (firstDeco < 0) P.items.push(it); else P.items.splice(firstDeco, 0, it);
    if (!batch) {
      M.reflow(P); M.ed.select(it.id, true); M.ed.animate(it.id); M.sfx.play('tape'); M.ed.commit(); M.ui.syncAll();
    } else M.ed.animate(it.id, { dur: 520 });
    M.ui.syncEmpty();
    return it;
  };
  A.removeImage = function (id) {
    var used = M.P.items.filter(function (i) { return i.img && i.img.id === id; }).length;
    if (used && !window.confirm('This photo is on the page ' + used + ' time' + (used > 1 ? 's' : '') + '. Remove it from the project entirely?')) return;
    M.P.items = M.P.items.filter(function (i) { return !(i.img && i.img.id === id); });
    if (M.ed.sel && !M.find(M.P, M.ed.sel)) M.ed.sel = null;
    A.images = A.images.filter(function (r) { return r.id !== id; });
    M.forgetImage(id);
    if (A.dbOk) M.db.del('images', id).catch(function () {});
    M.reflow(M.P); M.ed.commit(); M.ed.draw(); M.ui.syncAll(); M.sfx.play('snip');
  };
  A.shuffle = function () {
    var P = M.P, ph = M.photos(P);
    if (ph.length < 2 && P.layout !== 'scatter') { M.toast('Shuffling one photo is just… holding it.'); return; }
    for (var i = ph.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = ph[i]; ph[i] = ph[j]; ph[j] = t; }
    var rest = P.items.filter(function (x) { return x.type !== 'photo'; });
    P.items = ph.concat(rest);
    P.lo = P.lo || {}; P.lo.seed = Math.floor(Math.random() * 1e6);
    if (P.layout === 'freeform') { var W = M.W, H = M.docH(P); ph.forEach(function (it) { it.x = Math.random() * (W - it.w); it.y = Math.random() * (H - it.h); it.rot = Math.round((Math.random() - 0.5) * 24); }); }
    else M.applyLayout(P, P.layout);
    ph.forEach(function (it, k) { setTimeout(function () { M.ed.animate(it.id, { from: 0.8, drop: false }); }, k * 45); });
    M.sfx.play('whoosh'); M.ed.commit(); M.ed.draw();
  };
  A.setPaper = function (paper) {
    var P = M.P, oldH = M.docH(P); P.paper = paper; var newH = M.docH(P), ky = newH / oldH;
    P.items.forEach(function (it) { var cy = it.y + it.h / 2; it.y = cy * ky - it.h / 2; });
    if (P.layout === 'grid' || P.layout === 'magazine' || P.layout === 'scatter') M.applyLayout(P, P.layout);
    M.ed.fit(); M.ui.syncAll(); M.ed.commit();
    M.toast('Paper: ' + M.PAPERS[paper].label);
  };

  /* ---------- stickers & text ---------- */
  A.addSticker = function (s) {
    var P = M.P, W = M.W, H = M.docH(P), sel = M.ed.item(), cx = W / 2, cy = H / 2, rot = Math.round((Math.random() - 0.5) * 24);
    if (sel && sel.type === 'photo') { cx = sel.x + sel.w * (s.cat === 'tape' ? 0.5 : 0.85); cy = sel.y + (s.cat === 'tape' ? 4 : sel.h * 0.12); if (s.cat === 'tape') rot = Math.round((sel.rot || 0) + (Math.random() - 0.5) * 16); }
    else { cx += (Math.random() - 0.5) * W * 0.3; cy += (Math.random() - 0.5) * H * 0.3; }
    var it = { id: M.uid('s'), type: 'sticker', key: s.key, x: cx - s.w / 2, y: cy - s.h / 2, w: s.w, h: s.h, rot: rot, op: 1 };
    if (!s.emoji) it.color = s.color;
    M.ed.add(it); M.ui.syncEmpty();
    M.sfx.play(s.cat === 'tape' ? 'tape' : s.cat === 'clips' ? 'tink' : 'pop');
  };
  A.addText = function () {
    var P = M.P, W = M.W, H = M.docH(P);
    var it = M.makeText({ text: $('#textInput').value || 'hello!', font: $('#fontSel').value || 'hand', style: $('#textStyleSel').value, color: $('#textColor').value, bg: $('#textBgColor').value, align: $('#textAlignSel').value, size: +$('#textSize').value, rot: Math.round((Math.random() - 0.5) * 8) });
    it.x = W / 2 - it.w / 2 + (Math.random() - 0.5) * 120; it.y = H / 2 - it.h / 2 + (Math.random() - 0.5) * 160;
    M.ed.add(it); M.ui.syncEmpty(); M.sfx.play('pop');
  };

  /* ---------- sample photos (procedural, so nobody's privacy is harmed) ---------- */
  function samplePhoto(seed) {
    var r = M.rng(seed * 977 + 13), w = 1200, h = r() < 0.5 ? 900 : 1500, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    var skies = [['#ffcf9f', '#ff7e7e', '#6b4c9a'], ['#bfe9ff', '#ffe0f0', '#ffd6a5'], ['#0f2027', '#203a43', '#2c5364'], ['#fbd786', '#f7797d', '#c6ffdd'], ['#a1c4fd', '#c2e9fb', '#fdfbfb'], ['#ff9a8b', '#ff6a88', '#ff99ac']];
    var sk = skies[seed % skies.length], g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, sk[2]); g.addColorStop(0.55, sk[1]); g.addColorStop(1, sk[0]); c.fillStyle = g; c.fillRect(0, 0, w, h);
    var night = seed % skies.length === 2;
    if (night) for (var s = 0; s < 220; s++) { c.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.7) + ')'; c.fillRect(r() * w, r() * h * 0.6, 2, 2); }
    var sx = w * (0.25 + r() * 0.5), sy = h * (0.3 + r() * 0.2), sr = 60 + r() * 70;
    var sg = c.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.2); sg.addColorStop(0, night ? 'rgba(240,240,255,0.9)' : 'rgba(255,250,220,1)'); sg.addColorStop(0.3, night ? 'rgba(200,210,255,0.25)' : 'rgba(255,220,150,0.5)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sg; c.fillRect(0, 0, w, h); c.fillStyle = night ? '#f4f1e6' : '#fff6dc'; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
    for (var L = 0; L < 4; L++) {
      var base = h * (0.55 + L * 0.11), amp = 120 - L * 22, dark = 0.25 + L * 0.18;
      c.fillStyle = 'rgba(' + Math.round(40 + 60 * (1 - dark)) + ',' + Math.round(30 + 50 * (1 - dark)) + ',' + Math.round(60 + 70 * (1 - dark)) + ',' + (0.55 + L * 0.15) + ')';
      c.beginPath(); c.moveTo(0, h);
      var ph = r() * 6, fr = 0.004 + r() * 0.004;
      for (var x = 0; x <= w; x += 20) c.lineTo(x, base - Math.sin(x * fr + ph) * amp - Math.sin(x * fr * 2.7 + ph * 2) * amp * 0.35);
      c.lineTo(w, h); c.closePath(); c.fill();
    }
    if (r() < 0.6) { c.fillStyle = 'rgba(255,255,255,0.12)'; for (var k = 0; k < 6; k++) c.fillRect(0, h * 0.86 + k * 18, w, 3); }
    return new Promise(function (res) {
      if (cv.toBlob) cv.toBlob(function (b) { res(b); }, 'image/jpeg', 0.88);
      else { var u = cv.toDataURL('image/jpeg', 0.88); res(dataUrlToBlob(u)); }
    });
  }
  A.addSamples = function () {
    var base = Math.floor(Math.random() * 1000), n = 6, jobs = [];
    for (var i = 0; i < n; i++) jobs.push(samplePhoto(base + i));
    status('Developing sample shots…', 'busy');
    return Promise.all(jobs).then(function (blobs) {
      var files = blobs.filter(Boolean).map(function (b, i) { try { return new File([b], 'sample-' + (i + 1) + '.jpg', { type: 'image/jpeg' }); } catch (e) { b.name = 'sample-' + (i + 1) + '.jpg'; return b; } });
      return A.addFiles(files);
    });
  };

  /* ---------- export image (with print DPI metadata) ---------- */
  var crcT = null;
  function crc32(bytes, start, end) {
    if (!crcT) { crcT = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; } }
    var crc = 0xFFFFFFFF; for (var i = start; i < end; i++) crc = crcT[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function withDpi(blob, fmt, dpi) {
    if (!dpi || !blob.arrayBuffer) return Promise.resolve(blob);
    return blob.arrayBuffer().then(function (buf) {
      var b = new Uint8Array(buf);
      if (fmt === 'png' && b[0] === 0x89 && b[12] === 0x49 && b[13] === 0x48) { // insert pHYs after IHDR
        var ppm = Math.round(dpi / 0.0254), chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
        dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
        dv.setUint32(17, crc32(chunk, 4, 17));
        var ihdrEnd = 8 + 25, out = new Uint8Array(b.length + 21);
        out.set(b.subarray(0, ihdrEnd), 0); out.set(chunk, ihdrEnd); out.set(b.subarray(ihdrEnd), ihdrEnd + 21);
        return new Blob([out], { type: 'image/png' });
      }
      if (fmt === 'jpeg' && b[2] === 0xFF && b[3] === 0xE0 && b[6] === 0x4A && b[7] === 0x46 && b[8] === 0x49 && b[9] === 0x46) { // JFIF density
        b[13] = 1; b[14] = (dpi >> 8) & 255; b[15] = dpi & 255; b[16] = (dpi >> 8) & 255; b[17] = dpi & 255;
        return new Blob([b], { type: 'image/jpeg' });
      }
      return blob;
    }).catch(function () { return blob; });
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function slug(s) { return (s || 'mosaic').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'mosaic'; }
  A.exportImage = function (size, fmt, q) {
    var P = M.P, prog = $('#expProgress'), go = $('#expGo');
    if (!P.items.length && !window.confirm('The page is empty. Export a lovely blank background anyway?')) return;
    go.disabled = true; prog.textContent = 'Developing in the darkroom… (big prints take a few seconds)';
    setTimeout(function () {
      var cv;
      try {
        cv = document.createElement('canvas'); cv.width = size.w; cv.height = size.h;
        var c = cv.getContext('2d'), S = size.w / M.W;
        if (fmt === 'jpeg') { c.fillStyle = '#ffffff'; c.fillRect(0, 0, size.w, size.h); }
        M.render(c, P, S, { hi: true, Sy: size.h / M.docH(P) });
      } catch (e) { go.disabled = false; prog.textContent = 'This device ran out of darkroom space. Try a smaller size.'; M.clearHiCache(); return; }
      M.clearHiCache();
      var type = fmt === 'jpeg' ? 'image/jpeg' : 'image/png';
      var done = function (blob) {
        if (!blob) { go.disabled = false; prog.textContent = 'Export failed — the canvas may be too large for this browser. Try a smaller size.'; return; }
        withDpi(blob, fmt, size.dpi).then(function (b2) {
          download(b2, slug(P.name) + '-' + size.w + 'x' + size.h + (fmt === 'jpeg' ? '.jpg' : '.png'));
          go.disabled = false; prog.textContent = 'Done! ' + M.fmtBytes(b2.size) + ' of pure nostalgia downloaded.'; M.sfx.play('shutter'); flash();
          cv.width = cv.height = 1;
        });
      };
      if (cv.toBlob) cv.toBlob(done, type, q); else done(dataUrlToBlob(cv.toDataURL(type, q)));
    }, 60);
  };
  function flash() { if (M.reduced()) return; var f = document.createElement('div'); f.className = 'flash'; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 700); }

  /* ---------- project files ---------- */
  function dataUrlToBlob(u) {
    var parts = u.split(','), mime = (parts[0].match(/data:([^;]+)/) || [])[1] || 'application/octet-stream', bin = atob(parts[1]), arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }
  function blobToDataUrl(b) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(b); }); }
  A.exportProject = function () {
    var P = M.P;
    $('#exportProjBtn').disabled = true;
    Promise.all(A.images.map(function (r) { return blobToDataUrl(r.blob).then(function (d) { return { id: r.id, name: r.name, type: r.type, w: r.w, h: r.h, data: d }; }); })).then(function (imgs) {
      var json = JSON.stringify({ mosaic: 1, exported: new Date().toISOString(), project: P, images: imgs });
      download(new Blob([json], { type: 'application/json' }), slug(P.name) + '.mosaic.json');
      M.toast('Backup saved: ' + M.fmtBytes(json.length) + '. Keep it somewhere safe (not under the sofa).');
    }).catch(function () { M.toast('Backup failed. The photos were too camera-shy.', 'warn'); }).then(function () { $('#exportProjBtn').disabled = false; });
  };
  A.importProject = function (file) {
    var fr = new FileReader();
    fr.onload = function () {
      var o; try { o = JSON.parse(fr.result); } catch (e) { M.toast('That file is not a Mosaic backup. It might be a grocery list.', 'warn'); return; }
      if (!o || !o.project || !Array.isArray(o.project.items)) { M.toast('That file is not a Mosaic backup.', 'warn'); return; }
      A.flush();
      var P = o.project, map = {}; P.id = M.uid('p'); P.name = (P.name || 'Imported') + ' (imported)'; P.updated = Date.now();
      var recs = (o.images || []).map(function (im) { var nid = M.uid('m'); map[im.id] = nid; return { id: nid, project: P.id, blob: dataUrlToBlob(im.data), name: im.name, type: im.type, size: 0, w: im.w, h: im.h, added: Date.now() }; });
      recs.forEach(function (r) { r.size = r.blob.size; });
      P.items.forEach(function (it) { if (it.img && map[it.img.id]) it.img.id = map[it.img.id]; });
      var store = A.dbOk ? Promise.all(recs.map(function (r) { return M.db.put('images', r); })) : Promise.resolve();
      store.catch(function () { A.dbOk = false; }).then(function () {
        if (!A.dbOk) { M.clearImages(); M.P = P; A.images = recs; return Promise.all(recs.map(M.loadImageRecord)).then(function () { M.ed.fit(); M.ed.resetHistory(); M.ui.syncAll(); }); }
        return A.open(P).then(function () { A.save(); });
      }).then(function () { M.ui.closeDlg('projectsDlg'); M.toast('Imported! Welcome back, old friend.'); });
    };
    fr.readAsText(file);
  };

  /* ---------- projects dialog & storage management ---------- */
  var thumbUrls = [];
  A.refreshProjects = function () {
    var list = $('#projList');
    thumbUrls.forEach(function (u) { URL.revokeObjectURL(u); }); thumbUrls = [];
    if (!A.dbOk) { list.innerHTML = '<p class="empty-note">Saving is unavailable in this browser mode (private window?). Use "Back up this project" to keep your work.</p>'; quota(); return; }
    A.flush();
    Promise.all([M.db.all('projects'), M.db.all('images')]).then(function (res) {
      var projects = res[0], imgs = res[1], sizes = {}, counts = {};
      imgs.forEach(function (r) { sizes[r.project] = (sizes[r.project] || 0) + (r.size || (r.blob && r.blob.size) || 0); counts[r.project] = (counts[r.project] || 0) + 1; });
      projects.sort(function (a, b) { return b.updated - a.updated; });
      list.innerHTML = '';
      if (!projects.length) { list.innerHTML = '<p class="empty-note">No scrapbooks yet. The shelf is dusting itself in anticipation.</p>'; }
      projects.forEach(function (p, idx) {
        var card = document.createElement('article'); card.className = 'proj-card' + (M.P && p.id === M.P.id ? ' current' : '');
        card.style.setProperty('--tilt', ((idx % 3) - 1) * 1.2 + 'deg');
        var u = p.thumb ? URL.createObjectURL(p.thumb) : ''; if (u) thumbUrls.push(u);
        card.innerHTML = '<div class="proj-thumb">' + (u ? '<img alt="" src="' + u + '">' : '<span>no preview</span>') + '</div>' +
          '<div class="proj-meta"><h4>' + M.esc(p.name || 'Untitled') + (M.P && p.id === M.P.id ? ' <em>(open)</em>' : '') + '</h4>' +
          '<p>' + (counts[p.id] || 0) + ' photo' + ((counts[p.id] || 0) === 1 ? '' : 's') + ' · ' + M.fmtBytes(sizes[p.id] || 0) + ' · edited ' + M.timeAgo(p.updated) + '</p></div>' +
          '<div class="proj-acts"><button type="button" class="btn small" data-act="open">Open</button><button type="button" class="ibtn danger" data-act="del" aria-label="Delete ' + M.esc(p.name || 'project') + '"><svg><use href="#i-trash"/></svg></button></div>';
        card.querySelector('[data-act="open"]').addEventListener('click', function () { if (M.P && p.id === M.P.id) { M.ui.closeDlg('projectsDlg'); return; } A.flush(); M.db.get('projects', p.id).then(function (rec) { if (rec) A.open(rec); M.ui.closeDlg('projectsDlg'); M.sfx.play('paper'); }); });
        card.querySelector('[data-act="del"]').addEventListener('click', function () {
          if (!window.confirm('Delete "' + (p.name || 'Untitled') + '" and its photos from this browser? This cannot be undone.')) return;
          M.db.delProject(p.id).then(function () {
            M.toast('Project recycled into confetti.'); M.sfx.play('snip');
            if (M.P && p.id === M.P.id) return A.create(M.P.paper).then(A.refreshProjects);
            A.refreshProjects();
          });
        });
        list.appendChild(card);
      });
      quota(imgs, projects);
    }).catch(function () { list.innerHTML = '<p class="empty-note">Could not read the shelf. Try reloading.</p>'; });
  };
  function quota(imgs, projects) {
    var ours = 0; (imgs || []).forEach(function (r) { ours += r.size || (r.blob && r.blob.size) || 0; });
    (projects || []).forEach(function (p) { ours += (p.thumb && p.thumb.size) || 0; });
    var t = $('#quotaText'), fill = $('#quotaFill'), bar = $('#quotaBar');
    var set = function (used, total) {
      var pct = total ? Math.min(100, used / total * 100) : 0;
      fill.style.width = Math.max(1.5, pct) + '%'; bar.setAttribute('aria-valuenow', pct.toFixed(1)); fill.classList.toggle('hot', pct > 80);
      t.textContent = 'Mosaic photos & projects: ' + M.fmtBytes(ours) + (total ? ' · this site uses ' + M.fmtBytes(used) + ' of ~' + M.fmtBytes(total) + ' allowed (' + pct.toFixed(pct < 1 ? 2 : 1) + '%).' : ' · your browser does not report a quota.');
    };
    if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then(function (e) { set(e.usage || ours, e.quota || 0); }, function () { set(ours, 0); });
    else set(ours, 0);
    if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(function (p) { var b = $('#persistBtn'); if (p) { b.disabled = true; b.querySelector('span').textContent = 'Storage is persistent ✓'; } });
  }
  A.persist = function () {
    if (!(navigator.storage && navigator.storage.persist)) { M.toast('This browser does not support persistent storage requests. Back up important projects!'); return; }
    navigator.storage.persist().then(function (ok) { M.toast(ok ? 'Granted! Your browser promises not to tidy these away.' : 'The browser said "maybe later". Install the page or use it more often, and back up.'); quota(); });
  };
  A.clearOld = function () {
    var v = $('#clearAgeSel').value, cutoff = v === 'all' ? Infinity : Date.now() - (+v) * 86400000;
    M.db.all('projects').then(function (ps) {
      var victims = ps.filter(function (p) { return (!M.P || p.id !== M.P.id) && (v === 'all' || (p.updated || 0) < cutoff); });
      if (!victims.length) { M.toast('Nothing that old. Your shelf is impressively fresh.'); return; }
      if (!window.confirm('Delete ' + victims.length + ' project' + (victims.length > 1 ? 's' : '') + ' and their photos? The one you have open is safe.')) return;
      return victims.reduce(function (pr, p) { return pr.then(function () { return M.db.delProject(p.id); }); }, Promise.resolve()).then(function () {
        M.toast('Cleared ' + victims.length + ' old project' + (victims.length > 1 ? 's' : '') + '. Marie Kondo sends her regards.'); A.refreshProjects();
      });
    }).catch(function () { M.toast('Could not clear projects right now.', 'warn'); });
  };
  A.cleanOrphans = function () {
    A.flush();
    setTimeout(function () {
      Promise.all([M.db.all('projects'), M.db.all('images')]).then(function (res) {
        var used = {}, known = {};
        res[0].forEach(function (p) { known[p.id] = 1; (p.items || []).forEach(function (i) { if (i.img) used[i.img.id] = 1; }); });
        if (M.P) M.P.items.forEach(function (i) { if (i.img) used[i.img.id] = 1; });
        var orphans = res[1].filter(function (r) { return !used[r.id] || (!known[r.project] && (!M.P || r.project !== M.P.id)); });
        if (!orphans.length) { M.toast('No loose photos found. Everything is glued down.'); return; }
        var bytes = orphans.reduce(function (s, r) { return s + (r.size || 0); }, 0);
        if (!window.confirm('Remove ' + orphans.length + ' photo' + (orphans.length > 1 ? 's' : '') + ' (' + M.fmtBytes(bytes) + ') that are not placed on any page?')) return;
        return Promise.all(orphans.map(function (r) { return M.db.del('images', r.id); })).then(function () {
          var gone = {}; orphans.forEach(function (r) { gone[r.id] = 1; M.forgetImage(r.id); });
          A.images = A.images.filter(function (r) { return !gone[r.id]; }); M.ui.renderTray();
          M.toast('Freed ' + M.fmtBytes(bytes) + '. The shoebox breathes again.'); A.refreshProjects();
        });
      }).catch(function () { M.toast('Could not tidy up right now.', 'warn'); });
    }, 120);
  };

  /* ---------- intro & easter eggs ---------- */
  function intro() {
    var el = $('#intro');
    var seen = false; try { seen = sessionStorage.getItem('mosaic.intro') === '1'; } catch (e) {}
    if (M.reduced() || seen) { el.remove(); return; }
    try { sessionStorage.setItem('mosaic.intro', '1'); } catch (e) {}
    el.classList.add('show');
    var close = function () { if (!el.parentNode) return; el.classList.add('leave'); setTimeout(function () { el.remove(); }, 650); };
    el.addEventListener('pointerdown', close);
    setTimeout(close, 2100);
  }
  function tapeStorm(msg) {
    if (M.reduced()) { M.toast(msg); return; }
    var box = document.createElement('div'); box.className = 'storm'; box.setAttribute('aria-hidden', 'true');
    var cols = ['#f7a8b8', '#9ed8d6', '#ffd86b', '#cdb4db', '#ff8fa3', '#d6b48a'], n = M.lowPower ? 18 : 40;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span'); s.style.left = Math.random() * 100 + 'vw'; s.style.background = cols[i % cols.length];
      s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); s.style.animationDelay = Math.random() * 0.8 + 's'; s.style.width = 50 + Math.random() * 80 + 'px';
      box.appendChild(s);
    }
    document.body.appendChild(box); setTimeout(function () { box.remove(); }, 3600);
    M.sfx.play('chime'); M.toast(msg);
  }
  function eggs() {
    var clicks = 0, t = 0;
    $('#logoBtn').addEventListener('click', function () {
      clearTimeout(t); clicks++; t = setTimeout(function () { clicks = 0; }, 1500);
      var b = $('#logoBtn'); b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); M.sfx.play('tink');
      if (clicks === 7) { clicks = 0; b.classList.add('dropped'); setTimeout(function () { b.classList.remove('dropped'); }, 2600); tapeStorm('You clipped the clip. Who clips the clipper? (Easter egg found!)'); }
    });
    var code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0, typed = '';
    document.addEventListener('keydown', function (e) {
      pos = (e.key === code[pos] || e.key.toLowerCase() === code[pos]) ? pos + 1 : (e.key === code[0] ? 1 : 0);
      if (pos === code.length) { pos = 0; tapeStorm('Achievement unlocked: Professional Hoarder of Memories.'); }
      if (e.key.length === 1 && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) {
        typed = (typed + e.key.toLowerCase()).slice(-4);
        if (typed === 'glue') { document.body.classList.add('sticky'); setTimeout(function () { document.body.classList.remove('sticky'); }, 2400); M.toast('Sticky situation! Everything is briefly glued.'); }
      }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    intro();
    M.ed.init(); M.ui.init(); eggs();
    var fi = $('#fileInput');
    var pick = function () { M.sfx.unlock(); fi.click(); };
    $('#addPhotosBtn').addEventListener('click', pick);
    $('#emptyAddBtn').addEventListener('click', pick);
    fi.addEventListener('change', function () { A.addFiles(fi.files); fi.value = ''; });
    $('#sampleBtn').addEventListener('click', A.addSamples);
    $('#emptySampleBtn').addEventListener('click', A.addSamples);
    $('#newProjBtn').addEventListener('click', function () { A.create(M.P ? M.P.paper : 'a4p').then(function () { M.ui.closeDlg('projectsDlg'); M.toast('Fresh page! The smell of new paper, digitally.'); }); });
    $('#importProjBtn').addEventListener('click', function () { $('#importInput').click(); });
    $('#importInput').addEventListener('change', function (e) { var f = e.target.files[0]; if (f) A.importProject(f); e.target.value = ''; });
    $('#exportProjBtn').addEventListener('click', A.exportProject);
    $('#persistBtn').addEventListener('click', A.persist);
    $('#clearOldBtn').addEventListener('click', A.clearOld);
    $('#cleanOrphansBtn').addEventListener('click', A.cleanOrphans);

    // drag & drop + paste
    var dh = $('#dropHint'), depth = 0;
    var hasFiles = function (e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], 'Files') >= 0; };
    window.addEventListener('dragenter', function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; dh.classList.add('on'); });
    window.addEventListener('dragover', function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    window.addEventListener('dragleave', function () { depth = Math.max(0, depth - 1); if (!depth) dh.classList.remove('on'); });
    window.addEventListener('drop', function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; dh.classList.remove('on'); A.addFiles(e.dataTransfer.files); });
    window.addEventListener('paste', function (e) {
      var t = e.target; if (t && /INPUT|TEXTAREA/.test(t.tagName)) return;
      var files = []; Array.prototype.forEach.call((e.clipboardData && e.clipboardData.items) || [], function (i) { if (i.kind === 'file') { var f = i.getAsFile(); if (f) files.push(f); } });
      if (files.length) { e.preventDefault(); A.addFiles(files); }
    });
    window.addEventListener('pagehide', A.flush);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') A.flush(); });

    if (narrow()) $('#studio').classList.remove('sheet-open'); else M.ui.openPane('photos');

    M.db.open().then(function () {
      var last = M.store.get('last', null);
      return M.db.all('projects').then(function (ps) {
        if (!ps.length) return A.create('a4p');
        ps.sort(function (a, b) { return b.updated - a.updated; });
        var pick2 = ps.filter(function (p) { return p.id === last; })[0] || ps[0];
        return A.open(pick2);
      });
    }).catch(function () {
      A.dbOk = false;
      M.P = newProject('a4p'); M.ed.fit(); M.ed.resetHistory(); M.ui.syncAll();
      status('Not saved — export a backup', 'err');
      M.toast('This browser blocks local storage here (private mode?). You can still create & export — just back up your project.', 'warn');
    });
  }
  function narrow() { return window.matchMedia('(max-width: 860px)').matches; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
