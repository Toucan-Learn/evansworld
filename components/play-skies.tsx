import { useEffect, useRef } from 'react';
import type { SkyPreset } from './sky-presets';

type Spark = { x: number; y: number; vx: number; vy: number; life: number; hue: number };
export function PlaySkies({ preset, calm, colour, burst }: { preset: SkyPreset; calm: boolean; colour: number; burst: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ calm, colour, burst });
  settings.current = { calm, colour, burst };
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let width = 1, height = 1, frame = 0, last = 0, time = 0, lastBurst = burst;
    let x = innerWidth * .6, y = innerHeight * .55, angle = -.5, visible = false;
    let sparks: Spark[] = [];
    const grooves: { x: number; y: number; start: boolean }[] = [];
    let newStroke = true;
    const dots = Array.from({ length: 90 }, (_, i) => ({ x: ((i * 137.508) % 100) / 100, y: ((i * 73.17) % 100) / 100, size: 1 + i % 4 }));
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * ratio; canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const emit = (count: number) => {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, speed = 20 + Math.random() * 90;
        sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: 1, hue: (settings.current.colour * 100 + time * 15 + i * 13) % 360 });
      }
      sparks = sparks.slice(-240);
    };
    const point = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      const nx = event.clientX - box.left, ny = event.clientY - box.top;
      if (Math.hypot(nx - x, ny - y) > 2) angle = Math.atan2(ny - y, nx - x);
      x = nx; y = ny; visible = true;
      if (preset === 'sand') { grooves.push({ x: x / width, y: y / height, start: newStroke || event.type === 'pointerdown' }); newStroke = false; if (grooves.length > 2500) grooves.shift(); }
      if (!settings.current.calm) emit(event.type === 'pointerdown' ? 30 : 3);
      if (event.type === 'pointerdown') { canvas.focus(); canvas.setPointerCapture(event.pointerId); }
    };
    const leave = () => { visible = false; newStroke = true; };
    const key = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) return;
      event.preventDefault(); visible = true;
      const dx = event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0;
      const dy = event.key === 'ArrowUp' ? -20 : event.key === 'ArrowDown' ? 20 : 0;
      x = Math.max(25, Math.min(width - 25, x + dx)); y = Math.max(25, Math.min(height - 25, y + dy));
      if (dx || dy) angle = Math.atan2(dy, dx);
      if (!settings.current.calm) emit(event.key === ' ' ? 30 : 5);
    };
    const circle = (cx: number, cy: number, r: number, fill: string) => {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    };
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (document.hidden || now - last < 1000 / 30) return;
      const dt = Math.min((now - last) / 1000, .05); last = now;
      if (!settings.current.calm) time += dt;
      if (settings.current.burst !== lastBurst) { lastBurst = settings.current.burst; grooves.length = 0; if (!settings.current.calm) emit(70); }
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      const colors: Record<string, string[]> = { rocket: ['#080e2c', '#301a59'], sand: ['#745033', '#c39961'], water: ['#061b44', '#06667c'] };
      const palette = colors[preset] || colors.rocket;
      gradient.addColorStop(0, palette[0]); gradient.addColorStop(1, palette[1]); ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      if (preset === 'water') {
        for (let j = 0; j < 9; j++) {
          ctx.beginPath();
          for (let px = 0; px <= width + 10; px += 10) {
            const influence = visible ? Math.exp(-Math.pow((px - x) / 180, 2)) * (y / height - .5) * 130 : 0;
            const py = height * (.28 + j * .07) + Math.sin(px / 170 + time * .4 + j * .45) * 45 + influence;
            if (!px) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `hsla(${180 + j * 5 + settings.current.colour * 10},80%,65%,.24)`;
          ctx.lineWidth = 12; ctx.stroke();
        }
      }
      for (const [i, dot] of dots.entries()) {
        const px = dot.x * width;
        let py = (dot.y * height - (preset === 'sand' ? 0 : time)) % (height + 80);
        if (py < -40) py += height + 80;
        if (preset === 'sand') {
          for (let j = 0; j < 12; j++) circle((px + j * 47) % width, (py + j * 83) % height, .7 + dot.size * .2, i % 2 ? '#f0d6a144' : '#50351f44');
        } else if (preset === 'rocket') circle(px, py, dot.size * .45, '#e1eaff88');
      }
      if (preset === 'sand') {
        for (let j = 0; j < 7; j++) {
          ctx.beginPath();
          for (let px = 0; px <= width + 10; px += 10) {
            const py = height * (j / 6) + Math.sin(px / 260 + j) * 35;
            if (!px) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = '#f1dca319'; ctx.lineWidth = 18; ctx.stroke();
        }
      }
      if (preset === 'sand') {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (const [offset, color, thickness] of [[3, '#f2d29c88', 10], [0, '#65432399', 8]] as const) {
          ctx.beginPath();
          grooves.forEach((p, i) => { if (!i || p.start) ctx.moveTo(p.x * width, p.y * height + offset); else ctx.lineTo(p.x * width, p.y * height + offset); });
          ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.stroke();
        }
      }
      if (preset === 'rocket') {
        // Fixed-size visitors wrap beyond the screen edge; calm mode freezes their clock.
        for (let i = 0; i < 3; i++) {
          const progress = ((time * (24 + i * 7) + width * (.14 + i * .31)) % (width + 160)) - 80;
          const ux = i % 2 ? width - progress : progress;
          const uy = height * (.24 + i * .23) + Math.sin(time * .7 + i * 2) * 18;
          ctx.save(); ctx.translate(ux, uy); ctx.rotate(Math.sin(time * .5 + i) * .09);
          ctx.fillStyle = '#9ff4deaa'; ctx.beginPath(); ctx.ellipse(0, -9, 16, 16, 0, Math.PI, Math.PI * 2); ctx.fill();
          circle(0, -15, 6, '#b7ed9f'); circle(-2, -16, 1.5, '#17233e'); circle(3, -16, 1.5, '#17233e');
          ctx.fillStyle = ['#b5a4e9', '#83bdda', '#d7a4c2'][i]; ctx.beginPath(); ctx.ellipse(0, 0, 33, 10, 0, 0, Math.PI * 2); ctx.fill();
          for (let light = -1; light <= 1; light++) circle(light * 17, 2, 2.5, '#f7efb5');
          ctx.restore();
        }
        for (let i = 0; i < 2; i++) {
          const phase = (time + i * 4 + .8) % 9;
          if (phase > 2.6) continue;
          const progress = phase / 2.6;
          const sx = -110 + progress * (width + 280);
          const sy = height * (.12 + i * .28) + progress * height * .28;
          const trail = ctx.createLinearGradient(sx - 95, sy - 28, sx, sy);
          trail.addColorStop(0, '#a7caff00'); trail.addColorStop(1, '#dcefffcc');
          ctx.strokeStyle = trail; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 95, sy - 28); ctx.lineTo(sx, sy); ctx.stroke();
          circle(sx, sy, 2.5, '#f4faff');
        }
        circle(width * .78, height * .3, 56, '#b6a5e0'); circle(width * .79, height * .28, 12, '#8d7abe'); circle(width * .765, height * .325, 18, '#9580c5');
        ctx.save(); ctx.translate(width * .22, height * .72); ctx.rotate(-.3);
        ctx.strokeStyle = '#eabfbb88'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(0, 0, 84, 22, 0, 0, Math.PI * 2); ctx.stroke(); circle(0, 0, 43, '#d6a082'); ctx.restore();
      }
      if (!settings.current.calm) sparks.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; if (preset === 'sand') p.vy += 100 * dt; p.life -= dt * .6; });
      sparks = sparks.filter(p => p.life > 0);
      for (const p of sparks) {
        if (preset === 'water') {
          ctx.beginPath(); ctx.arc(p.x, p.y, 4 + (1 - p.life) * 65, 0, Math.PI * 2); ctx.strokeStyle = `rgba(170,235,255,${p.life * .3})`; ctx.lineWidth = 1.5; ctx.stroke();
        } else circle(p.x, p.y, preset === 'sand' ? 1 + p.life * 2 : 2 + p.life * 4, preset === 'sand' ? `rgba(255,221,158,${p.life})` : `hsla(${p.hue},90%,75%,${p.life * .7})`);
      }
      if (preset === 'rocket' && visible) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
        ctx.fillStyle = '#ffb85b'; ctx.beginPath(); ctx.moveTo(-19, -7); ctx.lineTo(-35 - (settings.current.calm ? 0 : Math.sin(time * 12) * 5), 0); ctx.lineTo(-19, 7); ctx.fill();
        ctx.fillStyle = '#f07188'; ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(-23, -18); ctx.lineTo(-20, 18); ctx.lineTo(-14, 8); ctx.fill();
        ctx.fillStyle = '#f1efff'; ctx.beginPath(); ctx.moveTo(25, 0); ctx.quadraticCurveTo(4, -18, -18, -9); ctx.lineTo(-18, 9); ctx.quadraticCurveTo(4, 18, 25, 0); ctx.fill(); circle(3, 0, 6, '#56bddb'); ctx.restore();
      }
    };
    resize(); frame = requestAnimationFrame(draw);
    const observer = new ResizeObserver(resize); observer.observe(canvas);
    canvas.addEventListener('pointermove', point); canvas.addEventListener('pointerdown', point); canvas.addEventListener('pointerleave', leave); canvas.addEventListener('keydown', key);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('pointermove', point); canvas.removeEventListener('pointerdown', point); canvas.removeEventListener('pointerleave', leave); canvas.removeEventListener('keydown', key); };
  }, [preset]);
  return <canvas ref={ref} className={`play-sky${preset === 'rocket' ? ' rocket-sky' : ''}`} tabIndex={0} role="application" aria-label={`${preset} playground. Move or touch to play. Arrow keys to move, space to burst.`} />;
}
