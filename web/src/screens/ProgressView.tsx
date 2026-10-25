import React, { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Store, Profile, Plan, Entry, forProfile, markMeta, localDate, today, uid } from "../../../app/lib/engine";
import Report from "../../../app/components/Report";
import Records from "../../../app/components/Records";
import { LineChartSVG } from "../../../app/components/Sheet";
import { celebrate } from "../../../app/lib/fx";
import { Seg } from "../ui";
import { BADGES, unlocked, teamBoard, evalComparison } from "../extras";
import { MonthCalendar, Challenges } from "../live";

const fmt = (d: string) => localDate(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
const metricKeys = Object.keys(markMeta);

export default function ProgressView({
  state,
  p,
  plan,
  done,
  put,
  notice,
  addMark,
  editLog,
  profiles,
  plans,
  switchTo,
  addProfile,
}: {
  state: Store;
  p: Profile;
  plan: Plan;
  done: Set<string>;
  put: (k: "marks" | "records" | "logs", e: Entry) => void;
  notice: (s: string) => void;
  addMark: (metric: string) => void;
  editLog: (l: Entry) => void;
  profiles: Profile[];
  plans: Plan[];
  switchTo: (id: string) => void;
  addProfile: () => void;
}) {
  const [pane, setPane] = useState<"report" | "calendar" | "marks" | "records" | "badges" | "team" | "diary">("report");
  const [metric, setMetric] = useState(metricKeys[0]);
  const marks = forProfile(state.marks, p.id).filter((m) => m.metric === metric).sort((a, b) => a.date.localeCompare(b.date));
  const logs = forProfile(state.logs, p.id).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
  const meta = markMeta[metric];
  const last = marks[marks.length - 1];
  return (
    <section className="k-page">
      <Seg
        label="Vista de progreso"
        value={pane}
        onChange={setPane}
        items={[
          ["report", "Informe"],
          ["calendar", "Calendario"],
          ["marks", "Marcas"],
          ["records", "Récords"],
          ["badges", "Logros"],
          ["team", "Equipo"],
          ["diary", "Diario"],
        ]}
      />
      {pane === "report" && <Report state={state} p={p} plan={plan} done={done} />}
      {pane === "calendar" && <MonthCalendar state={state} p={p} />}
      {pane === "team" && <Team state={state} p={p} profiles={profiles} plans={plans} switchTo={switchTo} addProfile={addProfile} />}
      {pane === "badges" && <Badges state={state} p={p} plan={plan} done={done} />}
      {pane === "records" && <Records state={state} p={p} save={(e) => put("records", e)} notice={notice} celebrate={() => celebrate()} />}
      {pane === "marks" && (
        <div className="ios-stack">
          <Compare state={state} p={p} />
          <p className="ios-foot">Series limpias, sin llegar al fallo. Tus dosis de gimnasia se calculan con la última evaluación de cada movimiento.</p>
          <Seg label="Movimiento evaluado" value={metric} onChange={setMetric} items={metricKeys.map((k) => [k, markMeta[k].name] as const)} small />
          <div className="ios-stats">
            <div>
              <b>
                {last ? last.value : "–"}
                <small> {meta.unit}</small>
              </b>
              <small>última evaluación</small>
            </div>
            <div>
              <b>
                {meta.goal}
                <small> {meta.unit}</small>
              </b>
              <small>objetivo {meta.lower ? "(menos es mejor)" : ""}</small>
            </div>
          </div>
          <div className="ios-card">
            <LineChartSVG
              label={"Evolución de " + meta.name}
              invert={!!meta.lower}
              series={[{ name: meta.name, color: "var(--green)", points: marks.map((m, i) => ({ x: i, y: Number(m.value), title: `${fmt(m.date)}: ${m.value} ${meta.unit}` })) }]}
            />
          </div>
          <button className="k-btn primary block" onClick={() => addMark(metric)}>
            <Plus /> Nueva evaluación de {meta.name}
          </button>
          {marks.length > 0 && (
            <div className="ios-group">
              {[...marks].reverse().map((m) => (
                <div key={m.id} className="ios-row">
                  <span className="ios-row-main">
                    <b>
                      {m.value} {meta.unit}
                    </b>
                    <small>
                      {fmt(m.date)}
                      {m.note ? " · " + m.note : ""}
                    </small>
                  </span>
                  <button
                    className="ios-icon-btn"
                    aria-label="Borrar evaluación"
                    onClick={() => {
                      if (confirm("¿Borrar esta evaluación? Tus dosis se recalcularán.")) put("marks", { ...m, _deleted: true, updatedAt: Date.now() });
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {pane === "diary" &&
        (logs.length ? (
          <div className="ios-group">
            {logs.map((l) => (
              <div key={l.id} className="ios-row">
                <span className="ios-row-main">
                  <b>{l.title}</b>
                  <small>
                    {fmt(l.date)} · {l.minutes}′ · RPE {l.rpe}
                    {l.score ? " · " + l.score : ""}
                    {l.note ? " · " + l.note : ""}
                  </small>
                </span>
                <button className="ios-icon-btn" aria-label="Editar registro" onClick={() => editLog(l)}>
                  <Pencil size={15} />
                </button>
                <button
                  className="ios-icon-btn"
                  aria-label="Borrar registro"
                  onClick={() => {
                    if (confirm("¿Borrar este registro? También se quitará de tus cálculos.")) put("logs", { ...l, _deleted: true, updatedAt: Date.now() });
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="ios-card ios-empty-card">
            <h3>Aún no hay entrenos registrados</h3>
            <p>Cuando guardes una sesión en Entrenar aparecerá aquí, con su esfuerzo y su resultado.</p>
          </div>
        ))}
    </section>
  );
}

export function MarkForm({ p, metric, save }: { p: Profile; metric: string; save: (e: Entry) => void }) {
  const [m, setM] = useState(metric);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const meta = markMeta[m];
  const n = Number(value.replace(",", "."));
  const valid = value.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 10000;
  return (
    <form
      className="ios-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) save({ id: uid(), profileId: p.id, date, metric: m, value: n, note: note.slice(0, 1000), updatedAt: Date.now() });
      }}
    >
      <Seg label="Movimiento" value={m} onChange={setM} items={metricKeys.map((k) => [k, markMeta[k].name] as const)} small />
      <div className="ios-grid2">
        <label className="ios-field">
          <span>Marca ({meta.unit})</span>
          <input autoFocus inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={m === "row" ? "480" : "8"} />
        </label>
        <label className="ios-field">
          <span>Fecha</span>
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
        </label>
      </div>
      <label className="ios-field">
        <span>Condiciones</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Asistencia, escala, máquina…" />
      </label>
      <p className="ios-foot">{m === "row" ? "Remo: segundos totales para 2.000 m." : m === "hsw" ? "Handstand walk: metros sin caer." : "Una serie limpia, sin llegar al fallo."}</p>
      <button className="k-btn primary block" disabled={!valid}>
        Guardar evaluación
      </button>
    </form>
  );
}

function Badges({ state, p, plan, done }: { state: Store; p: Profile; plan: Plan; done: Set<string> }) {
  const got = new Set(unlocked({ state, p, plan, done }));
  return (
    <div className="ios-stack">
      <Challenges state={state} p={p} />
      <div className="ios-hero-mini">
        <span className="ios-kicker">Logros</span>
        <b className="ios-bignum">
          {got.size}
          <small> de {BADGES.length}</small>
        </b>
        <div className="k-bar"><i style={{ width: (got.size / BADGES.length) * 100 + "%" }} /></div>
      </div>
      <div className="k-badges">
        {BADGES.map((b) => (
          <div key={b.id} className={"k-badge-card" + (got.has(b.id) ? " on" : "")}>
            <span className="ic">{got.has(b.id) ? b.icon : "🔒"}</span>
            <b>{b.name}</b>
            <small>{b.hint}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Compare({ state, p }: { state: Store; p: Profile }) {
  const rows = evalComparison(state, p).filter((r) => r.n > 1);
  if (!rows.length) return null;
  return (
    <div className="ios-card">
      <h3 className="ios-section">Antes y después</h3>
      {rows.map((r) => (
        <div className="k-cmp" key={r.k}>
          <div className="k-row" style={{ justifyContent: "space-between" }}>
            <b>{r.name}</b>
            <span className={"k-cmp-pct" + (r.change >= 0 ? " up" : " down")}>
              {r.change >= 0 ? "▲" : "▼"} {Math.abs(Math.round(r.change))} %
            </span>
          </div>
          <div className="k-small k-muted">
            {r.first} → {r.last} {r.unit} · {fmt(r.firstDate)} → {fmt(r.lastDate)}
          </div>
          <div className="k-bar light"><i style={{ width: r.goalPct + "%" }} /></div>
        </div>
      ))}
      <p className="ios-foot">La barra muestra lo cerca que estás del objetivo de cada movimiento.</p>
    </div>
  );
}

function Team({ state, p, profiles, plans, switchTo, addProfile }: { state: Store; p: Profile; profiles: Profile[]; plans: Plan[]; switchTo: (id: string) => void; addProfile: () => void }) {
  const rows = teamBoard(state, profiles, plans);
  const medals = ["🥇", "🥈", "🥉"];
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return (
    <div className="ios-stack">
      <div className="ios-hero-mini">
        <span className="ios-kicker">Ranking de esta semana</span>
        <b className="ios-bignum" style={{ fontSize: 26 }}>
          {rows.length > 1 ? `${rows[0].p.name} va en cabeza` : "Entrena en equipo"}
        </b>
        <p className="ios-foot">{rows.length > 1 ? "Por sesiones; desempata el tiempo y la racha. Sin presión: lo que cuenta es sumar." : "Añade a tu pareja o a tu grupo del box: cada uno con su plan y su registro en este móvil."}</p>
      </div>
      <div className="ios-group">
        {rows.map((r, i) => (
          <button key={r.p.id} className="ios-row" onClick={() => switchTo(r.p.id)}>
            <span style={{ fontSize: 22, width: 28, textAlign: "center" }}>{medals[i] || i + 1}</span>
            <span className="ios-row-main">
              <b>
                {r.p.name}
                {r.p.id === p.id ? " · tú" : ""}
              </b>
              <small>
                {r.sessions} {r.sessions === 1 ? "sesión" : "sesiones"} · {r.minutes}′ · ⚡ {r.streak} · 🏅 {r.badges}
                {r.prs ? ` · ⭐ ${r.prs}` : ""}
              </small>
              <span className="k-bar light" style={{ marginTop: 6 }}><i style={{ width: (r.minutes / max) * 100 + "%" }} /></span>
            </span>
          </button>
        ))}
      </div>
      <button className="k-btn tint block" onClick={addProfile}>
        + Añadir atleta
      </button>
      <p className="ios-foot">Cuando entrenéis juntos, al guardar la sesión podéis registrarla también para el otro con un toque.</p>
    </div>
  );
}
