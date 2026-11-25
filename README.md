# Mosaic — scrapbook collage & poster maker

A playful, fully client-side photo collage and poster maker with a scrapbook look: washi tape, paper clips, torn paper edges, polaroids and film strips.

**Live:** https://kumarnikhildeveloperaccount.github.io/mosaic/

## Features
- **Private by design.** Photos are read locally and never uploaded. No accounts, no trackers, no API keys.
- **Layouts:** grid (gap, margin and column controls), freeform, polaroid scatter, magazine cover (with editable headlines).
- **Canvas filters (hand-written pixel code):** Vintage (sepia + vignette), Duotone (pick 2 colours), Film grain, B&W, Golden hour, Nordic, Faded, Pop, plus strength and extra-grain sliders.
- **Crop & rotate:** crop mode with drag-to-pan, pinch / scroll zoom, 90° rotation, flip, free tilt. Outside crop mode, two-finger pinch scales and rotates any item.
- **Stickers:** 9 washi tapes, paper clips, push pins, binder clip, doodles (star, heart, sparkle, flower, sun, cloud, arrow, squiggle, speech bubble, stamp, gift tag, ticket) and emoji. Vector stickers can be recoloured.
- **Text:** 8 cross-platform font stacks; plain, washi label, gift tag, highlighter, sticker outline and drop-shadow styles.
- **Frames:** border, polaroid (with caption), torn paper, taped corners, paper clip, film strip, rounded, scalloped, postage stamp.
- **Background generator:** kraft, plain, gradient, glow, graph, notebook, polka, stripes, gingham, confetti, terrazzo, sunburst, blobs, cork, with palettes and a random generator.
- **Export:** PNG or JPEG. A4 at 150/300 dpi (2480×3508 px at 300 dpi), 4×6 in at 300/600 dpi (1200×1800 px at 300 dpi), square & story sizes. Print files are tagged with their DPI (PNG pHYs / JPEG JFIF density).
- **Saving (IndexedDB):** original image Blobs are stored with each project; project JSON autosaves with a thumbnail. Projects dialog shows the storage quota (`navigator.storage.estimate`), can request persistent storage, remove unused photos and **clear old projects** by age. Back up / import projects as `.mosaic.json` files.
- Undo/redo, keyboard shortcuts, drag & drop, paste from clipboard, 4 themes (Kraft, Pastel pinboard, Darkroom, Photocopy zine), synthesized sound effects (off by default), reduced-motion support.
- Easter eggs: click the paper-clip logo 7 times; try the Konami code; type “glue”.

## Files
```
index.html, 404.html, favicon.svg, manifest.webmanifest, README.md
css/base.css, css/studio.css
js/core.js     utilities, sound synth, IndexedDB wrapper
js/art.js      backgrounds, stickers, washi tape, frames
js/filters.js  pixel filters
js/render.js   scene renderer, text, layouts, image cache
js/editor.js   gestures (pointer/pinch), keyboard, history
js/ui.js       panels, controls, dialogs
js/app.js      projects, saving, uploads, export, easter eggs
```
No external libraries, fonts or CDNs.

## Limitations
- Fonts are system font stacks, so text looks slightly different across operating systems.
- HEIC/RAW photos only work where the browser itself can decode them (e.g. Safari for HEIC).
- Very large exports may fail on low-memory phones; choose a smaller size there.
- Browser storage can be cleared by the browser under pressure unless persistence is granted — keep backups of important projects.

Designed & built by Kumar Nikhil — [Portfolio](https://kumarnikhildeveloperaccount.github.io/) · [LinkedIn](https://www.linkedin.com/in/kumar-nikhil-1000a9192/) · [Email](mailto:nkashyapnikhilnk@gmail.com)

With gratitude to God — Om Namah Paarvati Pateh, Har Har Mahadev. May God bless you and everyone.
