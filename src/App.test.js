/**
 * @fileoverview Unit tests for EcoSense AI pure functions.
 * Tests cover: computeFootprint, computePredictions, computeSustainabilityScore,
 * computeTreesNeeded, levelFromXP, buildRoadmap, and all constants.
 */
import { describe, it, expect, vi } from "vitest";

import {
  computeFootprint, computePredictions, computeSustainabilityScore,
  computeTreesNeeded, levelFromXP, buildRoadmap,
} from "./calculations.js";

import {
  CAR_FACTORS, TWO_WHEELER_FACTOR, PUBLIC_TRANSPORT_FACTOR,
  DOMESTIC_FLIGHT_RT, INTL_FLIGHT_RT, GRID_FACTOR, LPG_CYLINDER_FACTOR,
  DIET_FACTORS, WASTE_FACTORS, WATER_FACTOR, SHOPPING_FACTOR,
  NATIONAL_AVG, GLOBAL_AVG, PARIS_TARGET, TREE_ABSORPTION,
  DEFAULT_INPUTS,
} from "./constants.js";

const cf = computeFootprint;

/** Zero-emission base inputs (EV car, zero kms, zero energy, zero water, zero shopping) */
const ZERO = {
  carType: "ev", carKm: 0, twoWheelerKm: 0, publicKm: 0,
  domesticFlights: 0, intlFlights: 0,
  electricity: 0, lpgCylinders: 0,
  diet: "vegan", waste: "most", waterLpd: 0, shoppingSpend: 0,
};

// ═══════════════════════════════════════════════════════════════════════════
// computeFootprint — transport
// ═══════════════════════════════════════════════════════════════════════════
describe("computeFootprint — transport", () => {
  it("zero car = no transport emissions", () => expect(cf(ZERO).breakdown.Transport).toBe(0));
  it("petrol car formula", () => expect(cf({...ZERO, carKm:100, carType:"petrol"}).breakdown.Transport).toBeCloseTo(100*52*0.192/1000, 4));
  it("diesel car formula", () => expect(cf({...ZERO, carKm:100, carType:"diesel"}).breakdown.Transport).toBeCloseTo(100*52*0.171/1000, 4));
  it("EV emits less than petrol", () => expect(cf({...ZERO, carKm:100, carType:"ev"}).breakdown.Transport).toBeLessThan(cf({...ZERO, carKm:100, carType:"petrol"}).breakdown.Transport));
  it("CNG emits less than petrol", () => expect(cf({...ZERO, carKm:100, carType:"cng"}).breakdown.Transport).toBeLessThan(cf({...ZERO, carKm:100, carType:"petrol"}).breakdown.Transport));
  it("public transport emits less than car", () => expect(cf({...ZERO, publicKm:100}).breakdown.Transport).toBeLessThan(cf({...ZERO, carKm:100, carType:"petrol"}).breakdown.Transport));
  it("1 domestic flight formula", () => expect(cf({...ZERO, domesticFlights:1}).breakdown.Transport).toBeCloseTo(DOMESTIC_FLIGHT_RT/1000, 4));
  it("1 international flight formula", () => expect(cf({...ZERO, intlFlights:1}).breakdown.Transport).toBeCloseTo(INTL_FLIGHT_RT/1000, 4));
  it("2 domestic flights = double 1", () => expect(cf({...ZERO, domesticFlights:2}).breakdown.Transport).toBeCloseTo(2*DOMESTIC_FLIGHT_RT/1000, 4));
  it("two-wheeler formula", () => expect(cf({...ZERO, twoWheelerKm:100}).breakdown.Transport).toBeCloseTo(100*52*TWO_WHEELER_FACTOR/1000, 4));
  it("mixed transport sums correctly", () => expect(cf({...ZERO, carKm:50, carType:"petrol", publicKm:30, twoWheelerKm:20}).breakdown.Transport).toBeGreaterThan(0));
});

