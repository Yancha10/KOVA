"use client";
import React, { useState } from "react";
import { Droplets, Minus, Plus, Trash2, ChevronRight } from "lucide-react";
import { Store, Profile, Entry, today, localDate, addDays } from "../lib/engine";
import {
  activities,
  goals,
  habits,
  nutritionOf,
  emptyDay,
  planId,
  weightId,
  trainedOn,
  waterGoal,
  weeklyAverage,
  nutritionGuide,
  NutritionPlan,
  NutritionTargets,
} from "../lib/nutrition";
import { LineChartSVG } from "./Sheet";

const fmt = (d: string) => localDate(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
type NutritionData = ReturnType<typeof nutritionOf>;
type PaneProps = { p: Profile; n: NutritionData; save: (e: Entry) => void; notice: (s: string) => void };
const stamp = (e: Entry, changes: Partial<Entry>): Entry => ({ ...e, ...changes, updatedAt: Date.now() });
const liters = (ml: number) => (ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 2).replace(".", ",");

export default function Nutrition({
  state,
  p,
  save,
  notice,
  celebrate,
}: {
  state: Store;
  p: Profile;
  save: (e: Entry) => void;
  notice: (s: string) => void;
  celebrate: () => void;
}) {
  const [pane, setPane] = useState("today");
  const n = nutritionOf(state, p.id);
  return (
    <div className="ios-stack nutrition-view">
      <div className="ios-seg" role="group" aria-label="Secciones de nutrición">
        {[
          ["today", "Hoy"],
          ["plan", "Mi plan"],
          ["weight", "Peso"],
          ["guide", "Guía"],
        ].map(([id, l]) => (
          <button key={id} aria-pressed={pane === id} onClick={() => setPane(id)}>
            {l}
          </button>
        ))}
      </div>
      {pane === "today" && <Today state={state} p={p} n={n} save={save} notice={notice} celebrate={celebrate} goPlan={() => setPane("plan")} />}
      {pane === "plan" && <PlanPane p={p} n={n} save={save} notice={notice} />}
      {pane === "weight" && <WeightPane p={p} n={n} save={save} notice={notice} />}
      {pane === "guide" && <Guide kg={n.plan?.weight || 75} />}
    </div>
  );
}

function Ring({ value, goal, label, unit }: { value: number; goal: number; label: string; unit: string }) {
  const r = 40, C = 2 * Math.PI * r, f = goal ? Math.min(1, value / goal) : 0;
  return (
    <div className="ios-ring">
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="ios-ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--cream)" />
            <stop offset=".5" stopColor="var(--pink)" />
            <stop offset="1" stopColor="var(--purple)" />
          </linearGradient>
        </defs>
        <circle cx="48" cy="48" r={r} className="track" />
        <circle cx="48" cy="48" r={r} className="value" strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - f)).toFixed(1)} />
      </svg>
      <span>
        <b>
          {value}
          {unit}
        </b>
        <small>{label}</small>
      </span>
    </div>
  );
}

function Bottle({ fraction }: { fraction: number }) {
  const f = Math.max(0, Math.min(1, fraction)), top = 30, bottom = 146, y = bottom - (bottom - top) * f;
  const shape = "M34 6h28v14c0 6 16 10 16 26v92c0 6-4 10-10 10H28c-6 0-10-4-10-10V46c0-16 16-20 16-26z";
  return (
    <div className="ios-bottle" aria-hidden="true">
      <svg viewBox="0 0 96 150">
        <defs>
          <clipPath id="ios-bottle-clip">
            <path d={shape} />
          </clipPath>
          <linearGradient id="ios-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a9dcff" />
            <stop offset="1" stopColor="#9d78bf" />
          </linearGradient>
        </defs>
        <path d={shape} className="glass" />
        <g clipPath="url(#ios-bottle-clip)">
          <g className="level" style={{ transform: `translateY(${y.toFixed(1)}px)` }}>
            <path className="wave back" d="M0 4 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V200 H0z" />
            <path className="wave" fill="url(#ios-water)" d="M0 6 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 V200 H0z" />
          </g>
        </g>
        <rect x="32" y="0" width="32" height="9" rx="3" className="cap" />
      </svg>
    </div>
  );
}

