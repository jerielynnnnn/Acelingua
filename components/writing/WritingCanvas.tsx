"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import styles from "./WritingStudio.module.css";

type Point = { x: number; y: number };
type Stroke = Point[];

export default function WritingCanvas({ character, onDrawn, independent = false }: { character: string; onDrawn: (drawn: boolean) => void; independent?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<Stroke[]>([]);
  const active = useRef<{ id: number; points: Stroke } | null>(null);
  const [count, setCount] = useState(0);
  const [guide, setGuide] = useState(!independent);
  const paint = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = canvas.getBoundingClientRect().width;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(size * ratio); canvas.height = Math.round(size * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.strokeStyle = "#EDE7FA"; context.lineWidth = 1;
    context.setLineDash([5, 5]);
    context.beginPath(); context.moveTo(size / 2, 0); context.lineTo(size / 2, size); context.moveTo(0, size / 2); context.lineTo(size, size / 2); context.stroke();
    context.setLineDash([]);
    if (guide) {
      context.fillStyle = "#1024521c";
      context.font = `${size * (character.length > 1 ? .48 : .76)}px sans-serif`;
      context.textAlign = "center"; context.textBaseline = "middle";
      context.fillText(character, size / 2, size * .53, size * .94);
    }
    context.strokeStyle = "#102452"; context.fillStyle = "#102452";
    context.lineWidth = Math.max(3, size * .012); context.lineCap = "round"; context.lineJoin = "round";
    for (const points of [...strokes.current, ...(active.current ? [active.current.points] : [])]) {
      if (!points.length) continue;
      context.beginPath(); context.moveTo(points[0].x * size, points[0].y * size);
      for (const point of points.slice(1)) context.lineTo(point.x * size, point.y * size);
      context.stroke();
      if (points.length === 1) { context.beginPath(); context.arc(points[0].x * size, points[0].y * size, context.lineWidth / 2, 0, Math.PI * 2); context.fill(); }
    }
  }, [character, guide]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(paint); observer.observe(element); paint();
    window.addEventListener("resize", paint);
    return () => { observer.disconnect(); window.removeEventListener("resize", paint); };
  }, [paint]);
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  }
  function clear() { strokes.current = []; active.current = null; setCount(0); onDrawn(false); paint(); }
  function finish(event: PointerEvent<HTMLCanvasElement>, cancelled = false) {
    if (active.current?.id !== event.pointerId) return;
    if (!cancelled) strokes.current.push(active.current.points);
    active.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setCount(strokes.current.length); onDrawn(strokes.current.length > 0); paint();
  }
  return <section className={styles.card} aria-label="Writing practice">
    <h2>{independent ? "Write without a guide" : "Trace the character"}</h2>
    <p>Use your mouse, finger, or pen. Tracing is practice; your handwriting is not automatically graded.</p>
    <canvas ref={ref} width={400} height={400} className={styles.canvas} aria-label={`Drawing area for ${character}`}
      onPointerDown={event => {
        if (active.current || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        active.current = { id: event.pointerId, points: [point(event)] }; paint();
      }}
      onPointerMove={event => { if (active.current?.id !== event.pointerId) return; active.current.points.push(point(event)); paint(); }}
      onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)}
      onLostPointerCapture={event => { if (active.current?.id === event.pointerId) finish(event, true); }}>
      Your browser does not support the drawing canvas. You can still practice the character on paper.
    </canvas>
    <div className={styles.actions}>
      <button type="button" onClick={clear}>Clear / Try again</button>
      <button type="button" disabled={!count} onClick={() => { strokes.current.pop(); setCount(strokes.current.length); onDrawn(strokes.current.length > 0); paint(); }}>Undo last stroke</button>
      {!independent && <label><input type="checkbox" checked={guide} onChange={event => setGuide(event.target.checked)} /> Show guide</label>}
    </div>
    <p role="status">{count} stroke{count === 1 ? "" : "s"} drawn.</p>
  </section>;
}
