export const SHOOTING_STAR_COUNT = 6;
export function shootingStar(time: number, index: number, width: number, height: number) {
  const phase = (time + index * .9 + .8) % 5.4;
  if (phase > 3.2) return null;
  const progress = phase / 3.2;
  return { x: -110 + progress * (width + 280), y: height * (.16 + index * .105) + progress * height * .28, phase };
}
// Swept collision catches fast stars between frames, without colliding along a wrap.
export function starHitsRocket(previous: ReturnType<typeof shootingStar>, current: ReturnType<typeof shootingStar>, x: number, y: number, radius = 23) {
  if (!current) return false;
  const start = previous && previous.phase <= current.phase ? previous : current;
  const dx = current.x - start.x, dy = current.y - start.y;
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / length)) : 0;
  return Math.hypot(x - start.x - t * dx, y - start.y - t * dy) <= radius;
}
