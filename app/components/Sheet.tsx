"use client";
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

export function Sheet({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      prev?.focus?.();
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="ios-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ios-sheet-scrim" onClick={close} />
      <div className={"ios-sheet-panel" + (dragging ? " dragging" : "")} ref={panel} tabIndex={-1} style={drag ? { transform: `translateY(${drag}px)` } : undefined}>
        <div
          className="ios-sheet-grab"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            start.current = e.clientY;
            setDragging(true);
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (start.current !== null) setDrag(Math.max(0, e.clientY - start.current));
          }}
          onPointerUp={() => {
            const d = drag;
            start.current = null;
            setDragging(false);
            setDrag(0);
            if (d > 90) close();
          }}
          onPointerCancel={() => {
            start.current = null;
            setDragging(false);
            setDrag(0);
          }}
        >
          <span />
          <h2>{title}</h2>
          <button className="ios-sheet-close" aria-label="Cerrar" onClick={close}>
            <X size={16} />
          </button>
        </div>
        <div className="ios-sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function LineChartSVG({
  series,
  labels,
  invert = false,
  format,
  height = 170,
  label,
}: {
  series: { name: string; color: string; points: { x: number; y: number; title?: string }[] }[];
  labels?: string[];
  invert?: boolean;
  format?: (v: number) => string;
  height?: number;
  label: string;
}) {
  const all = series.flatMap((s) => s.points.map((p) => p.y));
  if (!all.length) return <p className="ios-empty">Todavía no hay datos para esta gráfica.</p>;
  const W = 340, H = height, pl = 34, pr = 10, pt = 12, pb = labels ? 22 : 10;
  let lo = Math.min(...all), hi = Math.max(...all);
  if (lo === hi) {
    lo -= 1;
    hi += 1;
  }
  const pad = (hi - lo) * 0.12;
  lo -= pad;
  hi += pad;
  if (Math.min(...all) >= 0 && lo < 0) lo = 0;
  const maxX = Math.max(1, ...series.flatMap((s) => s.points.map((p) => p.x)), labels ? labels.length - 1 : 0);
  const X = (x: number) => pl + (x / maxX) * (W - pl - pr);
  const Y = (v: number) => {
    const k = (v - lo) / (hi - lo);
    return pt + (invert ? k : 1 - k) * (H - pt - pb);
  };
  const ticks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  return (
    <figure className="ios-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={pl} x2={W - pr} y1={Y(t)} y2={Y(t)} className="grid" />
            <text x={0} y={Y(t) + 3}>
              {format ? format(t) : Math.round(t * 10) / 10}
            </text>
          </g>
        ))}
        {labels?.map((l, i) =>
          l ? (
            <text key={i} x={X(i)} y={H - 5} textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        {series.map((s, si) => (
          <g key={si}>
            {s.points.length > 1 && (
              <path
                className="line"
                pathLength={1}
                d={s.points.map((p, i) => (i ? "L" : "M") + X(p.x).toFixed(1) + " " + Y(p.y).toFixed(1)).join(" ")}
                stroke={s.color}
              />
            )}
            {s.points.map((p, i) => (
              <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={4.5} fill={s.color} className="dot">
                <title>{p.title || String(p.y)}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      {series.length > 1 && (
        <figcaption>
          {series.map((s) => (
            <span key={s.name}>
              <i style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
