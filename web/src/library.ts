// Biblioteca de WODs de referencia (Girls y Héroes) y rutinas de movilidad guiadas.
// Pesos en kg: hombre / mujer. Son los estándares publicados por CrossFit; escálalos a tu nivel.
export type Benchmark = { name: string; group: "Girls" | "Héroes" | "Open gym"; type: "fortime" | "amrap" | "emom"; minutes: number; unit: "tiempo" | "rondas" | "reps"; desc: string; scale: string };

export const BENCHMARKS: Benchmark[] = [
  { name: "Fran", group: "Girls", type: "fortime", minutes: 10, unit: "tiempo", desc: "21-15-9: thrusters (43/29 kg) y pull-ups.", scale: "Barra más ligera y pull-ups con banda o ring rows." },
  { name: "Grace", group: "Girls", type: "fortime", minutes: 10, unit: "tiempo", desc: "30 clean & jerks (61/43 kg).", scale: "Baja el peso para hacerlo en menos de 8 min." },
  { name: "Isabel", group: "Girls", type: "fortime", minutes: 10, unit: "tiempo", desc: "30 snatches (61/43 kg).", scale: "Power snatch con peso que puedas mover en series de 3-5." },
  { name: "Diane", group: "Girls", type: "fortime", minutes: 12, unit: "tiempo", desc: "21-15-9: deadlifts (102/70 kg) y handstand push-ups.", scale: "HSPU con abmats, pike push-ups o push-ups." },
  { name: "Elizabeth", group: "Girls", type: "fortime", minutes: 14, unit: "tiempo", desc: "21-15-9: squat cleans (61/43 kg) y ring dips.", scale: "Power clean + front squat y fondos en banco." },
  { name: "Helen", group: "Girls", type: "fortime", minutes: 15, unit: "tiempo", desc: "3 rondas: 400 m carrera, 21 KB swings (24/16 kg) y 12 pull-ups.", scale: "KB más ligera y pull-ups asistidas." },
  { name: "Karen", group: "Girls", type: "fortime", minutes: 15, unit: "tiempo", desc: "150 wall balls (9/6 kg, a 3/2,7 m).", scale: "Balón más ligero o 100 repeticiones." },
  { name: "Annie", group: "Girls", type: "fortime", minutes: 12, unit: "tiempo", desc: "50-40-30-20-10: double unders y sit-ups.", scale: "Singles al doble de repeticiones." },
  { name: "Jackie", group: "Girls", type: "fortime", minutes: 12, unit: "tiempo", desc: "1.000 m remo, 50 thrusters (20/15 kg) y 30 pull-ups.", scale: "Barra técnica y ring rows." },
  { name: "Nancy", group: "Girls", type: "fortime", minutes: 20, unit: "tiempo", desc: "5 rondas: 400 m carrera y 15 overhead squats (43/29 kg).", scale: "OHS con PVC o front squat." },
  { name: "Amanda", group: "Girls", type: "fortime", minutes: 15, unit: "tiempo", desc: "9-7-5: muscle-ups y squat snatches (61/43 kg).", scale: "Jumping muscle-ups o C2B + fondos; power snatch ligero." },
  { name: "Angie", group: "Girls", type: "fortime", minutes: 25, unit: "tiempo", desc: "100 pull-ups, 100 push-ups, 100 sit-ups y 100 air squats, en orden.", scale: "50 de cada o partido en rondas." },
  { name: "Barbara", group: "Girls", type: "fortime", minutes: 35, unit: "tiempo", desc: "5 rondas: 20 pull-ups, 30 push-ups, 40 sit-ups y 50 air squats; 3 min de descanso entre rondas.", scale: "3 rondas o la mitad de repeticiones." },
  { name: "Eva", group: "Girls", type: "fortime", minutes: 45, unit: "tiempo", desc: "5 rondas: 800 m carrera, 30 KB swings (32/24 kg) y 30 pull-ups.", scale: "3 rondas, KB 24/16 kg." },
  { name: "Kelly", group: "Girls", type: "fortime", minutes: 35, unit: "tiempo", desc: "5 rondas: 400 m carrera, 30 box jumps (61/51 cm) y 30 wall balls (9/6 kg).", scale: "Step-ups y 20 repeticiones." },
  { name: "Cindy", group: "Girls", type: "amrap", minutes: 20, unit: "rondas", desc: "AMRAP 20: 5 pull-ups, 10 push-ups y 15 air squats.", scale: "Ring rows y push-ups en cajón." },
  { name: "Mary", group: "Girls", type: "amrap", minutes: 20, unit: "rondas", desc: "AMRAP 20: 5 handstand push-ups, 10 pistols y 15 pull-ups.", scale: "Pike push-ups, pistols a cajón y pull-ups asistidas." },
  { name: "Nicole", group: "Girls", type: "amrap", minutes: 20, unit: "reps", desc: "AMRAP 20: 400 m carrera y máximas pull-ups. Anota las pull-ups totales.", scale: "Pull-ups con banda." },
  { name: "Chelsea", group: "Girls", type: "emom", minutes: 30, unit: "rondas", desc: "EMOM 30: 5 pull-ups, 10 push-ups y 15 air squats. Anota los minutos completados.", scale: "EMOM 20 o ring rows." },
  { name: "Murph", group: "Héroes", type: "fortime", minutes: 60, unit: "tiempo", desc: "1 milla, 100 pull-ups, 200 push-ups, 300 air squats y 1 milla. Con chaleco de 9/6 kg en Rx.", scale: "Media Murph o partido en 20 rondas de 5-10-15." },
  { name: "DT", group: "Héroes", type: "fortime", minutes: 15, unit: "tiempo", desc: "5 rondas: 12 deadlifts, 9 hang power cleans y 6 push jerks (70/47 kg).", scale: "Barra de 43/29 kg." },
  { name: "JT", group: "Héroes", type: "fortime", minutes: 20, unit: "tiempo", desc: "21-15-9: handstand push-ups, ring dips y push-ups.", scale: "Pike push-ups, fondos en banco y push-ups en cajón." },
  { name: "Michael", group: "Héroes", type: "fortime", minutes: 35, unit: "tiempo", desc: "3 rondas: 800 m carrera, 50 back extensions y 50 sit-ups.", scale: "400 m y 30 repeticiones." },
  { name: "Randy", group: "Héroes", type: "fortime", minutes: 10, unit: "tiempo", desc: "75 power snatches (34/25 kg).", scale: "Barra técnica o 50 repeticiones." },
  { name: "Nate", group: "Héroes", type: "amrap", minutes: 20, unit: "rondas", desc: "AMRAP 20: 2 muscle-ups, 4 HSPU y 8 KB swings (32/24 kg).", scale: "C2B + fondos, pike push-ups, KB 24/16 kg." },
  { name: "Fight Gone Bad", group: "Open gym", type: "amrap", minutes: 17, unit: "reps", desc: "3 rondas de 1 min por estación: wall balls, SDHP (34/25 kg), box jumps, push press (34/25 kg) y remo (cal). 1 min de descanso entre rondas.", scale: "Pesos ligeros; step-ups." },
  { name: "Filthy Fifty", group: "Open gym", type: "fortime", minutes: 30, unit: "tiempo", desc: "50 de cada: box jumps, jumping pull-ups, KB swings, walking lunges, knees to elbows, push press (20/15 kg), back extensions, wall balls, burpees y double unders.", scale: "25 de cada." },
];