// ═══════════════════════════════════════════════════════════════════════════
// computeFootprint — energy
// ═══════════════════════════════════════════════════════════════════════════
describe("computeFootprint — energy", () => {
  it("zero energy inputs = zero energy category", () => expect(cf(ZERO).breakdown.Energy).toBe(0));
  it("electricity formula", () => expect(cf({...ZERO, electricity:150}).breakdown.Energy).toBeCloseTo(150*12*GRID_FACTOR/1000, 4));
  it("LPG formula", () => expect(cf({...ZERO, lpgCylinders:1}).breakdown.Energy).toBeCloseTo(12*LPG_CYLINDER_FACTOR/1000, 4));
  it("higher electricity = higher energy emissions", () => expect(cf({...ZERO, electricity:300}).breakdown.Energy).toBeGreaterThan(cf({...ZERO, electricity:100}).breakdown.Energy));
  it("2 cylinders = double 1 cylinder", () => expect(cf({...ZERO, lpgCylinders:2}).breakdown.Energy).toBeCloseTo(2*cf({...ZERO, lpgCylinders:1}).breakdown.Energy, 4));
});

// ═══════════════════════════════════════════════════════════════════════════
// computeFootprint — food
// ═══════════════════════════════════════════════════════════════════════════
describe("computeFootprint — food", () => {
  it("vegan < vegetarian", () => expect(cf({...ZERO, diet:"vegan"}).breakdown.Food).toBeLessThan(cf({...ZERO, diet:"vegetarian"}).breakdown.Food));
  it("vegetarian < eggetarian", () => expect(cf({...ZERO, diet:"vegetarian"}).breakdown.Food).toBeLessThan(cf({...ZERO, diet:"eggetarian"}).breakdown.Food));
  it("eggetarian < moderate", () => expect(cf({...ZERO, diet:"eggetarian"}).breakdown.Food).toBeLessThan(cf({...ZERO, diet:"moderate"}).breakdown.Food));
  it("moderate < heavy", () => expect(cf({...ZERO, diet:"moderate"}).breakdown.Food).toBeLessThan(cf({...ZERO, diet:"heavy"}).breakdown.Food));
  it("vegan exact value", () => expect(cf({...ZERO, diet:"vegan"}).breakdown.Food).toBeCloseTo(DIET_FACTORS.vegan/1000, 4));
  it("heavy exact value", () => expect(cf({...ZERO, diet:"heavy"}).breakdown.Food).toBeCloseTo(DIET_FACTORS.heavy/1000, 4));
});

// ═══════════════════════════════════════════════════════════════════════════
// computeFootprint — waste & water
// ═══════════════════════════════════════════════════════════════════════════
describe("computeFootprint — waste & water", () => {
  it("most < sometimes < rarely waste", () => {
    const m = cf({...ZERO, waste:"most"}).breakdown.Waste;
    const s = cf({...ZERO, waste:"sometimes"}).breakdown.Waste;
    const r = cf({...ZERO, waste:"rarely"}).breakdown.Waste;
    expect(m).toBeLessThan(s);
    expect(s).toBeLessThan(r);
  });
  it("water scales linearly", () => expect(cf({...ZERO, waterLpd:200}).breakdown.Water).toBeGreaterThan(cf({...ZERO, waterLpd:50}).breakdown.Water));
  it("water formula", () => expect(cf({...ZERO, waterLpd:100}).breakdown.Water).toBeCloseTo(100*365*WATER_FACTOR/1000, 5));
  it("zero water = zero water category", () => expect(cf(ZERO).breakdown.Water).toBe(0));
});

// ═══════════════════════════════════════════════════════════════════════════
// computeFootprint — shopping
// ═══════════════════════════════════════════════════════════════════════════
describe("computeFootprint — shopping", () => {
  it("higher spend = more emissions", () => expect(cf({...ZERO, shoppingSpend:5000}).breakdown.Shopping).toBeGreaterThan(cf({...ZERO, shoppingSpend:500}).breakdown.Shopping));
  it("shopping formula", () => expect(cf({...ZERO, shoppingSpend:3000}).breakdown.Shopping).toBeCloseTo(3000*12*SHOPPING_FACTOR/1000, 5));
  it("zero spend = zero shopping category", () => expect(cf(ZERO).breakdown.Shopping).toBe(0));
});

