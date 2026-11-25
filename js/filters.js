/* Mosaic — canvas filters (all hand-written pixel maths, no libraries) */
(function () {
  'use strict';
  var M = window.M;

  M.FILTERS = [
    { key: 'none', label: 'Original' }, { key: 'vintage', label: 'Vintage' }, { key: 'duotone', label: 'Duotone' },
    { key: 'grain', label: 'Film grain' }, { key: 'bw', label: 'B&W' }, { key: 'warm', label: 'Golden hour' },
    { key: 'cool', label: 'Nordic' }, { key: 'fade', label: 'Faded' }, { key: 'pop', label: 'Pop' }
  ];
  M.defFilter = function () { return { name: 'none', amt: 1, duoA: '#2b1f5c', duoB: '#ffb38a', grain: 0 }; };
  M.filterSig = function (f) { return f ? [f.name, f.amt, f.duoA, f.duoB, f.grain].join('|') : 'none'; };
  M.isPlain = function (f) { return !f || ((!f.name || f.name === 'none' || f.amt === 0) && !(f.grain > 0)); };

  function hash2(x, y) {
    var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  /* returns a new canvas with the filter applied (source may be img or canvas) */
  M.applyFilter = function (src, f, maxSide) {
    var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    var k = Math.min(1, (maxSide || 1400) / Math.max(sw, sh));
    var w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    c.imageSmoothingQuality = 'high';
    c.drawImage(src, 0, 0, w, h);
    if (M.isPlain(f)) return cv;
    var id;
    try { id = c.getImageData(0, 0, w, h); } catch (e) { return cv; }
    var d = id.data, name = f.name || 'none', amt = f.amt == null ? 1 : f.amt;
    var A = M.hexToRgb(f.duoA || '#2b1f5c'), B = M.hexToRgb(f.duoB || '#ffb38a');
    var grain = (f.grain || 0) + (name === 'grain' ? 0.55 * amt : 0);
    var gAmp = grain * 64;
    var cs = Math.max(1, Math.round(Math.max(w, h) / 1400)); // grain cell size keeps the look consistent at print res
    var vig = name === 'vintage' ? 0.6 * amt : (name === 'grain' ? 0.3 * amt : (name === 'bw' ? 0.18 * amt : 0));
    var cx = w / 2, cy = h / 2, md2 = cx * cx + cy * cy;
    var x, y, i, r, g, b, r0, g0, b0, l, t;
    for (y = 0; y < h; y++) {
      var gy = (y / cs) | 0, dy2 = (y - cy) * (y - cy);
      for (x = 0; x < w; x++) {
        i = (y * w + x) << 2;
        r0 = r = d[i]; g0 = g = d[i + 1]; b0 = b = d[i + 2];
        switch (name) {
          case 'bw':
            l = 0.2126 * r + 0.7152 * g + 0.0722 * b; l = (l - 128) * 1.2 + 128; r = g = b = l; break;
          case 'vintage':
            t = 0.393 * r + 0.769 * g + 0.189 * b; g = 0.349 * r + 0.686 * g + 0.168 * b; b = 0.272 * r0 + 0.534 * g0 + 0.131 * b; r = t;
            r = r * 0.8 + 34; g = g * 0.8 + 26; b = b * 0.76 + 22;
            r = r0 * 0.25 + r * 0.75; g = g0 * 0.2 + g * 0.8; b = b0 * 0.15 + b * 0.85; break;
          case 'duotone':
            l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; l = l < 0 ? 0 : l > 1 ? 1 : (l - 0.5) * 1.15 + 0.5; l = l < 0 ? 0 : l > 1 ? 1 : l;
            r = A[0] + (B[0] - A[0]) * l; g = A[1] + (B[1] - A[1]) * l; b = A[2] + (B[2] - A[2]) * l; break;
          case 'grain':
            l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            r = l + (r - l) * 0.78; g = l + (g - l) * 0.78; b = l + (b - l) * 0.78;
            r = (r - 128) * 1.12 + 132; g = (g - 128) * 1.12 + 128; b = (b - 128) * 1.08 + 122; break;
          case 'warm':
            r = r * 1.08 + 14; g = g * 1.02 + 5; b = b * 0.86; break;
          case 'cool':
            r = r * 0.9; g = g * 1.0 + 3; b = b * 1.08 + 16; break;
          case 'fade':
            l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            r = l + (r - l) * 0.7; g = l + (g - l) * 0.7; b = l + (b - l) * 0.7;
            r = r * 0.8 + 40; g = g * 0.8 + 38; b = b * 0.8 + 46; break;
          case 'pop':
            l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            r = l + (r - l) * 1.5; g = l + (g - l) * 1.5; b = l + (b - l) * 1.5;
            r = (r - 128) * 1.12 + 128; g = (g - 128) * 1.12 + 128; b = (b - 128) * 1.12 + 128; break;
        }
        if (amt < 1 && name !== 'none') { r = r0 + (r - r0) * amt; g = g0 + (g - g0) * amt; b = b0 + (b - b0) * amt; }
        if (vig) { var dd = ((x - cx) * (x - cx) + dy2) / md2; var v = 1 - vig * dd * dd * 1.25; r *= v; g *= v; b *= v; }
        if (gAmp) { var n = (hash2((x / cs) | 0, gy) + hash2(((x / cs) | 0) + 7919, gy + 104729) - 1) * gAmp; r += n; g += n; b += n; }
        d[i] = r; d[i + 1] = g; d[i + 2] = b;
      }
    }
    c.putImageData(id, 0, 0);
    return cv;
  };
})();
