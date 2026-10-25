import test from "node:test";
import assert from "node:assert/strict";
import { emptyStore, mergeStores, validStore } from "../app/lib/engine.ts";
import { groupRecords, isNewBest, recordScore, searchMovements, percentTable, recordMovements } from "../app/lib/records.ts";
import { nutritionTargets, nutritionOf, planId, dayId, weightId, waterGoal } from "../app/lib/nutrition.ts";

const rec = (id: string, name: string, unit: string, value: string, date: string, updatedAt = 1) => ({ id, profileId: "athlete-1", date, name, unit, value, updatedAt });

test("la base de récords trae más de 150 movimientos y se puede buscar sin tildes", () => {
  assert.ok(recordMovements.length >= 150);
  assert.ok(searchMovements("halterofilia".slice(0, 0) + "snatch").some((m) => m.name === "Power snatch"));
  assert.ok(searchMovements("ejercitos").length === 0);
  assert.equal(searchMovements("", "Héroes").every((m) => m.category === "Héroes"), true);
});

test("las marcas se puntúan según su unidad", () => {
  assert.equal(recordScore("4:35", "tiempo"), 275);
  assert.equal(recordScore("8+12", "rondas"), 8012);
  assert.equal(recordScore("102,5", "kg"), 102.5);
  assert.equal(recordScore("abc", "kg"), null);
});

test("el mejor récord respeta si menos es mejor", () => {
  const rs = [rec("a", "Fran", "tiempo", "6:10", "2026-01-01"), rec("b", "Fran", "tiempo", "5:40", "2026-02-01"), rec("c", "Back squat", "kg", "100", "2026-01-01")];
  const g = groupRecords(rs);
  assert.equal(g.find((x) => x.name === "Fran")!.best.value, "5:40");
  assert.equal(isNewBest(rs, { name: "fran", unit: "tiempo", value: "5:30" }), true);
  assert.equal(isNewBest(rs, { name: "Back squat", unit: "kg", value: "95" }), false);
  assert.equal(percentTable(100).find((x) => x.pct === 85)!.kg, 85);
});

test("los objetivos de nutrición son coherentes", () => {
  const t = nutritionTargets({ weight: 78, height: 178, age: 38, sex: "h", activity: "lig", goal: "mantener" })!;
  assert.ok(t.trainKcal > t.restKcal);
  assert.equal(t.protein, Math.round(1.8 * 78));
  assert.ok(t.carbsTrain > t.carbsRest);
  assert.equal(waterGoal(t, true) - waterGoal(t, false), 600);
  assert.equal(nutritionTargets(null), null);
});

test("las nuevas colecciones se validan y se fusionan entre dispositivos", () => {
  const base = emptyStore();
  assert.equal(validStore(base), true);
  const old: any = { ...base };
  delete old.records;
  delete old.nutrition;
  assert.equal(validStore(old), true, "las copias antiguas sin colecciones nuevas siguen siendo válidas");
  const a = { ...base, records: [rec("r1", "Clean", "kg", "80", "2026-03-01", 5)], nutrition: [{ id: dayId("athlete-1", "2026-03-01"), profileId: "athlete-1", date: "2026-03-01", kind: "day", water: 1500, protein: 90, train: true, habits: { veg: true }, updatedAt: 10 }] };
  const b = { ...base, records: [rec("r1", "Clean", "kg", "85", "2026-03-01", 9)], nutrition: [{ id: dayId("athlete-1", "2026-03-01"), profileId: "athlete-1", date: "2026-03-01", kind: "day", water: 500, protein: 20, train: null, habits: {}, updatedAt: 3 }, { id: weightId("athlete-1", "2026-03-01"), profileId: "athlete-1", date: "2026-03-01", kind: "weight", kg: 77.5, waist: null, updatedAt: 4 }, { id: planId("athlete-1"), profileId: "athlete-1", date: "2026-03-01", kind: "plan", weight: 78, height: 178, age: 38, sex: "h", activity: "lig", goal: "mantener", updatedAt: 4 }] };
  assert.equal(validStore(a), true);
  assert.equal(validStore(b), true);
  const m = mergeStores(a as any, b as any);
  assert.equal(m.records!.find((x) => x.id === "r1")!.value, "85");
  assert.equal(m.nutrition!.find((x) => x.kind === "day")!.water, 1500);
  const n = nutritionOf(m, "athlete-1");
  assert.equal(n.weights.length, 1);
  assert.ok(n.targets);
  assert.equal(validStore({ ...base, records: [rec("x", "", "kg", "1", "2026-01-01")] }), false);
  assert.equal(validStore({ ...base, nutrition: [{ id: "n", profileId: "athlete-1", date: "2026-01-01", kind: "day", water: -5, protein: 0, train: null, habits: {}, updatedAt: 1 }] }), false);
});
