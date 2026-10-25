import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Search, Upload, Check, Trash2, CalendarPlus } from "lucide-react";
import { Store, Profile, Plan, sessionDate, localDate, weekOf, live } from "../../../app/lib/engine";
import { movements, Movement, plain } from "../../../app/lib/movements";
import { FIGURE_FOR } from "../figures";
import { FigureStage, FigureThumb, Seg } from "../ui";

const fmt = (d: string) => localDate(d).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

export default function PlanView({
  state,
  p,
  plan,
  plans,
  done,
  next,
  train,
  openMove,
  activate,
  removePlan,
  importPlan,
  addCalendar,
}: {
  state: Store;
  p: Profile;
  plan: Plan;
  plans: Plan[];
  done: Set<string>;
  next: string | null;
  train: (id: string) => void;
  openMove: (m: Movement) => void;
  activate: (id: string) => void;
  removePlan: (pl: Plan) => void;
  importPlan: () => void;
  addCalendar: () => void;
}) {
  const [pane, setPane] = useState<"weeks" | "moves" | "programs">("weeks");
  const nowWeek = Math.min(plan.weeks, weekOf(p));
  const [week, setWeek] = useState(() => {
    const s = plan.sessions.find((x) => x.id === next);
    return s ? s.week : nowWeek;
  });
  const [cat, setCat] = useState<"Todos" | Movement["category"]>("Todos");
  const [q, setQ] = useState("");
  const swipe = useRef<number | null>(null);
  const W = Math.max(1, Math.min(plan.weeks, week));
  const sessions = plan.sessions.filter((s) => s.week === W).sort((a, b) => a.day.localeCompare(b.day));
  const first = sessions[0];
  return (
    <section className="k-page">
      <Seg
        label="Vista del plan"
        value={pane}
        onChange={setPane}
        items={[
          ["weeks", "Semanas"],
          ["moves", "Movimientos"],
          ["programs", "Programas"],
        ]}
      />
      {pane === "weeks" && (
        <>
          <div
            className="k-weeknav"
            onPointerDown={(e) => (swipe.current = e.clientX)}
            onPointerUp={(e) => {
              if (swipe.current === null) return;
              const dx = e.clientX - swipe.current;
              swipe.current = null;
              if (Math.abs(dx) > 60) setWeek(W + (dx < 0 ? 1 : -1));
            }}
          >
            <button className="k-icon" aria-label="Semana anterior" disabled={W <= 1} onClick={() => setWeek(W - 1)}>
              <ChevronLeft />
            </button>
            <div className="t">
              <p className="k-kicker">{first?.block || plan.name}</p>
              <h1 className="k-h1">Semana {W}</h1>
              {(first?.deload || W === nowWeek) && <span className="k-tag">{first?.deload ? "Descarga" : "Esta semana"}</span>}
            </div>
            <button className="k-icon" aria-label="Semana siguiente" disabled={W >= plan.weeks} onClick={() => setWeek(W + 1)}>
              <ChevronRight />
            </button>
          </div>
          <div className="k-wdots" style={{ gridTemplateColumns: `repeat(${plan.weeks},1fr)` }}>
            {Array.from({ length: plan.weeks }, (_, i) => {
              const ws = plan.sessions.filter((s) => s.week === i + 1);
              const n = ws.filter((s) => done.has(s.id)).length;
              return (
                <button
                  key={i}
                  className={`k-wdot ${ws.length && n === ws.length ? "full" : ""} ${i + 1 === W ? "on" : ""} ${i + 1 === nowWeek ? "now" : ""}`}
                  aria-label={`Semana ${i + 1}: ${n} de ${ws.length}`}
                  onClick={() => setWeek(i + 1)}
                >
                  <i style={{ height: ws.length ? (n / ws.length) * 100 + "%" : 0 }} />
                </button>
              );
            })}
          </div>
          <div className="k-wlab">
            <span>1</span>
            <span>{Math.round(plan.weeks / 3)}</span>
            <span>{Math.round((plan.weeks * 2) / 3)}</span>
            <span>{plan.weeks}</span>
          </div>
          <div className="ios-stack">
            {sessions.map((s, i) => {
              const isDone = done.has(s.id), isNext = s.id === next;
              return (
                <button key={s.id} className={`k-daycard d${i % 3}`} onClick={() => train(s.id)}>
                  <span className="k-grow">
                    <b>
                      {s.day} · {s.title}
                    </b>
                    <small>
                      {fmt(sessionDate(p, s))} · {s.duration} min{s.theme ? " · " + s.theme : ""}
                    </small>
                  </span>
                  <span className={`k-badge ${isDone ? "done" : isNext ? "next" : ""}`}>{isDone ? "✓ Hecha" : isNext ? "Toca" : "Ver"}</span>
                </button>
              );
            })}
          </div>
          <button className="k-btn cool block" onClick={addCalendar}>
            <CalendarPlus /> Recordatorios en mi calendario
          </button>
          {plan.subtitle && <p className="ios-foot" style={{ textAlign: "center" }}>{plan.subtitle}</p>}
        </>
      )}
      {pane === "moves" && (
        <>
          <label className="ios-search">
            <Search size={16} />
            <input type="search" placeholder="Buscar movimiento" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <Seg
            label="Categoría"
            value={cat}
            onChange={setCat}
            items={[
              ["Todos", "Todos"],
              ["Gimnasia", "Gimnasia"],
              ["Fuerza", "Fuerza"],
              ["Motor", "Motor"],
            ]}
          />
          <div className="k-mgrid">
            {movements
              .filter((m) => (cat === "Todos" || m.category === cat) && (!q || plain(m.name + " " + m.aka.join(" ")).includes(plain(q))))
              .map((m) => (
                <button key={m.id} className="k-mcard" onClick={() => openMove(m)}>
                  <span className="ph">{FIGURE_FOR[m.id] ? <FigureThumb id={FIGURE_FOR[m.id]} /> : "🎯"}</span>
                  <b>{m.name}</b>
                </button>
              ))}
          </div>
        </>
      )}
      {pane === "programs" && (
        <>
          <div className="ios-group">
            {plans.map((pl) => (
              <div key={pl.id} className="ios-row">
                <span className="ios-row-main">
                  <b>{pl.name}</b>
                  <small>
                    {pl.weeks} semanas · {pl.sessions.length} sesiones{pl.source ? " · " + pl.source : ""}
                  </small>
                </span>
                {pl.id === plan.id ? (
                  <span className="k-badge done">
                    <Check size={12} /> Activo
                  </span>
                ) : (
                  <button className="k-btn sm tint" onClick={() => activate(pl.id)}>
                    Activar
                  </button>
                )}
                {pl.id !== "base" && pl.id !== plan.id && (
                  <button className="ios-icon-btn" aria-label={"Borrar " + pl.name} onClick={() => removePlan(pl)}>
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="k-btn primary block" onClick={importPlan}>
            <Upload /> Importar un plan (PDF, Word o texto)
          </button>
          <p className="ios-foot">Al cambiar de programa se conserva todo tu historial. Las sesiones de otro programa no cuentan como hechas en el activo.</p>
          <p className="ios-foot">{live(state.plans).length} programas guardados, máximo 30.</p>
        </>
      )}
    </section>
  );
}

export function MovementDetail({ m }: { m: Movement }) {
  const fig = FIGURE_FOR[m.id];
  return (
    <div className="ios-stack">
      <p className="k-kicker">
        {m.category} · {m.level}
      </p>
      {fig && <FigureStage id={fig} label={m.name} />}
      <p style={{ fontSize: 16, lineHeight: 1.5 }}>{m.intro}</p>
      <div className="ios-card">
        <h3 className="ios-section">Paso a paso</h3>
        <ol className="k-steps-list">
          {m.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
      <div className="ios-note">
        <b>🎯 Clave</b>
        {m.cue}
      </div>
      <div className="ios-note" style={{ background: "color-mix(in srgb,var(--pink) 14%,var(--paper))" }}>
        <b>✕ Error típico</b>
        {m.mistake}
      </div>
      <div className="ios-note" style={{ background: "color-mix(in srgb,var(--mint) 14%,var(--paper))" }}>
        <b>↘ Si aún no sale</b>
        {m.scale}
      </div>
      <div className="ios-grid2">
        <a className="k-btn tint" href={m.source} target="_blank" rel="noreferrer">
          {m.provider} <ExternalLink size={15} />
        </a>
        <a className="k-btn tint" href={"https://www.youtube.com/results?search_query=" + encodeURIComponent(m.name + " técnica crossfit")} target="_blank" rel="noreferrer">
          Vídeos <ExternalLink size={15} />
        </a>
      </div>
    </div>
  );
}
