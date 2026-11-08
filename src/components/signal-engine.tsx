"use client";

import { useEffect, useRef, useState } from "react";
import {
  createScientificScene,
  type SceneKind,
} from "@/lib/visuals/scientific-scenes";

const sceneNames: Record<SceneKind, string> = {
  group: "globe",
  bio: "DNA",
  vision: "neuron",
  approach: "connection",
};

/** A shared, bounded animation clock keeps scroll, pointer and accessibility behavior consistent. */
export function SignalEngine({ variant = "group" }: { variant?: SceneKind }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<(paused: boolean) => void>(() => {});
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const element = canvas.current,
      ctx = element?.getContext("2d");
    if (!element || !ctx) return;
    const el = element,
      context = ctx,
      parent = el.parentElement;
    const drawScene = createScientificScene(variant);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0,
      height = 0,
      clock = 0,
      scroll = 0,
      scrollTarget = 0,
      pointerX = 0,
      pointerY = 0,
      pointerTargetX = 0,
      pointerTargetY = 0;
    let reduced = media.matches,
      visible = true,
      frame = 0,
      last = 0;
    const shouldAnimate = () =>
      !reduced && !pausedRef.current && visible && !document.hidden;
    function draw() {
      if (!width || !height) return;
      context.clearRect(0, 0, width, height);
      drawScene({
        ctx: context,
        width,
        height,
        time: reduced ? 0 : clock,
        scroll: reduced ? 0 : scroll,
        pointerX: reduced ? 0 : pointerX,
        pointerY: reduced ? 0 : pointerY,
        reduced,
      });
    }
    function position() {
      if (reduced || pausedRef.current) return;
      const rect = el.getBoundingClientRect();
      scrollTarget = Math.max(
        -1,
        Math.min(
          1,
          ((innerHeight - rect.top) / (innerHeight + Math.max(rect.height, 1)) -
            0.5) *
            2,
        ),
      );
    }
    function tick(now: number) {
      frame = 0;
      if (!shouldAnimate()) return;
      if (now - last >= 1000 / 30) {
        const dt = Math.min((now - last) / 1000, 0.06),
          ease = 1 - Math.exp(-dt * 7);
        clock += dt;
        scroll += (scrollTarget - scroll) * ease;
        pointerX += (pointerTargetX - pointerX) * ease;
        pointerY += (pointerTargetY - pointerY) * ease;
        draw();
        last = now;
      }
      frame = requestAnimationFrame(tick);
    }
    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
    function start() {
      if (!frame && shouldAnimate()) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      const bounds = el.getBoundingClientRect(),
        ratio = Math.min(devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      el.width = Math.round(width * ratio);
      el.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      position();
      draw();
      start();
    }
    function pointer(event: PointerEvent) {
      if (reduced || pausedRef.current || event.pointerType === "touch") return;
      const rect = el.getBoundingClientRect();
      pointerTargetX = Math.max(
        -0.5,
        Math.min(
          0.5,
          (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5,
        ),
      );
      pointerTargetY = Math.max(
        -0.5,
        Math.min(
          0.5,
          (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5,
        ),
      );
    }
    function leave() {
      pointerTargetX = 0;
      pointerTargetY = 0;
    }
    function visibility() {
      if (document.hidden) stop();
      else {
        position();
        start();
      }
    }
    function motionChange() {
      reduced = media.matches;
      stop();
      if (reduced) {
        scroll = 0;
        pointerX = 0;
        pointerY = 0;
        draw();
      } else {
        position();
        start();
      }
    }
    controller.current = (value) => {
      pausedRef.current = value;
      if (value) stop();
      else {
        position();
        start();
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          position();
          draw();
          start();
        } else stop();
      },
      { rootMargin: "40px" },
    );
    observer.observe(el);
    const resizer = new ResizeObserver(resize);
    resizer.observe(el);
    addEventListener("scroll", position, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    media.addEventListener("change", motionChange);
    parent?.addEventListener("pointermove", pointer, { passive: true });
    parent?.addEventListener("pointerleave", leave);
    resize();
    return () => {
      stop();
      observer.disconnect();
      resizer.disconnect();
      removeEventListener("scroll", position);
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", motionChange);
      parent?.removeEventListener("pointermove", pointer);
      parent?.removeEventListener("pointerleave", leave);
      controller.current = () => {};
    };
  }, [variant]);
  return (
    <>
      <canvas
        className={`signal-engine signal-engine-${variant}`}
        ref={canvas}
        aria-hidden="true"
      />
      <button
        type="button"
        className="signal-motion-control"
        aria-label={`${paused ? "Resume" : "Pause"} ${sceneNames[variant]} motion`}
        aria-pressed={paused}
        onClick={() => {
          const next = !paused;
          controller.current(next);
          setPaused(next);
        }}
      >
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {paused ? (
            <path
              d="m5 3 7 5-7 5V3Z"
              stroke="currentColor"
              strokeLinejoin="round"
            />
          ) : (
            <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.5" />
          )}
        </svg>
        {paused ? "Resume motion" : "Pause motion"}
      </button>
    </>
  );
}