function Today({ state, p, n, save, notice, celebrate, goPlan }: PaneProps & { state: Store; celebrate: () => void; goPlan: () => void }) {
  const date = today();
  const day: Entry = n.days.find((d: Entry) => d.date === date) || emptyDay(p.id, date);
  const training = day.train === null ? trainedOn(state, p.id, date) : !!day.train;
  const t: NutritionTargets | null = n.targets;
  const goal = waterGoal(t, training);
  const proteinGoal = t ? t.protein : 0;
  const done = habits.filter(([k]) => day.habits?.[k]).length;
  const put = (changes: Partial<Entry>) => save(stamp(day, changes));
  const addWater = (ml: number) => {
    const before = day.water || 0, after = Math.max(0, Math.min(20000, before + ml));
    put({ water: after });
    if (before < goal && after >= goal) {
      celebrate();
      notice("¡Objetivo de agua cumplido!");
    }
    try {
      navigator.vibrate?.(12);
    } catch {}
  };
  return (
    <>
      {!t && (
        <button className="ios-banner" onClick={goPlan}>
          <span>✨</span>
          <b>Configura tu plan para tener objetivos a tu medida</b>
          <ChevronRight size={16} />
        </button>
      )}
      <div className="ios-group">
        <div className="ios-row">
          <span className="ios-row-icon">🏋️</span>
          <span className="ios-row-main">
            <b>Hoy entreno</b>
            <small>{training ? "Más agua, carbohidrato y comida después" : "Día de descanso: menos carbohidrato"}</small>
          </span>
          <Toggle checked={training} label="Hoy entreno" onChange={(v) => put({ train: v })} />
        </div>
      </div>
      <div className="ios-card ios-water">
        <Bottle fraction={(day.water || 0) / goal} />
        <div className="ios-water-main">
          <span className="ios-kicker">
            <Droplets size={13} /> Hidratación
          </span>
          <b className="ios-bignum">
            {liters(day.water || 0)}
            <small> / {liters(goal)} L</small>
          </b>
          <div className="ios-quick">
            <button className="ios-btn tint" onClick={() => addWater(250)}>
              +250
            </button>
            <button className="ios-btn tint" onClick={() => addWater(500)}>
              +500
            </button>
            <button className="ios-btn" aria-label="Quitar 250 ml" onClick={() => addWater(-250)}>
              <Minus size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="ios-card ios-ring-row">
        <Ring value={day.protein || 0} goal={proteinGoal || 140} label={proteinGoal ? `de ${proteinGoal} g` : "proteína"} unit="g" />
        <div className="ios-water-main">
          <span className="ios-kicker">Proteína de hoy</span>
          <p className="ios-foot">{t ? `Unos ${t.proteinPerMeal} g por comida, en 3-5 tomas.` : "Configura tu plan para ver tu objetivo."}</p>
          <div className="ios-quick">
            <button className="ios-btn tint" onClick={() => put({ protein: Math.min(1000, (day.protein || 0) + 10) })}>
              +10
            </button>
            <button className="ios-btn tint" onClick={() => put({ protein: Math.min(1000, (day.protein || 0) + 25) })}>
              +25
            </button>
            <button className="ios-btn" aria-label="Quitar 10 g" onClick={() => put({ protein: Math.max(0, (day.protein || 0) - 10) })}>
              <Minus size={16} />
            </button>
          </div>
        </div>
      </div>
      {t && (
        <div className="ios-card">
          <span className="ios-kicker">Objetivo de hoy · {training ? "día de entreno" : "día de descanso"}</span>
          <b className="ios-bignum">
            {training ? t.trainKcal : t.restKcal}
            <small> kcal</small>
          </b>
          <div className="ios-macros">
            <div>
              <b>{t.protein}</b>
              <small>g proteína</small>
            </div>
            <div>
              <b>{training ? t.carbsTrain : t.carbsRest}</b>
              <small>g carbohidrato</small>
            </div>
            <div>
              <b>{t.fat}</b>
              <small>g grasa</small>
            </div>
          </div>
        </div>
      )}
      <h3 className="ios-section">
        Hábitos de hoy · {done}/{habits.length}
      </h3>
      <div className="ios-group">
        {habits.map(([k, icon, label]) => (
          <div className="ios-row" key={k}>
            <span className="ios-row-icon">{icon}</span>
            <span className="ios-row-main">
              <b>{label}</b>
            </span>
            <Toggle
              checked={!!day.habits?.[k]}
              label={label}
              onChange={(v) => {
                const h = { ...(day.habits || {}), [k]: v };
                put({ habits: h });
                if (v && habits.every(([x]) => h[x])) {
                  celebrate();
                  notice("¡Día de hábitos perfecto!");
                }
              }}
            />
          </div>
        ))}
      </div>
      {training && (
        <div className="ios-note">
          <b>⏱️ Alrededor del entreno</b>
          2-3 h antes, comida normal con hidratos y algo de proteína. 30-60 min antes, si tienes hambre, plátano o yogur. Después, {t ? t.proteinPerMeal + " g de proteína" : "proteína"} y una ración de hidratos en las 2 h siguientes. Bebe 400-600 ml en las 2 h previas.
        </div>
      )}
    </>
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

function PlanPane({ p, n, save, notice }: PaneProps) {
  const f: Partial<NutritionPlan> = n.plan || { sex: "h", activity: "lig", goal: "mantener" };
  const [form, setForm] = useState<Record<string, string | number | undefined>>({ weight: f.weight || "", height: f.height || "", age: f.age || "", sex: f.sex, activity: f.activity, goal: f.goal });
  const t: NutritionTargets | null = n.targets;
  const set = (k: string, v: string | number) => setForm({ ...form, [k]: v });
  const num = (v: unknown) => Number(String(v).replace(",", "."));
  return (
    <>
      <form
        className="ios-stack"
        onSubmit={(e) => {
          e.preventDefault();
          const w = num(form.weight), h = num(form.height), a = num(form.age);
          if (!(w >= 30 && w <= 300) || !(h >= 120 && h <= 230) || !(a >= 12 && a <= 100)) {
            notice("Revisa peso (30-300 kg), altura (120-230 cm) y edad");
            return;
          }
          save({ id: planId(p.id), profileId: p.id, date: today(), kind: "plan", weight: w, height: h, age: a, sex: String(form.sex), activity: String(form.activity), goal: String(form.goal), updatedAt: Date.now() });
          notice("Plan nutricional calculado");
        }}
      >
        <div className="ios-card ios-grid3">
          <label className="ios-field">
            <span>Peso (kg)</span>
            <input inputMode="decimal" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="75" required />
          </label>
          <label className="ios-field">
            <span>Altura (cm)</span>
            <input inputMode="numeric" value={form.height} onChange={(e) => set("height", e.target.value)} placeholder="175" required />
          </label>
          <label className="ios-field">
            <span>Edad</span>
            <input inputMode="numeric" value={form.age} onChange={(e) => set("age", e.target.value)} placeholder="35" required />
          </label>
        </div>
        <div className="ios-seg" role="group" aria-label="Sexo">
          {[
            ["h", "Hombre"],
            ["m", "Mujer"],
          ].map(([k, l]) => (
            <button type="button" key={k} aria-pressed={form.sex === k} onClick={() => set("sex", k)}>
              {l}
            </button>
          ))}
        </div>
        <h3 className="ios-section">Actividad fuera del box</h3>
        <div className="ios-group">
          {activities.map(([k, l, d]) => (
            <button type="button" key={k} className="ios-row" onClick={() => set("activity", k)} aria-pressed={form.activity === k}>
              <span className="ios-row-main">
                <b>{l}</b>
                <small>{d}</small>
              </span>
              {form.activity === k && <span className="ios-check">✓</span>}
            </button>
          ))}
        </div>
        <h3 className="ios-section">Objetivo</h3>
        <div className="ios-seg" role="group" aria-label="Objetivo">
          {goals.map(([k, l]) => (
            <button type="button" key={k} aria-pressed={form.goal === k} onClick={() => set("goal", k)}>
              {l}
            </button>
          ))}
        </div>
        <button className="ios-btn primary block">Calcular mi plan</button>
      </form>
      {t && (
        <>
          <div className="ios-stats">
            <div>
              <b>{t.trainKcal}</b>
              <small>kcal día de entreno</small>
            </div>
            <div>
              <b>{t.restKcal}</b>
              <small>kcal día de descanso</small>
            </div>
          </div>
          <div className="ios-card">
            <table className="ios-table">
              <thead>
                <tr>
                  <th />
                  <th>Entreno</th>
                  <th>Descanso</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Proteína</td>
                  <td>{t.protein} g</td>
                  <td>{t.protein} g</td>
                </tr>
                <tr>
                  <td>Carbohidrato</td>
                  <td>{t.carbsTrain} g</td>
                  <td>{t.carbsRest} g</td>
                </tr>
                <tr>
                  <td>Grasa</td>
                  <td>{t.fat} g</td>
                  <td>{t.fat} g</td>
                </tr>
                <tr>
                  <td>Agua</td>
                  <td>{liters(t.water + t.trainingWaterExtra)} L</td>
                  <td>{liters(t.water)} L</td>
                </tr>
              </tbody>
            </table>
            <MacroDonut t={t} />
          </div>
          <div className="ios-card">
            <h3 className="ios-section">Reparto en 4 comidas · día de entreno</h3>
            <table className="ios-table">
              <thead>
                <tr>
                  <th>Comida</th>
                  <th>Proteína</th>
                  <th>Carbohidrato</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Desayuno", 0.25, 0.25],
                    ["Comida", 0.3, 0.3],
                    ["Antes o después de entrenar", 0.2, 0.3],
                    ["Cena", 0.25, 0.15],
                  ] as const
                ).map(([m, a, b]) => (
                  <tr key={m}>
                    <td>{m}</td>
                    <td>{Math.round(t.protein * a)} g</td>
                    <td>{Math.round(t.carbsTrain * b)} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ios-foot">
            Metabolismo basal estimado: {t.bmr} kcal (fórmula de Mifflin-St Jeor). Son cifras orientativas: ajústalas según cómo evolucione tu peso en 2-3 semanas y, si tienes alguna condición de salud, consulta con un dietista-nutricionista.
          </p>
        </>
      )}
    </>
  );
}

function MacroDonut({ t }: { t: NutritionTargets }) {
  const kp = t.protein * 4, kc = t.carbsTrain * 4, kf = t.fat * 9, T = kp + kc + kf, r = 34, C = 2 * Math.PI * r;
  const parts: [number, string][] = [
    [kp, "var(--pink)"],
    [kc, "var(--cream)"],
    [kf, "var(--purple)"],
  ];
  const segs = parts.map(([k, color], i) => {
    const len = (C * k) / T;
    const off = parts.slice(0, i).reduce((a, [x]) => a + (C * x) / T, 0);
    return <circle key={color} cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="14" strokeDasharray={`${len.toFixed(1)} ${(C - len).toFixed(1)}`} strokeDashoffset={(-off).toFixed(1)} />;
  });
  return (
    <div className="ios-donut">
      <svg viewBox="0 0 100 100" aria-hidden="true">
        {segs}
      </svg>
      <ul>
        <li>
          <i style={{ background: "var(--pink)" }} /> Proteína {Math.round((kp / T) * 100)} %
        </li>
        <li>
          <i style={{ background: "var(--cream)" }} /> Carbohidrato {Math.round((kc / T) * 100)} %
        </li>
        <li>
          <i style={{ background: "var(--purple)" }} /> Grasa {Math.round((kf / T) * 100)} %
        </li>
      </ul>
    </div>
  );
}

function WeightPane({ p, n, save, notice }: PaneProps) {
  const [kg, setKg] = useState(""), [waist, setWaist] = useState(""), [date, setDate] = useState(today());
  const ws: Entry[] = n.weights;
  const last = ws[ws.length - 1];
  const avg = weeklyAverage(ws), prev = weeklyAverage(ws, addDays(today(), -7));
  return (
    <>
      <form
        className="ios-card ios-stack"
        onSubmit={(e) => {
          e.preventDefault();
          const k = Number(kg.replace(",", ".")), w = waist ? Number(waist.replace(",", ".")) : null;
          if (!(k >= 20 && k <= 400) || (w !== null && !(w >= 30 && w <= 300))) {
            notice("Revisa el peso y la cintura");
            return;
          }
          save({ id: weightId(p.id, date), profileId: p.id, date, kind: "weight", kg: k, waist: w, updatedAt: Date.now() });
          setKg("");
          setWaist("");
          notice("Peso guardado");
        }}
      >
        <div className="ios-grid2">
          <label className="ios-field">
            <span>Peso (kg)</span>
            <input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder={last ? String(last.kg) : "75,0"} required />
          </label>
          <label className="ios-field">
            <span>Cintura (cm, opcional)</span>
            <input inputMode="decimal" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder={last?.waist ? String(last.waist) : "82"} />
          </label>
        </div>
        <label className="ios-field">
          <span>Fecha</span>
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
        </label>
        <button className="ios-btn primary block">Guardar peso</button>
      </form>
      {ws.length ? (
        <>
          <div className="ios-stats">
            <div>
              <b>{String(last.kg).replace(".", ",")}</b>
              <small>último (kg)</small>
            </div>
            <div>
              <b>{avg ? avg.toFixed(1).replace(".", ",") : "–"}</b>
              <small>media 7 días</small>
            </div>
            {avg && prev ? (
              <div>
                <b>{(avg - prev > 0 ? "+" : "") + (avg - prev).toFixed(1).replace(".", ",")}</b>
                <small>vs semana anterior</small>
              </div>
            ) : null}
          </div>
          <div className="ios-card">
            <LineChartSVG
              label="Evolución del peso"
              series={[
                { name: "Peso", color: "var(--green)", points: ws.map((w, i) => ({ x: i, y: Number(w.kg), title: `${fmt(w.date)}: ${w.kg} kg` })) },
              ]}
            />
          </div>
          <div className="ios-group">
            {[...ws]
              .reverse()
              .slice(0, 10)
              .map((w) => (
                <div className="ios-row" key={w.id}>
                  <span className="ios-row-main">
                    <b>
                      {String(w.kg).replace(".", ",")} kg{w.waist ? ` · ${w.waist} cm` : ""}
                    </b>
                    <small>{fmt(w.date)}</small>
                  </span>
                  <button className="ios-icon-btn" aria-label="Borrar peso" onClick={() => save({ ...w, _deleted: true, updatedAt: Date.now() })}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>
        </>
      ) : (
        <p className="ios-foot">Pésate 2-3 mañanas por semana, en ayunas y después de ir al baño. Lo que cuenta es la media semanal, no el dato de un día.</p>
      )}
    </>
  );
}

function Guide({ kg }: { kg: number }) {
  return (
    <>
      {nutritionGuide(kg).map((s, i) => (
        <details className="ios-acc" key={s.title} open={i === 0}>
          <summary>
            <span>{s.icon}</span>
            {s.title}
          </summary>
          <ul>
            {s.body.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </details>
      ))}
      <p className="ios-foot center">Información general basada en guías de nutrición deportiva. No sustituye el consejo de un dietista-nutricionista.</p>
    </>
  );
}
