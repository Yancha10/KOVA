import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Play, Timer, HeartPulse, Share2, Mic } from "lucide-react";
import { Store, Profile, Plan, Session, Entry, adaptSession, context, sessionDate, localDate, today, uid, dayDiff } from "../../../app/lib/engine";
import { relatedMovements, Movement } from "../../../app/lib/movements";
import { FIGURE_FOR } from "../figures";
import { FigureThumb, RingMini, Toggle, blockLabels, blockShort, blockIndex } from "../ui";
import { presetFromBlock, TimerPreset } from "./TimerView";
import { CountUp, dayMessage, lateWeeks, haptic, MicButton } from "../live";

const fmt = (d: string) => localDate(d).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

export default function Train({
  state,
  p,
  plan,
  session,
  done,
  pick,
  step,
  setStep,
  draft,
  saveLog,
  openCheck,
  openMove,
  startTimer,
  shareWeek,
  others,
  guide,
  heroAction,
  reschedule,
}: {
  state: Store;
  p: Profile;
  plan: Plan;
  session: Session;
  done: Set<string>;
  pick: (id: string) => void;
  step: number;
  setStep: (n: number) => void;
  draft: string;
  saveLog: (e: Entry, alsoFor: string[]) => void;
  openCheck: () => void;
  openMove: (m: Movement) => void;
  startTimer: (preset: TimerPreset, label: string) => void;
  shareWeek: () => void;
  others: Profile[];
  guide: (b: Session["blocks"][number], next: () => void) => void;
  heroAction: (a: string) => void;
  reschedule: (weeks: number) => void;
}) {
  const adapted = adaptSession(session, state, p);
  const ctx = context(state, p);
  const weekSessions = plan.sessions.filter((s) => s.week === session.week).sort((a, b) => a.day.localeCompare(b.day));
  const isDone = done.has(session.id);
  const log = state.logs.find((l) => !l._deleted && l.profileId === p.id && l.sessionId === session.id);
  const blocks = adapted.blocks;
  const steps = [...blocks.map((b) => blockShort[b.type] || b.title), "Registro"];
  const cur = Math.min(step, steps.length - 1);
  const [dir, setDir] = useState(0);
  const go = (n: number) => {
    const next = Math.max(0, Math.min(steps.length - 1, n));
    setDir(next > cur ? 1 : -1);
    if (next !== cur) haptic(8);
    setStep(next);
  };
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stepsRef.current?.children[cur] as HTMLElement | undefined;
    const box = stepsRef.current;
    if (el && box) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [cur, session.id]);
  const date = sessionDate(p, session);
  const diff = dayDiff(date, today());
  const when = diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : diff < 0 && !isDone ? "Pendiente desde " + fmt(date) : fmt(date);
  const dc = (i: number) => "d" + (i % 3);
  const myLogs = state.logs.filter((l) => !l._deleted && l.profileId === p.id);
  const weekDone = weekSessions.filter((s) => done.has(s.id)).length;
  const minutes7 = myLogs.filter((l) => dayDiff(today(), l.date) >= 0 && dayDiff(today(), l.date) < 7).reduce((a, l) => a + (Number(l.minutes) || 0), 0);
  const streak = weekStreak(myLogs.map((l) => l.date));
  const msg = dayMessage(state, p, session, diff, isDone);
  const late = isDone ? 0 : lateWeeks(date);
  const color = blocks[cur] ? "d" + blockIndex[blocks[cur].type] : "d4";
  return (
    <section className="k-page">
      <div className="k-hero">
        <div className="k-head">
          <div className="k-grow">
            <p className="k-kicker">
              Semana {session.week} · {session.block || plan.name}
              {session.deload ? " · Descarga" : ""}
            </p>
            <h1 className="k-h1">{session.title}</h1>
            <span className="k-hero-when">
              {isDone && log ? (
                <>
                  <Check size={14} /> Hecha el {fmt(log.date)}
                  {log.score ? " · " + log.score : ""}
                </>
              ) : (
                <>
                  {when} · {session.duration} min
                </>
              )}
            </span>
          </div>
          <RingMini done={plan.sessions.filter((s) => done.has(s.id)).length} total={plan.sessions.length} />
        </div>
        <div className="k-hero-stats">
          <div>
            <b><CountUp value={weekDone} />/{weekSessions.length}</b>
            <small>esta semana</small>
          </div>
          <div>
            <b><CountUp value={streak} /></b>
            <small>{streak === 1 ? "semana seguida" : "semanas seguidas"}</small>
          </div>
          <div>
            <b><CountUp value={minutes7} suffix="′" /></b>
            <small>últimos 7 días</small>
          </div>
        </div>
        <div className="k-hero-msg">
          <b style={{ fontSize: 20 }}>{msg.icon}</b>
          <span>{msg.text}</span>
        </div>
        <div className="k-hero-actions">
          {!isDone && (
            <button className="k-hero-share" onClick={() => heroAction("box")}>
              <Play size={15} /> Modo box
            </button>
          )}
          {msg.action === "water" && (
            <button className="k-hero-share" onClick={() => heroAction("water")}>
              💧 +500 ml
            </button>
          )}
          {msg.action === "check" && (
            <button className="k-hero-share" onClick={() => heroAction("check")}>
              <HeartPulse size={15} /> Check-in
            </button>
          )}
          <button className="k-hero-share light" onClick={shareWeek}>
            <Share2 size={15} /> Compartir semana
          </button>
        </div>
      </div>
      <div className="k-days">
        {weekSessions.map((s, i) => (
          <button key={s.id} className={`k-pill ${dc(i)} ${s.id === session.id ? "on" : ""} ${done.has(s.id) ? "done" : ""}`} onClick={() => pick(s.id)}>
            <i />
            <span className="k-grow">
              <b>Día {s.day}</b>
              <small>{done.has(s.id) ? "✓ hecha" : s.title}</small>
            </span>
          </button>
        ))}
      </div>
      {late > 0 && (
        <button className="k-tip k-lately" onClick={() => reschedule(late)}>
          <b style={{ fontSize: 20, flex: "none" }}>🗓️</b>
          <span>
            Vas {late} {late === 1 ? "semana" : "semanas"} por detrás del calendario
            <small>Toca para mover el plan y retomarlo desde hoy, sin perder nada</small>
          </span>
          <ArrowRight size={16} />
        </button>
      )}
      {ctx.check ? (
        <button className={"k-tip " + (ctx.factor === 0 ? "warn" : ctx.factor < 1 ? "" : "ok")} onClick={openCheck}>
          <HeartPulse size={20} />
          <span>
            {ctx.factor === 0 ? "Hoy no toca intensidad" : ctx.factor < 1 ? "Sesión ajustada a tu recuperación" : "Recuperación buena: sigue el plan"}
            <small>{ctx.score !== null ? `Recuperación ${ctx.score}/100 · ` : ""}{ctx.reasons[0] || "Toca para revisar tu check-in"}</small>
          </span>
        </button>
      ) : (
        <button className="k-tip" onClick={openCheck}>
          <HeartPulse size={20} />
          <span>
            ¿Cómo llegas hoy?
            <small>30 segundos de check-in para ajustar la dosis</small>
          </span>
          <ArrowRight size={16} />
        </button>
      )}
      <div className="k-steps" role="tablist" aria-label="Partes de la sesión" ref={stepsRef}>
        {steps.map((l, i) => (
          <button key={i} role="tab" aria-selected={i === cur} className={`k-step ${i === cur ? "on" : ""} ${i === steps.length - 1 && isDone ? "ok" : ""} ${blocks[i] ? "d" + blockIndex[blocks[i].type] : "d4"}`} onClick={() => go(i)}>
            <b>{i === steps.length - 1 && isDone ? "✓" : i + 1}</b>
            {l}
          </button>
        ))}
      </div>
      <div
        className={`k-ficha ${color} ${dir > 0 ? "k-anim-n" : dir < 0 ? "k-anim-p" : ""}`}
        key={session.id + "-" + cur}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("input,textarea,select,.k-movechips")) return;
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s) return;
          const dx = e.clientX - s.x, dy = e.clientY - s.y;
          if (Math.abs(dx) > 60 && Math.abs(dy) < 50) go(cur + (dx < 0 ? 1 : -1));
        }}
      >
        {cur < blocks.length ? (
          <BlockCard
            b={blocks[cur]}
            original={session.blocks[cur]}
            adapted={!!adapted.adapted}
            openMove={openMove}
            next={() => go(cur + 1)}
            nextLabel={cur + 1 < blocks.length ? blockLabels[blocks[cur + 1].type] || steps[cur + 1] : "Registro"}
            startTimer={() => {
              const b = blocks[cur];
              startTimer(presetFromBlock(b.title, b.text, b.minutes, b.interval, session.cap), `S${session.week} · ${session.title} · ${b.title}`);
            }}
            rest={() => startTimer({ mode: "rest", seconds: 90 }, `Descanso · ${session.title}`)}
            guide={() => guide(blocks[cur], () => go(cur + 1))}
          />
        ) : (
          <LogCard key={session.id + (log?.id || "")} session={session} p={p} previous={log} draft={draft} save={saveLog} others={others} />
        )}
      </div>
    </section>
  );
}

