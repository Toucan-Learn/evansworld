# Rocket Dodge

Standalone six-stage mouse / touch / keyboard mini-game. Games launches the full
page, and the legacy #rocket-dodge link redirects here. Back to Games returns to
the website. Survive 30 seconds in each of the first four stages to advance:
stars, burgers, lasers, handheld consoles, the ghost wave, then a giant block ghost. A hit bursts
the rocket and offers Retry; retry restarts the current stage's timer. Pausing
freezes the timer. Star stages launch roughly four to six stars per second from all four edges, with varied speeds and angles. Some shots aim at the rocket’s position when launched, so standing still is unsafe.
In stage five, the shield reflects stars toward the nearest living ghost.
Reflected stars must physically hit their targets; clearing six ghosts unlocks the giant ghost. Each reflected laser destroys exactly one block; destroying every block wins.
The countdown shows the remaining survival time.

Mouse movement or touch dragging controls the ship; arrow keys / WASD also work.
Pause or Escape pauses. Leaving the browser window pauses automatically.
All visuals are local Canvas drawings. No assets, accounts or network services
are needed. `engine.js` contains gameplay, `game.js` drawing/input, and `style.css`
the viewport-fitting layout. Unit coverage is in `tests/rocket-dodge.test.mjs`.

Incoming hazard velocities are scaled to 80% for a gentler difficulty. Reflected shots retain full speed.
