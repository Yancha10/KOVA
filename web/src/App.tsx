import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, Dumbbell, Apple } from "lucide-react";
import baseJSON from "../../app/lib/base-plan.json";
import { Plan, Profile, Entry, Session, live, forProfile, sessionDate, dayDiff, today, uid } from "../../app/lib/engine";
import { Movement } from "../../app/lib/movements";
import Nutrition from "../../app/components/Nutrition";
import { Sheet } from "../../app/components/Sheet";
import StopwatchIcon from "../../app/components/Stopwatch";
import { celebrate } from "../../app/lib/fx";
import { useLocalStore } from "./store";
import { GradientDefs, useToast } from "./ui";
import Train from "./screens/Train";
import PlanView, { MovementDetail } from "./screens/PlanView";
import TimerView, { TimerPreset } from "./screens/TimerView";
import ProgressView, { MarkForm } from "./screens/ProgressView";
import ProfileView, { ProfileForm, CheckForm, ImportPlan, applyTheme, readTheme } from "./screens/ProfileView";

const BASE = baseJSON as Plan;
type Route = "train" | "plan" | "timer" | "nutrition" | "progress" | "profile";
const ROUTES: Route[] = ["train", "plan", "timer", "nutrition", "progress", "profile"];
const TITLES: Record<Route, string> = { train: "Entrenar", plan: "Plan", timer: "Cronómetro", nutrition: "Nutrición", progress: "Progreso", profile: "Perfil" };
type SheetState =
  | { type: "move"; m: Movement }
  | { type: "check" }
  | { type: "profile"; edit: boolean }
  | { type: "mark"; metric: string }
  | { type: "import" }
  | { type: "log"; log: Entry }
  | null;

