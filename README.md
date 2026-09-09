# Evansworld

Evan’s Universe: an interactive pixel-galaxy homepage with a Masayoshi Takanaka radio.

## Play

Move a mouse or draw on the sky to leave colourful trails. Click or tap for a ripple. Use **Colour** to switch palettes, **Star burst** for a larger ripple, and **Calm mode** to stop the sky. Keyboard users can focus the galaxy, paint with the arrow keys and trigger a burst with Space or Enter. System reduced-motion preferences are respected.

The radio has 38 tracks, a track selector, previous/next buttons, play/pause and volume. Music begins only after a user action. Only the volume preference is saved in the browser.

## Development

Requires Node.js 22.13 or newer and pnpm.

1. Run `pnpm install --frozen-lockfile`.
2. Prepare the separately managed game audio with `python3 scripts/prepare-music.py --source-game /path/to/flame-godot` (requires ffmpeg).
3. Run `python3 scripts/verify-assets.py` (requires ffprobe).
4. Run `pnpm dev` or `pnpm build`.

The build verifies every generated audio file against the pinned hashes before compiling. Generated music is excluded from Git and must be prepared locally; a complete deployment package includes all 38 files.

## Logo

The Mike Tyson pixel portrait is the site brand mark and favicon. The transparent original and exact generation prompt are preserved in `assets/evan-tyson-logo-v1.png` and `assets/TYSON-LOGO-SOURCE.md`.

## Sources

The original repository README was the starting point. The working homepage comes from the isolated Evan draft created for this project. Harry Baker Media’s existing galaxy shader, noise, fallback image and radio character were reused. Their original galaxy attribution is preserved in `assets/GALAXY-SOURCE.md`. No other learner’s writing or records are included.

`data/music-provenance.json` records the FLAME Masayoshi input hashes and the 128 kbps MP3 output hashes. The existing musical treatment and track cuts are preserved. Audio source files and public release rights are managed separately.

## Hosting and checks

The project builds to static output in `dist`. An optional Sites configuration example is in `.openai/hosting.example.json`; account-specific hosting configuration stays local. No automatic public-deployment workflow is included.

TypeScript compilation, the production build, audio hashes, stereo MP3 codecs and all track durations have been checked. Browser interaction and visual QA have not been performed. The optional `configure_galaxy` WebMCP tool is feature-detected; a supported validation context was unavailable.
