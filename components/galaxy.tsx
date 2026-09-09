import { useEffect, useRef, useState } from "react";
import { originalFragmentSource, vertexSource } from "./galaxy-shaders";
import { MAX_RIPPLES, RIPPLE_LIFETIME, RipplePool } from "./ripples";

// Keep Harry's geometry, ordered dithering and noise, with Evan's Earth palette.
const fragmentSource = originalFragmentSource
  .replace(
    /const vec3 PALETTE\[9\]=vec3\[\]\([\s\S]*?\);/,
    `const vec3 PALETTE[9]=vec3[](
 vec3(.025,.18,.25),vec3(.04,.27,.38),vec3(.065,.40,.49),
 vec3(.105,.53,.56),vec3(.28,.61,.52),vec3(.49,.69,.51),
 vec3(.69,.77,.55),vec3(.87,.84,.64),vec3(.99,.94,.79)
);`,
  )
  .replace(
    "vec3 colour=palette_colour(density,pixel);",
    "density=clamp(density*.90+.12,0.0,1.0);\n vec3 colour=palette_colour(density,pixel);",
  )
  .replace("colour*=1.0-navigation*.40;", "colour*=1.0-navigation*.18;")
  .replace(
    "uniform float home_view;",
    `uniform float home_view;
uniform vec4 brush[12];
uniform vec2 swash[12];
uniform vec3 ink;
uniform vec3 ripples[${MAX_RIPPLES}];
uniform int rippleCount;`,
  )
  .replace(
    "vec2 drift=vec2(t*.0007,-t*.00028);",
    `
 float brushLight=0.0;
 vec2 warp=vec2(0.0);
 for(int i=0;i<12;i++){
  vec2 delta=(uv-brush[i].xy)*vec2(grid.x/grid.y,1.0);
  float age=brush[i].z;
  float life=max(0.0,1.0-age/1.5)*brush[i].w;
  vec2 direction=normalize(swash[i]+vec2(.0001,0.0));
  float along=dot(delta,direction);
  float across=dot(delta,vec2(-direction.y,direction.x));
  float halo=exp(-(along*along*55.0+across*across*340.0))*life;
  brushLight+=halo*.22;
  warp-=direction*halo*min(length(swash[i])*2.5,.09);
 }
 float ring=0.0;
 vec2 rippleWarp=vec2(0.0);
 for(int i=0;i<${MAX_RIPPLES};i++){
  if(i>=rippleCount){break;}
  vec2 delta=(uv-ripples[i].xy)*vec2(grid.x/grid.y,1.0);
  float age=ripples[i].z;
  float wave=exp(-pow((length(delta)-age*.32)*60.0,2.0))*max(0.0,1.0-age/${RIPPLE_LIFETIME});
  ring+=wave;
  rippleWarp+=normalize(delta+vec2(.0001))*wave*.025;
 }
 noise_uv+=clamp(warp,vec2(-.10),vec2(.10))+clamp(rippleWarp,vec2(-.06),vec2(.06));
 vec2 drift=vec2(t*.0007,-t*.00028);`,
  )
  .replace(
    "outputColour=vec4(colour,1.0);",
    `
 float glow=clamp(brushLight+ring*.38,0.0,.8);
 vec3 painted=floor((ink*(.15+density*.85)+colour*.55)*32.0+.5)/32.0;
 colour=mix(colour,painted,glow);
 outputColour=vec4(colour,1.0);`,
  );

