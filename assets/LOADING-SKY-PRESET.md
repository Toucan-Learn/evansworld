# Pixel sky: preserved loading background

Saved on 2026-09-10 at Joshua's request, from the loading view of Evan's Universe.

`loading-pixel-sky.png` is an unchanged, separately named copy of `galaxy-still.png` from release `a686b45f1ce76bd7dfa99bac19f5d058fa05a60c`.

SHA-256: `201bea561cb3abf2ac17700b8040cc00177a7d009b29fbadc6f21b7dbade4921`.

The visible loading artwork includes the image and its original CSS colour treatment. The **Pixel sky** preset uses that same background layer, preserving all of these settings:

```css
background:
  url("loading-pixel-sky.png") center/cover,
  linear-gradient(130deg, #166181, #3e9a8d 52%, #dcce91);
background-blend-mode: screen;
image-rendering: pixelated;
```

The original readability shade remains above the background:

```css
background: linear-gradient(90deg, #07313e66, transparent 65%);
```

The pixel composition stays still. Swashes and full-screen ripples use a transparent effects canvas above it. Selecting **Earth sky** restores the animated renderer. Both presets share the existing interactions and radio; the browser saves the selected preset locally.

Original image provenance and attribution are in `GALAXY-SOURCE.md`.