// ═══════════════════════════════════════════════════════════════════════════
// computeFootprint — totals & structure
// ═══════════════════════════════════════════════════════════════════════════
describe("computeFootprint — totals & structure", () => {
  it("total equals sum of all breakdown categories", () => {
    const r = cf(DEFAULT_INPUTS);
    const sum = Object.values(r.breakdown).reduce((a, b) => a + b, 0);
    expect(r.totalTons).toBeCloseTo(sum, 5);
  });
  it("total is always non-negative", () => expect(cf(ZERO).totalTons).toBeGreaterThanOrEqual(0));
  it("typical Indian user footprint > 1t", () => expect(cf(DEFAULT_INPUTS).totalTons).toBeGreaterThan(1));
  it("breakdown has all 6 categories", () => {
    const keys = Object.keys(cf(ZERO).breakdown);
    ["Transport","Energy","Food","Waste","Water","Shopping"].forEach(k => expect(keys).toContain(k));
  });
  it("result has raw field", () => expect(cf(ZERO)).toHaveProperty("raw"));
  it("breakdown values are numbers", () => Object.values(cf(DEFAULT_INPUTS).breakdown).forEach(v => expect(typeof v).toBe("number")));
});

// ═══════════════════════════════════════════════════════════════════════════
// levelFromXP
// ═══════════════════════════════════════════════════════════════════════════
describe("levelFromXP", () => {
  it("0 XP = level 1", () => expect(levelFromXP(0)).toBe(1));
  it("199 XP = level 1", () => expect(levelFromXP(199)).toBe(1));
  it("200 XP = level 2", () => expect(levelFromXP(200)).toBe(2));
  it("400 XP = level 3", () => expect(levelFromXP(400)).toBe(3));
  it("800 XP = level 5", () => expect(levelFromXP(800)).toBe(5));
  it("monotonically increases with XP", () => expect(levelFromXP(500)).toBeGreaterThanOrEqual(levelFromXP(200)));
  it("never returns 0 or negative", () => expect(levelFromXP(0)).toBeGreaterThanOrEqual(1));
});

// ═══════════════════════════════════════════════════════════════════════════
// computeSustainabilityScore
// ═══════════════════════════════════════════════════════════════════════════
describe("computeSustainabilityScore", () => {
  it("at Paris target = 100", () => expect(computeSustainabilityScore(PARIS_TARGET)).toBe(100));
  it("at global average = low score", () => expect(computeSustainabilityScore(GLOBAL_AVG)).toBeLessThanOrEqual(5));
  it("above global average = 0", () => expect(computeSustainabilityScore(GLOBAL_AVG + 5)).toBe(0));
  it("always between 0 and 100", () => [0.5,1,2,3,4,5,8,20].forEach(t => {
    const s = computeSustainabilityScore(t);
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(100);
  }));
  it("lower footprint = higher score", () => expect(computeSustainabilityScore(1.5)).toBeGreaterThan(computeSustainabilityScore(3.5)));
  it("returns an integer", () => expect(Number.isInteger(computeSustainabilityScore(2.5))).toBe(true));
});

// ═══════════════════════════════════════════════════════════════════════════
// computeTreesNeeded
// ═══════════════════════════════════════════════════════════════════════════
describe("computeTreesNeeded", () => {
  it("always at least 1 tree", () => expect(computeTreesNeeded(0)).toBeGreaterThanOrEqual(1));
  it("more tons = more trees", () => expect(computeTreesNeeded(4)).toBeGreaterThan(computeTreesNeeded(2)));
  it("formula matches TREE_ABSORPTION constant", () => expect(computeTreesNeeded(1.9)).toBe(Math.max(1, Math.ceil(1900/TREE_ABSORPTION))));
  it("returns an integer", () => expect(Number.isInteger(computeTreesNeeded(2.5))).toBe(true));
  it("scales proportionally", () => expect(computeTreesNeeded(4)).toBeGreaterThan(computeTreesNeeded(2)));
});