export type Mobility = { id: string; icon: string; name: string; when: string; minutes: number; text: string };
export const MOBILITY: Mobility[] = [
  { id: "shoulders", icon: "🙆", name: "Hombros y escápulas", when: "Antes de gimnasia y overhead", minutes: 8, text: "30 círculos de brazos + 10 pass-throughs con banda + 10 band pull-aparts + 8 scap pull-ups + 30 s colgado pasivo + 30 s colgado activo + 10 Y-T-W en el suelo" },
  { id: "wrists", icon: "🤲", name: "Muñecas para el pino", when: "Antes de handstand y front rack", minutes: 6, text: "30 s círculos de muñeca + 10 balanceos adelante en cuadrupedia + 10 balanceos atrás con dorsos + 30 s plancha con dedos girados + 10 elevaciones de palmas + 30 s apoyo en pino a la pared" },
  { id: "hips", icon: "🦵", name: "Cadera y tobillo para squat", when: "Antes de sentadillas y olímpicos", minutes: 8, text: "45 s couch stretch por lado + 10 balanceos de tobillo a la pared por lado + 45 s sentadilla profunda con apertura + 10 90/90 de cadera + 10 good mornings con barra vacía + 10 air squats lentos" },
  { id: "thoracic", icon: "🧘", name: "Espalda y torácica", when: "Días de remo, pull-ups y oficina", minutes: 7, text: "10 cat-cow + 8 aperturas torácicas por lado + 45 s puppy pose + 10 rotaciones en cuadrupedia por lado + 45 s colgado de la barra + 10 superman lentos" },
  { id: "cooldown", icon: "🌙", name: "Vuelta a la calma post-WOD", when: "Justo después del metcon", minutes: 8, text: "2 min caminar o bici muy suave + 60 s respiración nasal lenta + 45 s estiramiento de dorsal por lado + 45 s cuádriceps por lado + 45 s isquios + 60 s postura del niño" },
  { id: "rest", icon: "🌿", name: "Día de descanso", when: "Recuperación activa de 15 min", minutes: 15, text: "3 min paseo o bici suave + 2 min cat-cow y aperturas + 2 min couch stretch alterno + 2 min sentadilla profunda + 2 min colgado y hombros + 2 min 90/90 de cadera + 2 min respiración tumbado con piernas en la pared" },
];

export const STRENGTH_LIFTS = ["Back squat", "Front squat", "Deadlift", "Strict press", "Push press", "Bench press", "Clean", "Power clean", "Squat clean", "Clean & jerk", "Snatch", "Power snatch", "Overhead squat", "Thruster", "Push jerk", "Split jerk", "Hip thrust", "Romanian deadlift", "Weighted pull-up", "Barbell row"];
/** 1RM estimado (Epley), redondeado a 0,5 kg. */
export const est1RM = (kg: number, reps: number) => (reps <= 1 ? kg : Math.round(kg * (1 + reps / 30) * 2) / 2);
