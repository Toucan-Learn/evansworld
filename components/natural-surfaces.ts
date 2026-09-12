// Procedural textures stay local and require no image downloads.
export function createSandTexture(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(1400, Math.ceil(width));
  canvas.height = Math.min(1000, Math.ceil(height));
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  let seed = 39281;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    const grain = ((seed >>> 0) / 4294967296 - .5) * 42;
    const ridge = Math.sin(y * .075 + Math.sin(x * .007) * 2.6 + Math.sin(x * .019 + y * .005) * .7);
    const dune = Math.sin(x * .004 + y * .006) * 8;
    const light = ridge * 9 + dune + grain;
    const index = (y * canvas.width + x) * 4;
    pixels.data[index] = 204 + light;
    pixels.data[index + 1] = 176 + light;
    pixels.data[index + 2] = 126 + light * .85;
    pixels.data[index + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}
export type WaterRing = { x: number; y: number; born: number };
export function createWaterSurface() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let pixels: ImageData;
  return (target: CanvasRenderingContext2D, width: number, height: number, time: number, rings: WaterRing[], colour: number) => {
    const w = Math.min(360, Math.ceil(width / 2)), h = Math.max(1, Math.round(w * height / width));
    if (canvas.width !== w || canvas.height !== h || !pixels) { canvas.width = w; canvas.height = h; pixels = ctx.createImageData(w, h); }
    const scale = width / w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x * scale * .018, v = y * scale * .018;
      const a = u * .8 + v * .55 + time * .6;
      const b = u * -.45 + v * 1.2 - time * .45;
      const c = u * 1.8 + Math.sin(v * .7 + time * .2) - time * .3;
      let nx = Math.cos(a) * .38 - Math.cos(b) * .22 + Math.cos(c) * .16;
      let ny = Math.cos(a) * .26 + Math.cos(b) * .55;
      for (const ring of rings) {
        const dx = x * scale - ring.x * width, dy = y * scale - ring.y * height;
        const distance = Math.hypot(dx, dy), age = time - ring.born;
        const edge = distance - age * 95;
        if (Math.abs(edge) > 80) continue;
        const wave = Math.cos(edge * .15) * Math.exp(-edge * edge / 1800) * Math.max(0, 1 - age / 3) * .9;
        nx += wave * dx / (distance + 1); ny += wave * dy / (distance + 1);
      }
      const reflection = Math.pow(Math.max(0, (nx * -.4 + ny * -.6 + .65) / Math.sqrt(nx * nx + ny * ny + 1)), 10);
      const caustic = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(c + Math.sin(b)) + Math.sin(b + Math.sin(a))) * .8), 9);
      const shade = nx * -9 + ny * -14;
      const i = (y * w + x) * 4;
      pixels.data[i] = 18 + colour * 9 + shade + caustic * 25 + reflection * 150;
      pixels.data[i + 1] = 103 - colour * 10 + shade + caustic * 42 + reflection * 125;
      pixels.data[i + 2] = 123 + shade + caustic * 38 + reflection * 105;
      pixels.data[i + 3] = 255;
    }
    ctx.putImageData(pixels, 0, 0);
    target.drawImage(canvas, 0, 0, width, height);
  };
}
