// Software equivalent of the galaxy shader's displacement. Sample the artwork
// itself so a missing/lost WebGL context still produces waves, not outline rings.
export type ImageWave = { x: number; y: number; radius: number; opacity: number };
export type ImageBrush = { x: number; y: number; dx: number; dy: number; life: number };

export function warpSkyImage(
  source: Uint8ClampedArray,
  output: Uint8ClampedArray,
  width: number,
  height: number,
  waves: ImageWave[],
  brushes: ImageBrush[],
  ink: number[],
) {
  if (!waves.length && !brushes.length) {
    output.set(source);
    return;
  }
  const aspect = width / height;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width,
        v = (y + 0.5) / height;
      let waveX = 0,
        waveY = 0,
        brushX = 0,
        brushY = 0,
        glow = 0;
      for (const wave of waves) {
        const dx = (u - wave.x) * aspect,
          dy = v - wave.y;
        const distance = Math.hypot(dx, dy);
        const difference = (distance - wave.radius) * 60;
        if (Math.abs(difference) > 4) continue;
        const strength = Math.exp(-difference * difference) * wave.opacity;
        const length = Math.hypot(dx + 0.0001, dy + 0.0001);
        waveX += ((dx + 0.0001) / length) * strength * 0.025;
        waveY += ((dy + 0.0001) / length) * strength * 0.025;
        glow += strength * 0.38;
      }
      for (const brush of brushes) {
        const dx = (u - brush.x) * aspect,
          dy = v - brush.y;
        const length = Math.hypot(brush.dx + 0.0001, brush.dy);
        const directionX = (brush.dx + 0.0001) / length,
          directionY = brush.dy / length;
        const along = dx * directionX + dy * directionY;
        const across = -dx * directionY + dy * directionX;
        const halo = Math.exp(-(along * along * 55 + across * across * 340)) * brush.life;
        const strength = halo * Math.min(Math.hypot(brush.dx, brush.dy) * 2.5, 0.09);
        brushX -= directionX * strength;
        brushY -= directionY * strength;
        glow += halo * 0.22;
      }
      const warpX = Math.max(-0.1, Math.min(0.1, brushX)) + Math.max(-0.06, Math.min(0.06, waveX));
      const warpY = Math.max(-0.1, Math.min(0.1, brushY)) + Math.max(-0.06, Math.min(0.06, waveY));
      const sampleX = Math.max(0, Math.min(width - 1, Math.floor((u + warpX / aspect) * width)));
      const sampleY = Math.max(0, Math.min(height - 1, Math.floor((v + warpY) * height)));
      const from = (sampleY * width + sampleX) * 4,
        to = (y * width + x) * 4;
      const strength = Math.min(0.8, glow);
      const brightness = Math.max(source[from], source[from + 1], source[from + 2]) / 255;
      for (let channel = 0; channel < 3; channel++) {
        const original = source[from + channel] / 255;
        const painted =
          Math.round((ink[channel] * (0.15 + brightness * 0.85) + original * 0.55) * 32) / 32;
        output[to + channel] = (original * (1 - strength) + painted * strength) * 255;
      }
      output[to + 3] = 255;
    }
  }
}
