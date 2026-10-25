import React, { useEffect, useState } from "react";
import { Check, Download, Upload, Plus, Pencil, Send } from "lucide-react";
import { Store, Profile, Plan, Entry, coachAdvice, coachReply, hRoutes, mRoutes, readiness, today, uid, validStore, live } from "../../../app/lib/engine";
import DriveSync from "../../../app/components/DriveSync";
import { extractFile, planFromText } from "../../../app/lib/documents";
import { Seg, Toggle } from "../ui";
import { getTimerPref, setTimerPref } from "./TimerView";

type Theme = "light" | "dark" | "system";
export function applyTheme(mode: Theme) {
  const dark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#140E1E" : "#F7F1F8");
}
export function readTheme(): Theme {
  try {
    const v = localStorage.getItem("kova-theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export default function ProfileView({
  state,
  p,
  profiles,
  switchTo,
  editProfile,
  addProfile,
  snapshot,
  integrate,
  notice,
}: {
  state: Store;
  p: Profile;
  profiles: Profile[];
  switchTo: (id: string) => void;
  editProfile: () => void;
  addProfile: () => void;
  snapshot: () => Store;
  integrate: (s: Store) => void;
  notice: (s: string) => void;
}) {
  const [pane, setPane] = useState<"athletes" | "coach" | "settings" | "data">("athletes");
  return (
    <section className="k-page">
      <Seg
        label="Secciones del perfil"
        value={pane}
        onChange={setPane}
        items={[
          ["athletes", "Atletas"],
          ["coach", "Coach"],
          ["settings", "Ajustes"],
          ["data", "Datos"],
        ]}
      />
      {pane === "athletes" && (
        <>
          <div className="ios-group">
            {profiles.map((x) => {
              const n = live(state.logs).filter((l) => l.profileId === x.id).length;
              return (
                <button key={x.id} className="ios-row" onClick={() => switchTo(x.id)}>
                  <span className="k-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                    {x.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="ios-row-main">
                    <b>{x.name}</b>
                    <small>
                      {x.goal} · {n} {n === 1 ? "entreno" : "entrenos"} · rutas {x.hRoute} / {x.mRoute}
                    </small>
                  </span>
                  {x.id === p.id && <Check size={18} color="var(--accent)" />}
                </button>
              );
            })}
          </div>
          <div className="ios-grid2">
            <button className="k-btn tint" onClick={editProfile}>
              <Pencil /> Editar {p.name}
            </button>
            <button className="k-btn primary" onClick={addProfile} disabled={profiles.length >= 20}>
              <Plus /> Atleta
            </button>
          </div>
          <p className="ios-foot">Cada atleta tiene su plan, días, rutas de pino y muscle-up, registros y nutrición por separado.</p>
        </>
      )}
      {pane === "coach" && <Coach state={state} p={p} />}
      {pane === "settings" && <Settings />}
      {pane === "data" && <Data state={state} snapshot={snapshot} integrate={integrate} notice={notice} />}
    </section>
  );
}

function Coach({ state, p }: { state: Store; p: Profile }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const tips = coachAdvice(state, p);
  return (
    <>
      <div className="ios-card">
        {tips.map((t) => (
          <div className="ios-advice" key={t.title}>
            <span>🧭</span>
            <div>
              <span className="k-kicker">{t.tag}</span>
              <b style={{ display: "block" }}>{t.title}</b>
              <p>{t.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form
        className="ios-card ios-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) setA(coachReply(q, state, p));
        }}
      >
        <label className="ios-field">
          <span>Pregunta al coach</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Cómo progreso en el muscle-up?" />
        </label>
        <div className="ios-seg scroll small">
          {["¿Qué hago con el pino?", "¿Cuándo intento el muscle-up?", "¿Cómo dosifico el cardio?", "Me duele el hombro"].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => {
                setQ(s);
                setA(coachReply(s, state, p));
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="k-btn tint block" disabled={!q.trim()}>
          <Send /> Preguntar
        </button>
        {a && <div className="k-coach-a">{a}</div>}
        <p className="ios-foot">El coach usa reglas transparentes sobre tus datos, no un modelo de IA. No diagnostica: ante dolor o síntomas, consulta a un profesional.</p>
      </form>
    </>
  );
}

function Settings() {
  const [theme, setTheme] = useState<Theme>("system");
  const [voice, setVoice] = useState(true);
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    setTheme(readTheme());
    setVoice(getTimerPref("voice", true));
    setFocus(getTimerPref("focus", false));
  }, []);
  return (
    <>
      <h3 className="ios-section">Apariencia</h3>
      <Seg
        label="Apariencia"
        value={theme}
        onChange={(v) => {
          setTheme(v);
          try {
            localStorage.setItem("kova-theme", v);
          } catch {
            /* sin almacenamiento */
          }
          applyTheme(v);
        }}
        items={[
          ["light", "Claro"],
          ["dark", "Oscuro"],
          ["system", "Automático"],
        ]}
      />
      <h3 className="ios-section">Cronómetro</h3>
      <div className="ios-group">
        <div className="ios-row">
          <span className="ios-row-icon">🗣️</span>
          <span className="ios-row-main">
            <b>Voz</b>
            <small>Cuenta atrás y avisos en español</small>
          </span>
          <Toggle
            checked={voice}
            label="Voz"
            onChange={(v) => {
              setVoice(v);
              setTimerPref("voice", v);
            }}
          />
        </div>
        <div className="ios-row">
          <span className="ios-row-icon">⛶</span>
          <span className="ios-row-main">
            <b>Pantalla completa al correr</b>
            <small>Oculta las barras mientras el reloj está en marcha</small>
          </span>
          <Toggle
            checked={focus}
            label="Pantalla completa"
            onChange={(v) => {
              setFocus(v);
              setTimerPref("focus", v);
            }}
          />
        </div>
      </div>
      <p className="ios-foot">Consejo: en iPhone, añade KOVA a la pantalla de inicio desde Safari (Compartir → Añadir a pantalla de inicio) para usarla a pantalla completa.</p>
    </>
  );
}

function Data({ state, snapshot, integrate, notice }: { state: Store; snapshot: () => Store; integrate: (s: Store) => void; notice: (s: string) => void }) {
  return (
    <>
      <div className="ios-card ios-stack">
        <h3 className="ios-section">Copia de seguridad</h3>
        <p className="ios-foot">Tus datos viven en este dispositivo. Exporta una copia para guardarla o pasarla a otro móvil.</p>
        <div className="ios-grid2">
          <button
            className="k-btn tint"
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" }));
              a.download = `kova-copia-${today()}.json`;
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                URL.revokeObjectURL(a.href);
                a.remove();
              }, 600);
              notice("Copia exportada");
            }}
          >
            <Download /> Exportar
          </button>
          <label className="k-btn tint" style={{ cursor: "pointer" }}>
            <Upload /> Importar
            <input
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  const raw = JSON.parse(await f.text());
                  const s = raw?.state ?? raw;
                  if (!validStore(s)) throw new Error("formato");
                  integrate(s);
                  notice("Copia importada y fusionada con tus datos");
                } catch {
                  notice("Ese archivo no es una copia válida de KOVA");
                }
              }}
            />
          </label>
        </div>
        <p className="ios-foot">
          {live(state.logs).length} entrenos · {live(state.marks).length} evaluaciones · {(state.records || []).filter((x) => !x._deleted).length} récords guardados.
        </p>
      </div>
      <div className="ios-card k-drive">
        <DriveSync accountId="local" snapshot={snapshot} integrate={integrate} />
      </div>
    </>
  );
}

