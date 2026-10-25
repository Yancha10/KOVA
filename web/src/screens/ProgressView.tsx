import React, { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Store, Profile, Plan, Entry, forProfile, markMeta, localDate, today, uid } from "../../../app/lib/engine";
import Report from "../../../app/components/Report";
import Records from "../../../app/components/Records";
import { LineChartSVG } from "../../../app/components/Sheet";
import { celebrate } from "../../../app/lib/fx";
import { Seg } from "../ui";

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
}: {
  state: Store;
  p: Profile;
  plan: Plan;
  done: Set<string>;
  put: (k: "marks" | "records" | "logs", e: Entry) => void;
  notice: (s: string) => void;
  addMark: (metric: string) => void;
  editLog: (l: Entry) => void;
}) {
  const [pane, setPane] = useState<"report" | "marks" | "records" | "diary">("report");
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
          ["marks", "Marcas"],
          ["records", "Récords"],
          ["diary", "Diario"],
        ]}
      />
      {pane === "report" && <Report state={state} p={p} plan={plan} done={done} />}
      {pane === "records" && <Records state={state} p={p} save={(e) => put("records", e)} notice={notice} celebrate={() => celebrate()} />}
      {pane === "marks" && (
        <div className="ios-stack">
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
