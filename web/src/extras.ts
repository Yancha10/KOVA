// Logros, tarjeta semanal para compartir y recordatorios en el calendario.
import { Store, Profile, Plan, Session, Entry, forProfile, sessionDate, localDate, today, dayDiff, markMeta } from "../../app/lib/engine";
import { groupRecords } from "../../app/lib/records";
import { nutritionOf } from "../../app/lib/nutrition";

export type Ctx = { state: Store; p: Profile; plan: Plan; done: Set<string> };
export type Badge = { id: string; icon: string; name: string; hint: string; ok: (c: Ctx) => boolean };

const logsOf = (c: Ctx) => forProfile(c.state.logs, c.p.id);
const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
export function weekStreak(dates: string[]) {
  const monday = (d: string) => {
    const x = localDate(d);
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return iso(x);
  };
  const weeks = new Set(dates.map(monday));
  const cur = localDate(monday(today()));
  if (!weeks.has(iso(cur))) cur.setDate(cur.getDate() - 7);
  let n = 0;
  while (weeks.has(iso(cur))) {
    n++;
    cur.setDate(cur.getDate() - 7);
  }
  return n;
}
const best = (c: Ctx, k: string) => {
  const ms = forProfile(c.state.marks, c.p.id).filter((m) => m.metric === k).map((m) => Number(m.value));
  return ms.length ? (markMeta[k]?.lower ? Math.min(...ms) : Math.max(...ms)) : null;
};
const weekFull = (c: Ctx) => {
  const weeks = new Map<number, Session[]>();
  c.plan.sessions.forEach((s) => weeks.set(s.week, [...(weeks.get(s.week) || []), s]));
  return [...weeks.values()].filter((ss) => ss.every((s) => c.done.has(s.id))).length;
};

export const BADGES: Badge[] = [
  { id: "first", icon: "🔥", name: "Primera sesión", hint: "Registra tu primer entreno", ok: (c) => logsOf(c).length >= 1 },
  { id: "check", icon: "💚", name: "Escucha al cuerpo", hint: "Haz tu primer check-in", ok: (c) => forProfile(c.state.checks, c.p.id).length >= 1 },
  { id: "week", icon: "🗓️", name: "Semana redonda", hint: "Completa las 3 sesiones de una semana", ok: (c) => weekFull(c) >= 1 },
  { id: "ten", icon: "💪", name: "10 sesiones", hint: "Llega a 10 entrenos", ok: (c) => logsOf(c).length >= 10 },
  { id: "streak4", icon: "⚡", name: "4 semanas seguidas", hint: "Entrena 4 semanas sin parar", ok: (c) => weekStreak(logsOf(c).map((l) => l.date)) >= 4 },
  { id: "streak8", icon: "🌋", name: "8 semanas seguidas", hint: "Dos meses sin parar", ok: (c) => weekStreak(logsOf(c).map((l) => l.date)) >= 8 },
  { id: "half", icon: "🌗", name: "Mitad del plan", hint: "Completa la mitad de las sesiones", ok: (c) => c.done.size >= c.plan.sessions.length / 2 },
  { id: "all", icon: "🏆", name: "Plan completado", hint: "Termina todas las sesiones", ok: (c) => c.done.size >= c.plan.sessions.length && c.plan.sessions.length > 0 },
  { id: "eval", icon: "🎯", name: "Primera evaluación", hint: "Registra una marca en Progreso → Marcas", ok: (c) => forProfile(c.state.marks, c.p.id).length >= 1 },
  { id: "pu10", icon: "🌀", name: "10 pull-ups", hint: "Serie limpia de 10 pull-ups", ok: (c) => (best(c, "pu") || 0) >= 10 },
  { id: "c2b5", icon: "🎯", name: "5 chest to bar", hint: "Serie limpia de 5 C2B", ok: (c) => (best(c, "c2b") || 0) >= 5 },
  { id: "ttb10", icon: "🦶", name: "10 toes to bar", hint: "Serie limpia de 10 T2B", ok: (c) => (best(c, "ttb") || 0) >= 10 },
  { id: "bmu", icon: "🚀", name: "Primer muscle-up", hint: "Registra al menos 1 BMU", ok: (c) => (best(c, "bmu") || 0) >= 1 },
  { id: "hsw", icon: "🤸", name: "Manos que caminan", hint: "5 m de handstand walk", ok: (c) => (best(c, "hsw") || 0) >= 5 },
  { id: "pr", icon: "⭐", name: "Primer récord", hint: "Guarda un récord personal", ok: (c) => groupRecords((c.state.records || []).filter((r) => r.profileId === c.p.id)).length >= 1 },
  { id: "pr5", icon: "🌟", name: "5 récords", hint: "Récords en 5 movimientos", ok: (c) => groupRecords((c.state.records || []).filter((r) => r.profileId === c.p.id)).length >= 5 },
  { id: "water", icon: "💧", name: "Bien hidratado", hint: "Cumple el objetivo de agua un día", ok: (c) => { const n = nutritionOf(c.state, c.p.id); return n.days.some((d) => (d.water || 0) >= (n.targets ? n.targets.water : 2500)); } },
  { id: "habits", icon: "🥗", name: "Día perfecto", hint: "Cumple los 8 hábitos en un día", ok: (c) => nutritionOf(c.state, c.p.id).days.some((d) => Object.values(d.habits || {}).filter(Boolean).length >= 8) },
  { id: "plan", icon: "🧮", name: "Plan a medida", hint: "Calcula tu plan nutricional", ok: (c) => !!nutritionOf(c.state, c.p.id).plan },
  { id: "early", icon: "🌅", name: "Madrugador", hint: "Entrena antes de las 8:00 (según la hora del registro)", ok: (c) => logsOf(c).some((l) => { const h = new Date(l.updatedAt).getHours(); return h >= 4 && h < 8; }) },
];

