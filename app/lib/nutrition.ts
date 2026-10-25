import type { Entry, Store } from "./engine";

// Utilidades de fecha propias para que este módulo se pueda probar con Node sin bundler.
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const addDays = (s: string, n: number) => {
  const d = new Date(s + "T12:00:00");
  d.setDate(d.getDate() + n);
  return iso(d);
};

export type NutritionPlan = {
  weight: number;
  height: number;
  age: number;
  sex: "h" | "m";
  activity: "sed" | "lig" | "mod" | "alt";
  goal: "perder" | "mantener" | "ganar";
};

export const activities = [
  ["sed", "Sedentario", "Trabajo sentado, poco movimiento", 1.3],
  ["lig", "Ligero", "De pie o caminando a ratos", 1.45],
  ["mod", "Moderado", "Trabajo activo o muchos pasos", 1.6],
  ["alt", "Muy activo", "Trabajo físico intenso", 1.75],
] as const;

export const goals = [
  ["perder", "Perder grasa", -0.15, 2.2],
  ["mantener", "Mantener", 0, 1.8],
  ["ganar", "Ganar músculo", 0.08, 2.0],
] as const;

export const habits = [
  ["veg", "🥦", "Verdura en 2 comidas"],
  ["fruit", "🍓", "2-3 piezas de fruta"],
  ["protein", "🍳", "Proteína en cada comida"],
  ["pre", "⏱️", "Comida 2-3 h antes de entrenar"],
  ["post", "🍌", "Proteína y carbohidrato después"],
  ["creatine", "💊", "Creatina (si la tomas)"],
  ["electrolytes", "🧂", "Sal o electrolitos si sudas mucho"],
  ["sleep", "😴", "7-9 h de sueño"],
] as const;

export type NutritionTargets = {
  bmr: number;
  restKcal: number;
  trainKcal: number;
  protein: number;
  fat: number;
  carbsTrain: number;
  carbsRest: number;
  water: number;
  trainingWaterExtra: number;
  proteinPerMeal: number;
};

export function nutritionTargets(p: NutritionPlan | null | undefined): NutritionTargets | null {
  if (!p || !(p.weight > 0) || !(p.height > 0) || !(p.age > 0)) return null;
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === "m" ? -161 : 5);
  const pal = (activities.find((a) => a[0] === p.activity) || activities[1])[3];
  const goal = goals.find((g) => g[0] === p.goal) || goals[1];
  const rest = bmr * pal;
  const train = rest + 7 * p.weight;
  const restKcal = Math.round((rest * (1 + goal[2])) / 10) * 10;
  const trainKcal = Math.round((train * (1 + goal[2])) / 10) * 10;
  const protein = Math.round(goal[3] * p.weight);
  const fat = Math.round(0.9 * p.weight);
  const carbs = (k: number) => Math.max(Math.round((k - protein * 4 - fat * 9) / 4), Math.round(2 * p.weight));
  return {
    bmr: Math.round(bmr),
    restKcal,
    trainKcal,
    protein,
    fat,
    carbsTrain: carbs(trainKcal),
    carbsRest: carbs(restKcal),
    water: Math.round((p.weight * 35) / 50) * 50,
    trainingWaterExtra: 600,
    proteinPerMeal: Math.round(0.4 * p.weight),
  };
}

export const planId = (profileId: string) => "np-" + profileId;
export const dayId = (profileId: string, date: string) => "nd-" + profileId + "-" + date;
export const weightId = (profileId: string, date: string) => "nw-" + profileId + "-" + date;

export function nutritionOf(store: Store, profileId: string) {
  const all = (store.nutrition || []).filter((x) => x.profileId === profileId && !x._deleted);
  const planEntry = all.find((x) => x.kind === "plan");
  const plan: NutritionPlan | null = planEntry
    ? { weight: planEntry.weight, height: planEntry.height, age: planEntry.age, sex: planEntry.sex, activity: planEntry.activity, goal: planEntry.goal }
    : null;
  const days = all.filter((x) => x.kind === "day");
  const weights = all.filter((x) => x.kind === "weight").sort((a, b) => a.date.localeCompare(b.date));
  return { plan, days, weights, targets: nutritionTargets(plan) };
}

export function emptyDay(profileId: string, date: string): Entry {
  return { id: dayId(profileId, date), profileId, date, kind: "day", water: 0, protein: 0, train: null, habits: {}, updatedAt: 0 };
}

export function trainedOn(store: Store, profileId: string, date: string) {
  return (store.logs || []).some((l) => !l._deleted && l.profileId === profileId && l.date === date);
}

export function waterGoal(targets: NutritionTargets | null, training: boolean) {
  return (targets ? targets.water : 2500) + (training ? 600 : 0);
}

