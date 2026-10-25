"use client";
import React, { useMemo, useState } from "react";
import { Download, Sparkles } from "lucide-react";
import { Store, Profile, Plan, today, addDays, localDate, forProfile, markMeta, readiness, coachAdvice } from "../lib/engine";
import { groupRecords, unitSuffix } from "../lib/records";
import { nutritionOf, waterGoal, trainedOn } from "../lib/nutrition";
import { LineChartSVG } from "./Sheet";

const fmt = (d: string) => localDate(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

type Advice = { icon: string; title: string; text: string };

export function buildReport(state: Store, p: Profile, plan: Plan, done: Set<unknown>) {
  const logs = forProfile(state.logs, p.id).sort((a, b) => a.date.localeCompare(b.date));
  const checks = forProfile(state.checks, p.id).sort((a, b) => a.date.localeCompare(b.date));
  const marks = forProfile(state.marks, p.id).sort((a, b) => a.date.localeCompare(b.date));
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = addDays(today(), -(7 - i) * 7), start = addDays(end, -6);
    const ls = logs.filter((l) => l.date >= start && l.date <= end);
    return { label: fmt(end), sessions: ls.length, load: ls.reduce((a, l) => a + (+l.minutes || 0) * (+l.rpe || 0), 0), minutes: ls.reduce((a, l) => a + (+l.minutes || 0), 0) };
  });
  const recent = logs.slice(-20);
  const avgRpe = recent.length ? recent.reduce((a, l) => a + (+l.rpe || 0), 0) / recent.length : null;
  const last4 = weeks.slice(-4), prev4 = weeks.slice(0, 4);
  const sessionsLast4 = last4.reduce((a, w) => a + w.sessions, 0);
  const n = nutritionOf(state, p.id);
  const week7 = Array.from({ length: 7 }, (_, i) => addDays(today(), -i));
  const days = n.days.filter((d) => week7.includes(d.date));
  const waterPct = days.length ? days.reduce((a, d) => a + Math.min(1.2, (d.water || 0) / waterGoal(n.targets, d.train === null ? trainedOn(state, p.id, d.date) : !!d.train)), 0) / days.length : null;
  const protAvg = days.filter((d) => d.protein > 0).length ? days.filter((d) => d.protein > 0).reduce((a, d) => a + d.protein, 0) / days.filter((d) => d.protein > 0).length : null;
  const records = groupRecords((state.records || []).filter((r) => r.profileId === p.id));
  const advice: Advice[] = [];
  if (!logs.length) advice.push({ icon: "🚀", title: "Empieza por registrar", text: "Cada sesión que guardas alimenta las gráficas, la carga semanal y los consejos de este informe." });
  if (logs.length && sessionsLast4 < 8) advice.push({ icon: "📅", title: "Gana constancia", text: `Llevas ${sessionsLast4} sesiones en 4 semanas. Fija 3 días a la semana; si fallas una semana, repítela en lugar de saltarla.` });
  if (sessionsLast4 >= 12) advice.push({ icon: "🔥", title: "Constancia excelente", text: `${sessionsLast4} sesiones en 4 semanas. Es lo que más pesa en el progreso.` });
  if (avgRpe !== null && avgRpe >= 8.3) advice.push({ icon: "🌙", title: "Esfuerzo muy alto", text: `Tus últimas sesiones promedian RPE ${avgRpe.toFixed(1)}. Deja los metcons en 7-8 o adelanta una semana de descarga para llegar fresco a la técnica.` });
  if (avgRpe !== null && avgRpe <= 5.5 && recent.length >= 5) advice.push({ icon: "⬆️", title: "Hay margen para apretar", text: `RPE medio ${avgRpe.toFixed(1)}: sube cargas o repeticiones en los bloques de motor.` });
  const loadNow = last4.reduce((a, w) => a + w.load, 0), loadPrev = prev4.reduce((a, w) => a + w.load, 0);
  if (loadPrev > 0 && loadNow > loadPrev * 1.3) advice.push({ icon: "⚠️", title: "La carga sube rápido", text: `Tu carga de 4 semanas ha subido un ${Math.round((loadNow / loadPrev - 1) * 100)} %. Vigila hombros, codos y manos.` });
  const latest = (k: string) => [...marks].reverse().find((m) => m.metric === k);
  const pu = latest("pu"), c2b = latest("c2b"), ttb = latest("ttb"), hsw = latest("hsw");
  if (!marks.length) advice.push({ icon: "🎯", title: "Haz tus evaluaciones", text: "Registra pull-ups, C2B, T2B y handstand walk en Progreso → Marcas para calcular tus dosis y ver tu evolución aquí." });
  if (pu && +pu.value < markMeta.pu.goal) advice.push({ icon: "🌀", title: "Pull-ups", text: `Tu última serie limpia es de ${pu.value}. Trabaja series del 40-60 % (${Math.max(2, Math.round(+pu.value * 0.5))} reps) con ritmo perfecto.` });
  if (ttb && +ttb.value < markMeta.ttb.goal) advice.push({ icon: "🦶", title: "Toes to bar", text: `${ttb.value} seguidos. Prioriza el kip swing y el hollow; en metcons parte en series de ${Math.max(2, Math.round(+ttb.value * 0.5))}.` });
  if (c2b && pu && +c2b.value >= 3 && +pu.value >= 5) advice.push({ icon: "🚀", title: "Base para el bar muscle-up", text: "Tienes 5 pull-ups y 3 C2B. Revisa con tu coach la transición y los fondos antes de intentos libres." });
  if (hsw && +hsw.value < markMeta.hsw.goal) advice.push({ icon: "🤸", title: "Handstand walk", text: `Vas por ${hsw.value} m. Cinco minutos de kick-ups y holds cada día suman más que una sesión larga a la semana.` });
  if (!n.targets) advice.push({ icon: "🥗", title: "Configura tu nutrición", text: "Con tu peso y tu objetivo calculo calorías, proteína e hidratación para días de entreno y de descanso." });
  if (n.targets && protAvg !== null && protAvg < n.targets.protein * 0.8) advice.push({ icon: "🍳", title: "Proteína baja", text: `Media de ${Math.round(protAvg)} g frente a ${n.targets.protein} g. Añade una toma: yogur griego o queso fresco batido.` });
  if (waterPct !== null && waterPct < 0.75) advice.push({ icon: "💧", title: "Bebe más", text: "Esta semana te quedas por debajo del 75 % del agua objetivo. Bebe 500 ml en las 2 h antes de entrenar." });
  const lastCheck = checks[checks.length - 1];
  if (lastCheck && readiness(lastCheck) !== null && (readiness(lastCheck) as number) < 50) advice.push({ icon: "😴", title: "Recuperación baja", text: "Tu último check-in sale bajo. Prioriza el sueño y reduce la dosis de gimnasia ese día." });
  const coach = coachAdvice(state, p).map((c) => ({ icon: "🧭", title: c.title, text: c.text }));
  return { logs, checks, marks, weeks, avgRpe, sessionsLast4, n, waterPct, protAvg, records, advice, coach, done: done.size, total: plan.sessions.length };
}

