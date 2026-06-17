import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ── Pure function imports ──────────────────────────────────────────────────
import {
  computeFootprint, computeFootprint as cf,
  computePredictions, computeSustainabilityScore,
  computeTreesNeeded, levelFromXP, buildRoadmap,
  CAR_FACTORS, TWO_WHEELER_FACTOR, PUBLIC_TRANSPORT_FACTOR,
  DOMESTIC_FLIGHT_RT, INTL_FLIGHT_RT, GRID_FACTOR, LPG_CYLINDER_FACTOR,
  DIET_FACTORS, WASTE_FACTORS, WATER_FACTOR, SHOPPING_FACTOR,
  NATIONAL_AVG, GLOBAL_AVG, PARIS_TARGET, TREE_ABSORPTION,
  DEFAULT_INPUTS,
} from "./App.jsx";

// ── Storage mock ───────────────────────────────────────────────────────────
const storageMock = { get: vi.fn().mockRejectedValue(new Error("not found")), set: vi.fn().mockResolvedValue(null), delete: vi.fn().mockResolvedValue(null), list: vi.fn().mockResolvedValue({ keys: [] }) };
global.window = global.window || {};
global.window.storage = storageMock;

// ── BASE INPUT ─────────────────────────────────────────────────────────────
const BASE = { carType:"petrol", carKm:0, twoWheelerKm:0, publicKm:0, domesticFlights:0, intlFlights:0, electricity:0, lpgCylinders:0, diet:"vegan", waste:"most", waterLpd:0, shoppingSpend:0 };

// ═══════════════════════════════════════════════════════════════════════════
// UNIT TESTS — computeFootprint
// ═══════════════════════════════════════════════════════════════════════════
describe("computeFootprint — zero inputs", () => {
  it("returns zero total", () => expect(cf(BASE).totalTons).toBe(0));
  it("all breakdown cats zero", () => Object.values(cf(BASE).breakdown).forEach(v => expect(v).toBe(0)));
});

describe("computeFootprint — transport", () => {
  it("petrol car correct", () => { const r = cf({...BASE, carKm:100, carType:"petrol"}); expect(r.breakdown.Transport).toBeCloseTo(100*52*0.192/1000,4); });
  it("diesel car correct", () => { const r = cf({...BASE, carKm:100, carType:"diesel"}); expect(r.breakdown.Transport).toBeCloseTo(100*52*0.171/1000,4); });
  it("EV < petrol", () => { const ev=cf({...BASE,carKm:100,carType:"ev"}); const pt=cf({...BASE,carKm:100,carType:"petrol"}); expect(ev.breakdown.Transport).toBeLessThan(pt.breakdown.Transport); });
  it("CNG < petrol", () => { const cng=cf({...BASE,carKm:100,carType:"cng"}); const pt=cf({...BASE,carKm:100,carType:"petrol"}); expect(cng.breakdown.Transport).toBeLessThan(pt.breakdown.Transport); });
  it("public < car", () => { const pub=cf({...BASE,publicKm:100}); const car=cf({...BASE,carKm:100,carType:"petrol"}); expect(pub.breakdown.Transport).toBeLessThan(car.breakdown.Transport); });
  it("domestic flight", () => expect(cf({...BASE,domesticFlights:1}).breakdown.Transport).toBeCloseTo(DOMESTIC_FLIGHT_RT/1000,4));
  it("intl flight", () => expect(cf({...BASE,intlFlights:1}).breakdown.Transport).toBeCloseTo(INTL_FLIGHT_RT/1000,4));
  it("two flights sum", () => expect(cf({...BASE,domesticFlights:2}).breakdown.Transport).toBeCloseTo(2*DOMESTIC_FLIGHT_RT/1000,4));
  it("two-wheeler", () => expect(cf({...BASE,twoWheelerKm:100}).breakdown.Transport).toBeCloseTo(100*52*TWO_WHEELER_FACTOR/1000,4));
  it("mixed transport adds", () => { const r=cf({...BASE,carKm:50,carType:"petrol",publicKm:30,twoWheelerKm:20}); expect(r.breakdown.Transport).toBeGreaterThan(0); });
});

