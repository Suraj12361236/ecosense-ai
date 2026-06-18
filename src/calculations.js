/**
 * @fileoverview Pure calculation functions for EcoSense AI.
 * All functions are side-effect free and fully unit-tested.
 */

import {
  CAR_FACTORS, TWO_WHEELER_FACTOR, PUBLIC_TRANSPORT_FACTOR,
  DOMESTIC_FLIGHT_RT, INTL_FLIGHT_RT, GRID_FACTOR, LPG_CYLINDER_FACTOR,
  DIET_FACTORS, WASTE_FACTORS, WATER_FACTOR, SHOPPING_FACTOR,
  NATIONAL_AVG, GLOBAL_AVG, PARIS_TARGET, TREE_ABSORPTION, XP_PER_LEVEL,
} from "./constants.js";

/**
 * @typedef {Object} FootprintInputs
 * @property {string} carType       - "petrol" | "diesel" | "cng" | "ev"
 * @property {number} carKm         - Weekly car distance in km
 * @property {number} twoWheelerKm  - Weekly two-wheeler distance in km
 * @property {number} publicKm      - Weekly public transport distance in km
 * @property {number} domesticFlights - Round trips per year (domestic)
 * @property {number} intlFlights   - Round trips per year (international)
 * @property {number} electricity   - Monthly electricity use in kWh
 * @property {number} lpgCylinders  - Monthly LPG cylinders (14.2 kg)
 * @property {string} diet          - "vegan" | "vegetarian" | "eggetarian" | "moderate" | "heavy"
 * @property {number} waterLpd      - Daily water use in litres
 * @property {string} waste         - "most" | "sometimes" | "rarely"
 * @property {number} shoppingSpend - Monthly discretionary spend in INR
 */

/**
 * @typedef {Object} FootprintResult
 * @property {number} totalTons - Total annual footprint in tons CO₂e
 * @property {Object} breakdown - Per-category breakdown in tons CO₂e
 * @property {Object} raw       - Raw kg values per source
 */

/**
 * Computes annual carbon footprint from lifestyle inputs.
 * @param {FootprintInputs} inputs - User lifestyle data
 * @returns {FootprintResult}
 */
export function computeFootprint(inputs) {
  const carKg        = inputs.carKm * 52 * (CAR_FACTORS[inputs.carType] || 0);
  const twoWheelerKg = inputs.twoWheelerKm * 52 * TWO_WHEELER_FACTOR;
  const publicKg     = inputs.publicKm * 52 * PUBLIC_TRANSPORT_FACTOR;
  const flightsKg    = inputs.domesticFlights * DOMESTIC_FLIGHT_RT + inputs.intlFlights * INTL_FLIGHT_RT;
  const transportKg  = carKg + twoWheelerKg + publicKg + flightsKg;

  const energyKg   = inputs.electricity * 12 * GRID_FACTOR + inputs.lpgCylinders * 12 * LPG_CYLINDER_FACTOR;
  const foodKg     = DIET_FACTORS[inputs.diet] || 0;
  const wasteKg    = WASTE_FACTORS[inputs.waste] || 0;
  const waterKg    = inputs.waterLpd * 365 * WATER_FACTOR;
  const shoppingKg = inputs.shoppingSpend * 12 * SHOPPING_FACTOR;

  const totalKg = transportKg + energyKg + foodKg + wasteKg + waterKg + shoppingKg;

  return {
    totalTons: totalKg / 1000,
    breakdown: {
      Transport: transportKg / 1000,
      Energy:    energyKg / 1000,
      Food:      foodKg / 1000,
      Waste:     wasteKg / 1000,
      Water:     waterKg / 1000,
      Shopping:  shoppingKg / 1000,
    },
    raw: { carKg, twoWheelerKg, publicKg, flightsKg, energyKg, foodKg, wasteKg, waterKg, shoppingKg },
  };
}

/**
 * Computes user level from total XP.
 * Level increases every XP_PER_LEVEL points.
 * @param {number} xp - Total XP earned
 * @returns {number} Current level (minimum 1)
 */
