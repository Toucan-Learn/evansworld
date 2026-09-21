import assert from "node:assert/strict";
import test from "node:test";
import { warpSkyImage } from "../components/sky-image-warp.ts";

const width = 100,
  height = 100;
function artwork() {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      pixels[index] = x >= 50 ? 255 : 0;
      pixels[index + 1] = y >= 50 ? 255 : 0;
      pixels[index + 3] = 255;
    }
  return pixels;
}

test("waves move artwork pixels across an edge, rather than only colouring an overlay", () => {
  const source = artwork(),
    saved = source.slice(),
    output = new Uint8ClampedArray(source.length);
  const point = (50 * width + 48) * 4;
  warpSkyImage(
    source,
    output,
    width,
    height,
    [{ x: 0.25, y: 0.5, radius: 0.235, opacity: 1 }],
    [],
    [0, 0, 0],
  );
  assert.equal(source[point], 0);
  assert.ok(output[point] > 100, "the wave should pull red pixels across the source edge");
  assert.deepEqual(source, saved, "the original drawing must never be edited by a wave");
});

test("directional swashes deform the image and settling restores every original pixel", () => {
  const source = artwork(),
    output = new Uint8ClampedArray(source.length);
  const point = (50 * width + 48) * 4;
  warpSkyImage(
    source,
    output,
    width,
    height,
    [],
    [{ x: 0.48, y: 0.5, dx: -0.03, dy: 0, life: 1 }],
    [0, 0, 0],
  );
  assert.ok(output[point] > 100, "the swash should move image content, not draw a spiral");
  warpSkyImage(source, output, width, height, [], [], [0, 0, 0]);
  assert.deepEqual(output, source);
});

for (const style of ["gentle", "elastic"])
  test(`${style} image waves combine without modifying either wave`, () => {
    const source = artwork();
    const waves = [
      { x: 0.25, y: 0.5, radius: 0.235, opacity: 1 },
      { x: 0.75, y: 0.5, radius: 0.26, opacity: 0.8 },
    ];
    const before = structuredClone(waves);
    const outputs = [waves, waves.slice(0, 1), waves.slice(1)].map((rings) => {
      const output = new Uint8ClampedArray(source.length);
      warpSkyImage(source, output, width, height, rings, [], [0.23, 1, 0.78], style);
      return output;
    });
    assert.notDeepEqual(outputs[0], outputs[1]);
    assert.notDeepEqual(outputs[0], outputs[2]);
    assert.deepEqual(waves, before);
  });

test("drawing rings stretch a wider area and pull the artwork back behind the crest", () => {
  const source = artwork(),
    saved = source.slice();
  const gentle = new Uint8ClampedArray(source.length);
  const elastic = new Uint8ClampedArray(source.length);
  const wave = [{ x: 0.165, y: 0.505, radius: 0.235, opacity: 1 }];
  const distantEdge = (50 * width + 40) * 4;
  warpSkyImage(source, gentle, width, height, wave, [], [0, 0, 0]);
  warpSkyImage(source, elastic, width, height, wave, [], [0, 0, 0], "elastic");
  assert.equal(gentle[distantEdge], 0);
  assert.ok(elastic[distantEdge] > 100, "the drawing ring must pull colour across a ten-pixel gap");

  const returnWave = [{ x: 0.18, y: 0.505, radius: 0.25, opacity: 1 }];
  const behindCrest = (50 * width + 52) * 4;
  warpSkyImage(source, gentle, width, height, returnWave, [], [0, 0, 0]);
  warpSkyImage(source, elastic, width, height, returnWave, [], [0, 0, 0], "elastic");
  assert.equal(gentle[behindCrest], 255);
  assert.equal(elastic[behindCrest], 0, "the trailing fold must pull back, not only push out");
  assert.deepEqual(source, saved);
  warpSkyImage(source, elastic, width, height, [], [], [0, 0, 0], "elastic");
  assert.deepEqual(elastic, source, "settling must restore the original artwork exactly");
});
