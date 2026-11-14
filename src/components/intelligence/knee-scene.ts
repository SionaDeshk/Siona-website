import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import {
  createKneeParts,
  disposeKneeParts,
} from "@/lib/intelligence/knee-geometry";

export function mountKneeScene(
  host: HTMLElement,
  onContextLost: () => void,
  onSpinChange: (spinning: boolean) => void,
) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false; // Keep wheel scrolling on the page; use explicit zoom controls.
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI - 0.12;
  scene.add(new THREE.HemisphereLight(0xfffdf2, 0x45675e, 3));
  const key = new THREE.DirectionalLight(0xfff9e9, 4);
  key.position.set(-3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc8e9e2, 3);
  rim.position.set(4, 2, -3);
  scene.add(rim);
  const parts = createKneeParts();
  parts.forEach((group) => scene.add(group));
  let selected = 0,
    isolated = false,
    distance = 9;
  const draw = () => renderer.render(scene, camera);
  let spinning = false,
    frame = 0,
    lastTime = 0;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rotate = (angle: number) => {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    camera.position.copy(controls.target).add(offset);
    controls.update();
    draw();
  };
  const stopSpin = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    if (spinning) {
      spinning = false;
      onSpinChange(false);
    }
  };
  const animate = (time: number) => {
    if (!spinning) return;
    rotate(Math.min((time - lastTime) / 1000, 0.05) * 0.45);
    lastTime = time;
    frame = requestAnimationFrame(animate);
  };
  const toggleSpin = () => {
    if (spinning) {
      stopSpin();
      return;
    }
    if (motion.matches) {
      rotate(Math.PI / 8);
      return;
    }
    if (document.hidden) return;
    spinning = true;
    onSpinChange(true);
    lastTime = performance.now();
    frame = requestAnimationFrame(animate);
  };
  let pointer: { id: number; x: number; y: number; moved: boolean } | null =
    null;
  const down = (event: PointerEvent) => {
    if (pointer) {
      pointer = null;
      stopSpin();
      return;
    }
    if (event.button === 0)
      pointer = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
  };
  const move = (event: PointerEvent) => {
    if (
      pointer &&
      pointer.id === event.pointerId &&
      Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 5
    ) {
      pointer.moved = true;
      stopSpin();
    }
  };
  const up = (event: PointerEvent) => {
    if (
      pointer?.id === event.pointerId &&
      !pointer.moved &&
      Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) <= 5
    )
      toggleSpin();
    pointer = null;
  };
  const cancel = () => {
    pointer = null;
  };
  const visibility = () => {
    if (document.hidden) stopSpin();
  };
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointermove", move);
  renderer.domElement.addEventListener("pointerup", up);
  renderer.domElement.addEventListener("pointercancel", cancel);
  document.addEventListener("visibilitychange", visibility);
  motion.addEventListener("change", stopSpin);
  const reset = () => {
    stopSpin();
    distance = isolated ? 6.6 : 9;
    controls.target.set(0, isolated ? 0 : 0.25, 0);
    camera.position
      .copy(controls.target)
      .add(
        new THREE.Vector3(0.43, 0.28, 1).normalize().multiplyScalar(distance),
      );
    controls.update();
    draw();
  };
  const update = (index: number, only: boolean) => {
    stopSpin();
    const changedMode = isolated !== only;
    selected = index;
    isolated = only;
    parts.forEach((group, i) => {
      group.visible = !isolated || i === selected;
      group.position.y = isolated ? 0 : [1.65, -0.1, -0.9][i];
    });
    if (changedMode) reset();
    else draw();
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  controls.addEventListener("change", draw);
  const lost = (event: Event) => {
    event.preventDefault();
    onContextLost();
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  update(0, false);
  reset();
  resize();
  return {
    update,
    reset,
    toggleSpin,
    rotate: (direction: number) => {
      stopSpin();
      rotate((direction * Math.PI) / 8);
    },
    zoom: (factor: number) => {
      stopSpin();
      distance = THREE.MathUtils.clamp(
        camera.position.distanceTo(controls.target) * factor,
        4.5,
        13,
      );
      camera.position
        .sub(controls.target)
        .normalize()
        .multiplyScalar(distance)
        .add(controls.target);
      controls.update();
      draw();
    },
    download: async () => {
      // Export a separate original model, centered and with its illustration metadata.
      const exportParts = createKneeParts();
      try {
        const result = await new GLTFExporter().parseAsync(
          exportParts[selected],
          { binary: true },
        );
        const url = URL.createObjectURL(
          new Blob([result as ArrayBuffer], { type: "model/gltf-binary" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = `siona-illustrative-${["femoral", "bearing", "tibial"][selected]}.glb`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } finally {
        disposeKneeParts(exportParts);
      }
    },
    dispose: () => {
      cancelAnimationFrame(frame);
      spinning = false;
      renderer.domElement.removeEventListener("pointerdown", down);
      renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up);
      renderer.domElement.removeEventListener("pointercancel", cancel);
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", stopSpin);
      observer.disconnect();
      controls.removeEventListener("change", draw);
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      disposeKneeParts(parts);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
