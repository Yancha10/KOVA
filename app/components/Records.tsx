"use client";
import React, { useMemo, useState } from "react";
import { Plus, Search, Trash2, Trophy, ChevronRight, Check } from "lucide-react";
import { Store, Profile, Entry, uid, today, localDate } from "../lib/engine";
import {
  recordCategories,
  recordUnitLabels,
  searchMovements,
  findMovement,
  groupRecords,
  isNewBest,
  percentTable,
  recordScore,
  unitSuffix,
  lowerIsBetter,
  RecordUnit,
  normalizeText,
} from "../lib/records";
import { Sheet, LineChartSVG } from "./Sheet";

const fmt = (d: string) => localDate(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" });

export default function Records({
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
  const records = (state.records || []).filter((r) => r.profileId === p.id && !r._deleted);
  const groups = useMemo(() => groupRecords(records), [records]);
  const [adding, setAdding] = useState<{ name: string; unit: RecordUnit } | null | "new">(null);
  const [detail, setDetail] = useState<{ name: string; unit: string } | null>(null);
  const [filter, setFilter] = useState("");
  const shown = groups.filter((g) => !filter || normalizeText(g.name).includes(normalizeText(filter)));
  const current = detail ? groups.find((g) => normalizeText(g.name) === normalizeText(detail.name) && g.unit === detail.unit) : null;
  return (
    <div className="ios-stack">
      <button className="ios-btn primary block" onClick={() => setAdding("new")}>
        <Plus size={18} /> Nuevo récord
      </button>
      {groups.length > 4 && (
        <label className="ios-search">
          <Search size={16} />
          <input type="search" placeholder="Buscar en tus récords" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </label>
      )}
      {groups.length ? (
        <div className="ios-group">
          {shown.map((g) => (
            <button key={g.name + g.unit} className="ios-row" onClick={() => setDetail({ name: g.name, unit: g.unit })}>
              <span className="ios-row-icon">
                <Trophy size={16} />
              </span>
              <span className="ios-row-main">
                <b>{g.name}</b>
                <small>
                  {g.entries.length} {g.entries.length === 1 ? "marca" : "marcas"} · {fmt(g.best.date)}
                </small>
              </span>
              <span className="ios-row-value">
                {g.best.value}
                <small>{unitSuffix(g.unit)}</small>
              </span>
              <ChevronRight size={16} className="ios-chevron" />
            </button>
          ))}
        </div>
      ) : (
        <div className="ios-card ios-empty-card">
          <Trophy size={28} />
          <h3>Tus mejores marcas, en un sitio</h3>
          <p>Hay más de 150 movimientos y WODs listos para buscar: halterofilia, fuerza, gimnásticos, cardio, Girls y Héroes. También puedes escribir el tuyo.</p>
        </div>
      )}
      {adding && (
        <Sheet title="Nuevo récord" close={() => setAdding(null)}>
          <RecordForm
            preset={adding === "new" ? null : adding}
            onSave={(entry) => {
              const best = isNewBest(records, { name: String(entry.name), unit: String(entry.unit), value: String(entry.value) });
              save(entry);
              setAdding(null);
              if (best) {
                celebrate();
                notice(`¡Nuevo récord en ${entry.name}!`);
              } else notice("Marca guardada");
            }}
            p={p}
          />
        </Sheet>
      )}
      {current && (
        <Sheet title={current.name} close={() => setDetail(null)}>
          <RecordDetail
            group={current}
            remove={(e) => {
              if (confirm(`¿Borrar la marca ${e.value} del ${fmt(e.date)}?`)) save({ ...e, _deleted: true, updatedAt: Date.now() });
            }}
            add={() => {
              setDetail(null);
              setAdding({ name: current.name, unit: current.unit as RecordUnit });
            }}
          />
        </Sheet>
      )}
    </div>
  );
}

function RecordForm({ preset, onSave, p }: { preset: { name: string; unit: RecordUnit } | null; onSave: (e: Entry) => void; p: Profile }) {
  const [query, setQuery] = useState(preset?.name || "");
  const [picked, setPicked] = useState<string | null>(preset?.name || null);
  const [unit, setUnit] = useState<RecordUnit>(preset?.unit || "kg");
  const [cat, setCat] = useState("Todos");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const results = searchMovements(query, cat);
  const exact = findMovement(query);
  const pick = (name: string, u?: RecordUnit) => {
    setPicked(name);
    setQuery(name);
    if (u) setUnit(u);
  };
  const valid = picked && value.trim() && recordScore(value, unit) !== null;
  return (
    <form
      className="ios-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSave({ id: uid(), profileId: p.id, date, name: picked!.trim().slice(0, 80), unit, value: value.trim().slice(0, 20), note: note.trim().slice(0, 500), updatedAt: Date.now() });
      }}
    >
      {!picked ? (
        <>
          <label className="ios-search big">
            <Search size={18} />
            <input
              autoFocus
              type="search"
              placeholder="Back squat, Fran, remo 500 m…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar o escribir movimiento"
            />
          </label>
          <div className="ios-seg scroll" role="group" aria-label="Categoría">
            {["Todos", ...recordCategories].map((c) => (
              <button type="button" key={c} aria-pressed={cat === c} onClick={() => setCat(c)}>
                {c}
              </button>
            ))}
          </div>
          <div className="ios-group ios-picklist">
            {query.trim() && !exact && (
              <button type="button" className="ios-row accent" onClick={() => pick(query.trim().slice(0, 80))}>
                <span className="ios-row-main">
                  <b>Usar «{query.trim()}»</b>
                  <small>Movimiento escrito a mano</small>
                </span>
                <Plus size={16} />
              </button>
            )}
            {results.map((m) => (
              <button type="button" key={m.name + m.unit} className="ios-row" onClick={() => pick(m.name, m.unit)}>
                <span className="ios-row-main">
                  <b>{m.name}</b>
                  <small>
                    {m.category} · {recordUnitLabels[m.unit]}
                  </small>
                </span>
                <ChevronRight size={16} className="ios-chevron" />
              </button>
            ))}
            {!results.length && !query.trim() && <p className="ios-empty">Sin resultados.</p>}
          </div>
        </>
      ) : (
        <>
          <button type="button" className="ios-picked" onClick={() => setPicked(null)}>
            <Check size={17} />
            <span>
              <b>{picked}</b>
              <small>Toca para cambiar el movimiento</small>
            </span>
          </button>
          <div className="ios-grid2">
            <label className="ios-field">
              <span>Marca</span>
              <input
                autoFocus
                inputMode={unit === "tiempo" || unit === "rondas" ? "text" : "decimal"}
                placeholder={unit === "tiempo" ? "4:35" : unit === "rondas" ? "8+12" : "100"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </label>
            <label className="ios-field">
              <span>Unidad</span>
              <select value={unit} onChange={(e) => setUnit(e.target.value as RecordUnit)}>
                {Object.entries(recordUnitLabels).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="ios-field">
            <span>Fecha</span>
            <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} required />
          </label>
          <label className="ios-field">
            <span>Notas (opcional)</span>
            <input placeholder="Escalado, cinturón, Rx…" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </label>
          <button className="ios-btn primary block" disabled={!valid}>
            Guardar récord
          </button>
        </>
      )}
    </form>
  );
}

function RecordDetail({ group, remove, add }: { group: ReturnType<typeof groupRecords>[number]; remove: (e: Entry) => void; add: () => void }) {
  const pts = group.entries
    .map((e, i) => ({ e, s: recordScore(e.value, group.unit) }))
    .filter((x) => x.s !== null)
    .map((x, i) => ({ x: i, y: group.unit === "rondas" ? (x.s as number) / 1000 : (x.s as number), title: `${fmt(x.e.date)}: ${x.e.value}` }));
  const best = recordScore(group.best.value, group.unit);
  return (
    <div className="ios-stack">
      <div className="ios-hero-mini">
        <span className="ios-kicker">Mejor marca</span>
        <b className="ios-bignum">
          {group.best.value}
          <small>{unitSuffix(group.unit)}</small>
        </b>
        <span className="ios-kicker">{fmt(group.best.date)}</span>
      </div>
      {pts.length > 1 && (
        <div className="ios-card">
          <LineChartSVG
            label={"Evolución de " + group.name}
            series={[{ name: group.name, color: "var(--green)", points: pts }]}
            invert={lowerIsBetter(group.unit)}
            format={group.unit === "tiempo" ? (v) => `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, "0")}` : undefined}
          />
        </div>
      )}
      {group.unit === "kg" && best !== null && (
        <div className="ios-card">
          <h3 className="ios-section">Porcentajes de tu mejor marca</h3>
          <div className="ios-pct">
            {percentTable(best).map((r) => (
              <div key={r.pct}>
                <small>{r.pct}%</small>
                <b>{String(r.kg).replace(".", ",")}</b>
              </div>
            ))}
          </div>
          <p className="ios-foot">Redondeado a 0,5 kg.</p>
        </div>
      )}
      <div className="ios-group">
        {[...group.entries].reverse().map((e) => (
          <div className="ios-row" key={e.id}>
            <span className="ios-row-main">
              <b>
                {e.value}
                {unitSuffix(group.unit)}
              </b>
              <small>
                {fmt(e.date)}
                {e.note ? " · " + e.note : ""}
              </small>
            </span>
            <button className="ios-icon-btn" aria-label="Borrar marca" onClick={() => remove(e)}>
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      <button className="ios-btn tint block" onClick={add}>
        <Plus size={17} /> Añadir marca
      </button>
    </div>
  );
}