export function levelFromXP(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/**
 * Computes a 0–100 sustainability score.
 * 100 = at or below Paris target. 0 = at or above global average.
 * @param {number} totalTons - Annual footprint in tons CO₂e
 * @returns {number} Score between 0 and 100 (integer)
 */
export function computeSustainabilityScore(totalTons) {
  return Math.max(0, Math.min(100,
    Math.round(100 - ((totalTons - PARIS_TARGET) / (GLOBAL_AVG - PARIS_TARGET)) * 100)
  ));
}

/**
 * Computes the number of trees needed to offset the annual footprint.
 * Based on average tree absorption of TREE_ABSORPTION kg CO₂/year.
 * @param {number} totalTons - Annual footprint in tons CO₂e
 * @returns {number} Trees needed (minimum 1, always integer)
 */
export function computeTreesNeeded(totalTons) {
  return Math.max(1, Math.ceil((totalTons * 1000) / TREE_ABSORPTION));
}

/**
 * @typedef {Object} PredictionResult
 * @property {number} avgDelta        - Average change per period
 * @property {number} nextTotal       - Projected next-period total (non-negative)
 * @property {number} yearProjection  - Projected yearly total (4 periods ahead)
 * @property {Array}  chartData       - Data points for chart rendering
 */

/**
 * Computes emission trend predictions from historical entries.
 * Requires at least 2 entries. Returns null if insufficient data.
 * Uses linear extrapolation (avg delta across all consecutive pairs).
 * @param {Array<{date: string, total: number}>} entries - Sorted log entries
 * @returns {PredictionResult|null}
 */
export function computePredictions(entries) {
  if (entries.length < 2) return null;

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;

  let totalDelta = 0;
  for (let i = 1; i < n; i++) {
    totalDelta += sorted[i].total - sorted[i - 1].total;
  }
  const avgDelta       = totalDelta / (n - 1);
  const last           = sorted[n - 1];
  const nextTotal      = Math.max(0, last.total + avgDelta);
  const yearProjection = Math.max(0, last.total + avgDelta * 4);

  const chartData = sorted.map((e) => ({
    date:      e.date,
    actual:    Number(e.total.toFixed(2)),
    projected: null,
  }));
  chartData[chartData.length - 1].projected = chartData[chartData.length - 1].actual;
  chartData.push({ date: "Next", actual: null, projected: Number(nextTotal.toFixed(2)) });

  return { avgDelta, nextTotal, yearProjection, chartData };
}

/**
 * @typedef {Object} RoadmapItem
 * @property {string}   id       - Unique action identifier
 * @property {Function} icon     - Lucide icon component
 * @property {string}   priority - "High" | "Medium" | "Low"
 * @property {string}   title    - Short action title
 * @property {string}   desc     - Detailed description with savings estimate
 * @property {number}   saving   - Estimated saving in tons CO₂e/year
 */

/**
 * Builds a personalized, prioritized carbon reduction roadmap.
 * Only includes actions relevant to the user's actual inputs.
 * Items are sorted by estimated saving (descending).
 * @param {FootprintInputs} inputs - User lifestyle data
 * @param {FootprintResult} result - Computed footprint result
 * @returns {RoadmapItem[]}
 */
export function buildRoadmap(inputs, result) {
  const items  = [];
  const { carKg, flightsKg } = result.raw;

  if (inputs.carKm > 0) {
    const saving = (inputs.carKm * 0.5 * 52 * (CAR_FACTORS[inputs.carType] - PUBLIC_TRANSPORT_FACTOR)) / 1000;
    if (saving > 0) {
      items.push({
        id:       "transport-shift",
        priority: saving > 0.4 ? "High" : "Medium",
        title:    "Shift half your car trips to public transport",
        desc:     `Moving half of your ${inputs.carKm} km/week driving to bus or metro cuts roughly ${saving.toFixed(2)} t CO₂e/year.`,
        saving,
      });
    }
  }

  if (inputs.electricity > 0) {
    const saving = (inputs.electricity * 0.15 * 12 * GRID_FACTOR) / 1000;
    items.push({
      id:       "energy-efficiency",
      priority: saving > 0.3 ? "High" : "Medium",
      title:    "Cut electricity use by 15%",
      desc:     `Efficient lighting and unplugging idle devices saves about ${saving.toFixed(2)} t CO₂e/year.`,
      saving,
    });
  }

  if (inputs.diet === "heavy" || inputs.diet === "moderate") {
    const saving = (DIET_FACTORS[inputs.diet] - DIET_FACTORS.vegetarian) / 1000;
    items.push({
      id:       "diet-shift",
      priority: saving > 0.5 ? "High" : "Medium",
      title:    "Add 3 plant-based days each week",
      desc:     `Shifting toward vegetarian meals more often could save roughly ${saving.toFixed(2)} t CO₂e/year.`,
      saving,
    });
  }

  if (inputs.waste !== "most") {
    const saving = (WASTE_FACTORS[inputs.waste] - WASTE_FACTORS.most) / 1000;
    items.push({
      id:       "waste-sort",
      priority: "Medium",
      title:    "Segregate wet, dry and recyclable waste",
      desc:     `Consistent segregation could save about ${saving.toFixed(2)} t CO₂e/year.`,
      saving,
    });
  }

  if (inputs.waterLpd > 100) {
    const saving = ((inputs.waterLpd - 100) * 365 * WATER_FACTOR) / 1000;
    items.push({
      id:       "water-saving",
      priority: "Low",
      title:    "Trim daily water use toward 100 L/day",
      desc:     `Shorter showers and fixing leaks could save about ${saving.toFixed(2)} t CO₂e/year.`,
      saving,
    });
  }

  if (inputs.shoppingSpend > 1500) {
    const saving = ((inputs.shoppingSpend - 1500) * 12 * SHOPPING_FACTOR) / 1000;
    items.push({
      id:       "shopping-mindful",
      priority: "Low",
      title:    "Buy fewer, longer-lasting items",
      desc:     `Cutting spending toward ₹1,500/month could avoid roughly ${saving.toFixed(2)} t CO₂e/year.`,
      saving,
    });
  }

  if (flightsKg > 0) {
    const saving = flightsKg / 4000;
    items.push({
      id:       "flights-reduce",
      priority: "Medium",
      title:    "Make every flight count",
      desc:     `Your flights add about ${(flightsKg / 1000).toFixed(2)} t CO₂e/year. Combine trips or fly direct.`,
      saving,
    });
  }

  return items.sort((a, b) => b.saving - a.saving);
}