export function unlocked(c: Ctx) {
  return BADGES.filter((b) => {
    try {
      return b.ok(c);
    } catch {
      return false;
    }
  }).map((b) => b.id);
}

/* ---------- Resumen semanal para compartir ---------- */
export function weekSummary(c: Ctx) {
  const logs = logsOf(c);
  const from = (() => {
    const x = localDate(today());
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
    return iso(x);
  })();
  const week = logs.filter((l) => l.date >= from && l.date <= today());
  const minutes = week.reduce((a, l) => a + (Number(l.minutes) || 0), 0);
  const rpe = week.length ? week.reduce((a, l) => a + (Number(l.rpe) || 0), 0) / week.length : 0;
  const streak = weekStreak(logs.map((l) => l.date));
  const prs = (c.state.records || []).filter((r) => r.profileId === c.p.id && !r._deleted && r.date >= from).length;
  return { sessions: week.length, minutes, rpe, streak, prs, titles: week.map((l) => String(l.title)), done: c.done.size, total: c.plan.sessions.length };
}

export async function shareWeek(c: Ctx): Promise<"shared" | "downloaded" | "cancelled"> {
  const s = weekSummary(c);
  const W = 1080, H = 1920, cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#FFD25A");
  bg.addColorStop(0.35, "#FF9FB4");
  bg.addColorStop(0.68, "#9D78E0");
  bg.addColorStop(1, "#3E7BEA");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // Sol de franjas
  g.save();
  g.beginPath();
  g.arc(W / 2, 700, 330, Math.PI, 0);
  g.clip();
  const sun = g.createLinearGradient(0, 370, 0, 700);
  sun.addColorStop(0, "#FFF6C8");
  sun.addColorStop(1, "#FFB03A");
  g.fillStyle = sun;
  for (let y = 370; y < 700; y += 34) g.fillRect(W / 2 - 340, y, 680, 34 - Math.max(4, (y - 370) / 14));
  g.restore();
  g.fillStyle = "rgba(30,47,107,.92)";
  g.fillRect(0, 700, W, 6);
  // Rejilla en perspectiva
  g.strokeStyle = "rgba(255,255,255,.35)";
  g.lineWidth = 3;
  for (let i = -10; i <= 10; i++) {
    g.beginPath();
    g.moveTo(W / 2 + i * 60, 706);
    g.lineTo(W / 2 + i * 260, 1000);
    g.stroke();
  }
  for (let k = 0; k < 6; k++) {
    const y = 706 + Math.pow(k / 5, 1.8) * 294;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  const font = (w: number, size: number) => `${w} ${size}px -apple-system, "SF Pro Rounded", "Helvetica Neue", Arial, sans-serif`;
  g.fillStyle = "#24183A";
  g.textAlign = "center";
  g.font = font(800, 54);
  g.fillText("MI SEMANA EN KOVA", W / 2, 180);
  g.font = font(600, 40);
  g.fillText(c.p.name, W / 2, 245);
  const card = (x: number, y: number, w: number, h: number) => {
    g.fillStyle = "rgba(255,255,255,.6)";
    g.beginPath();
    g.roundRect(x, y, w, h, 44);
    g.fill();
  };
  card(80, 1060, 920, 300);
  g.fillStyle = "#24183A";
  g.font = font(900, 190);
  g.fillText(String(s.sessions), W / 2, 1260);
  g.font = font(700, 44);
  g.fillText(s.sessions === 1 ? "sesión esta semana" : "sesiones esta semana", W / 2, 1328);
  const stat = (x: number, val: string, label: string) => {
    card(x, 1400, 290, 230);
    g.fillStyle = "#24183A";
    g.font = font(900, 84);
    g.fillText(val, x + 145, 1515);
    g.font = font(700, 32);
    g.fillText(label, x + 145, 1575);
  };
  stat(80, s.minutes + "′", "minutos");
  stat(395, s.streak + "", s.streak === 1 ? "semana seguida" : "semanas seguidas");
  stat(710, s.rpe ? s.rpe.toFixed(1).replace(".", ",") : "–", "RPE medio");
  g.font = font(700, 36);
  g.fillStyle = "rgba(36,24,58,.85)";
  g.fillText(`${s.done}/${s.total} sesiones del plan${s.prs ? ` · ${s.prs} récord${s.prs > 1 ? "s" : ""} nuevo${s.prs > 1 ? "s" : ""}` : ""}`, W / 2, 1720);
  g.font = font(800, 40);
  g.fillStyle = "#fff";
  g.fillText("KOVA · entrena, mide y progresa", W / 2, 1830);
  const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/png"));
  const file = new File([blob], "mi-semana-kova.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: "Mi semana en KOVA" });
      return "shared";
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return "cancelled";
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 800);
  return "downloaded";
}

/* ---------- Recordatorios en el calendario (.ics) ---------- */
export function calendarFile(c: Ctx, hour: number, minute: number, weeks = 4) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const end = (() => {
    const x = localDate(today());
    x.setDate(x.getDate() + weeks * 7);
    return iso(x);
  })();
  const sessions = c.plan.sessions
    .filter((s) => !c.done.has(s.id))
    .map((s) => ({ s, d: sessionDate(c.p, s) }))
    .filter(({ d }) => dayDiff(d, today()) >= 0 && d <= end)
    .sort((a, b) => a.d.localeCompare(b.d));
  const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//KOVA//Open gym//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:KOVA entrenos"];
  for (const { s, d } of sessions) {
    const [y, m, dd] = d.split("-");
    const startMin = hour * 60 + minute, endMin = startMin + s.duration;
    const t = (mins: number) => `${y}${m}${dd}T${pad(Math.floor(mins / 60) % 24)}${pad(mins % 60)}00`;
    const desc = s.blocks.map((b) => `${b.title} (${b.minutes}′): ${b.text}`).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}-${c.p.id}@kova`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${t(startMin)}`,
      `DTEND:${t(endMin)}`,
      `SUMMARY:${esc("KOVA · " + s.title)}`,
      `DESCRIPTION:${esc(desc)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc("En 30 min: " + s.title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return { text: lines.join("\r\n"), count: sessions.length };
}

export function downloadText(name: string, text: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 800);
}
export type { Entry };