export function weeklyAverage(weights: Entry[], endDate = today(), days = 7) {
  const start = addDays(endDate, -(days - 1));
  const vals = weights.filter((w) => w.date >= start && w.date <= endDate).map((w) => Number(w.kg));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

export const nutritionGuide = (kg: number) => [
  {
    icon: "💧",
    title: "Hidratación",
    body: [
      `Base diaria: unos 35 ml por kg (${((kg * 35) / 1000).toFixed(1).replace(".", ",")} L para ${kg} kg) y 500-750 ml más por hora de entreno.`,
      `2-4 h antes de entrenar: 5-7 ml/kg (unos ${Math.round((kg * 6) / 50) * 50} ml).`,
      "Durante: sorbos según la sed. En sesiones de más de 60 min o con calor, bebida con sodio.",
      "Después: 1,25-1,5 L por cada kg perdido en la sesión.",
      "Orina color limonada clara: vas bien. Si ves sal blanca en la ropa, añade electrolitos.",
    ],
  },
  {
    icon: "🍳",
    title: "Proteína",
    body: [
      `Para fuerza y gimnásticos: 1,6-2,2 g/kg al día, repartidos en 3-5 tomas de ${Math.round(kg * 0.3)}-${Math.round(kg * 0.4)} g.`,
      "Fuentes: huevos, pollo, pavo, pescado, carne magra, yogur griego o skyr, queso fresco batido, legumbres, tofu. La proteína en polvo es un comodín.",
      "Antes de dormir, un lácteo (yogur o queso fresco) ayuda a la recuperación.",
    ],
  },
  {
    icon: "🍚",
    title: "Carbohidratos",
    body: [
      "Son el combustible de los metcons: sube arroz, patata, pasta, avena, pan o fruta en días de entreno y baja la ración en descanso.",
      "Volumen bajo (1 h al día): 3-5 g/kg. Volumen moderado: 5-7 g/kg.",
    ],
  },
  {
    icon: "🥑",
    title: "Grasas y fibra",
    body: [
      "0,8-1 g/kg de grasa: aceite de oliva virgen extra, frutos secos, aguacate y pescado azul 2 veces por semana.",
      "Verdura en 2 comidas y 2-3 piezas de fruta al día para fibra y micronutrientes.",
    ],
  },
  {
    icon: "⏱️",
    title: "Antes y después de entrenar",
    body: [
      "2-3 h antes: comida completa (arroz con pollo y verdura, tostadas con huevo y fruta…).",
      "30-60 min antes, si hace falta: plátano, yogur o tortita de arroz con miel.",
      "Después: proteína y carbohidrato en las 2 h siguientes (yogur con avena y fruta, bocadillo de pavo, arroz con atún).",
      "Si entrenas en ayunas por la mañana, toma al menos un plátano o un café con leche antes.",
    ],
  },
  {
    icon: "💊",
    title: "Suplementos con evidencia",
    body: [
      "Creatina monohidrato: 3-5 g al día, todos los días. Es el más estudiado para fuerza y potencia.",
      `Cafeína: unos 3 mg/kg (${Math.round((kg * 3) / 10) * 10} mg) 30-60 min antes. Evítala por la tarde si te quita sueño.`,
      "Proteína en polvo solo si no llegas con comida. Electrolitos en días de calor o mucho sudor.",
      "Vitamina D, hierro y similares solo con analítica y consejo médico.",
    ],
  },
  {
    icon: "😴",
    title: "Sueño y recuperación",
    body: [
      "7-9 h: es el mejor recuperador que existe.",
      "Cena 2-3 h antes de dormir y evita pantallas y cafeína tarde.",
      "Las semanas de descarga del plan son parte del progreso.",
    ],
  },
  {
    icon: "🍽️",
    title: "Ideas de menú",
    body: [
      "Desayuno: tostadas con tomate, aceite y huevos revueltos con fruta, o yogur griego con avena y frutos rojos.",
      "Comida: lentejas con arroz y verdura, pollo al horno con patata y ensalada, o salmón con quinoa.",
      "Merienda antes de entrenar: plátano con yogur o un bocadillo pequeño de pavo.",
      "Cena: tortilla francesa con ensalada y pan, merluza con verduras o revuelto de setas con gambas.",
    ],
  },
  {
    icon: "🛒",
    title: "Lista de la compra base",
    body: [
      "Huevos, pollo o pavo, atún y salmón, yogur griego o skyr, queso fresco batido, legumbres cocidas, arroz, avena, patata, pan integral, fruta variada, verduras de temporada, aceite de oliva virgen extra, frutos secos y cacao puro.",
    ],
  },
];
