"use client";

import { useEffect, useRef } from "react";

type Point = { x: number; y: number; z: number };

/** Procedural, scroll-responsive scientific forms; no remote artwork or WebGL dependency. */
export function SignalEngine({
  variant = "group",
}: {
  variant?: "group" | "bio";
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext("2d");
    if (!element || !context) return;
    const el = element,
      ctx = context;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches,
      width = 0,
      height = 0,
      rotation = 0,
      scroll = 0,
      frame = 0,
      visible = true,
      last = 0;
    const count = 300;
    const points: Point[] = Array.from({ length: count }, (_, i) => {
      const y = 1 - ((i + 0.5) / count) * 2,
        r = Math.sqrt(1 - y * y),
        a = i * Math.PI * (3 - Math.sqrt(5));
      return { x: Math.cos(a) * r, y, z: Math.sin(a) * r };
    });
    const edges: [number, number][] = [];
    for (let i = 0; i < count; i++) {
      points
        .map((p, j) => ({
          j,
          d: Math.hypot(
            p.x - points[i].x,
            p.y - points[i].y,
            p.z - points[i].z,
          ),
        }))
        .filter((p) => p.j > i && p.d < 0.3)
        .sort((a, b) => a.d - b.d)
        .slice(0, 4)
        .forEach((p) => edges.push([i, p.j]));
    }
    function project(p: Point, cx: number, cy: number, radius: number) {
      const a = rotation + (reduced ? 0 : scroll * 0.9),
        tilt = -0.17 + (reduced ? 0 : scroll * 0.18);
      const x = p.x * Math.cos(a) + p.z * Math.sin(a),
        z = -p.x * Math.sin(a) + p.z * Math.cos(a);
      const y = p.y * Math.cos(tilt) - z * Math.sin(tilt),
        depth = p.y * Math.sin(tilt) + z * Math.cos(tilt);
      const perspective = 3.8 / (3.8 - depth);
      return {
        x: cx + x * radius * perspective,
        y: cy + y * radius * perspective,
        z: depth,
      };
    }
    function globe() {
      const mobile = width < 750,
        cx = width * (mobile ? 0.53 : 0.74),
        cy = height * (mobile ? 0.74 : 0.48);
      const radius = mobile
        ? width * 0.42
        : Math.min(height * 0.39, width * 0.285);
      const light = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.45);
      light.addColorStop(0, "#2f76b42c");
      light.addColorStop(0.65, "#1850a014");
      light.addColorStop(1, "#05132600");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, width, height);
      const nodes = points.map((p) => project(p, cx, cy, radius));
      for (const [i, j] of edges) {
        const depth = (nodes[i].z + nodes[j].z + 2) / 4;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `rgba(95,179,255,${0.07 + depth * 0.43})`;
        ctx.lineWidth = 0.35 + depth * 0.65;
        ctx.stroke();
      }
      nodes.forEach((p, i) => {
        const depth = (p.z + 1) / 2,
          bright = i % 13 === 0;
        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          (bright ? 2.5 : 1.1) * (0.55 + depth * 0.7),
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = bright
          ? `rgba(174,225,255,${0.35 + depth * 0.65})`
          : `rgba(111,183,243,${0.12 + depth * 0.7})`;
        ctx.shadowBlur = bright && p.z > 0 ? 12 : 0;
        ctx.shadowColor = "#65baff";
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      if (!reduced) {
        edges
          .filter((_, i) => i % 47 === 0)
          .forEach(([i, j], index) => {
            const t = (rotation * 0.9 + index * 0.13) % 1,
              a = nodes[i],
              b = nodes[j];
            if (a.z + b.z < 0) return;
            ctx.beginPath();
            ctx.arc(
              a.x + (b.x - a.x) * t,
              a.y + (b.y - a.y) * t,
              1.7,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = "#d1f2ff";
            ctx.fill();
          });
      }
    }
    function dna() {
      const mobile = width < 750,
        cx = width * (mobile ? 0.61 : 0.77),
        cy = height * (mobile ? 0.73 : 0.5);
      const length = mobile ? height * 0.43 : height * 0.86,
        radius = mobile ? width * 0.16 : Math.min(width * 0.095, 130);
      const phase = rotation * 1.2 + (reduced ? 0 : scroll * 1.7),
        tilt = -0.28;
      const strands: { x: number; y: number; z: number }[][] = [[], []];
      for (let strand = 0; strand < 2; strand++) {
        for (let i = 0; i <= 180; i++) {
          const p = i / 180,
            angle = p * Math.PI * 4.2 + phase + strand * Math.PI;
          const x = Math.sin(angle) * radius,
            y = (p - 0.5) * length;
          strands[strand].push({
            x: cx + x * Math.cos(tilt) - y * Math.sin(tilt),
            y: cy + x * Math.sin(tilt) + y * Math.cos(tilt),
            z: Math.cos(angle),
          });
        }
      }
      for (let i = 3; i < 180; i += 6) {
        const a = strands[0][i],
          b = strands[1][i],
          midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const colors = ["#70c6dd", "#a6b6df", "#77b8ac", "#becddc"];
        ctx.lineWidth = mobile ? 3 : 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(midpoint.x, midpoint.y);
        ctx.strokeStyle = colors[((i / 6) | 0) % 4];
        ctx.globalAlpha = 0.58;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midpoint.x, midpoint.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = colors[((i / 6 + 2) | 0) % 4];
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      strands.forEach((strand, s) => {
        for (let i = 1; i < strand.length; i++) {
          const p = strand[i],
            depth = (p.z + 1) / 2;
          ctx.beginPath();
          ctx.moveTo(strand[i - 1].x, strand[i - 1].y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = s
            ? `rgba(134,181,200,${0.3 + depth * 0.65})`
            : `rgba(108,187,239,${0.3 + depth * 0.65})`;
          ctx.lineWidth = 2.3 + depth * 2.5;
          ctx.stroke();
          if (i % 6 === 3) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 + depth * 2.3, 0, Math.PI * 2);
            ctx.fillStyle = depth > 0.5 ? "#c7e7f0" : "#4c7e9c";
            ctx.fill();
          }
        }
      });
    }
    function draw() {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      if (variant === "bio") dna();
      else globe();
    }
    function resize() {
      const bounds = el.getBoundingClientRect(),
        ratio = Math.min(devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      el.width = Math.round(width * ratio);
      el.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }
    function onScroll() {
      scroll = Math.min(
        2,
        Math.max(0, -el.getBoundingClientRect().top / Math.max(height, 1)),
      );
      if (visible && !reduced) draw();
    }
    function loop(time: number) {
      if (visible && !document.hidden && time - last > 30) {
        rotation += 0.006;
        draw();
        last = time;
      }
      frame = requestAnimationFrame(loop);
    }
    function motionChange() {
      reduced = media.matches;
      cancelAnimationFrame(frame);
      if (reduced) {
        rotation = 0;
        draw();
      } else frame = requestAnimationFrame(loop);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(el);
    const resizer = new ResizeObserver(resize);
    resizer.observe(el);
    addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener("change", motionChange);
    resize();
    if (!reduced) frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizer.disconnect();
      removeEventListener("scroll", onScroll);
      media.removeEventListener("change", motionChange);
    };
  }, [variant]);
  return (
    <canvas
      className={`signal-engine signal-engine-${variant}`}
      ref={canvas}
      aria-hidden="true"
    />
  );
}