const metricKeys = Object.keys(markMeta);

export default function Report({ state, p, plan, done }: { state: Store; p: Profile; plan: Plan; done: Set<unknown> }) {
  const r = useMemo(() => buildReport(state, p, plan, done), [state, p, plan, done]);
  const [view, setView] = useState("marks");
  const [metric, setMetric] = useState(metricKeys[0]);
  const ms = r.marks.filter((m) => m.metric === metric);
  const charts: Record<string, React.ReactNode> = {
    marks: (
      <>
        <div className="ios-seg scroll small" role="group" aria-label="Movimiento">
          {metricKeys.map((k) => (
            <button key={k} aria-pressed={metric === k} onClick={() => setMetric(k)}>
              {markMeta[k].name}
            </button>
          ))}
        </div>
        <LineChartSVG
          label={"Evolución de " + markMeta[metric].name}
          series={[{ name: markMeta[metric].name, color: "var(--green)", points: ms.map((m, i) => ({ x: i, y: +m.value, title: `${fmt(m.date)}: ${m.value} ${markMeta[metric].unit}` })) }]}
          invert={!!markMeta[metric].lower}
        />
        {ms.length > 0 && (
          <p className="ios-foot">
            Objetivo: {markMeta[metric].goal} {markMeta[metric].unit} · última: {ms[ms.length - 1].value} {markMeta[metric].unit}
          </p>
        )}
      </>
    ),
    sessions: (
      <LineChartSVG
        label="Sesiones por semana"
        labels={r.weeks.map((w, i) => (i % 2 ? "" : w.label))}
        series={[{ name: "Sesiones", color: "var(--pink)", points: r.weeks.map((w, i) => ({ x: i, y: w.sessions, title: `Semana del ${w.label}: ${w.sessions}` })) }]}
      />
    ),
    load: (
      <LineChartSVG
        label="Carga semanal"
        labels={r.weeks.map((w, i) => (i % 2 ? "" : w.label))}
        series={[{ name: "Carga (min × RPE)", color: "var(--purple)", points: r.weeks.map((w, i) => ({ x: i, y: w.load, title: `${w.label}: ${w.load}` })) }]}
      />
    ),
    rpe: (
      <LineChartSVG
        label="Esfuerzo por sesión"
        series={[{ name: "RPE", color: "var(--green)", points: r.logs.slice(-20).map((l, i) => ({ x: i, y: +l.rpe, title: `${fmt(l.date)} · ${l.title}: RPE ${l.rpe}` })) }]}
      />
    ),
    recovery: (
      <LineChartSVG
        label="Recuperación"
        series={[{ name: "Recuperación", color: "#6dbb94", points: r.checks.slice(-20).map((c, i) => ({ x: i, y: readiness(c) || 0, title: `${fmt(c.date)}: ${readiness(c)}` })) }]}
      />
    ),
    weight: (
      <LineChartSVG
        label="Peso"
        series={[{ name: "Peso", color: "var(--green)", points: r.n.weights.map((w, i) => ({ x: i, y: +w.kg, title: `${fmt(w.date)}: ${w.kg} kg` })) }]}
      />
    ),
  };
  return (
    <div className="ios-stack report-view">
      <div className="ios-report-hero">
        <span className="ios-kicker">Informe de {p.name} · {localDate(today()).toLocaleDateString("es-ES", { day: "numeric", month: "long" })}</span>
        <h2>Tu progreso, en un documento vivo</h2>
        <p>Se actualiza con cada sesión, check-in, marca, récord y dato de nutrición que guardas.</p>
      </div>
      <div className="ios-stats four">
        <div>
          <b>
            {r.done}/{r.total}
          </b>
          <small>sesiones del plan</small>
        </div>
        <div>
          <b>{r.sessionsLast4}</b>
          <small>entrenos en 4 semanas</small>
        </div>
        <div>
          <b>{r.avgRpe ? r.avgRpe.toFixed(1).replace(".", ",") : "–"}</b>
          <small>RPE medio reciente</small>
        </div>
        <div>
          <b>{r.records.length}</b>
          <small>récords</small>
        </div>
      </div>
      <div className="ios-card ios-stack">
        <div className="ios-seg scroll" role="group" aria-label="Gráfica">
          {[
            ["marks", "Marcas"],
            ["sessions", "Sesiones"],
            ["load", "Carga"],
            ["rpe", "Esfuerzo"],
            ["recovery", "Recuperación"],
            ["weight", "Peso"],
          ].map(([k, l]) => (
            <button key={k} aria-pressed={view === k} onClick={() => setView(k)}>
              {l}
            </button>
          ))}
        </div>
        {charts[view]}
      </div>
      <div className="ios-card">
        <h3 className="ios-section">
          <Sparkles size={14} /> Consejos de progresión
        </h3>
        {[...r.advice, ...r.coach.slice(0, 2)].map((a, i) => (
          <div className="ios-advice" key={i}>
            <span>{a.icon}</span>
            <div>
              <b>{a.title}</b>
              <p>{a.text}</p>
            </div>
          </div>
        ))}
      </div>
      {r.records.length > 0 && (
        <div className="ios-card">
          <h3 className="ios-section">Mejores marcas</h3>
          <table className="ios-table">
            <tbody>
              {r.records.slice(0, 8).map((g) => (
                <tr key={g.name + g.unit}>
                  <td>{g.name}</td>
                  <td>
                    <b>
                      {g.best.value}
                      {unitSuffix(g.unit)}
                    </b>
                  </td>
                  <td>{fmt(g.best.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.n.targets && (
        <div className="ios-card">
          <h3 className="ios-section">Nutrición</h3>
          <div className="ios-macros">
            <div>
              <b>{r.n.targets.trainKcal}</b>
              <small>kcal día de entreno</small>
            </div>
            <div>
              <b>{r.protAvg ? Math.round(r.protAvg) : "–"}</b>
              <small>g proteína media / {r.n.targets.protein}</small>
            </div>
            <div>
              <b>{r.waterPct !== null ? Math.round(r.waterPct * 100) + " %" : "–"}</b>
              <small>del agua objetivo</small>
            </div>
          </div>
        </div>
      )}
      <button className="ios-btn primary block" onClick={() => downloadReport(state, p, plan, done)}>
        <Download size={18} /> Descargar informe completo
      </button>
      <p className="ios-foot center">El informe descargado es un documento HTML con todas las gráficas y tablas. Ábrelo y usa Compartir → Imprimir para guardarlo como PDF.</p>
    </div>
  );
}

function svgLine(points: number[], labels: string[], color: string, invert = false) {
  if (!points.length) return "<p style='color:#888'>Sin datos todavía.</p>";
  const W = 640, H = 200, pl = 36, pb = 22;
  let lo = Math.min(...points), hi = Math.max(...points);
  if (lo === hi) { lo -= 1; hi += 1; }
  const X = (i: number) => pl + (i / Math.max(1, points.length - 1)) * (W - pl - 10);
  const Y = (v: number) => { const k = (v - lo) / (hi - lo); return 10 + (invert ? k : 1 - k) * (H - 10 - pb); };
  const d = points.map((v, i) => (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(v).toFixed(1)).join(" ");
  const grid = [0, 1, 2, 3].map((k) => { const v = lo + ((hi - lo) * k) / 3; return `<line x1="${pl}" x2="${W - 10}" y1="${Y(v)}" y2="${Y(v)}" stroke="#eee"/><text x="0" y="${Y(v) + 3}" font-size="10" fill="#888">${Math.round(v * 10) / 10}</text>`; }).join("");
  const lab = labels.map((l, i) => (l ? `<text x="${X(i)}" y="${H - 4}" font-size="10" fill="#888" text-anchor="middle">${l}</text>` : "")).join("");
  const dots = points.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="4" fill="${color}"/>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${grid}${lab}<path d="${d}" fill="none" stroke="${color}" stroke-width="2.5"/>${dots}</svg>`;
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function reportHTML(state: Store, p: Profile, plan: Plan, done: Set<unknown>) {
  const r = buildReport(state, p, plan, done);
  const sec = (t: string, h: string) => `<section><h2>${t}</h2>${h}</section>`;
  const marksHTML = metricKeys
    .map((k) => {
      const ms = r.marks.filter((m) => m.metric === k);
      if (!ms.length) return "";
      return `<h3>${esc(markMeta[k].name)} · objetivo ${markMeta[k].goal} ${markMeta[k].unit}</h3>${svgLine(ms.map((m) => +m.value), ms.map((m) => fmt(m.date)), "#6d4591", !!markMeta[k].lower)}`;
    })
    .join("");
  const logsHTML = r.logs
    .slice()
    .reverse()
    .map((l) => `<tr><td>${fmt(l.date)}</td><td>${esc(l.title)}</td><td>${esc(l.minutes)}′</td><td>${esc(l.rpe)}</td><td>${esc(l.score || "")}</td><td>${esc(l.note || "")}</td></tr>`)
    .join("");
  const recHTML = r.records.map((g) => `<tr><td>${esc(g.name)}</td><td><b>${esc(g.best.value)}${esc(unitSuffix(g.unit))}</b></td><td>${fmt(g.best.date)}</td><td>${g.entries.length}</td></tr>`).join("");
  const t = r.n.targets;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Informe KOVA · ${esc(p.name)}</title>
<style>body{margin:0;background:#fff;color:#33263f;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}main{max-width:820px;margin:0 auto;padding:32px 20px}header{background:linear-gradient(135deg,#ffe6c9,#f3c5df 55%,#d9c6ef);border-radius:24px;padding:26px}h1{margin:6px 0 2px;font-size:30px}h2{font-size:20px;margin:30px 0 10px}h3{font-size:14px;margin:16px 0 6px;color:#6d4591}.k{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#79657f;font-weight:700}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:16px}.stats div{background:#fffafb;border-radius:14px;padding:12px}.stats b{display:block;font-size:22px}table{border-collapse:collapse;width:100%;font-size:13.5px}th,td{text-align:left;padding:7px 6px;border-bottom:1px solid #eee;vertical-align:top}.adv{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #f3eef5}.adv p{margin:2px 0 0;color:#79657f}@media print{section{break-inside:avoid}}</style></head><body><main>
<header><div class="k">Informe KOVA · ${localDate(today()).toLocaleDateString("es-ES", { dateStyle: "long" })}</div><h1>${esc(p.name)}</h1><div>${esc(plan.name)}</div>
<div class="stats"><div><b>${r.done}/${r.total}</b>sesiones del plan</div><div><b>${r.sessionsLast4}</b>entrenos en 4 semanas</div><div><b>${r.avgRpe ? r.avgRpe.toFixed(1) : "–"}</b>RPE medio</div><div><b>${r.records.length}</b>récords</div></div></header>
${sec("Consejos de progresión", [...r.advice, ...r.coach].map((a) => `<div class="adv"><span>${a.icon}</span><div><b>${esc(a.title)}</b><p>${esc(a.text)}</p></div></div>`).join("") || "<p>Sin datos todavía.</p>")}
${sec("Sesiones por semana", svgLine(r.weeks.map((w) => w.sessions), r.weeks.map((w) => w.label), "#d999bc"))}
${sec("Carga semanal (minutos × RPE)", svgLine(r.weeks.map((w) => w.load), r.weeks.map((w) => w.label), "#9d78bf"))}
${sec("Esfuerzo por sesión", svgLine(r.logs.slice(-20).map((l) => +l.rpe), r.logs.slice(-20).map((l) => fmt(l.date)), "#6d4591"))}
${sec("Recuperación", svgLine(r.checks.slice(-20).map((c) => readiness(c) || 0), r.checks.slice(-20).map((c) => fmt(c.date)), "#6dbb94"))}
${marksHTML ? sec("Evaluaciones", marksHTML) : ""}
${recHTML ? sec("Récords personales", `<table><thead><tr><th>Movimiento</th><th>Mejor</th><th>Fecha</th><th>Marcas</th></tr></thead><tbody>${recHTML}</tbody></table>`) : ""}
${t ? sec("Nutrición", `<p>Día de entreno: <b>${t.trainKcal} kcal</b> · ${t.protein} g proteína · ${t.carbsTrain} g carbohidrato · ${t.fat} g grasa · ${((t.water + 600) / 1000).toFixed(1)} L de agua.<br>Día de descanso: <b>${t.restKcal} kcal</b> · ${t.carbsRest} g carbohidrato · ${(t.water / 1000).toFixed(1)} L de agua.</p><p>Esta semana: proteína media ${r.protAvg ? Math.round(r.protAvg) + " g" : "–"} · agua ${r.waterPct !== null ? Math.round(r.waterPct * 100) + " %" : "–"} del objetivo.</p>${r.n.weights.length ? `<h3>Peso</h3>${svgLine(r.n.weights.map((w) => +w.kg), r.n.weights.map((w) => fmt(w.date)), "#6d4591")}` : ""}<p style="color:#79657f;font-size:13px">Cifras orientativas; no sustituyen a un dietista-nutricionista.</p>`) : ""}
${logsHTML ? sec("Registro de entrenos", `<table><thead><tr><th>Fecha</th><th>Sesión</th><th>Min</th><th>RPE</th><th>Resultado</th><th>Notas</th></tr></thead><tbody>${logsHTML}</tbody></table>`) : ""}
<p style="color:#79657f;font-size:12px;margin-top:30px">Generado con KOVA. Para guardarlo como PDF: Compartir → Imprimir → Guardar en Archivos.</p></main></body></html>`;
}

export function downloadReport(state: Store, p: Profile, plan: Plan, done: Set<unknown>) {
  const html = reportHTML(state, p, plan, done);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  a.download = `informe-kova-${p.name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")}-${today()}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 800);
}