describe("computeFootprint — energy", () => {
  it("electricity correct", () => expect(cf({...BASE,electricity:150}).breakdown.Energy).toBeCloseTo(150*12*GRID_FACTOR/1000,4));
  it("LPG correct", () => expect(cf({...BASE,lpgCylinders:1}).breakdown.Energy).toBeCloseTo(12*LPG_CYLINDER_FACTOR/1000,4));
  it("higher kWh = higher energy", () => expect(cf({...BASE,electricity:300}).breakdown.Energy).toBeGreaterThan(cf({...BASE,electricity:100}).breakdown.Energy));
  it("two cylinders double one", () => expect(cf({...BASE,lpgCylinders:2}).breakdown.Energy).toBeCloseTo(2*cf({...BASE,lpgCylinders:1}).breakdown.Energy,4));
});

describe("computeFootprint — food", () => {
  it("vegan < vegetarian", () => expect(cf({...BASE,diet:"vegan"}).breakdown.Food).toBeLessThan(cf({...BASE,diet:"vegetarian"}).breakdown.Food));
  it("vegetarian < eggetarian", () => expect(cf({...BASE,diet:"vegetarian"}).breakdown.Food).toBeLessThan(cf({...BASE,diet:"eggetarian"}).breakdown.Food));
  it("eggetarian < moderate", () => expect(cf({...BASE,diet:"eggetarian"}).breakdown.Food).toBeLessThan(cf({...BASE,diet:"moderate"}).breakdown.Food));
  it("moderate < heavy", () => expect(cf({...BASE,diet:"moderate"}).breakdown.Food).toBeLessThan(cf({...BASE,diet:"heavy"}).breakdown.Food));
  it("vegan exact", () => expect(cf({...BASE,diet:"vegan"}).breakdown.Food).toBeCloseTo(DIET_FACTORS.vegan/1000,4));
});

describe("computeFootprint — waste & water", () => {
  it("most < sometimes < rarely", () => { const m=cf({...BASE,waste:"most"}).breakdown.Waste; const s=cf({...BASE,waste:"sometimes"}).breakdown.Waste; const r=cf({...BASE,waste:"rarely"}).breakdown.Waste; expect(m).toBeLessThan(s); expect(s).toBeLessThan(r); });
  it("water scales", () => expect(cf({...BASE,waterLpd:200}).breakdown.Water).toBeGreaterThan(cf({...BASE,waterLpd:50}).breakdown.Water));
  it("water formula", () => expect(cf({...BASE,waterLpd:100}).breakdown.Water).toBeCloseTo(100*365*WATER_FACTOR/1000,5));
});

describe("computeFootprint — shopping", () => {
  it("higher spend = higher emissions", () => expect(cf({...BASE,shoppingSpend:5000}).breakdown.Shopping).toBeGreaterThan(cf({...BASE,shoppingSpend:500}).breakdown.Shopping));
  it("formula correct", () => expect(cf({...BASE,shoppingSpend:3000}).breakdown.Shopping).toBeCloseTo(3000*12*SHOPPING_FACTOR/1000,5));
});

describe("computeFootprint — totals", () => {
  it("total = sum of breakdown", () => { const r=cf(DEFAULT_INPUTS); const sum=Object.values(r.breakdown).reduce((a,b)=>a+b,0); expect(r.totalTons).toBeCloseTo(sum,5); });
  it("total non-negative", () => expect(cf({...BASE,carType:"ev"}).totalTons).toBeGreaterThanOrEqual(0));
  it("typical Indian user 1-5t", () => { const r=cf(DEFAULT_INPUTS); expect(r.totalTons).toBeGreaterThan(1); expect(r.totalTons).toBeLessThan(5); });
  it("breakdown keys correct", () => { const keys=Object.keys(cf(BASE).breakdown); expect(keys).toContain("Transport"); expect(keys).toContain("Energy"); expect(keys).toContain("Food"); });
});

// ═══════════════════════════════════════════════════════════════════════════
// UNIT TESTS — other pure functions
// ═══════════════════════════════════════════════════════════════════════════
describe("levelFromXP", () => {
  it("0 xp = level 1", () => expect(levelFromXP(0)).toBe(1));
  it("199 xp = level 1", () => expect(levelFromXP(199)).toBe(1));
  it("200 xp = level 2", () => expect(levelFromXP(200)).toBe(2));
  it("400 xp = level 3", () => expect(levelFromXP(400)).toBe(3));
  it("800 xp = level 5", () => expect(levelFromXP(800)).toBe(5));
  it("monotonic", () => expect(levelFromXP(500)).toBeGreaterThanOrEqual(levelFromXP(200)));
});

