import type { Entry } from "./engine";

export type RecordUnit = "kg" | "reps" | "tiempo" | "rondas" | "m" | "s" | "cal";
export type RecordMovement = { name: string; category: string; unit: RecordUnit };

export const recordCategories = ["Halterofilia", "Fuerza", "Gimnásticos", "Cardio", "Girls", "Héroes", "Open gym"] as const;

export const recordUnitLabels: Record<RecordUnit, string> = {
  kg: "kg",
  reps: "repeticiones",
  tiempo: "tiempo (mm:ss)",
  rondas: "rondas + reps",
  m: "metros",
  s: "segundos",
  cal: "calorías",
};

function group(category: string, unit: RecordUnit, names: string): RecordMovement[] {
  return names.split("|").map((name) => ({ name, category, unit }));
}

export const recordMovements: RecordMovement[] = [
  ...group("Halterofilia", "kg", "Snatch|Power snatch|Squat snatch|Hang snatch|Hang power snatch|Muscle snatch|Snatch balance|Overhead squat|Clean|Power clean|Squat clean|Hang clean|Hang power clean|Hang squat clean|Clean & jerk|Power clean & jerk|Jerk|Split jerk|Push jerk|Power jerk|Squat jerk|Clean pull|Snatch pull|Thruster|Cluster|Sots press"),
  ...group("Fuerza", "kg", "Back squat|Front squat|Box squat|Pause squat|Zercher squat|Deadlift|Sumo deadlift|Romanian deadlift|Trap bar deadlift|Deficit deadlift|Bench press|Close grip bench press|Incline bench press|Strict press|Push press|Behind the neck press|Z press|Weighted pull-up|Weighted chin-up|Weighted dip|Barbell row|Pendlay row|Hip thrust|Good morning|Bulgarian split squat|Walking lunge|Turkish get-up|Farmer carry|DB bench press|DB shoulder press|KB swing"),
  ...group("Gimnásticos", "reps", "Pull-ups estrictas|Kipping pull-ups|Butterfly pull-ups|Chin-ups|Chest to bar|Bar muscle-ups|Ring muscle-ups|Ring muscle-ups estrictos|Toes to bar|Knees to elbows|HSPU estrictos|Kipping HSPU|Deficit HSPU|Wall walks|Pistols|Ring dips|Bar dips|Push-ups|Ring push-ups|Rope climbs|Legless rope climbs|Double unders|Triple unders|GHD sit-ups|Burpees|Air squats|Pull-ups en 1 min|Sit-ups en 2 min"),
  ...group("Gimnásticos", "s", "Handstand hold libre|Handstand hold en pared|L-sit|Dead hang|Plancha|Hollow hold"),
  ...group("Gimnásticos", "m", "Handstand walk|Handstand walk sin caer"),
  ...group("Cardio", "tiempo", "Remo 250 m|Remo 500 m|Remo 1.000 m|Remo 2.000 m|Remo 5.000 m|SkiErg 500 m|SkiErg 1.000 m|BikeErg 2 km|Assault bike 10 cal|Echo bike 50 cal|Carrera 400 m|Carrera 800 m|Carrera 1 km|Carrera 1 milla|Carrera 5 km|Carrera 10 km|100 double unders"),
  ...group("Cardio", "cal", "Remo cal 1 min|Assault bike cal 1 min|Echo bike cal 1 min|SkiErg cal 1 min|Assault bike cal 10 min"),
  ...group("Girls", "tiempo", "Fran|Grace|Isabel|Diane|Elizabeth|Helen|Karen|Annie|Jackie|Nancy|Amanda|Linda|Angie|Barbara|Kelly|Eva|Filthy Fifty"),
  ...group("Girls", "rondas", "Cindy|Mary|Chelsea|Nicole"),
  ...group("Girls", "reps", "Fight Gone Bad|Lynne"),
  ...group("Héroes", "tiempo", "Murph|DT|JT|Michael|Randy|Badger|Josh|Daniel|Holleyman|The Seven|Bull|Kalsu"),
  ...group("Héroes", "rondas", "Nate|Danny|Glen|Ryan"),
  ...group("Open gym", "rondas", "AMRAP 15 del plan"),
  ...group("Open gym", "tiempo", "For time 15 del plan"),
];

export function normalizeText(s: string) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function searchMovements(query: string, category = "Todos", limit = 80) {
  const q = normalizeText(query);
  return recordMovements
    .filter((m) => (category === "Todos" || m.category === category) && (!q || normalizeText(m.name).includes(q)))
    .sort((a, b) => {
      if (!q) return 0;
      const sa = normalizeText(a.name).startsWith(q) ? 0 : 1, sb = normalizeText(b.name).startsWith(q) ? 0 : 1;
      return sa - sb;
    })
    .slice(0, limit);
}

export function findMovement(name: string) {
  const q = normalizeText(name);
  return recordMovements.find((m) => normalizeText(m.name) === q) || null;
}

export function parseClock(v: string): number | null {
  const s = String(v || "").trim().replace(",", ".");
  if (!s) return null;
  if (s.includes(":")) {
    const parts = s.split(":").map(Number);
    if (parts.some((n) => !Number.isFinite(n))) return null;
    return parts.reduce((a, n) => a * 60 + n, 0);
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function recordScore(value: string, unit: string): number | null {
  if (unit === "tiempo") return parseClock(value);
  if (unit === "rondas") {
    const m = String(value).match(/(\d+)\s*\+\s*(\d+)/);
    if (m) return Number(m[1]) * 1000 + Number(m[2]);
    const n = Number(String(value).replace(",", "."));
    return Number.isFinite(n) ? n * 1000 : null;
  }
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export const lowerIsBetter = (unit: string) => unit === "tiempo";

export function unitSuffix(unit: string) {
  return unit === "tiempo" ? "" : unit === "rondas" ? " rondas" : unit === "reps" ? " reps" : " " + unit;
}

export type RecordGroup = { name: string; unit: string; entries: Entry[]; best: Entry };

export function groupRecords(records: Entry[]): RecordGroup[] {
  const map = new Map<string, Entry[]>();
  for (const r of records) {
    if (r._deleted) continue;
    const key = normalizeText(r.name) + "|" + r.unit;
    map.set(key, [...(map.get(key) || []), r]);
  }
  return [...map.values()]
    .map((entries) => {
      entries.sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt - b.updatedAt);
      const unit = entries[0].unit;
      let best = entries[entries.length - 1];
      let bestScore = recordScore(best.value, unit);
      for (const e of entries) {
        const sc = recordScore(e.value, unit);
        if (sc === null) continue;
        if (bestScore === null || (lowerIsBetter(unit) ? sc < bestScore : sc > bestScore)) {
          best = e;
          bestScore = sc;
        }
      }
      return { name: entries[0].name, unit, entries, best };
    })
    .sort((a, b) => b.best.date.localeCompare(a.best.date) || a.name.localeCompare(b.name));
}

export function isNewBest(records: Entry[], candidate: { name: string; unit: string; value: string }) {
  const g = groupRecords(records).find((x) => normalizeText(x.name) === normalizeText(candidate.name) && x.unit === candidate.unit);
  if (!g) return true;
  const a = recordScore(candidate.value, candidate.unit), b = recordScore(g.best.value, g.unit);
  if (a === null || b === null) return false;
  return lowerIsBetter(candidate.unit) ? a < b : a > b;
}

export function percentTable(kg: number) {
  return [50, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110].map((pct) => ({ pct, kg: Math.round(((kg * pct) / 100) * 2) / 2 }));
}
