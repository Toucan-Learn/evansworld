export const RIPPLE_LIFETIME = 2.6;
export const MAX_RIPPLES = 64;
export type Ripple = { x: number; y: number; born: number };

export class RipplePool {
  active: Ripple[] = [];

  expire(now: number) {
    this.active = this.active.filter((ripple) => now - ripple.born < RIPPLE_LIFETIME);
  }

  add(x: number, y: number, now: number) {
    this.expire(now);
    // Keep existing rings alive even when input exceeds the GPU's burst budget.
    if (this.active.length < MAX_RIPPLES) this.active.push({ x, y, born: now });
  }

  clear() {
    this.active = [];
  }
}
