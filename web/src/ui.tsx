import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { FIGURES, figInner, figStatic, poseAt } from "./figures";

export function Seg<T extends string>({
  items,
  value,
  onChange,
  label,
  small = false,
}: {
  items: readonly (readonly [T, string])[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  small?: boolean;
}) {
  return (
    <div className={"ios-seg scroll" + (small ? " small" : "")} role="group" aria-label={label}>
      {items.map(([k, l]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>
          {l}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="ios-switch">
      <input type="checkbox" checked={checked} aria-label={label} onChange={(e) => onChange(e.target.checked)} />
      <i />
    </label>
  );
}

export function RingMini({ done, total }: { done: number; total: number }) {
  const r = 24, C = 2 * Math.PI * r, off = C * (1 - (total ? done / total : 0));
  return (
    <div className="k-ring" aria-label={`${done} de ${total} sesiones`}>
      <svg viewBox="0 0 58 58" aria-hidden="true">
        <circle cx="29" cy="29" r={r} className="tr" />
        <circle cx="29" cy="29" r={r} className="vl" strokeDasharray={C.toFixed(1)} strokeDashoffset={off.toFixed(1)} />
      </svg>
      <span>
        {done}
        <small>/{total}</small>
      </span>
    </div>
  );
}

/** Degradado compartido por los anillos (se pinta una vez en la app). */
export function GradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <linearGradient id="k-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--cream)" />
          <stop offset=".5" stopColor="var(--pink)" />
          <stop offset="1" stopColor="var(--purple)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function FigureThumb({ id }: { id: string }) {
  if (!FIGURES[id]) return null;
  return <span className="k-fig-thumb" dangerouslySetInnerHTML={{ __html: figStatic(id, true) }} />;
}

/** Demostración animada en bucle, con pausa y cámara lenta. */
export function FigureStage({ id, label }: { id: string; label: string }) {
  const g = useRef<SVGGElement>(null);
  const [paused, setPaused] = useState(false);
  const [slow, setSlow] = useState(false);
  const clock = useRef({ acc: 0, t0: 0 });
  useEffect(() => {
    const mv = FIGURES[id];
    if (!mv) return;
    let raf = 0;
    clock.current.t0 = performance.now();
    const speed = slow ? 0.4 : 1;
    const loop = (now: number) => {
      const t = paused ? clock.current.acc : clock.current.acc + (now - clock.current.t0) * speed;
      if (g.current) g.current.innerHTML = figInner(mv, poseAt(mv, t), t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const c = clock.current;
    return () => {
      cancelAnimationFrame(raf);
      if (!paused) c.acc += (performance.now() - c.t0) * speed;
    };
  }, [id, paused, slow]);
  if (!FIGURES[id]) return null;
  return (
    <div className="k-stage">
      <svg viewBox="0 0 220 230" role="img" aria-label={"Demostración animada: " + label}>
        <g ref={g} />
      </svg>
      <div className="k-stage-ctl">
        <button className="k-icon" aria-label={slow ? "Velocidad normal" : "Cámara lenta"} onClick={() => setSlow(!slow)}>
          <b style={{ fontSize: 12 }}>{slow ? "½×" : "1×"}</b>
        </button>
        <button className="k-icon" aria-label={paused ? "Reanudar" : "Pausar"} onClick={() => setPaused(!paused)}>
          {paused ? <Play size={18} /> : <Pause size={18} />}
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 2800);
  };
  const node = (
    <div className={"k-toast" + (msg ? " show" : "")} role="status" aria-live="polite">
      {msg}
    </div>
  );
  return { show, node };
}

export const blockLabels: Record<string, string> = {
  warmup: "Activación",
  skill: "Técnica",
  strength: "Fuerza",
  conditioning: "Motor",
  cooldown: "Vuelta a la calma",
};
export const blockShort: Record<string, string> = { warmup: "Activar", skill: "Técnica", strength: "Fuerza", conditioning: "Motor", cooldown: "Calma" };
export const blockIndex: Record<string, number> = { warmup: 3, skill: 0, strength: 1, conditioning: 2, cooldown: 4 };
