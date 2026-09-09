import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_RIPPLES,
  RIPPLE_SPEED,
  RIPPLE_TAIL,
  RipplePool,
  rippleOpacity,
} from "../components/ripples.ts";

test("new bursts preserve earlier positions and each ring expires on its own", () => {
  const sky = new RipplePool();
  sky.add(0.2, 0.3, 0);
  sky.add(0.8, 0.6, 1);
  sky.add(0.5, 0.5, 2);
  assert.deepEqual(sky.active, [
    { x: 0.2, y: 0.3, born: 0 },
    { x: 0.8, y: 0.6, born: 1 },
    { x: 0.5, y: 0.5, born: 2 },
  ]);
  sky.expire(3.7);
  assert.deepEqual(
    sky.active.map((r) => r.born),
    [1, 2],
  );
  sky.expire(4.4);
  assert.deepEqual(
    sky.active.map((r) => r.born),
    [2],
  );
  sky.expire(4.6);
  assert.equal(sky.active.length, 0);
});

test("a rapid burst flood never evicts a ring that is still alive", () => {
  const sky = new RipplePool();
  for (let i = 0; i < MAX_RIPPLES; i++) sky.add(i / MAX_RIPPLES, 0.5, i / 100);
  const first = sky.active[0];
  sky.add(0.1, 0.2, 1);
  assert.equal(sky.active.length, MAX_RIPPLES);
  assert.equal(sky.active[0], first);
  sky.add(0.9, 0.8, 10);
  assert.deepEqual(sky.active, [{ x: 0.9, y: 0.8, born: 10 }]);
  sky.clear();
  assert.equal(sky.active.length, 0);
});

for (const [width, height] of [
  [320, 568],
  [768, 1024],
  [1920, 1080],
  [3440, 1440],
]) {
  test(`ripples stay visible through every corner on a ${width} by ${height} screen`, () => {
    const aspect = width / height;
    for (const [x, y] of [
      [0.5, 0.5],
      [0.63, 0.5],
      [0, 0],
      [1, 1],
      [0.1, 0.9],
    ]) {
      const sky = new RipplePool(aspect);
      sky.add(x, y, 0);
      const ripple = sky.active[0];
      const distances = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ].map(([cx, cy]) => Math.hypot((cx - x) * aspect, cy - y));
      const lastCorner = Math.max(...distances) / RIPPLE_SPEED;
      for (const distance of distances) {
        assert.ok(rippleOpacity(ripple, distance / RIPPLE_SPEED, aspect) > 0.999);
      }
      sky.expire(lastCorner);
      assert.equal(sky.active.length, 1, "ring disappeared before clearing the whole screen");
      const finished = lastCorner + RIPPLE_TAIL / RIPPLE_SPEED + 0.001;
      assert.equal(rippleOpacity(ripple, finished, aspect), 0);
      sky.expire(finished);
      assert.equal(sky.active.length, 0);
    }
  });
}

test("an active ripple extends its journey when the viewport becomes wider", () => {
  const sky = new RipplePool(9 / 16);
  sky.add(0, 0, 0);
  sky.aspect = 21 / 9;
  sky.expire(4);
  assert.equal(sky.active.length, 1);
  assert.equal(rippleOpacity(sky.active[0], 4, sky.aspect), 1);
});