export function ProfileForm({ initial, plans, save }: { initial: Profile | null; plans: Plan[]; save: (p: Profile) => void }) {
  const base: Profile = initial || {
    id: uid(),
    name: "",
    startDate: today(),
    days: [1, 3, 5],
    planId: "base",
    hRoute: "H1",
    mRoute: "M0",
    goal: "Gimnasia y motor",
    classes: 3,
    updatedAt: 0,
  };
  const [f, setF] = useState<Profile>(base);
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const toggleDay = (d: number) => {
    const has = f.days.includes(d);
    const next = has ? f.days.filter((x) => x !== d) : f.days.length < 3 ? [...f.days, d].sort((a, b) => a - b) : f.days;
    setF({ ...f, days: next });
  };
  const valid = f.name.trim().length > 0 && f.days.length === 3;
  return (
    <form
      className="ios-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) save({ ...f, name: f.name.trim().slice(0, 80), updatedAt: Date.now() });
      }}
    >
      <label className="ios-field">
        <span>Nombre</span>
        <input autoFocus={!initial} value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Por ejemplo, Dani" />
      </label>
      <div>
        <span className="k-kicker">Días de entreno (elige 3)</span>
        <div className="k-weekday" style={{ marginTop: 6 }}>
          {days.map((d, i) => {
            const val = (i + 1) % 7;
            return (
              <button type="button" key={d} aria-pressed={f.days.includes(val)} onClick={() => toggleDay(val)}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
      <div className="ios-grid2">
        <label className="ios-field">
          <span>Inicio del plan</span>
          <input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value || today() })} />
        </label>
        <label className="ios-field">
          <span>Clases extra / semana</span>
          <select value={f.classes} onChange={(e) => setF({ ...f, classes: Number(e.target.value) })}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="ios-field">
        <span>Programa</span>
        <select value={f.planId} onChange={(e) => setF({ ...f, planId: e.target.value })}>
          {plans.map((pl) => (
            <option key={pl.id} value={pl.id}>
              {pl.name}
            </option>
          ))}
        </select>
      </label>
      <label className="ios-field">
        <span>Ruta de pino</span>
        <select value={f.hRoute} onChange={(e) => setF({ ...f, hRoute: e.target.value })}>
          {hRoutes.map(([k, n]) => (
            <option key={k} value={k}>
              {k} · {n}
            </option>
          ))}
        </select>
      </label>
      <label className="ios-field">
        <span>Ruta de muscle-up</span>
        <select value={f.mRoute} onChange={(e) => setF({ ...f, mRoute: e.target.value })}>
          {mRoutes.map(([k, n]) => (
            <option key={k} value={k}>
              {k} · {n}
            </option>
          ))}
        </select>
      </label>
      <p className="ios-foot">Las rutas se cambian a mano y conviene revisarlas con tu coach: KOVA nunca te sube de nivel automáticamente.</p>
      <button className="k-btn primary block" disabled={!valid}>
        {initial ? "Guardar cambios" : "Crear atleta"}
      </button>
    </form>
  );
}

