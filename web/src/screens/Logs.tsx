import React, { useMemo, useState } from "react";
import { Plus, Minus, Search, Trash2, ChevronRight } from "lucide-react";
import { Store, Profile, Entry, today, uid, markMeta } from "../../../app/lib/engine";
import { groupRecords, normalizeText, recordScore } from "../../../app/lib/records";
import { BENCHMARKS, Benchmark, MOBILITY, Mobility, STRENGTH_LIFTS, est1RM } from "../library";
import { Seg, Toggle } from "../ui";
import { haptic } from "../live";

const RPE = ({ v, set }: { v: number; set: (n: number) => void }) => (
  <div className="k-rpe">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
      <button type="button" key={n} aria-pressed={v === n} onClick={() => (haptic(6), set(n))}>
        {n}
      </button>
    ))}
  </div>
);

/* ---------- Registrar un WOD (benchmark o libre) ---------- */
export function WodLog({ state, p, save }: { state: Store; p: Profile; save: (log: Entry, record: Entry | null) => void }) {
  const [mode, setMode] = useState<"bench" | "free">("bench");
  const [q, setQ] = useState("");
  const [b, setB] = useState<Benchmark | null>(null);
  const [type, setType] = useState<"fortime" | "amrap" | "emom" | "other">("fortime");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [result, setResult] = useState("");
  const [minutes, setMinutes] = useState("20");
  const [rx, setRx] = useState(true);
  const [rpe, setRpe] = useState(8);
  const [note, setNote] = useState("");
  const prev = useMemo(() => (b ? groupRecords((state.records || []).filter((r) => r.profileId === p.id)).find((g) => normalizeText(g.name) === normalizeText(b.name)) : null), [b, state.records, p.id]);
  const list = BENCHMARKS.filter((x) => !q || normalizeText(x.name + " " + x.desc).includes(normalizeText(q)));
  const placeholder = (b ? b.type : type) === "amrap" ? "8+12" : (b ? b.type : type) === "fortime" ? "6:42" : "Resultado";
  const valid = (mode === "bench" ? !!b : title.trim().length > 0) && Number(minutes) >= 1 && Number(minutes) <= 300;
  const submit = () => {
    if (!valid) return;
    const name = mode === "bench" ? b!.name : title.trim().slice(0, 120);
    const log: Entry = {
      id: uid(),
      profileId: p.id,
      sessionId: null,
      date: today(),
      title: name.slice(0, 120),
      minutes: Number(minutes),
      rpe,
      score: (result + (rx ? " Rx" : " escalado")).trim().slice(0, 200),
      note: ((mode === "free" ? desc + (note ? " · " : "") : "") + note).slice(0, 2000),
      kind: "wod",
      wodType: mode === "bench" ? b!.type : type,
      rx,
      updatedAt: Date.now(),
    };
    const unit = mode === "bench" ? b!.unit : null;
    const rec = unit && result.trim() && recordScore(result, unit) !== null ? ({ id: uid(), profileId: p.id, date: today(), name: name, unit, value: result.trim().slice(0, 20), note: rx ? "Rx" : "Escalado", updatedAt: Date.now() } as Entry) : null;
    save(log, rec);
  };
  return (
    <div className="ios-stack">
      <Seg
        label="Tipo de WOD"
        value={mode}
        onChange={(v) => {
          setMode(v);
          setB(null);
        }}
        items={[
          ["bench", "Benchmarks"],
          ["free", "WOD libre"],
        ]}
      />
      {mode === "bench" && !b && (
        <>
          <label className="ios-search">
            <Search size={16} />
            <input type="search" placeholder="Fran, Murph, Cindy…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="ios-group ios-picklist" style={{ maxHeight: "52vh" }}>
            {list.map((x) => (
              <button
                key={x.name}
                className="ios-row"
                onClick={() => {
                  setB(x);
                  setMinutes(String(x.minutes));
                }}
              >
                <span className="ios-row-main">
                  <b>
                    {x.name} <span className="k-chiptag">{x.group}</span>
                  </b>
                  <small>{x.desc}</small>
                </span>
                <ChevronRight size={16} className="ios-chevron" />
              </button>
            ))}
          </div>
        </>
      )}
      {mode === "bench" && b && (
        <div className="k-wodcard">
          <div className="k-row" style={{ justifyContent: "space-between" }}>
            <span className="k-chiptag">{b.type === "fortime" ? "For time" : b.type === "amrap" ? `AMRAP ${b.minutes}` : `EMOM ${b.minutes}`}</span>
            <button className="linkbtn" style={{ border: 0, background: "none", color: "var(--blue)", fontWeight: 600 }} onClick={() => setB(null)}>
              Cambiar
            </button>
          </div>
          <h2>{b.name}</h2>
          <p>{b.desc}</p>
          <p className="ios-foot">Escalado: {b.scale}</p>
          {prev && (
            <p className="k-prev">
              Tu mejor marca: <b>{prev.best.value}</b> · {prev.entries.length} {prev.entries.length === 1 ? "intento" : "intentos"}
            </p>
          )}
        </div>
      )}
      {mode === "free" && (
        <>
          <Seg
            label="Formato"
            value={type}
            onChange={setType}
            small
            items={[
              ["fortime", "For time"],
              ["amrap", "AMRAP"],
              ["emom", "EMOM"],
              ["other", "Otro"],
            ]}
          />
          <label className="ios-field">
            <span>Nombre</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="WOD del box, Open 25.1…" />
          </label>
          <label className="ios-field">
            <span>Qué hiciste</span>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} style={{ height: 100, border: 0, borderRadius: 12, background: "var(--ios-fill)", padding: 12, font: "inherit" }} placeholder={"3 rondas:\n15 wall balls\n10 T2B\n200 m carrera"} />
          </label>
        </>
      )}
      {(mode === "free" || b) && (
        <>
          <div className="ios-grid2">
            <label className="ios-field">
              <span>Resultado</span>
              <input value={result} onChange={(e) => setResult(e.target.value)} placeholder={placeholder} />
            </label>
            <label className="ios-field">
              <span>Minutos</span>
              <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
            </label>
          </div>
          <div className="ios-group">
            <div className="ios-row">
              <span className="ios-row-main">
                <b>{rx ? "Rx" : "Escalado"}</b>
                <small>{rx ? "Pesos y movimientos como están" : "Con escalas o pesos adaptados"}</small>
              </span>
              <Toggle checked={rx} onChange={setRx} label="Rx" />
            </div>
          </div>
          <span className="k-kicker">Esfuerzo (RPE)</span>
          <RPE v={rpe} set={setRpe} />
          <label className="ios-field">
            <span>Notas</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Estrategia, splits, sensaciones…" />
          </label>
          <button className="k-btn primary block" disabled={!valid} onClick={submit}>
            Guardar WOD
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- Fuerza por series ---------- */
type SetRow = { r: string; kg: string };
export function StrengthLog({ state, p, save }: { state: Store; p: Profile; save: (log: Entry, record: Entry | null) => void }) {
  const known = useMemo(() => {
    const fromRecs = groupRecords((state.records || []).filter((r) => r.profileId === p.id && r.unit === "kg")).map((g) => g.name);
    return [...new Set([...fromRecs, ...STRENGTH_LIFTS])];
  }, [state.records, p.id]);
  const [lift, setLift] = useState(known[0]);
  const [sets, setSets] = useState<SetRow[]>([
    { r: "5", kg: "60" },
    { r: "5", kg: "70" },
    { r: "5", kg: "80" },
  ]);
  const [rpe, setRpe] = useState(8);
  const [minutes, setMinutes] = useState("20");
  const best = groupRecords((state.records || []).filter((r) => r.profileId === p.id && r.unit === "kg")).find((g) => g.name === lift);
  const parsed = sets.map((s) => ({ r: Number(s.r) || 0, kg: Number(String(s.kg).replace(",", ".")) || 0 })).filter((s) => s.r > 0 && s.kg > 0);
  const top = parsed.reduce((a, s) => (est1RM(s.kg, s.r) > a ? est1RM(s.kg, s.r) : a), 0);
  const heaviestSingle = parsed.filter((s) => s.r === 1).reduce((a, s) => Math.max(a, s.kg), 0);
  const volume = parsed.reduce((a, s) => a + s.r * s.kg, 0);
  const upd = (i: number, k: keyof SetRow, v: string) => setSets(sets.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const bump = (i: number, d: number) => {
    haptic(6);
    upd(i, "kg", String(Math.max(0, (Number(String(sets[i].kg).replace(",", ".")) || 0) + d)));
  };
  return (
    <div className="ios-stack">
      <label className="ios-field">
        <span>Movimiento</span>
        <select value={lift} onChange={(e) => setLift(e.target.value)}>
          {known.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </label>
      {best && <p className="k-prev">Tu récord: {best.best.value} kg</p>}
      <div className="k-sets">
        <div className="k-sets-h">
          <span>Serie</span>
          <span>Reps</span>
          <span>Kilos</span>
          <span />
        </div>
        {sets.map((s, i) => (
          <div className="k-set" key={i}>
            <b>{i + 1}</b>
            <input inputMode="numeric" value={s.r} onChange={(e) => upd(i, "r", e.target.value.replace(/\D/g, ""))} aria-label={`Repeticiones serie ${i + 1}`} />
            <span className="kg">
              <button type="button" onClick={() => bump(i, -2.5)} aria-label="Menos 2,5 kg">
                <Minus size={14} />
              </button>
              <input inputMode="decimal" value={s.kg} onChange={(e) => upd(i, "kg", e.target.value)} aria-label={`Kilos serie ${i + 1}`} />
              <button type="button" onClick={() => bump(i, 2.5)} aria-label="Más 2,5 kg">
                <Plus size={14} />
              </button>
            </span>
            <button type="button" className="ios-icon-btn" aria-label="Quitar serie" onClick={() => setSets(sets.filter((_, j) => j !== i))} disabled={sets.length <= 1}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button type="button" className="k-btn tint block sm" onClick={() => setSets([...sets, { ...sets[sets.length - 1] }])}>
          <Plus /> Añadir serie
        </button>
      </div>
      <div className="ios-stats">
        <div>
          <b>{top ? String(top).replace(".", ",") : "–"}</b>
          <small>1RM estimado</small>
        </div>
        <div>
          <b>{Math.round(volume)}</b>
          <small>kg de volumen</small>
        </div>
      </div>
      <div className="ios-grid2">
        <label className="ios-field">
          <span>Minutos</span>
          <input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} />
        </label>
        <div />
      </div>
      <span className="k-kicker">Esfuerzo (RPE)</span>
      <RPE v={rpe} set={setRpe} />
      <button
        className="k-btn primary block"
        disabled={!parsed.length}
        onClick={() => {
          const summary = parsed.map((s) => `${s.r}×${String(s.kg).replace(".", ",")}`).join(" · ");
          const log: Entry = { id: uid(), profileId: p.id, sessionId: null, date: today(), title: ("Fuerza · " + lift).slice(0, 120), minutes: Number(minutes) || 20, rpe, score: `1RM est. ${top} kg`, note: summary.slice(0, 2000), kind: "strength", lift, sets: parsed, updatedAt: Date.now() };
          const rec = heaviestSingle > 0 ? ({ id: uid(), profileId: p.id, date: today(), name: lift, unit: "kg", value: String(heaviestSingle), note: "Single", updatedAt: Date.now() } as Entry) : null;
          save(log, rec);
        }}
      >
        Guardar fuerza
      </button>
      <p className="ios-foot">1RM estimado con la fórmula de Epley. Solo los singles (1 repetición) cuentan como récord real.</p>
    </div>
  );
}

/* ---------- Movilidad ---------- */
export function MobilityList({ pick }: { pick: (m: Mobility) => void }) {
  return (
    <div className="ios-stack">
      <p className="ios-foot">Rutinas cortas guiadas por voz. Elige según lo que vayas a entrenar o cómo te sientas.</p>
      <div className="k-mobgrid">
        {MOBILITY.map((m) => (
          <button key={m.id} className="k-mob" onClick={() => pick(m)}>
            <span className="ic">{m.icon}</span>
            <b>{m.name}</b>
            <small>{m.when}</small>
            <em>{m.minutes} min</em>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Bienvenida ---------- */
export function Onboarding({ p, finish }: { p: Profile; finish: (prof: Profile, marks: Entry[]) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [days, setDays] = useState<number[]>(p.days);
  const [goal, setGoal] = useState("Gimnasia y motor");
  const [pu, setPu] = useState(3);
  const [ttb, setTtb] = useState(3);
  const toggleDay = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : days.length < 3 ? [...days, d].sort((a, b) => a - b) : days);
  const steps = [
    <div key="0" className="k-onb-body">
      <div className="k-onb-sun" />
      <h1>KOVA</h1>
      <p>Tu plan de CrossFit, cronómetro, nutrición y progreso en una sola app. Sin cuentas: todo se queda en tu móvil.</p>
      <label className="ios-field">
        <span>¿Cómo te llamas?</span>
        <input autoFocus value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
      </label>
    </div>,
    <div key="1" className="k-onb-body">
      <h2>¿Qué días entrenas?</h2>
      <p>Elige 3. Las sesiones del plan caerán en esos días.</p>
      <div className="k-weekday">
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => {
          const v = (i + 1) % 7;
          return (
            <button type="button" key={d} aria-pressed={days.includes(v)} onClick={() => toggleDay(v)}>
              {d}
            </button>
          );
        })}
      </div>
      <h2 style={{ marginTop: 18 }}>¿Qué buscas?</h2>
      <div className="k-onb-goals">
        {["Gimnasia y motor", "Fuerza", "Perder grasa", "Volver a entrenar"].map((g) => (
          <button key={g} aria-pressed={goal === g} onClick={() => setGoal(g)}>
            {g}
          </button>
        ))}
      </div>
    </div>,
    <div key="2" className="k-onb-body">
      <h2>¿Dónde estás hoy?</h2>
      <p>Con esto ajusto tus series desde el primer día. Puedes cambiarlo cuando quieras.</p>
      {[
        ["Pull-ups estrictas seguidas", pu, setPu],
        ["Toes to bar seguidos", ttb, setTtb],
      ].map(([label, v, set]) => (
        <div key={label as string} className="k-onb-count">
          <span>{label as string}</span>
          <div>
            <button aria-label="Menos" onClick={() => (set as (n: number) => void)(Math.max(0, (v as number) - 1))}>
              −
            </button>
            <b>{v as number}</b>
            <button aria-label="Más" onClick={() => (set as (n: number) => void)(Math.min(50, (v as number) + 1))}>
              +
            </button>
          </div>
        </div>
      ))}
    </div>,
  ];
  const canNext = step === 0 ? name.trim().length > 0 : step === 1 ? days.length === 3 : true;
  return (
    <div className="k-onb" role="dialog" aria-label="Bienvenida">
      <div className="k-onb-dots">
        {steps.map((_, i) => (
          <i key={i} className={i <= step ? "on" : ""} />
        ))}
      </div>
      <div key={step} className="k-onb-anim">
        {steps[step]}
      </div>
      <div className="k-onb-foot">
        {step > 0 && (
          <button className="k-btn" onClick={() => setStep(step - 1)}>
            Atrás
          </button>
        )}
        <button
          className="k-btn primary"
          style={{ flex: 2 }}
          disabled={!canNext}
          onClick={() => {
            haptic(15);
            if (step < steps.length - 1) return setStep(step + 1);
            const prof = { ...p, name: name.trim().slice(0, 80), days, goal, updatedAt: Date.now() };
            const marks: Entry[] = [
              { id: uid(), profileId: p.id, date: today(), metric: "pu", value: pu, note: "Bienvenida", updatedAt: Date.now() },
              { id: uid(), profileId: p.id, date: today(), metric: "ttb", value: ttb, note: "Bienvenida", updatedAt: Date.now() },
            ].filter((m) => Object.hasOwn(markMeta, String(m.metric)));
            finish(prof, marks);
          }}
        >
          {step < steps.length - 1 ? "Seguir" : "Empezar a entrenar"}
        </button>
      </div>
    </div>
  );
}
