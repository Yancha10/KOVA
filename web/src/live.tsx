import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mic, Play, Timer, X, Camera, Trash2 } from "lucide-react";
import { Store, Profile, Session, Entry, forProfile, localDate, today, readiness, dayDiff } from "../../app/lib/engine";
import { groupRecords, recordScore } from "../../app/lib/records";
import { nutritionOf, waterGoal, trainedOn } from "../../app/lib/nutrition";
import { blockLabels, blockIndex } from "./ui";

const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
export const haptic = (p: number | number[] = 12) => {
  try {
    navigator.vibrate?.(p);
  } catch {
    /* sin vibración */
  }
};

/* ---------- Momento del día ---------- */
export function daypart(h = new Date().getHours()) {
  return h >= 5 && h < 12 ? "dawn" : h >= 12 && h < 19 ? "day" : "night";
}
export function useDaypart() {
  useEffect(() => {
    const set = () => document.documentElement.setAttribute("data-daypart", daypart());
    set();
    const id = setInterval(set, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
}

/* ---------- Números que suben contando ---------- */
export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now(), a = from.current, b = value, dur = 700;
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
      setV(a + (b - a) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <>
      {v.toFixed(decimals).replace(".", ",")}
      {suffix}
    </>
  );
}

/* ---------- Mensaje del día en la cabecera ---------- */
export function dayMessage(state: Store, p: Profile, session: Session, sessionWhen: number, isDone: boolean) {
  const t = today();
  const trainedToday = forProfile(state.logs, p.id).some((l) => l.date === t);
  const h = new Date().getHours();
  const n = nutritionOf(state, p.id);
  const day = n.days.find((d) => d.date === t);
  const water = day?.water || 0, goal = waterGoal(n.targets, trainedToday);
  if (trainedToday) return { icon: "✅", text: h >= 19 ? "Entreno hecho. Cena con proteína y a dormir 7-9 h." : "Entreno hecho. Ahora toca recuperar: agua y proteína en las 2 h siguientes.", action: water < goal ? "water" : null };
  if (sessionWhen === 0 && !isDone) return { icon: h < 12 ? "🌅" : "🔥", text: `Hoy toca ${session.title}. ${h < 15 ? "Come 2-3 h antes y llega hidratado." : "¡A por ella!"}`, action: "box" };
  if (sessionWhen < 0 && !isDone) return { icon: "⏰", text: `${session.title} está pendiente. Puedes hacerla hoy o reorganizar el plan.`, action: "box" };
  if (!forProfile(state.checks, p.id).some((c) => c.date === t)) return { icon: "🧘", text: "Día de descanso: 10 minutos de movilidad y agua. Haz el check-in para preparar la próxima.", action: "check" };
  return { icon: "🌙", text: `Descanso. Próxima sesión: ${session.title}.`, action: water < goal ? "water" : null };
}

/* ---------- Reorganizar el plan si vas con retraso ---------- */
export function lateWeeks(sessionDateStr: string) {
  const late = dayDiff(today(), sessionDateStr);
  return late > 2 ? Math.ceil(late / 7) : 0;
}
export function shiftStart(p: Profile, weeks: number): Profile {
  const d = localDate(p.startDate);
  d.setDate(d.getDate() + weeks * 7);
  return { ...p, startDate: iso(d), updatedAt: Date.now() };
}

/* ---------- Resumen al terminar una sesión ---------- */
export type SummaryData = { title: string; minutes: number; rpe: number; streak: number; weekDone: number; weekTotal: number; total: number; done: number; badges: string[]; next: string | null };
export function Summary({ d, close, share }: { d: SummaryData; close: () => void; share: () => void }) {
  useEffect(() => haptic([30, 40, 60]), []);
  return (
    <div className="k-summary" role="dialog" aria-label="Sesión completada">
      <h2>¡Sesión completada!</h2>
      <p>{d.title}</p>
      <div className="k-sum-grid">
        <div>
          <b>
            <CountUp value={d.minutes} suffix="′" />
          </b>
          <small>entrenados</small>
        </div>
        <div>
          <b>
            <CountUp value={d.rpe} />
          </b>
          <small>esfuerzo (RPE)</small>
        </div>
        <div>
          <b>
            <CountUp value={d.weekDone} />/{d.weekTotal}
          </b>
          <small>esta semana</small>
        </div>
        <div>
          <b>
            ⚡<CountUp value={d.streak} />
          </b>
          <small>{d.streak === 1 ? "semana seguida" : "semanas seguidas"}</small>
        </div>
      </div>
      <p>
        {d.done}/{d.total} sesiones del plan{d.badges.length ? ` · Nuevo logro: ${d.badges.join(", ")}` : ""}
      </p>
      {d.next && <p style={{ fontSize: 14 }}>Siguiente: {d.next}</p>}
      <div className="k-sum-actions">
        <button className="k-btn ghost" onClick={share}>
          Compartir
        </button>
        <button className="k-btn primary" onClick={close}>
          Seguir
        </button>
      </div>
    </div>
  );
}

/* ---------- Modo box: la sesión a pantalla completa ---------- */
export function BoxMode({ session, start, close, finish, timer, guide }: { session: Session; start: number; close: () => void; finish: () => void; timer: (i: number) => void; guide: (i: number) => void }) {
  const [i, setI] = useState(Math.min(start, session.blocks.length - 1));
  const sx = useRef<number | null>(null);
  const b = session.blocks[i];
  useEffect(() => {
    const keep = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = keep;
    };
  }, []);
  const next = () => {
    haptic(25);
    if (i + 1 >= session.blocks.length) finish();
    else setI(i + 1);
  };
  return (
    <div className={"k-box d" + blockIndex[b.type]} role="dialog" aria-label="Modo box">
      <div className="k-box-top">
        <button className="k-icon" aria-label="Salir del modo box" onClick={close}>
          <X />
        </button>
        <div className="k-box-progress" aria-label={`Bloque ${i + 1} de ${session.blocks.length}`}>
          {session.blocks.map((x, k) => (
            <i key={k} className={k < i ? "done" : k === i ? "on" : ""} />
          ))}
        </div>
        <button className="k-icon" aria-label="Bloque anterior" disabled={i === 0} onClick={() => setI(i - 1)}>
          <ChevronLeft />
        </button>
      </div>
      <div
        className="k-box-main"
        key={i}
        onPointerDown={(e) => (sx.current = e.clientX)}
        onPointerUp={(e) => {
          if (sx.current === null) return;
          const dx = e.clientX - sx.current;
          sx.current = null;
          if (dx < -70) next();
          if (dx > 70 && i > 0) setI(i - 1);
        }}
      >
        <span className="k-type" style={{ alignSelf: "flex-start" }}>
          {blockLabels[b.type]} · {b.minutes}′
        </span>
        <h2>{b.title}</h2>
        <p>{b.text}</p>
      </div>
      <div className="k-box-sub">
        <button className="k-btn tint" onClick={() => timer(i)}>
          <Play /> Reloj
        </button>
        <button className="k-btn tint" onClick={() => guide(i)}>
          <Mic /> Guía
        </button>
        <button className="k-btn tint" onClick={() => timer(-1)}>
          <Timer /> 90″
        </button>
      </div>
      <button className="k-box-done" onClick={next}>
        {i + 1 >= session.blocks.length ? "Terminar y registrar ✓" : "Hecho ✓"}
      </button>
    </div>
  );
}

/* ---------- Calculadora de cargas ---------- */
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
export function platesFor(total: number, bar: number) {
  let side = Math.max(0, (total - bar) / 2);
  const out: number[] = [];
  for (const p of PLATES) {
    while (side >= p - 1e-9) {
      out.push(p);
      side = Math.round((side - p) * 100) / 100;
    }
  }
  return { plates: out, rest: side * 2 };
}
export function LoadCalc({ state, p }: { state: Store; p: Profile }) {
  const lifts = useMemo(() => groupRecords((state.records || []).filter((r) => r.profileId === p.id && r.unit === "kg")), [state.records, p.id]);
  const [lift, setLift] = useState(lifts[0]?.name || "");
  const g = lifts.find((x) => x.name === lift);
  const [rm, setRm] = useState(g ? String(recordScore(g.best.value, "kg")) : "100");
  const [pct, setPct] = useState(75);
  const [bar, setBar] = useState(20);
  useEffect(() => {
    if (g) setRm(String(recordScore(g.best.value, "kg")));
  }, [lift]); // eslint-disable-line react-hooks/exhaustive-deps
  const rmN = Number(String(rm).replace(",", ".")) || 0;
  const target = Math.round(((rmN * pct) / 100) * 2) / 2;
  const { plates, rest } = platesFor(target, bar);
  const cls = (x: number) => "k-plate p" + (x >= 25 ? "25" : x >= 20 ? "20" : x >= 15 ? "15" : x >= 10 ? "10" : x >= 5 ? "5" : x >= 2.5 ? "2" : x >= 1.25 ? "1" : "0");
  return (
    <div className="ios-stack">
      {lifts.length > 0 && (
        <label className="ios-field">
          <span>Movimiento (de tus récords)</span>
          <select value={lift} onChange={(e) => setLift(e.target.value)}>
            {lifts.map((x) => (
              <option key={x.name} value={x.name}>
                {x.name} · {x.best.value} kg
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="ios-grid2">
        <label className="ios-field">
          <span>Tu 1RM (kg)</span>
          <input inputMode="decimal" value={rm} onChange={(e) => setRm(e.target.value)} />
        </label>
        <label className="ios-field">
          <span>Barra</span>
          <select value={bar} onChange={(e) => setBar(Number(e.target.value))}>
            <option value={20}>20 kg (hombre)</option>
            <option value={15}>15 kg (mujer)</option>
            <option value={10}>10 kg (técnica)</option>
          </select>
        </label>
      </div>
      <div className="k-pctgrid">
        {[50, 60, 65, 70, 75, 80, 85, 90, 95, 100].map((x) => (
          <button key={x} aria-pressed={pct === x} onClick={() => (haptic(8), setPct(x))}>
            {x}%
          </button>
        ))}
      </div>
      <div className="ios-card" style={{ textAlign: "center" }}>
        <span className="ios-kicker">
          {pct} % de {rmN} kg
        </span>
        <b className="ios-bignum k-pop-num" key={target}>
          {String(target).replace(".", ",")}
          <small> kg</small>
        </b>
        <div className="k-bar-visual" key={target + "-" + bar} aria-label={`Por lado: ${plates.join(", ") || "nada"}`}>
          <span className="sleeve" />
          {[...plates].reverse().map((x, k) => (
            <span key={"l" + k} className={cls(x)} style={{ animationDelay: k * 0.04 + "s" }}>
              {x >= 5 ? x : ""}
            </span>
          ))}
          <span className="collar" />
          <span className="shaft" />
          <span className="collar" />
          {plates.map((x, k) => (
            <span key={"r" + k} className={cls(x)} style={{ animationDelay: k * 0.04 + "s" }}>
              {x >= 5 ? x : ""}
            </span>
          ))}
          <span className="sleeve" />
        </div>
        <p className="ios-foot">
          Por lado: {plates.length ? plates.map((x) => String(x).replace(".", ",")).join(" + ") + " kg" : "solo la barra"}
          {rest > 0.01 ? ` · faltan ${String(rest).replace(".", ",")} kg para el exacto` : ""}
        </p>
      </div>
      <p className="ios-foot">Colores de discos de competición: rojo 25, azul 20, amarillo 15, verde 10 y blanco 5 kg.</p>
    </div>
  );
}

/* ---------- Calendario mensual ---------- */
export function MonthCalendar({ state, p }: { state: Store; p: Profile }) {
  const [offset, setOffset] = useState(0);
  const base = localDate(today());
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const month = base.getMonth();
  const first = new Date(base);
  first.setDate(1 - ((first.getDay() + 6) % 7));
  const logs = forProfile(state.logs, p.id), checks = forProfile(state.checks, p.id);
  const days = Array.from({ length: 42 }, (_, k) => {
    const d = new Date(first);
    d.setDate(first.getDate() + k);
    const s = iso(d);
    const ls = logs.filter((l) => l.date === s);
    const c = checks.find((x) => x.date === s);
    const r = c ? readiness(c) : null;
    return { s, n: d.getDate(), out: d.getMonth() !== month, train: ls.some((l) => l.sessionId), extra: ls.some((l) => !l.sessionId), low: c ? !!c.pain || (r !== null && r < 50) : false, ok: r !== null && r >= 65 };
  });
  const inMonth = days.filter((d) => !d.out);
  const trained = inMonth.filter((d) => d.train || d.extra).length;
  return (
    <div className="ios-card ios-stack">
      <div className="k-row" style={{ justifyContent: "space-between" }}>
        <button className="k-icon" aria-label="Mes anterior" onClick={() => setOffset(offset - 1)}>
          <ChevronLeft />
        </button>
        <div style={{ textAlign: "center" }}>
          <b style={{ fontSize: 18, textTransform: "capitalize" }}>{base.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</b>
          <div className="k-small k-muted">
            {trained} {trained === 1 ? "día entrenado" : "días entrenados"}
          </div>
        </div>
        <button className="k-icon" aria-label="Mes siguiente" disabled={offset >= 0} onClick={() => setOffset(offset + 1)}>
          <ChevronRight />
        </button>
      </div>
      <div className="k-cal">
        {["L", "M", "X", "J", "V", "S", "D"].map((h) => (
          <span key={h} className="h">
            {h}
          </span>
        ))}
        {days.map((d) => (
          <span key={d.s} className={`d ${d.out ? "out" : ""} ${d.train ? "train" : d.extra ? "extra" : ""} ${d.low ? "low" : d.ok ? "ok" : ""} ${d.s === today() ? "today" : ""}`}>
            {d.n}
          </span>
        ))}
      </div>
      <div className="k-legend">
        <span>
          <i style={{ background: "linear-gradient(140deg,var(--violet),var(--blue))" }} />
          Sesión del plan
        </span>
        <span>
          <i style={{ background: "linear-gradient(140deg,var(--sun),#FF9F6E)" }} />
          Clase o extra
        </span>
        <span>
          <i style={{ background: "var(--leaf)", borderRadius: "50%" }} />
          Buena recuperación
        </span>
        <span>
          <i style={{ background: "#E0464E", borderRadius: "50%" }} />
          Recuperación baja
        </span>
      </div>
    </div>
  );
}

/* ---------- Retos del mes ---------- */
export function Challenges({ state, p }: { state: Store; p: Profile }) {
  const d = localDate(today());
  const from = iso(new Date(d.getFullYear(), d.getMonth(), 1));
  const inMonth = (s: string) => s >= from && s <= today();
  const logs = forProfile(state.logs, p.id).filter((l) => inMonth(l.date));
  const checks = forProfile(state.checks, p.id).filter((c) => inMonth(c.date));
  const n = nutritionOf(state, p.id);
  const water = n.days.filter((x) => inMonth(x.date) && (x.water || 0) >= waterGoal(n.targets, x.train === null ? trainedOn(state, p.id, x.date) : !!x.train)).length;
  const minutes = logs.reduce((a, l) => a + (Number(l.minutes) || 0), 0);
  const list = [
    { icon: "🏋️", name: "12 entrenos este mes", v: logs.length, goal: 12, color: "var(--violet)" },
    { icon: "⏱️", name: "600 minutos de entreno", v: minutes, goal: 600, color: "var(--blue)" },
    { icon: "💚", name: "15 check-ins", v: checks.length, goal: 15, color: "var(--leaf)" },
    { icon: "💧", name: "20 días de agua cumplida", v: water, goal: 20, color: "var(--sun)" },
  ];
  const C = 2 * Math.PI * 22;
  return (
    <div className="ios-card">
      <h3 className="ios-section">Retos de {d.toLocaleDateString("es-ES", { month: "long" })}</h3>
      {list.map((c) => {
        const f = Math.min(1, c.v / c.goal);
        return (
          <div className="k-challenge" key={c.name}>
            <div className="ring">
              <svg viewBox="0 0 54 54" aria-hidden="true">
                <circle cx="27" cy="27" r="22" className="tr" />
                <circle cx="27" cy="27" r="22" className="vl" stroke={c.color} strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - f)).toFixed(1)} />
              </svg>
              <span>{f >= 1 ? "🏅" : c.icon}</span>
            </div>
            <div className="k-grow">
              <b>{c.name}</b>
              <div className="k-small k-muted">
                {Math.min(c.v, c.goal)} de {c.goal}
                {f >= 1 ? " · ¡conseguido!" : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Dictado por voz ---------- */
type Rec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
export function canDictate() {
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}
export function MicButton({ onText }: { onText: (t: string) => void }) {
  const [on, setOn] = useState(false);
  const rec = useRef<Rec | null>(null);
  if (typeof window === "undefined" || !canDictate()) return null;
  return (
    <button
      type="button"
      className={"k-mic" + (on ? " on" : "")}
      aria-label={on ? "Parar dictado" : "Dictar nota"}
      onClick={() => {
        if (on) {
          rec.current?.stop();
          return;
        }
        const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
        const R = (w.SpeechRecognition || w.webkitSpeechRecognition)!;
        const r = new R();
        r.lang = "es-ES";
        r.interimResults = false;
        r.continuous = false;
        r.onresult = (e) => {
          const t = Array.from(e.results)
            .map((x) => x[0].transcript)
            .join(" ");
          if (t.trim()) onText(t.trim());
        };
        r.onend = () => setOn(false);
        r.onerror = () => setOn(false);
        rec.current = r;
        setOn(true);
        haptic(15);
        r.start();
      }}
    >
      <Mic size={18} />
    </button>
  );
}

/* ---------- Fotos de progreso (solo en el dispositivo, IndexedDB) ---------- */
type Photo = { id: string; profileId: string; date: string; data: string };
function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("kova-photos", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("photos", { keyPath: "id" });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function allPhotos(profileId: string): Promise<Photo[]> {
  const d = await db();
  return new Promise((res) => {
    const out: Photo[] = [];
    const cur = d.transaction("photos").objectStore("photos").openCursor();
    cur.onsuccess = () => {
      const c = cur.result;
      if (c) {
        if ((c.value as Photo).profileId === profileId) out.push(c.value as Photo);
        c.continue();
      } else res(out.sort((a, b) => a.date.localeCompare(b.date)));
    };
    cur.onerror = () => res(out);
  });
}
async function putPhoto(p: Photo | { id: string; del: true }) {
  const d = await db();
  return new Promise<void>((res, rej) => {
    const tx = d.transaction("photos", "readwrite");
    if ("del" in p) tx.objectStore("photos").delete(p.id);
    else tx.objectStore("photos").put(p);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
function shrink(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const max = 1100, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
export function Photos({ p, notice }: { p: Profile; notice: (s: string) => void }) {
  const [list, setList] = useState<Photo[]>([]);
  const [sel, setSel] = useState<string[]>([]);
  const [cut, setCut] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const load = () => allPhotos(p.id).then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const pair = sel.length === 2 ? sel.map((id) => list.find((x) => x.id === id)!).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date)) : [];
  const fmt = (d: string) => localDate(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" });
  return (
    <div className="ios-stack">
      <label className="k-btn primary block" style={{ cursor: "pointer" }}>
        <Camera /> Añadir foto
        <input
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              const data = await shrink(f);
              await putPhoto({ id: crypto.randomUUID(), profileId: p.id, date: today(), data });
              await load();
              notice("Foto guardada en este dispositivo");
            } catch {
              notice("No se pudo guardar la foto");
            }
          }}
        />
      </label>
      {pair.length === 2 && (
        <div
          className="k-compare"
          ref={box}
          style={{ ["--cut" as string]: cut + "%" } as React.CSSProperties}
          onPointerDown={(e) => (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)}
          onPointerMove={(e) => {
            if (e.buttons === 0 && e.pointerType === "mouse") return;
            const r = box.current!.getBoundingClientRect();
            setCut(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
          }}
        >
          <img src={pair[0].data} alt={"Antes, " + fmt(pair[0].date)} />
          <img className="after" src={pair[1].data} alt={"Después, " + fmt(pair[1].date)} />
          <span className="handle" />
          <span className="lbl" style={{ left: 10 }}>
            {fmt(pair[0].date)}
          </span>
          <span className="lbl" style={{ right: 10 }}>
            {fmt(pair[1].date)}
          </span>
        </div>
      )}
      {list.length > 0 ? (
        <>
          <p className="ios-foot">{sel.length < 2 ? "Toca dos fotos para compararlas deslizando." : "Desliza sobre la imagen para comparar."}</p>
          <div className="k-photos">
            {[...list].reverse().map((ph) => (
              <button key={ph.id} className={sel.includes(ph.id) ? "sel" : ""} onClick={() => setSel(sel.includes(ph.id) ? sel.filter((x) => x !== ph.id) : [...sel.slice(-1), ph.id])}>
                <img src={ph.data} alt={"Foto del " + fmt(ph.date)} />
                <small>{fmt(ph.date)}</small>
              </button>
            ))}
          </div>
          {sel.length > 0 && (
            <button
              className="k-btn danger block"
              onClick={async () => {
                if (!confirm(sel.length === 1 ? "¿Borrar esta foto?" : "¿Borrar las fotos seleccionadas?")) return;
                for (const id of sel) await putPhoto({ id, del: true });
                setSel([]);
                load();
              }}
            >
              <Trash2 /> Borrar seleccionadas
            </button>
          )}
        </>
      ) : (
        <p className="ios-foot">Haz una foto cada 4 semanas, con la misma luz y la misma postura. Lo verás mejor que en el espejo.</p>
      )}
      <p className="ios-foot">🔒 Las fotos se guardan solo en este dispositivo: no se suben a ningún sitio ni entran en las copias ni en Google Drive.</p>
    </div>
  );
}

export type { Entry };
