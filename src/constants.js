/**
 * @fileoverview Emission factors and reference constants for EcoSense AI.
 * All values are India-weighted averages (kg CO₂e per unit) unless noted.
 * Sources: CEA 2023 (grid), IPCC AR6 (food), MoRTH (transport), WHO (water).
 */

/** @type {Object.<string, number>} kg CO₂e per km by fuel type */
export const CAR_FACTORS = {
  petrol: 0.192,
  diesel: 0.171,
  cng:    0.13,
  ev:     0.05,
};

/** kg CO₂e per km — two-wheeler (petrol average) */
export const TWO_WHEELER_FACTOR = 0.045;

/** kg CO₂e per km — bus/metro/train weighted average */
export const PUBLIC_TRANSPORT_FACTOR = 0.04;

/** kg CO₂e per domestic round-trip flight (India average ~1000km) */
export const DOMESTIC_FLIGHT_RT = 900;

/** kg CO₂e per international round-trip flight (average ~7000km) */
export const INTL_FLIGHT_RT = 2500;

/** kg CO₂e per kWh — India grid emission factor (CEA 2023) */
export const GRID_FACTOR = 0.82;

/** kg CO₂e per standard 14.2 kg LPG cylinder */
export const LPG_CYLINDER_FACTOR = 42.6;

/** @type {Object.<string, number>} Annual food kg CO₂e by diet pattern */
export const DIET_FACTORS = {
  vegan:       1000,
  vegetarian:  1500,
  eggetarian:  1700,
  moderate:    2100,
  heavy:       3200,
};

/** @type {Object.<string, number>} Annual waste kg CO₂e by segregation habit */
export const WASTE_FACTORS = {
  most:      30,
  sometimes: 55,
  rarely:    80,
};

/** kg CO₂e per litre of water (pumping + treatment energy) */
export const WATER_FACTOR = 0.00035;

/** kg CO₂e per INR spent on discretionary goods (embedded carbon proxy) */
export const SHOPPING_FACTOR = 0.0005;

/** Benchmark: India per-capita average (tons CO₂e/year) */
export const NATIONAL_AVG = 1.9;

/** Benchmark: Global per-capita average (tons CO₂e/year) */
export const GLOBAL_AVG = 4.7;

/** Benchmark: 1.5°C-aligned per-capita target (tons CO₂e/year) */
export const PARIS_TARGET = 2.0;

/** kg CO₂ absorbed per mature tree per year (commonly cited average) */
export const TREE_ABSORPTION = 21;

/** Default calculator inputs for a typical urban Indian user */
export const DEFAULT_INPUTS = {
  carType:        "petrol",
  carKm:          50,
  twoWheelerKm:   40,
  publicKm:       20,
  domesticFlights:1,
  intlFlights:    0,
  electricity:    150,
  lpgCylinders:   1,
  diet:           "moderate",
  waterLpd:       120,
  waste:          "sometimes",
  shoppingSpend:  3000,
};

/** Navigation item definition */
export const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",    icon: "LayoutDashboard" },
  { id: "calculator",   label: "Calculator",   icon: "CalcIcon" },
  { id: "coach",        label: "AI Coach",     icon: "Sparkles" },
  { id: "scanner",      label: "Bill Scanner", icon: "ScanLine" },
  { id: "predictions",  label: "Predictions",  icon: "TrendingUp" },
  { id: "roadmap",      label: "Roadmap",      icon: "MapIcon" },
  { id: "offset",       label: "Tree Offset",  icon: "TreePine" },
  { id: "gamification", label: "Challenges",   icon: "Trophy" },
  { id: "leaderboard",  label: "Leaderboard",  icon: "Award" },
  { id: "greenhub",     label: "Green Hub",    icon: "Recycle" },
  { id: "analytics",    label: "Analytics",    icon: "BarChart3" },
  { id: "profile",      label: "Profile",      icon: "User" },
];

/** XP required per level */
export const XP_PER_LEVEL = 200;

/** Daily missions definition */
export const DAILY_MISSIONS = [
  { id: "log-commute",    label: "Log today's commute in the calculator", xp: 10 },
  { id: "meat-free-meal", label: "Have one fully plant-based meal",       xp: 10 },
  { id: "unplug",         label: "Unplug idle chargers before bed",       xp: 5  },
  { id: "short-shower",   label: "Keep your shower under 5 minutes",      xp: 5  },
];

/** Eco tips for Green Hub */
export const ECO_TIPS = [
  { title: "Switch to LED bulbs",          text: "LEDs use up to 80% less energy than incandescent bulbs." },
  { title: "Carpool or share rides",       text: "Sharing a ride even twice a week cuts transport emissions." },
  { title: "Unplug standby devices",       text: "Standby devices can account for 5-10% of household electricity." },
  { title: "Compost kitchen waste",        text: "Composting wet waste reduces methane from landfills." },
  { title: "Air-dry laundry",              text: "Skipping the dryer saves significant electricity over a year." },
  { title: "Buy local & seasonal produce", text: "Locally grown food travels less and is usually fresher." },
  { title: "Fix leaking taps promptly",    text: "A dripping tap can waste thousands of litres a year." },
  { title: "Choose repair over replace",   text: "Extending a product's life cuts its lifetime carbon footprint." },
];

/** Green product recommendations */
export const GREEN_PRODUCTS = [
  { name: "Solar-powered chargers",              note: "Great for phones and small devices." },
  { name: "Refillable water bottles",            note: "Cuts single-use plastic significantly." },
  { name: "Energy-efficient (5-star) appliances",note: "Lower lifetime electricity bills." },
  { name: "Reusable cloth bags",                 note: "One bag replaces hundreds of plastic bags." },
];