type Dot = { x: number; y: number; dx: number; dy: number; born: number };
const inks = [
  [0.23, 1, 0.78],
  [0.73, 0.46, 1],
  [1, 0.66, 0.28],
];
export function Galaxy({ calm, colour, burst }: { calm: boolean; colour: number; burst: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const state = useRef({ calm, colour, burst });
  state.current = { calm, colour, burst };
  const refresh = useRef<(() => void) | null>(null);
  const [keyboardHint, setKeyboardHint] = useState(false);
  useEffect(() => {
    refresh.current?.();
  }, [calm, colour, burst]);
  useEffect(() => {
    const canvas = canvasRef.current!,
      surface = surfaceRef.current!;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
    });
    let fallback: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let frame = 0,
      last = 0,
      elapsed = 0,
      disposed = false,
      loaded = false,
      lastBurst = state.current.burst;
    const ripples = new RipplePool();
    const rippleValues = new Float32Array(MAX_RIPPLES * 3);
    let dots: Dot[] = [];
    let lastInput = 0;
    let previousPoint: { x: number; y: number; time: number } | null = null;
    let keyPoint = { x: 0.55, y: 0.5 };
    let program: WebGLProgram | null = null,
      buffer: WebGLBuffer | null = null,
      texture: WebGLTexture | null = null;
    const shaders: WebGLShader[] = [];
    const loc: Record<string, WebGLUniformLocation | null> = {};
    let usable = false;
    function initFallback() {
      canvas.style.opacity = "0";
      fallback = document.createElement("canvas");
      fallback.className = "galaxy-sky";
      fallback.style.cssText = "position:absolute;inset:0;opacity:1";
      canvas.parentElement!.appendChild(fallback);
      ctx = fallback.getContext("2d");
      loaded = true;
    }
    if (gl) {
      try {
        program = gl.createProgram();
        if (!program) throw Error("No program");
        for (const [kind, code] of [
          [gl.VERTEX_SHADER, vertexSource],
          [gl.FRAGMENT_SHADER, fragmentSource],
        ] as const) {
          const shader = gl.createShader(kind);
          if (!shader) throw Error("No shader");
          shaders.push(shader);
          gl.shaderSource(shader, code);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw Error("Shader could not compile");
          gl.attachShader(program, shader);
        }
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error("Link failed");
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW,
        );
        const position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        for (const name of [
          "resolution",
          "clock",
          "home_view",
          "brush[0]",
          "swash[0]",
          "ink",
          "ripples[0]",
          "rippleCount",
        ])
          loc[name] = gl.getUniformLocation(program, name);
        usable = true;
      } catch {
        initFallback();
      }
    } else initFallback();
    const noise = new Image();
    if (usable) {
      noise.onload = () => {
        if (disposed || !usable) return;
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, noise);
        loaded = true;
        canvas.style.opacity = "1";
        resize();
        wake();
      };
      noise.onerror = () => {
        if (disposed) return;
        usable = false;
        initFallback();
        resize();
        wake();
      };
      noise.src = new URL("../assets/galaxy-noise.png", import.meta.url).href;
    }
    function draw() {
      if (disposed || document.hidden || !loaded) return;
      const ink = inks[state.current.colour];
      if (usable && gl) {
        const values = new Float32Array(48);
        const swashes = new Float32Array(24);
        dots.slice(-12).forEach((p, i) => {
          values.set([p.x, p.y, elapsed - p.born, 1], i * 4);
          swashes.set([p.dx, p.dy], i * 2);
        });
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(loc.resolution, canvas.width, canvas.height);
        gl.uniform1f(loc.clock, elapsed);
        gl.uniform1f(loc.home_view, 1);
        gl.uniform4fv(loc["brush[0]"], values);
        gl.uniform2fv(loc["swash[0]"], swashes);
        gl.uniform3fv(loc.ink, ink);
        ripples.active.forEach((ripple, i) => {
          rippleValues.set([ripple.x, ripple.y, elapsed - ripple.born], i * 3);
        });
        gl.uniform3fv(loc["ripples[0]"], rippleValues);
        gl.uniform1i(loc.rippleCount, ripples.active.length);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else if (ctx && fallback) {
        ctx.clearRect(0, 0, fallback.width, fallback.height);
        for (const p of dots) {
          const life = Math.max(0, 1 - (elapsed - p.born) / 1.5);
          const magnitude = Math.hypot(p.dx, p.dy);
          const dx = magnitude ? p.dx / magnitude : 1;
          const dy = magnitude ? p.dy / magnitude : 0;
          for (let i = 0; i < 28; i++) {
            const along = (i % 7) * 3 - 9 + (elapsed - p.born) * 7;
            const across = Math.floor(i / 7) * 2 - 3;
            ctx.fillStyle = `rgba(${ink.map((v) => Math.round(v * 255)).join(",")},${life * 0.65})`;
            ctx.fillRect(
              Math.floor(p.x * fallback.width + dx * along - dy * across),
              Math.floor(p.y * fallback.height + dy * along + dx * across),
              2,
              2,
            );
          }
        }
        for (const ripple of ripples.active) {
          const age = elapsed - ripple.born;
          for (let i = 0; i < 40; i++) {
            const a = (i * Math.PI) / 20;
            ctx.fillStyle = `rgba(${ink.map((v) => Math.round(v * 255)).join(",")},${(1 - age / RIPPLE_LIFETIME) * 0.8})`;
            ctx.fillRect(
              Math.floor(ripple.x * fallback.width + Math.cos(a) * age * fallback.height * 0.32),
              Math.floor(ripple.y * fallback.height + Math.sin(a) * age * fallback.height * 0.32),
              2,
              2,
            );
          }
        }
      }
    }
    function tick(now: number) {
      frame = 0;
      if (disposed || document.hidden || state.current.calm) return;
      if (!last) last = now;
      if (now - last >= 1000 / 30) {
        elapsed += Math.min((now - last) / 1000, 0.08);
        last = now;
        dots = dots.filter((p) => elapsed - p.born < 1.5);
        ripples.expire(elapsed);
        draw();
      }
      if (usable || dots.length || ripples.active.length) frame = requestAnimationFrame(tick);
    }
    function wake() {
      while (lastBurst < state.current.burst) {
        lastBurst++;
        ripples.add(0.63, 0.5, elapsed);
      }
      if (state.current.calm) {
        dots = [];
        ripples.clear();
        previousPoint = null;
      }
      if (disposed || document.hidden || state.current.calm) {
        cancelAnimationFrame(frame);
        frame = 0;
        last = 0;
      }
      draw();
      if (!disposed && loaded && !document.hidden && !state.current.calm && !frame) {
        last = 0;
        frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      const scale = Math.max(4, window.innerWidth / 560);
      canvas.width = Math.max(1, Math.floor(window.innerWidth / scale));
      canvas.height = Math.max(1, Math.floor(window.innerHeight / scale));
      if (fallback) {
        fallback.width = canvas.width;
        fallback.height = canvas.height;
      }
      draw();
    }
    function point(event: PointerEvent) {
      if (state.current.calm) return;
      const now = performance.now();
      if (event.type === "pointermove" && now - lastInput < 24) return;
      lastInput = now;
      const box = surface.getBoundingClientRect(),
        x = (event.clientX - box.left) / box.width,
        y = (event.clientY - box.top) / box.height;
      const follows =
        previousPoint && now - previousPoint.time < 180 && event.type !== "pointerdown";
      const dx = follows ? ((x - previousPoint!.x) * box.width) / box.height : 0.025;
      const dy = follows ? y - previousPoint!.y : 0;
      dots.push({ x, y, dx, dy, born: elapsed });
      previousPoint = { x, y, time: now };
      dots = dots.slice(-12);
      if (event.type === "pointerdown") {
        ripples.add(x, y, elapsed);
        if (event.pointerType === "touch") surface.setPointerCapture(event.pointerId);
      }
      if (!frame) wake();
    }
    function keys(event: KeyboardEvent) {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "Enter"].includes(event.key))
        return;
      event.preventDefault();
      if (state.current.calm) return;
      const previousKey = { ...keyPoint };
      keyPoint.x = Math.max(
        0.05,
        Math.min(
          0.95,
          keyPoint.x +
            (event.key === "ArrowRight" ? 0.035 : event.key === "ArrowLeft" ? -0.035 : 0),
        ),
      );
      keyPoint.y = Math.max(
        0.05,
        Math.min(
          0.95,
          keyPoint.y + (event.key === "ArrowDown" ? 0.035 : event.key === "ArrowUp" ? -0.035 : 0),
        ),
      );
      dots.push({
        ...keyPoint,
        dx: ((keyPoint.x - previousKey.x) * canvas.width) / canvas.height,
        dy: keyPoint.y - previousKey.y,
        born: elapsed,
      });
      dots = dots.slice(-12);
      if (event.key === " " || event.key === "Enter") ripples.add(keyPoint.x, keyPoint.y, elapsed);
      if (!frame) wake();
    }
    function lost(event: Event) {
      event.preventDefault();
      usable = false;
      if (!fallback) initFallback();
      resize();
      wake();
    }
    refresh.current = wake;
    resize();
    wake();
    surface.addEventListener("pointermove", point);
    surface.addEventListener("pointerdown", point);
    surface.addEventListener("keydown", keys);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", wake);
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      noise.onload = null;
      noise.onerror = null;
      refresh.current = null;
      surface.removeEventListener("pointermove", point);
      surface.removeEventListener("pointerdown", point);
      surface.removeEventListener("keydown", keys);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", wake);
      canvas.removeEventListener("webglcontextlost", lost);
      fallback?.remove();
      if (gl) {
        shaders.forEach((s) => gl.deleteShader(s));
        gl.deleteBuffer(buffer);
        gl.deleteTexture(texture);
        gl.deleteProgram(program);
      }
    };
  }, []);
  return (
    <>
      <div className="galaxy-backdrop" aria-hidden="true">
        <canvas ref={canvasRef} className="galaxy-sky" />
        <div className="sky-shade" />
      </div>
      <div
        ref={surfaceRef}
        className="galaxy-touch"
        tabIndex={0}
        role="application"
        aria-label="Interactive galaxy. Use arrow keys to paint, and space for a star burst."
        onFocus={() => setKeyboardHint(true)}
        onBlur={() => setKeyboardHint(false)}
      />
      {keyboardHint && <p className="keyboard-hint">Arrow keys to paint · Space to burst</p>}
    </>
  );
}
