import { useEffect, useRef } from "react";
import {
  computeGeometry,
  createDisplay,
  createFx,
  hitTestField,
  renderField,
  spawnPulse,
  stepDisplay,
  stepFx,
} from "./paint";

export function FieldCanvas({ soil, pulse, onInspect }) {
  const canvasRef = useRef(null);
  const soilRef = useRef(soil);
  const dispRef = useRef(null);
  const fxRef = useRef(null);

  soilRef.current = soil;
  if (!dispRef.current) dispRef.current = createDisplay(soil);
  if (!fxRef.current) fxRef.current = createFx();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let last = performance.now();
    let w = 1;
    let h = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const loop = (now) => {
      const dt = Math.min(64, now - last);
      last = now;
      stepDisplay(dispRef.current, soilRef.current, dt);
      stepFx(fxRef.current, dt, now);
      renderField(ctx, w, h, soilRef.current, dispRef.current, fxRef.current, now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!pulse || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const geom = computeGeometry(
      Math.round(rect.width),
      Math.round(rect.height),
      soilRef.current.season.unlockedHorizons
    );
    spawnPulse(fxRef.current, pulse, geom, performance.now());
  }, [pulse]);

  const handlePointerUp = (e) => {
    if (!onInspect || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const geom = computeGeometry(
      Math.round(rect.width),
      Math.round(rect.height),
      soilRef.current.season.unlockedHorizons
    );
    const hit = hitTestField(geom, soilRef.current, x, y);
    onInspect(hit);
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 h-full w-full cursor-pointer touch-manipulation"
      aria-label="Living soil cross-section: tap any root arbuscule, biochar reef, tardigrade, or horizon to dive in with the subsurface microscope"
    />
  );
}