export default function App() {
  const store = useLocalStore();
  const { state, ready, put, putProfile, putPlan, integrate, snapshot, saveError } = store;
  const toast = useToast();
  const [route, setRoute] = useState<Route>("train");
  const [activeId, setActiveId] = useState("");
  const [cur, setCur] = useState<string | null>(null);
  const [steps, setSteps] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState<SheetState>(null);
  const [timer, setTimer] = useState<{ preset: TimerPreset | null; key: number; label: string | null; sessionId: string | null }>({ preset: null, key: 0, label: null, sessionId: null });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    applyTheme(readTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => readTheme() === "system" && applyTheme("system");
    media.addEventListener?.("change", on);
    try {
      setActiveId(localStorage.getItem("kova-active-local") || "");
    } catch {
      /* sin almacenamiento */
    }
    const h = location.hash.slice(1) as Route;
    if (ROUTES.includes(h)) setRoute(h);
    const onHash = () => {
      const r = location.hash.slice(1) as Route;
      if (ROUTES.includes(r)) setRoute(r);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      media.removeEventListener?.("change", on);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  const go = useCallback((r: Route) => {
    setRoute(r);
    setSheet(null);
    try {
      history.replaceState(null, "", "#" + r);
    } catch {
      /* sin historial */
    }
    document.querySelector(".k-view")?.scrollTo({ top: 0 });
  }, []);

  const profiles = live(state.profiles);
  const p = profiles.find((x) => x.id === activeId) || profiles[0];
  const plans = useMemo(() => [BASE, ...live(state.plans)], [state.plans]);
  const plan = plans.find((x) => x.id === p?.planId) || BASE;
  const logs = p ? forProfile(state.logs, p.id) : [];
  const planIds = new Set(plan.sessions.map((s) => s.id));
  const done = new Set(logs.filter((l) => l.sessionId && planIds.has(l.sessionId)).map((l) => l.sessionId as string));
  const ordered = p ? [...plan.sessions].sort((a, b) => sessionDate(p, a).localeCompare(sessionDate(p, b))) : [];
  const next = ordered.find((s) => !done.has(s.id) && dayDiff(sessionDate(p, s), today()) >= 0) || ordered.find((s) => !done.has(s.id)) || ordered[ordered.length - 1];
  const session: Session | undefined = (cur && plan.sessions.find((s) => s.id === cur)) || next;

  const notice = toast.show;
  if (!ready || !p || !session)
    return (
      <div className="k-loading">
        <span className="k-logo" style={{ margin: "0 auto" }}>
          k
        </span>
        Preparando tu espacio…
      </div>
    );

  const startTimer = (preset: TimerPreset, label: string) => {
    setTimer((t) => ({ preset, key: t.key + 1, label, sessionId: session.id }));
    go("timer");
  };
  const tabs: [Route, string, React.ReactNode][] = [
    ["train", "Entrenar", <Dumbbell key="t" />],
    ["plan", "Plan", <CalendarDays key="p" />],
    ["timer", "Cronómetro", null],
    ["nutrition", "Nutrición", <Apple key="n" />],
    ["progress", "Progreso", <BarChart3 key="g" />],
  ];

  return (
    <>
      <GradientDefs />
      <header className="k-top">
        <div className="k-top-in">
          <div className="k-brand">
            <span className="k-logo" aria-hidden="true">
              k
            </span>
            <span className="k-title">{route === "train" ? "KOVA" : TITLES[route]}</span>
          </div>
          <button className="k-chip" aria-label={"Perfil de " + p.name} onClick={() => go("profile")}>
            <span className="k-avatar">{p.name.charAt(0).toUpperCase()}</span>
            <span>{p.name}</span>
          </button>
        </div>
      </header>
      <main className={"k-view" + (route === "timer" ? " noscroll" : "")}>
        {route === "train" && (
          <Train
            state={state}
            p={p}
            plan={plan}
            session={session}
            done={done}
            pick={setCur}
            step={steps[session.id] ?? 0}
            setStep={(n) => setSteps((s) => ({ ...s, [session.id]: n }))}
            draft={drafts[session.id] || ""}
            saveLog={(e) => {
              put("logs", e);
              setDrafts((d) => ({ ...d, [session.id]: "" }));
              celebrate(140);
              const nx = ordered.find((s) => s.id !== session.id && !done.has(s.id));
              setCur(null);
              if (nx) setSteps((s) => ({ ...s, [nx.id]: 0 }));
              notice(nx ? `¡Guardada! Siguiente: ${nx.title}` : "¡Programa completado!");
              document.querySelector(".k-view")?.scrollTo({ top: 0 });
            }}
            openCheck={() => setSheet({ type: "check" })}
            openMove={(m) => setSheet({ type: "move", m })}
            startTimer={startTimer}
          />
        )}
        {route === "plan" && (
          <PlanView
            state={state}
            p={p}
            plan={plan}
            plans={plans}
            done={done}
            next={next?.id || null}
            train={(id) => {
              setCur(id);
              go("train");
            }}
            openMove={(m) => setSheet({ type: "move", m })}
            activate={(id) => {
              putProfile({ ...p, planId: id, updatedAt: Date.now() });
              setCur(null);
              notice("Programa activado. Tu historial se conserva.");
            }}
            removePlan={(pl) => {
              if (confirm(`¿Borrar el programa «${pl.name}»? Tus registros se conservan.`)) putPlan({ ...pl, _deleted: true, updatedAt: Date.now() });
            }}
            importPlan={() => setSheet({ type: "import" })}
          />
        )}
        <TimerView
          visible={route === "timer"}
          preset={timer.preset}
          presetKey={timer.key}
          originLabel={timer.label}
          clearOrigin={() => setTimer((t) => ({ ...t, label: null, sessionId: null }))}
          onRunning={setRunning}
          onResult={(text) => {
            const sid = timer.sessionId;
            if (sid) {
              setDrafts((d) => ({ ...d, [sid]: text }));
              const s = plan.sessions.find((x) => x.id === sid);
              if (s) {
                setCur(sid);
                setSteps((st) => ({ ...st, [sid]: s.blocks.length }));
              }
            }
            setTimer((t) => ({ ...t, label: null, sessionId: null }));
            go("train");
            notice("Resultado listo: revisa y guarda la sesión");
          }}
        />
        {route === "nutrition" && (
          <section className="k-page">
            <Nutrition state={state} p={p} save={(e) => put("nutrition", e)} notice={notice} celebrate={() => celebrate()} />
          </section>
        )}
        {route === "progress" && (
          <ProgressView
            state={state}
            p={p}
            plan={plan}
            done={done}
            put={put}
            notice={notice}
            addMark={(metric) => setSheet({ type: "mark", metric })}
            editLog={(log) => setSheet({ type: "log", log })}
          />
        )}
        {route === "profile" && (
          <ProfileView
            state={state}
            p={p}
            profiles={profiles}
            switchTo={(id) => {
              setActiveId(id);
              setCur(null);
              try {
                localStorage.setItem("kova-active-local", id);
              } catch {
                /* sin almacenamiento */
              }
              notice("Entrena: " + (profiles.find((x) => x.id === id)?.name || ""));
            }}
            editProfile={() => setSheet({ type: "profile", edit: true })}
            addProfile={() => setSheet({ type: "profile", edit: false })}
            snapshot={snapshot}
            integrate={(s) => integrate(s)}
            notice={notice}
          />
        )}
      </main>
      <nav className="k-tabs" aria-label="Secciones">
        <div className="k-tabs-in">
          {tabs.map(([r, label, icon]) =>
            r === "timer" ? (
              <button key={r} className={"k-tab dock-clock" + (route === r ? " active" : "") + (running ? " running" : "")} aria-label="Cronómetro" aria-current={route === r ? "page" : undefined} onClick={() => go(r)}>
                <span className="clock-orb">
                  <StopwatchIcon />
                </span>
              </button>
            ) : (
              <button key={r} className={"k-tab" + (route === r ? " on" : "")} aria-current={route === r ? "page" : undefined} onClick={() => go(r)}>
                {icon}
                {label}
              </button>
            ),
          )}
        </div>
      </nav>
      {sheet?.type === "move" && (
        <Sheet title={sheet.m.name} close={() => setSheet(null)}>
          <MovementDetail m={sheet.m} />
        </Sheet>
      )}
      {sheet?.type === "check" && (
        <Sheet title="¿Cómo llegas hoy?" close={() => setSheet(null)}>
          <CheckForm
            p={p}
            previous={state.checks.find((c) => !c._deleted && c.profileId === p.id && c.date === today())}
            save={(e) => {
              put("checks", e);
              setSheet(null);
              notice("Check-in guardado: la sesión se ajusta a cómo llegas");
            }}
          />
        </Sheet>
      )}
      {sheet?.type === "profile" && (
        <Sheet title={sheet.edit ? "Editar " + p.name : "Nuevo atleta"} close={() => setSheet(null)}>
          <ProfileForm
            initial={sheet.edit ? p : null}
            plans={plans}
            save={(np) => {
              putProfile(np);
              if (!sheet.edit) {
                setActiveId(np.id);
                try {
                  localStorage.setItem("kova-active-local", np.id);
                } catch {
                  /* sin almacenamiento */
                }
              }
              setSheet(null);
              notice(sheet.edit ? "Perfil guardado" : `¡Bienvenido, ${np.name}!`);
            }}
          />
        </Sheet>
      )}
      {sheet?.type === "mark" && (
        <Sheet title="Nueva evaluación" close={() => setSheet(null)}>
          <MarkForm
            p={p}
            metric={sheet.metric}
            save={(e) => {
              put("marks", e);
              setSheet(null);
              notice("Evaluación guardada: tus dosis se recalculan");
            }}
          />
        </Sheet>
      )}
      {sheet?.type === "import" && (
        <Sheet title="Importar un plan" close={() => setSheet(null)}>
          <ImportPlan
            notice={notice}
            save={(pl) => {
              if (live(state.plans).length >= 30) {
                notice("Máximo 30 programas guardados. Borra alguno antes.");
                return;
              }
              const plan2 = { ...pl, id: pl.id || uid(), updatedAt: Date.now() };
              putPlan(plan2);
              putProfile({ ...p, planId: plan2.id, updatedAt: Date.now() });
              setSheet(null);
              setCur(null);
              notice("Programa importado y activado");
            }}
          />
        </Sheet>
      )}
      {sheet?.type === "log" && (
        <Sheet title="Editar registro" close={() => setSheet(null)}>
          <EditLog
            log={sheet.log}
            save={(e) => {
              put("logs", e);
              setSheet(null);
              notice("Registro actualizado");
            }}
          />
        </Sheet>
      )}
      {saveError && <div className="k-toast show">{saveError}</div>}
      {toast.node}
    </>
  );
}

function EditLog({ log, save }: { log: Entry; save: (e: Entry) => void }) {
  const [f, setF] = useState({ title: String(log.title || ""), minutes: String(log.minutes || 60), rpe: Number(log.rpe || 7), score: String(log.score || ""), note: String(log.note || ""), date: String(log.date) });
  const valid = f.title.trim() && Number(f.minutes) >= 1 && Number(f.minutes) <= 300;
  return (
    <form
      className="ios-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) save({ ...log, ...f, title: f.title.slice(0, 120), minutes: Number(f.minutes), updatedAt: Date.now() });
      }}
    >
      <label className="ios-field">
        <span>Título</span>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      </label>
      <div className="ios-grid2">
        <label className="ios-field">
          <span>Minutos</span>
          <input inputMode="numeric" value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value.replace(/\D/g, "") })} />
        </label>
        <label className="ios-field">
          <span>Fecha</span>
          <input type="date" value={f.date} max={today()} onChange={(e) => setF({ ...f, date: e.target.value || f.date })} />
        </label>
      </div>
      <div className="k-rpe">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button type="button" key={n} aria-pressed={f.rpe === n} onClick={() => setF({ ...f, rpe: n })}>
            {n}
          </button>
        ))}
      </div>
      <label className="ios-field">
        <span>Resultado</span>
        <input value={f.score} onChange={(e) => setF({ ...f, score: e.target.value })} />
      </label>
      <label className="ios-field">
        <span>Notas</span>
        <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </label>
      <button className="k-btn primary block" disabled={!valid}>
        Guardar
      </button>
    </form>
  );
}