export function CheckForm({ p, previous, save }: { p: Profile; previous?: Entry; save: (e: Entry) => void }) {
  const [f, setF] = useState({ sleep: previous?.sleep ?? 7, energy: previous?.energy ?? 3, soreness: previous?.soreness ?? 2, stress: previous?.stress ?? 2, pain: previous?.pain ?? false });
  const score = readiness(f as unknown as Entry) ?? 0;
  const scale = (key: "energy" | "soreness" | "stress", label: string, low: string, high: string) => (
    <div>
      <div className="k-row" style={{ justifyContent: "space-between" }}>
        <span className="k-kicker">{label}</span>
        <span className="k-small k-muted">
          {low} → {high}
        </span>
      </div>
      <div className="k-rpe" style={{ marginTop: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} aria-pressed={f[key] === n} onClick={() => setF({ ...f, [key]: n })}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <form
      className="ios-stack"
      onSubmit={(e) => {
        e.preventDefault();
        save({ id: p.id + "-" + today(), profileId: p.id, date: today(), ...f, updatedAt: Date.now() });
      }}
    >
      <div className="ios-hero-mini" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <b className="ios-bignum" style={{ margin: 0 }}>
          {f.pain ? "—" : score}
          <small>/100</small>
        </b>
        <span style={{ fontWeight: 600 }}>{f.pain ? "Revisa los síntomas antes de entrenar" : score < 45 ? "Volumen a la mitad y cardio suave" : score < 65 ? "Algo menos de volumen" : "Mantén la dosis prevista"}</span>
      </div>
      <label className="ios-field">
        <span>
          Horas de sueño: <b>{f.sleep} h</b>
        </span>
        <input type="range" min={0} max={12} step={0.5} value={f.sleep} onChange={(e) => setF({ ...f, sleep: Number(e.target.value) })} style={{ padding: 0, accentColor: "var(--purple)" }} />
      </label>
      {scale("energy", "Energía", "muy baja", "muy alta")}
      {scale("soreness", "Molestias musculares", "ninguna", "muy altas")}
      {scale("stress", "Estrés", "bajo", "muy alto")}
      <div className="ios-group">
        <div className="ios-row">
          <span className="ios-row-main">
            <b>Dolor o síntomas</b>
            <small>Articular, mareo, migraña… KOVA no propondrá intensidad</small>
          </span>
          <Toggle checked={f.pain} onChange={(v) => setF({ ...f, pain: v })} label="Dolor o síntomas" />
        </div>
      </div>
      <button className="k-btn primary block">Guardar check-in</button>
    </form>
  );
}

export function ImportPlan({ save, notice }: { save: (pl: Plan) => void; notice: (s: string) => void }) {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState("");
  const [preview, setPreview] = useState<{ plan: Plan; recognized: boolean } | null>(null);
  const build = (t: string) => {
    try {
      const r = planFromText(t, name || "Plan importado");
      setPreview(r);
    } catch (e) {
      notice(e instanceof Error ? e.message : "No se pudo interpretar el plan");
    }
  };
  return (
    <div className="ios-stack">
      <label className="k-btn tint block" style={{ cursor: "pointer" }}>
        <Upload /> Elegir PDF, Word o texto
        <input
          type="file"
          hidden
          accept=".pdf,.docx,.txt,.md,.json"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try {
              setBusy("Leyendo…");
              const t = await extractFile(f, setBusy);
              setText(t);
              if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
              build(t);
            } catch (err) {
              notice(err instanceof Error ? err.message : "No se pudo leer el archivo");
            } finally {
              setBusy("");
            }
          }}
        />
      </label>
      {busy && <p className="ios-foot">{busy}</p>}
      <label className="ios-field">
        <span>Nombre del programa</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mi plan de verano" />
      </label>
      <label className="ios-field">
        <span>O pega el texto del plan</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} style={{ height: 140, border: 0, borderRadius: 12, background: "var(--ios-fill)", padding: 12, font: "inherit" }} placeholder={"Semana 1\nDía A: …"} />
      </label>
      <button className="k-btn tint block" disabled={text.trim().length < 30} onClick={() => build(text)}>
        Analizar
      </button>
      {preview && (
        <div className="ios-card ios-stack">
          <b>{preview.plan.name}</b>
          <p className="ios-foot">
            {preview.plan.weeks} semanas · {preview.plan.sessions.length} sesiones{preview.recognized ? " · plantilla reconocida" : ""}
          </p>
          <button className="k-btn primary block" disabled={!preview.plan.sessions.length} onClick={() => save(preview.plan)}>
            Guardar y activar
          </button>
        </div>
      )}
      <p className="ios-foot">La lectura se hace en tu dispositivo: el documento no se envía a ningún servidor.</p>
    </div>
  );
}