function BlockCard({
  b,
  original,
  adapted,
  openMove,
  next,
  nextLabel,
  startTimer,
  rest,
  guide,
}: {
  b: Session["blocks"][number];
  original: Session["blocks"][number];
  adapted: boolean;
  openMove: (m: Movement) => void;
  next: () => void;
  nextLabel: string;
  startTimer: () => void;
  rest: () => void;
  guide: () => void;
}) {
  const moves = relatedMovements(b.title + " " + b.text);
  const changed = adapted && b.text !== original.text;
  return (
    <>
      <div className="k-ficha-body">
        <span className="k-type">
          {blockLabels[b.type] || b.type} · {b.minutes}′
        </span>
        <h2 className="k-block-title">{b.title}</h2>
        <p className="k-text">{b.text}</p>
        {changed && <p className="k-adapted">Ajustado a tu recuperación. El texto original del plan sigue guardado.</p>}
        {moves.length > 0 && (
          <div className="k-movechips">
            {moves.map((m) => (
              <button key={m.id} className="k-movechip" onClick={() => openMove(m)}>
                <span className="ph">{FIGURE_FOR[m.id] ? <FigureThumb id={FIGURE_FOR[m.id]} /> : "🎯"}</span>
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="k-ficha-foot">
        {b.type === "conditioning" ? (
          <>
            <button className="k-btn primary" style={{ flex: 2 }} onClick={startTimer}>
              <Play /> Empezar reloj
            </button>
            <button className="k-btn" aria-label={"Siguiente: " + nextLabel} onClick={next}>
              <ArrowRight />
            </button>
          </>
        ) : (
          <>
            {(b.type === "warmup" || b.type === "cooldown") && (
              <button className="k-btn tint" onClick={guide}>
                <Mic /> Guíame
              </button>
            )}
            {(b.type === "skill" || b.type === "strength") && (
              <button className="k-btn tint" onClick={rest}>
                <Timer /> 90″
              </button>
            )}
            <button className="k-btn" style={{ flex: 2 }} onClick={next}>
              {nextLabel} <ArrowRight />
            </button>
          </>
        )}
      </div>
    </>
  );
}

function LogCard({ session, p, previous, draft, save, others }: { session: Session; p: Profile; previous?: Entry; draft: string; save: (e: Entry, alsoFor: string[]) => void; others: Profile[] }) {
  const [also, setAlso] = useState<string[]>([]);
  const [rpe, setRpe] = useState<number>(previous?.rpe || 7);
  const [minutes, setMinutes] = useState(String(previous?.minutes || session.duration));
  const [score, setScore] = useState(draft || previous?.score || "");
  const [note, setNote] = useState(previous?.note || "");
  const [bar, setBar] = useState(!!previous?.barHeavy);
  const [push, setPush] = useState(!!previous?.pushHeavy);
  const [date, setDate] = useState(previous?.date || today());
  const [showMore, setShowMore] = useState(!!(previous?.note || previous?.barHeavy || previous?.pushHeavy));
  const valid = Number(minutes) >= 1 && Number(minutes) <= 300;
  return (
    <>
      <form
        id="k-log"
        className="k-ficha-body ios-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          save({
            id: previous?.id || uid(),
            profileId: p.id,
            sessionId: session.id,
            date,
            title: session.title.slice(0, 120),
            minutes: Number(minutes),
            rpe,
            score: score.slice(0, 200),
            note: note.slice(0, 2000),
            barHeavy: bar,
            pushHeavy: push,
            kind: previous?.kind || "open",
            updatedAt: Date.now(),
          }, previous ? [] : also);
        }}
      >
        <span className="k-type">Registro</span>
        <label className="ios-field">
          <span>Resultado del metcon</span>
          <input value={score} onChange={(e) => setScore(e.target.value)} placeholder="6+12, 11:42, escalado…" autoComplete="off" />
        </label>
        <div>
          <span className="k-kicker">Esfuerzo percibido (RPE)</span>
          <div className="k-rpe" role="radiogroup" aria-label="Esfuerzo de 1 a 10" style={{ marginTop: 6 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button type="button" key={n} role="radio" aria-checked={rpe === n} aria-pressed={rpe === n} onClick={() => setRpe(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="ios-grid2">
          <label className="ios-field">
            <span>Minutos</span>
            <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="ios-field">
            <span>Fecha</span>
            <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
          </label>
        </div>
        {!previous && others.length > 0 && (
          <div>
            <span className="k-kicker">Habéis entrenado juntos</span>
            <div className="ios-group" style={{ marginTop: 6 }}>
              {others.map((o) => (
                <div className="ios-row" key={o.id}>
                  <span className="k-avatar">{o.name.charAt(0).toUpperCase()}</span>
                  <span className="ios-row-main">
                    <b>Registrar también para {o.name}</b>
                    <small>Mismo resultado y esfuerzo; luego puede editarlo</small>
                  </span>
                  <Toggle checked={also.includes(o.id)} label={"Registrar también para " + o.name} onChange={(v) => setAlso(v ? [...also, o.id] : also.filter((x) => x !== o.id))} />
                </div>
              ))}
            </div>
          </div>
        )}
        {showMore ? (
          <>
            <label className="ios-field">
              <span>Notas</span>
              <span style={{ display: "flex", gap: 8 }}>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escalas, pesos, sensaciones…" style={{ flex: 1 }} />
                <MicButton onText={(t) => setNote((n: string) => (n ? n + " " : "") + t)} />
              </span>
            </label>
            <div className="ios-group">
              <div className="ios-row">
                <span className="ios-row-main">
                  <b>Barra cargada pesada</b>
                  <small>Mañana se reduce ese patrón</small>
                </span>
                <Toggle checked={bar} onChange={setBar} label="Barra cargada pesada" />
              </div>
              <div className="ios-row">
                <span className="ios-row-main">
                  <b>Empuje pesado</b>
                  <small>Press, HSPU o fondos exigentes</small>
                </span>
                <Toggle checked={push} onChange={setPush} label="Empuje pesado" />
              </div>
            </div>
          </>
        ) : (
          <button type="button" className="linkbtn" style={{ border: 0, background: "none", color: "var(--accent)", fontWeight: 600, padding: "4px 0", textAlign: "left" }} onClick={() => setShowMore(true)}>
            + Notas y carga del día
          </button>
        )}
      </form>
      <div className="k-ficha-foot">
        <button className="k-btn primary" type="submit" form="k-log" disabled={!valid} style={{ flex: 2 }}>
          {previous ? "Actualizar registro" : "Guardar sesión"}
        </button>
      </div>
    </>
  );
}

/** Semanas seguidas (de lunes a domingo) con al menos un entreno, contando la actual si ya hay alguno. */
function weekStreak(dates: string[]) {
  const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  const monday = (d: string) => {
    const x = localDate(d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return iso(x);
  };
  const weeks = new Set(dates.map(monday));
  const cur = localDate(monday(today()));
  if (!weeks.has(iso(cur))) cur.setDate(cur.getDate() - 7);
  let n = 0;
  while (weeks.has(iso(cur))) {
    n++;
    cur.setDate(cur.getDate() - 7);
  }
  return n;
}