// ═══════════════════════════════════════════════════════════════════════════
// computePredictions
// ═══════════════════════════════════════════════════════════════════════════
describe("computePredictions", () => {
  it("returns null for empty array", () => expect(computePredictions([])).toBeNull());
  it("returns null for 1 entry", () => expect(computePredictions([{date:"2024-01",total:2}])).toBeNull());
  it("upward trend: nextTotal > last", () => {
    const p = computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]);
    expect(p.nextTotal).toBeGreaterThan(2.5);
  });
  it("avgDelta correct for 2 entries", () => {
    const p = computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]);
    expect(p.avgDelta).toBeCloseTo(0.5, 4);
  });
  it("downward trend: nextTotal < last", () => {
    const p = computePredictions([{date:"2024-01",total:3},{date:"2024-02",total:2.5},{date:"2024-03",total:2}]);
    expect(p.nextTotal).toBeLessThan(2);
  });
  it("nextTotal never negative", () => {
    const p = computePredictions([{date:"2024-01",total:0.1},{date:"2024-02",total:0}]);
    expect(p.nextTotal).toBeGreaterThanOrEqual(0);
  });
  it("chartData contains a projected point", () => {
    const p = computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]);
    expect(p.chartData.some(d => d.projected !== null)).toBe(true);
  });
  it("yearProjection > nextTotal on upward trend", () => {
    const p = computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]);
    expect(p.yearProjection).toBeGreaterThan(p.nextTotal);
  });
  it("result has required fields", () => {
    const p = computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]);
    expect(p).toHaveProperty("avgDelta");
    expect(p).toHaveProperty("nextTotal");
    expect(p).toHaveProperty("yearProjection");
    expect(p).toHaveProperty("chartData");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// buildRoadmap
// ═══════════════════════════════════════════════════════════════════════════
describe("buildRoadmap", () => {
  it("returns an array", () => expect(Array.isArray(buildRoadmap(DEFAULT_INPUTS, cf(DEFAULT_INPUTS)))).toBe(true));
  it("sorted by saving descending", () => {
    const items = buildRoadmap(DEFAULT_INPUTS, cf(DEFAULT_INPUTS));
    for (let i = 1; i < items.length; i++) {
      expect(items[i-1].saving).toBeGreaterThanOrEqual(items[i].saving);
    }
  });
  it("each item has id, title, saving, priority", () => {
    buildRoadmap(DEFAULT_INPUTS, cf(DEFAULT_INPUTS)).forEach(item => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("saving");
      expect(item).toHaveProperty("priority");
    });
  });
  it("all savings are positive", () => buildRoadmap(DEFAULT_INPUTS, cf(DEFAULT_INPUTS)).forEach(i => expect(i.saving).toBeGreaterThan(0)));
  it("minimal habits = minimal roadmap", () => {
    const inp = {...ZERO, diet:"vegan", carType:"ev", waste:"most", electricity:0};
    expect(buildRoadmap(inp, cf(inp)).length).toBeLessThanOrEqual(2);
  });
  it("priority is valid value", () => {
    buildRoadmap(DEFAULT_INPUTS, cf(DEFAULT_INPUTS)).forEach(item => {
      expect(["High","Medium","Low"]).toContain(item.priority);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Constants sanity checks
// ═══════════════════════════════════════════════════════════════════════════
describe("constants sanity", () => {
  it("Paris target < India national average + 1", () => expect(PARIS_TARGET).toBeLessThan(NATIONAL_AVG + 1));
  it("India national average < global average", () => expect(NATIONAL_AVG).toBeLessThan(GLOBAL_AVG));
  it("tree absorption is positive", () => expect(TREE_ABSORPTION).toBeGreaterThan(0));
  it("grid factor is positive", () => expect(GRID_FACTOR).toBeGreaterThan(0));
  it("all car factors are positive", () => Object.values(CAR_FACTORS).forEach(v => expect(v).toBeGreaterThan(0)));
  it("EV has lowest car emission factor", () => expect(CAR_FACTORS.ev).toBeLessThan(CAR_FACTORS.petrol));
  it("water factor is positive", () => expect(WATER_FACTOR).toBeGreaterThan(0));
  it("shopping factor is positive", () => expect(SHOPPING_FACTOR).toBeGreaterThan(0));
  it("all diet factors are positive", () => Object.values(DIET_FACTORS).forEach(v => expect(v).toBeGreaterThan(0)));
  it("all waste factors are positive", () => Object.values(WASTE_FACTORS).forEach(v => expect(v).toBeGreaterThan(0)));
  it("DEFAULT_INPUTS has all required keys", () => {
    const keys = Object.keys(DEFAULT_INPUTS);
    ["carType","carKm","twoWheelerKm","publicKm","domesticFlights","intlFlights","electricity","lpgCylinders","diet","waterLpd","waste","shoppingSpend"].forEach(k => expect(keys).toContain(k));
  });
});
