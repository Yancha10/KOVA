import React from "react";
import { ArrowRight, Dumbbell, Flame, HeartPulse, Play, Timer, Droplets, Sparkles, Trophy } from "lucide-react";
import { Store, Profile, Plan, Session, forProfile, markMeta, readiness, today, localDate, dayDiff, sessionDate } from "../../../app/lib/engine";
import { groupRecords, unitSuffix } from "../../../app/lib/records";
import { nutritionOf, waterGoal, trainedOn } from "../../../app/lib/nutrition";
import { CountUp } from "../live";
import { weekStreak } from "../extras";
import { est1RM } from "../library";

const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;

export function athleteScores(state: Store, p: Profile) {
  const marks = forProfile(state.marks, p.id);
  const last = (k: string) => {
    const m = marks.filter((x) => x.metric === k).sort((a, b) => a.date.localeCompare(b.date));
    return m.length ? Number(m[m.length - 1].value) : null;
  };
  const goalPct = (k: string) => {
    const v = last(k), meta = markMeta[k];
    if (v === null || !meta) return null;
    return Math.min(100, meta.lower ? (meta.goal / Math.max(1, v)) * 100 : (v / meta.goal) * 100);
  };
  const avg = (xs: (number | null)[]) => {
    const v = xs.filter((x): x is number => x !== null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const logs = forProfile(state.logs, p.id);
  const from28 = iso(new Date(Date.now() - 27 * 864e5));
  const recent = logs.filter((l) => l.date >= from28);
  const n = nutritionOf(state, p.id);
  const bw = n.plan?.weight || null;
  const recs = groupRecords((state.records || []).filter((r) => r.profileId === p.id && r.unit === "kg"));
  const lift = (names: string[]) => {
    const g = recs.find((r) => names.includes(r.name));
    return g ? Number(String(g.best.value).replace(",", ".")) : null;
  };
  const strengthLogs = recent.filter((l) => l.kind === "strength");
  const sq = lift(["Back squat"]), dl = lift(["Deadlift"]), cl = lift(["Clean", "Power clean", "Squat clean", "Clean & jerk"]);
  const strength = bw
    ? avg([sq !== null ? Math.min(100, (sq / (1.5 * bw)) * 100) : null, dl !== null ? Math.min(100, (dl / (2 * bw)) * 100) : null, cl !== null ? Math.min(100, (cl / bw) * 100) : null])
    : Math.min(100, recs.length * 12 + strengthLogs.length * 8);
  const condMin = recent.reduce((a, l) => a + (Number(l.minutes) || 0), 0);
  const engine = avg([goalPct("row"), Math.min(100, (condMin / 600) * 100)]);
  const checks = forProfile(state.checks, p.id).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const rec = checks.length ? avg(checks.map((c) => readiness(c))) : 0;
  const days = n.days.filter((d) => d.date >= iso(new Date(Date.now() - 6 * 864e5)));
  const nut = days.length ? avg(days.map((d) => (Object.values(d.habits || {}).filter(Boolean).length / 8) * 50 + Math.min(1, (d.water || 0) / waterGoal(n.targets, d.train === null ? trainedOn(state, p.id, d.date) : !!d.train)) * 50)) : 0;
  return [
    { k: "Gimnasia", v: Math.round(avg(["pu", "c2b", "ttb", "hsw", "bmu"].map(goalPct))), c: "var(--violet)" },
    { k: "Fuerza", v: Math.round(strength), c: "var(--pink)" },
    { k: "Motor", v: Math.round(engine), c: "var(--blue)" },
    { k: "Constancia", v: Math.round(Math.min(100, (recent.length / 12) * 100)), c: "var(--sun)" },
    { k: "Recuperación", v: Math.round(rec), c: "var(--leaf)" },
    { k: "Nutrición", v: Math.round(nut), c: "var(--olive)" },
  ];
}

function Rings({ rings }: { rings: { v: number; c: string }[] }) {
  return (
    <svg className="k-rings" viewBox="0 0 120 120" aria-hidden="true">
      {rings.map((r, i) => {
        const rad = 52 - i * 13, C = 2 * Math.PI * rad, f = Math.min(1, Math.max(0, r.v));
        return (
          <g key={i}>
            <circle cx="60" cy="60" r={rad} className="trk" stroke={r.c} />
            <circle cx="60" cy="60" r={rad} className="val" stroke={r.c} strokeDasharray={C.toFixed(1)} strokeDashoffset={(C * (1 - f)).toFixed(1)} style={{ animationDelay: i * 0.12 + "s" }} />
          </g>
        );
      })}
    </svg>
  );
}

function Radar({ data }: { data: { k: string; v: number; c: string }[] }) {
  const N = data.length, R = 82, cx = 120, cy = 104;
  const pt = (i: number, r: number) => [cx + r * Math.sin((i / N) * 2 * Math.PI), cy - r * Math.cos((i / N) * 2 * Math.PI)];
  const poly = data.map((d, i) => pt(i, (Math.max(6, d.v) / 100) * R).map((x) => x.toFixed(1)).join(",")).join(" ");
  return (
    <svg className="k-radar" viewBox="-40 -4 320 218" role="img" aria-label={"Perfil atleta: " + data.map((d) => `${d.k} ${d.v}`).join(", ")}>
      <defs>
        <linearGradient id="k-radar-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--sun)" />
          <stop offset=".5" stopColor="var(--violet)" />
          <stop offset="1" stopColor="var(--blue)" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <polygon key={k} className="ring" points={data.map((_, i) => pt(i, R * k).map((x) => x.toFixed(1)).join(",")).join(" ")} />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} className="axis" x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <polygon className="area" points={poly} />
      {data.map((d, i) => {
        const [x, y] = pt(i, (Math.max(6, d.v) / 100) * R);
        const [lx, ly] = pt(i, R + 16);
        return (
          <g key={d.k}>
            <circle cx={x} cy={y} r="4.5" fill={d.c} stroke="var(--paper)" strokeWidth="2" />
            <text x={lx} y={ly} textAnchor={lx < cx - 4 ? "end" : lx > cx + 4 ? "start" : "middle"} dominantBaseline="middle">
              {d.k} {d.v}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Home({
  state,
  p,
  plan,
  next,
  done,
  go,
  act,
}: {
  state: Store;
  p: Profile;
  plan: Plan;
  next: Session;
  done: Set<string>;
  go: (r: "train" | "progress" | "nutrition") => void;
  act: (a: "wod" | "strength" | "mobility" | "check" | "water" | "timer" | "box") => void;
}) {
  const h = new Date().getHours();
  const hello = h < 6 ? "Buenas noches" : h < 13 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
  const logs = forProfile(state.logs, p.id);
  const monday = (() => {
    const x = localDate(today());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return x;
  })();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const s = iso(d);
    return { s, l: "LMXJVSD"[i], m: logs.filter((x) => x.date === s).reduce((a, x) => a + (Number(x.minutes) || 0), 0) };
  });
  const weekLogs = logs.filter((l) => l.date >= week[0].s && l.date <= today());
  const weekMin = week.reduce((a, d) => a + d.m, 0);
  const n = nutritionOf(state, p.id);
  const day = n.days.find((d) => d.date === today());
  const wGoal = waterGoal(n.targets, trainedOn(state, p.id, today()));
  const water = day?.water || 0;
  const check = forProfile(state.checks, p.id).find((c) => c.date === today());
  const ready = check ? readiness(check) : null;
  const streak = weekStreak(logs.map((l) => l.date));
  const scores = athleteScores(state, p);
  const level = Math.round(scores.reduce((a, s) => a + s.v, 0) / scores.length);
  const recs = groupRecords((state.records || []).filter((r) => r.profileId === p.id)).slice(0, 3);
  const nd = sessionDate(p, next), diff = dayDiff(nd, today()), isDone = done.has(next.id);
  const maxM = Math.max(30, ...week.map((d) => d.m));
  return (
    <section className="k-page">
      <div className="k-hero k-home-hero">
        <div className="k-home-top">
          <div className="k-grow">
            <p className="k-kicker">{localDate(today()).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="k-h1">
              {hello},<br />
              {p.name === "Mi perfil" ? "atleta" : p.name}
            </h1>
            <div className="k-ring-legend">
              <span>
                <i style={{ background: "var(--violet)" }} />
                {weekLogs.length}/3 entrenos
              </span>
              <span>
                <i style={{ background: "var(--blue)" }} />
                {weekMin}/180 min
              </span>
              <span>
                <i style={{ background: "var(--leaf)" }} />
                {(water / 1000).toFixed(1).replace(".", ",")}/{(wGoal / 1000).toFixed(1).replace(".", ",")} L
              </span>
            </div>
          </div>
          <Rings rings={[{ v: weekLogs.length / 3, c: "var(--violet)" }, { v: weekMin / 180, c: "var(--blue)" }, { v: water / wGoal, c: "var(--leaf)" }]} />
        </div>
      </div>

      <button className="k-next" onClick={() => go("train")}>
        <span className="k-next-badge">{isDone ? "✓" : diff === 0 ? "HOY" : diff < 0 ? "PEND." : diff === 1 ? "MAÑ." : localDate(nd).toLocaleDateString("es-ES", { weekday: "short" }).toUpperCase()}</span>
        <span className="k-grow">
          <small>
            Semana {next.week} · día {next.day} · {next.duration} min
          </small>
          <b>{next.title}</b>
          <em>{next.blocks.map((b) => b.title).slice(1, 4).join(" · ")}</em>
        </span>
        <ArrowRight />
      </button>

      <div className="k-quick">
        <button onClick={() => act("wod")}>
          <span className="ic" style={{ background: "linear-gradient(140deg,var(--sun),#FF9F6E)" }}>
            <Flame />
          </span>
          Registrar WOD
        </button>
        <button onClick={() => act("strength")}>
          <span className="ic" style={{ background: "linear-gradient(140deg,var(--pink),var(--violet))" }}>
            <Dumbbell />
          </span>
          Fuerza
        </button>
        <button onClick={() => act("timer")}>
          <span className="ic" style={{ background: "linear-gradient(140deg,var(--violet),var(--blue))" }}>
            <Timer />
          </span>
          Cronómetro
        </button>
        <button onClick={() => act("box")}>
          <span className="ic" style={{ background: "linear-gradient(140deg,var(--olive),var(--leaf))" }}>
            <Play />
          </span>
          Modo box
        </button>
        <button onClick={() => act("mobility")}>
          <span className="ic" style={{ background: "linear-gradient(140deg,var(--sky),var(--leaf))" }}>
            <Sparkles />
          </span>
          Movilidad
        </button>
        <button onClick={() => act("water")}>
          <span className="ic" style={{ background: "linear-gradient(140deg,var(--sky),var(--blue))" }}>
            <Droplets />
          </span>
          +500 ml
        </button>
      </div>

      <div className="k-duo">
        <button className="k-mini" onClick={() => act("check")}>
          <HeartPulse />
          <b>{ready !== null ? <CountUp value={ready} /> : "—"}</b>
          <small>{ready === null ? "Haz tu check-in" : ready >= 65 ? "Recuperación alta" : ready >= 45 ? "Recuperación media" : "Recuperación baja"}</small>
        </button>
        <div className="k-mini">
          <span style={{ fontSize: 22 }}>⚡</span>
          <b>
            <CountUp value={streak} />
          </b>
          <small>{streak === 1 ? "semana seguida" : "semanas seguidas"}</small>
        </div>
      </div>

      <div className="k-card">
        <div className="k-row" style={{ justifyContent: "space-between" }}>
          <h3 className="ios-section" style={{ margin: 0 }}>
            Tu semana
          </h3>
          <span className="k-small k-muted">{weekMin} min</span>
        </div>
        <div className="k-weekbars">
          {week.map((d) => (
            <div key={d.s} className={d.s === today() ? "today" : ""}>
              <span className="bar">
                <i style={{ height: (d.m / maxM) * 100 + "%" }} />
              </span>
              <small>{d.l}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="k-card">
        <div className="k-row" style={{ justifyContent: "space-between" }}>
          <h3 className="ios-section" style={{ margin: 0 }}>
            Tu perfil atleta
          </h3>
          <span className="k-level">Nivel {level}</span>
        </div>
        <Radar data={scores} />
        <p className="ios-foot">Se calcula con tus evaluaciones, récords de fuerza, minutos de entreno, check-ins y hábitos. Cuanto más registres, más preciso.</p>
      </div>

      {recs.length > 0 && (
        <button className="k-card k-recs" onClick={() => go("progress")}>
          <h3 className="ios-section" style={{ margin: "0 0 6px" }}>
            <Trophy size={14} /> Últimos récords
          </h3>
          {recs.map((r) => (
            <div key={r.name + r.unit} className="k-row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
              <span>{r.name}</span>
              <b>
                {r.best.value}
                {unitSuffix(r.unit)}
              </b>
            </div>
          ))}
        </button>
      )}
    </section>
  );
}
export { est1RM };
