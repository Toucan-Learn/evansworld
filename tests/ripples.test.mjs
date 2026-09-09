import assert from "node:assert/strict";
import test from "node:test";
import { MAX_RIPPLES, RipplePool } from "../components/ripples.ts";

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
  sky.expire(2.7);
  assert.deepEqual(
    sky.active.map((r) => r.born),
    [1, 2],
  );
  sky.expire(3.7);
  assert.deepEqual(
    sky.active.map((r) => r.born),
    [2],
  );
  sky.expire(4.7);
  assert.equal(sky.active.length, 0);
});

test("a rapid burst flood never evicts a ring that is still alive", () => {
  const sky = new RipplePool();
  for (let i = 0; i < MAX_RIPPLES; i++) sky.add(i / MAX_RIPPLES, 0.5, i / 100);
  const first = sky.active[0];
  sky.add(0.1, 0.2, 1);
  assert.equal(sky.active.length, MAX_RIPPLES);
  assert.equal(sky.active[0], first);
  sky.add(0.9, 0.8, 3.3);
  assert.deepEqual(sky.active, [{ x: 0.9, y: 0.8, born: 3.3 }]);
  sky.clear();
  assert.equal(sky.active.length, 0);
});
