# Rocket Dodge

Five-stage mouse / touch / keyboard mini-game. The rocket uses the same shape
as the website's Rocket flight background. Each hit bursts the rocket, clears
the screen and advances the hazard theme: stars, burgers, lasers, handheld
consoles, then the ghost finale. Brief protection follows each transition.
In the final stage, the shield reflects stars toward the nearest living ghost.
Reflected stars must physically hit their targets; all six ghosts cleared wins.
The dodge counter rewards avoiding hazards during the first four stages.

Mouse movement or touch dragging controls the ship; arrow keys / WASD also work.
Pause or Escape pauses. Leaving the browser window pauses automatically.
All visuals are local Canvas drawings. No assets, accounts or network services
are needed. `engine.js` contains gameplay, `game.js` drawing/input, and `style.css`
the viewport-fitting layout. Unit coverage is in `tests/rocket-dodge.test.mjs`.