describe("computeSustainabilityScore", () => {
  it("at paris target = 100", () => expect(computeSustainabilityScore(PARIS_TARGET)).toBe(100));
  it("above global avg = 0", () => expect(computeSustainabilityScore(GLOBAL_AVG + 5)).toBe(0));
  it("0-100 range", () => { [1,2,3,4,5].forEach(t => { const s=computeSustainabilityScore(t); expect(s).toBeGreaterThanOrEqual(0); expect(s).toBeLessThanOrEqual(100); }); });
  it("lower footprint = higher score", () => expect(computeSustainabilityScore(1.5)).toBeGreaterThan(computeSustainabilityScore(3.5)));
});

describe("computeTreesNeeded", () => {
  it("at least 1 tree", () => expect(computeTreesNeeded(0)).toBeGreaterThanOrEqual(1));
  it("more tons = more trees", () => expect(computeTreesNeeded(4)).toBeGreaterThan(computeTreesNeeded(2)));
  it("formula correct", () => expect(computeTreesNeeded(1.9)).toBe(Math.max(1,Math.ceil(1900/TREE_ABSORPTION))));
});

describe("computePredictions", () => {
  it("null < 2 entries", () => { expect(computePredictions([])).toBeNull(); expect(computePredictions([{date:"2024-01",total:2}])).toBeNull(); });
  it("upward trend", () => { const p=computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]); expect(p.nextTotal).toBeGreaterThan(2.5); expect(p.avgDelta).toBeCloseTo(0.5,4); });
  it("downward trend", () => { const p=computePredictions([{date:"2024-01",total:3},{date:"2024-02",total:2.5},{date:"2024-03",total:2}]); expect(p.nextTotal).toBeLessThan(2); });
  it("nextTotal never negative", () => { const p=computePredictions([{date:"2024-01",total:0.1},{date:"2024-02",total:0}]); expect(p.nextTotal).toBeGreaterThanOrEqual(0); });
  it("chartData has projected point", () => { const p=computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]); const hasProjected=p.chartData.some(d=>d.projected!==null); expect(hasProjected).toBe(true); });
  it("yearProjection > nextTotal on upward", () => { const p=computePredictions([{date:"2024-01",total:2},{date:"2024-02",total:2.5}]); expect(p.yearProjection).toBeGreaterThan(p.nextTotal); });
});

describe("buildRoadmap", () => {
  it("returns array", () => { const r=cf(DEFAULT_INPUTS); expect(Array.isArray(buildRoadmap(DEFAULT_INPUTS,r))).toBe(true); });
  it("sorted by saving desc", () => { const r=cf(DEFAULT_INPUTS); const items=buildRoadmap(DEFAULT_INPUTS,r); for(let i=1;i<items.length;i++) expect(items[i-1].saving).toBeGreaterThanOrEqual(items[i].saving); });
  it("each item has required fields", () => { const r=cf(DEFAULT_INPUTS); buildRoadmap(DEFAULT_INPUTS,r).forEach(item=>{ expect(item).toHaveProperty("id"); expect(item).toHaveProperty("title"); expect(item).toHaveProperty("saving"); expect(item).toHaveProperty("priority"); }); });
  it("vegan+ev+zero = empty/minimal roadmap", () => { const inp={...BASE,diet:"vegan",carType:"ev",waste:"most"}; const r=cf(inp); expect(buildRoadmap(inp,r).length).toBeLessThanOrEqual(2); });
});

describe("constants sanity", () => {
  it("paris < national avg", () => expect(PARIS_TARGET).toBeLessThan(NATIONAL_AVG+1));
  it("national < global", () => expect(NATIONAL_AVG).toBeLessThan(GLOBAL_AVG));
  it("tree absorption positive", () => expect(TREE_ABSORPTION).toBeGreaterThan(0));
  it("grid factor positive", () => expect(GRID_FACTOR).toBeGreaterThan(0));
  it("all car factors positive", () => Object.values(CAR_FACTORS).forEach(v=>expect(v).toBeGreaterThan(0)));
  it("EV factor lowest", () => expect(CAR_FACTORS.ev).toBeLessThan(CAR_FACTORS.petrol));
});
