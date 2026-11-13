"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./knee-viewer.module.css";
import type { mountKneeScene } from "./knee-scene";

const names = ["Femoral component", "Bearing insert", "Tibial baseplate"];

export function KneeViewer({
  selected,
  fallback,
}: {
  selected: number;
  fallback: ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isolated, setIsolated] = useState(true);
  const [exportState, setExportState] = useState("");
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof mountKneeScene> | null>(null);

  useEffect(() => {
    if (!enabled || failed) return;
    let cancelled = false;
    import("./knee-scene")
      .then(({ mountKneeScene }) => {
        if (cancelled || !host.current) return;
        scene.current = mountKneeScene(
          host.current,
          () => {
            setFailed(true);
            setReady(false);
            setSpinning(false);
          },
          setSpinning,
        );
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setReady(false);
        }
      });
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [enabled, failed]);

  useEffect(() => {
    if (ready) scene.current?.update(selected, isolated);
  }, [ready, selected, isolated]);

  return (
    <div className={styles.viewer}>
      <div className={styles.topline}>
        <span>ILLUSTRATIVE MODEL</span>
        <span>{enabled && !failed ? "3D EXPLORER" : "2D SCHEMATIC"}</span>
      </div>
      <div role="group" aria-label="Model display" className={styles.toggle}>
        <button
          aria-pressed={!enabled}
          onClick={() => {
            setSpinning(false);
            setEnabled(false);
            setReady(false);
            setExportState("");
          }}
        >
          2D diagram
        </button>
        <button
          aria-pressed={enabled}
          onClick={() => {
            setFailed(false);
            setEnabled(true);
            setExportState("");
          }}
        >
          Explore in 3D
        </button>
      </div>
      {enabled && !failed ? (
        <>
          <div
            className={styles.stage}
            ref={host}
            role="img"
            aria-label={`${isolated ? names[selected] : "Exploded three-component knee illustration"}, simplified 3D illustration. Not manufacturer geometry.`}
          />
          <p className={styles.current} aria-live="polite">
            {ready
              ? `${isolated ? names[selected] : "All three parts · exploded view"}`
              : "Loading 3D illustration…"}
          </p>
          <div
            className={styles.controls}
            role="group"
            aria-label="3D model controls"
          >
            <button
              disabled={!ready}
              aria-pressed={spinning}
              onClick={() => scene.current?.toggleSpin()}
            >
              {spinning ? "Pause spin" : "Spin model"}
            </button>
            <button disabled={!ready} onClick={() => setIsolated(!isolated)}>
              {isolated ? "Show all parts" : "Isolate selected part"}
            </button>
            <button
              disabled={!ready}
              onClick={() => scene.current?.rotate(-1)}
              aria-label="Rotate model left"
            >
              Rotate left
            </button>
            <button
              disabled={!ready}
              onClick={() => scene.current?.rotate(1)}
              aria-label="Rotate model right"
            >
              Rotate right
            </button>
            <button disabled={!ready} onClick={() => scene.current?.zoom(0.85)}>
              Zoom in
            </button>
            <button disabled={!ready} onClick={() => scene.current?.zoom(1.15)}>
              Zoom out
            </button>
            <button disabled={!ready} onClick={() => scene.current?.reset()}>
              Reset view
            </button>
          </div>
          <p className={styles.help}>
            Click or tap the model to start or pause its spin. Drag to rotate.
            With reduced motion enabled, each click turns the model one step.
          </p>
          <button
            className={styles.download}
            disabled={!ready || exportState === "Preparing download…"}
            onClick={async () => {
              setExportState("Preparing download…");
              try {
                await scene.current?.download();
                setExportState("Illustrative model download prepared.");
              } catch {
                setExportState(
                  "Download unavailable. You can continue exploring the model.",
                );
              }
            }}
          >
            Download {names[selected].toLowerCase()} (.glb)
          </button>
          <p className={styles.help} role="status">
            {exportState}
          </p>
        </>
      ) : (
        <>
          {fallback}
          {failed && (
            <p role="status" className={styles.help}>
              3D is unavailable in this browser. The diagram and component
              explanations remain available. Select Explore in 3D to retry.
            </p>
          )}
        </>
      )}
      <p className={styles.caveat}>
        Original educational shapes, shared across manufacturer examples. Not
        Persona or Triathlon CAD, not to scale, and not a verified compatible
        assembly. Colors do not specify materials. Not for implant selection,
        manufacturing or surgical planning.
      </p>
    </div>
  );
}
