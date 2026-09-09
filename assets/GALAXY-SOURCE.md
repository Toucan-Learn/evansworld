# Harry Hub — FLAME pixel galaxy adaptation

The background is a WebGL 2 port of Joshua’s actual FLAME main-menu shader:
`flame-godot/assets/ui/shaders/flame_terminal_pixel_galaxy_v1.gdshader`.
The original scene is `scenes/shell/terminal_main_menu.tscn`. FLAME files were read, not changed.

The ordered Bayer dithering / nine-colour palette technique derives from Not Jam’s **Space Generator**, published under CC0 1.0:
- https://not-jam.itch.io/space-generator
- https://github.com/NotJamGames/SpaceGenerator
- Pinned upstream revision: `1111fac02c03a58f0f6bf34b9860af24449065a6`
- Upstream file: `GeneratorLayers/NebulaLayer/nebula_shader.gdshader`
- https://creativecommons.org/publicdomain/zero/1.0/

FLAME’s diagonal galactic band, dust lanes, deterministic star fields and stepped parallax are preserved. Harry’s version uses a quieter midnight/slate palette, somewhat livelier star movement, and a very slow cloud-density variation. It remains pixelated rather than blurred.

`galaxy-noise.png` was exported from Godot FastNoiseLite / NoiseTexture2D using the exact FLAME scene parameters: seed 1821316500, frequency 0.013, five octaves, 512×512 seamless texture. The export ran in a separate temporary Godot project.

Rendering is capped at 24 frames per second and at 560 art pixels wide, pauses when the page is hidden, honours reduced motion by default, and has a persistent user pause control. No gameplay logic, audio, client records, or FLAME menu text is included. The fallback is a static render of this adapted shader.

## Evan reuse (2026-09-09)

Copied from Harry's committed source at `3f4facaa9de8c692b2e51e7b3552944b77a684d3`. The noise and fallback are byte-identical. Evan adds pointer colour and swirl, a click/touch ripple, keyboard painting, and a 2D interaction fallback. Original galaxy source and attribution remain above.
