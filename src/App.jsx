import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Calculator as CalcIcon, Sparkles, ScanLine, TrendingUp,
  Map as MapIcon, TreePine, Trophy, Award, Recycle, BarChart3, User,
  Sun, Moon, Send, Upload, Car, Zap, Utensils, Trash2, Plane, Leaf, Target,
  Save, Bike, Bus, Flame, Droplets, ShoppingBag, ChevronRight, ChevronLeft,
  CheckCircle2, Bell, Star, Download, Lightbulb, Medal, Crown, X, Menu,
  Loader2, Plus, ArrowRight, Info, Users, Wind, Gauge as GaugeIcon, History,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from "recharts";

/* ============================================================================
   CONSTANTS — emission factors (illustrative, India-weighted, kg CO2e)
   ========================================================================== */
const CAR_FACTORS = { petrol: 0.192, diesel: 0.171, cng: 0.13, ev: 0.05 };
const TWO_WHEELER_FACTOR = 0.045;
const PUBLIC_TRANSPORT_FACTOR = 0.04;
const DOMESTIC_FLIGHT_RT = 900;
const INTL_FLIGHT_RT = 2500;
const GRID_FACTOR = 0.82;
const LPG_CYLINDER_FACTOR = 42.6;
const DIET_FACTORS = { vegan: 1000, vegetarian: 1500, eggetarian: 1700, moderate: 2100, heavy: 3200 };
const WASTE_FACTORS = { most: 30, sometimes: 55, rarely: 80 };
const WATER_FACTOR = 0.00035; // kg CO2e per litre
const SHOPPING_FACTOR = 0.0005; // kg CO2e per INR spent

const NATIONAL_AVG = 1.9;
const GLOBAL_AVG = 4.7;
const PARIS_TARGET = 2.0;
const TREE_ABSORPTION = 21; // kg CO2 absorbed per tree per year

const CATEGORY_META = {
  Transport: { icon: Car, color: "#38BDF8" },
  Energy: { icon: Zap, color: "#FBBF24" },
  Food: { icon: Utensils, color: "#34D399" },
  Waste: { icon: Trash2, color: "#A78BFA" },
  Water: { icon: Droplets, color: "#22D3EE" },
  Shopping: { icon: ShoppingBag, color: "#F472B6" },
};

const DEFAULT_INPUTS = {
  carType: "petrol", carKm: 50, twoWheelerKm: 40, publicKm: 20,
  domesticFlights: 1, intlFlights: 0,
  electricity: 150, lpgCylinders: 1,
  diet: "moderate",
  waterLpd: 120, waste: "sometimes",
  shoppingSpend: 3000,
};

/* ============================================================================
   CALCULATION HELPERS
   ========================================================================== */
function computeFootprint(inputs) {
  const carKg = inputs.carKm * 52 * (CAR_FACTORS[inputs.carType] || 0);
  const twoWheelerKg = inputs.twoWheelerKm * 52 * TWO_WHEELER_FACTOR;
  const publicKg = inputs.publicKm * 52 * PUBLIC_TRANSPORT_FACTOR;
  const flightsKg = inputs.domesticFlights * DOMESTIC_FLIGHT_RT + inputs.intlFlights * INTL_FLIGHT_RT;
  const transportKg = carKg + twoWheelerKg + publicKg + flightsKg;

  const energyKg = inputs.electricity * 12 * GRID_FACTOR + inputs.lpgCylinders * 12 * LPG_CYLINDER_FACTOR;
  const foodKg = DIET_FACTORS[inputs.diet] || 0;
  const wasteKg = WASTE_FACTORS[inputs.waste] || 0;
  const waterKg = inputs.waterLpd * 365 * WATER_FACTOR;
  const shoppingKg = inputs.shoppingSpend * 12 * SHOPPING_FACTOR;

  const totalKg = transportKg + energyKg + foodKg + wasteKg + waterKg + shoppingKg;

  return {
    totalTons: totalKg / 1000,
    breakdown: {
      Transport: transportKg / 1000,
      Energy: energyKg / 1000,
      Food: foodKg / 1000,
      Waste: wasteKg / 1000,
      Water: waterKg / 1000,
      Shopping: shoppingKg / 1000,
    },
    raw: { carKg, twoWheelerKg, publicKg, flightsKg, energyKg, foodKg, wasteKg, waterKg, shoppingKg },
  };
}

function buildRoadmap(inputs, result) {
  const items = [];
  const { carKg, flightsKg } = result.raw;

  if (inputs.carKm > 0) {
    const saving = (inputs.carKm * 0.5 * 52 * (CAR_FACTORS[inputs.carType] - PUBLIC_TRANSPORT_FACTOR)) / 1000;
    if (saving > 0) {
      items.push({
        id: "transport-shift", icon: Bus, priority: saving > 0.4 ? "High" : "Medium",
        title: "Shift half your car trips to public transport",
        desc: `You currently drive ${inputs.carKm} km/week. Moving half of that to bus or metro cuts roughly ${saving.toFixed(2)} t CO2e/year.`,
        saving,
      });
    }
  }
  if (inputs.electricity > 0) {
    const saving = (inputs.electricity * 0.15 * 12 * GRID_FACTOR) / 1000;
    items.push({
      id: "energy-efficiency", icon: Zap, priority: saving > 0.3 ? "High" : "Medium",
      title: "Cut electricity use by 15%",
      desc: `Efficient lighting, fans on timers and unplugging idle devices on ${inputs.electricity} kWh/month saves about ${saving.toFixed(2)} t CO2e/year.`,
      saving,
    });
  }
  if (inputs.diet === "heavy" || inputs.diet === "moderate") {
    const saving = (DIET_FACTORS[inputs.diet] - DIET_FACTORS.vegetarian) / 1000;
    items.push({
      id: "diet-shift", icon: Utensils, priority: saving > 0.5 ? "High" : "Medium",
      title: "Add 3 plant-based days each week",
      desc: `Shifting toward vegetarian meals more often could save roughly ${saving.toFixed(2)} t CO2e/year from food alone.`,
      saving,
    });
  }
  if (inputs.waste !== "most") {
    const saving = (WASTE_FACTORS[inputs.waste] - WASTE_FACTORS.most) / 1000;
    items.push({
      id: "waste-sort", icon: Trash2, priority: "Medium",
      title: "Segregate wet, dry and recyclable waste",
      desc: `Consistent segregation and composting could save about ${saving.toFixed(2)} t CO2e/year.`,
      saving,
    });
  }
  if (inputs.waterLpd > 100) {
    const saving = ((inputs.waterLpd - 100) * 365 * WATER_FACTOR) / 1000;
    items.push({
      id: "water-saving", icon: Droplets, priority: "Low",
      title: "Trim daily water use toward 100 L/day",
      desc: `Shorter showers and fixing leaks could save about ${saving.toFixed(2)} t CO2e/year via reduced pumping & treatment energy.`,
      saving,
    });
  }
  if (inputs.shoppingSpend > 1500) {
    const saving = ((inputs.shoppingSpend - 1500) * 12 * SHOPPING_FACTOR) / 1000;
    items.push({
      id: "shopping-mindful", icon: ShoppingBag, priority: "Low",
      title: "Buy fewer, longer-lasting items",
      desc: `Cutting discretionary spending toward ₹1,500/month could avoid roughly ${saving.toFixed(2)} t CO2e/year embedded in goods.`,
      saving,
    });
  }
  if (flightsKg > 0) {
    items.push({
      id: "flights-reduce", icon: Plane, priority: "Medium",
      title: "Make every flight count",
      desc: `Your flights add about ${(flightsKg / 1000).toFixed(2)} t CO2e/year. Combine trips, fly direct, or consider trains for short routes.`,
      saving: flightsKg / 4000,
    });
  }
  return items.sort((a, b) => b.saving - a.saving);
}

function computePredictions(entries) {
  if (entries.length < 2) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;
  let totalDelta = 0;
  for (let i = 1; i < n; i++) totalDelta += sorted[i].total - sorted[i - 1].total;
  const avgDelta = totalDelta / (n - 1);
  const last = sorted[n - 1];
  const nextTotal = Math.max(0, last.total + avgDelta);
  const yearProjection = Math.max(0, last.total + avgDelta * 4);

  let riskCategory = null, riskDelta = -Infinity;
  const first = sorted[0];
  if (last.breakdown && first.breakdown) {
    Object.keys(last.breakdown).forEach((cat) => {
      const d = (last.breakdown[cat] || 0) - (first.breakdown[cat] || 0);
      if (d > riskDelta) { riskDelta = d; riskCategory = cat; }
    });
  }

  const chartData = sorted.map((e) => ({ date: e.date, actual: Number(e.total.toFixed(2)), projected: null }));
  chartData[chartData.length - 1].projected = chartData[chartData.length - 1].actual;
  chartData.push({ date: "Next", actual: null, projected: Number(nextTotal.toFixed(2)) });

  return { avgDelta, nextTotal, yearProjection, riskCategory, riskDelta, chartData };
}

function levelFromXP(xp) { return Math.floor(xp / 200) + 1; }

const BADGES = [
  { id: "first-step", label: "First Step", icon: Star, desc: "Completed your first calculation", check: (s) => s.entries.length >= 1 },
  { id: "on-target", label: "On Target", icon: Target, desc: "Footprint at or below the 1.5°C target", check: (s) => s.result.totalTons <= PARIS_TARGET },
  { id: "consistent", label: "Consistent Tracker", icon: TrendingUp, desc: "Logged at least 3 entries", check: (s) => s.entries.length >= 3 },
  { id: "planner", label: "Roadmap Rookie", icon: MapIcon, desc: "Completed a roadmap action", check: (s) => s.roadmapDone.length >= 1 },
  { id: "tree-hugger", label: "Tree Hugger", icon: TreePine, desc: "Logged your first planted tree", check: (s) => s.treesPlanted >= 1 },
  { id: "community", label: "Community Member", icon: Users, desc: "Joined the global leaderboard", check: (s) => s.joinedLeaderboard },
  { id: "eco-warrior", label: "Eco Warrior", icon: Crown, desc: "Reached level 5", check: (s) => levelFromXP(s.xp) >= 5 },
];

const DAILY_MISSIONS = [
  { id: "log-commute", label: "Log today's commute in the calculator", xp: 10 },
  { id: "meat-free-meal", label: "Have one fully plant-based meal", xp: 10 },
  { id: "unplug", label: "Unplug idle chargers before bed", xp: 5 },
  { id: "short-shower", label: "Keep your shower under 5 minutes", xp: 5 },
];

const ECO_TIPS = [
  { title: "Switch to LED bulbs", text: "LEDs use up to 80% less energy than incandescent bulbs and last far longer.", icon: Lightbulb },
  { title: "Carpool or share rides", text: "Sharing a ride even twice a week meaningfully cuts your transport emissions.", icon: Users },
  { title: "Unplug standby devices", text: "Devices on standby can account for 5-10% of household electricity use.", icon: Zap },
  { title: "Compost kitchen waste", text: "Composting wet waste reduces methane from landfills and enriches soil.", icon: Recycle },
  { title: "Air-dry laundry", text: "Skipping the dryer when possible saves significant electricity over a year.", icon: Wind },
  { title: "Buy local & seasonal produce", text: "Locally grown food travels less and is usually fresher and cheaper.", icon: Leaf },
  { title: "Fix leaking taps promptly", text: "A single dripping tap can waste thousands of litres of water a year.", icon: Droplets },
  { title: "Choose repair over replace", text: "Extending a product's life by even a year cuts its lifetime carbon footprint per use.", icon: ShoppingBag },
];

const GREEN_PRODUCTS = [
  { name: "Solar-powered chargers", note: "Great for phones and small devices, especially during outdoor trips." },
  { name: "Refillable water bottles & containers", note: "Cuts single-use plastic significantly over a year." },
  { name: "Energy-efficient (5-star) appliances", note: "Higher upfront cost, lower lifetime electricity bills and emissions." },
  { name: "Reusable cloth bags", note: "One sturdy bag can replace hundreds of plastic bags over its life." },
];

/* ============================================================================
   NAVIGATION
   ========================================================================== */
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calculator", label: "Calculator", icon: CalcIcon },
  { id: "coach", label: "AI Coach", icon: Sparkles },
  { id: "scanner", label: "Bill Scanner", icon: ScanLine },
  { id: "predictions", label: "Predictions", icon: TrendingUp },
  { id: "roadmap", label: "Roadmap", icon: MapIcon },
  { id: "offset", label: "Tree Offset", icon: TreePine },
  { id: "gamification", label: "Challenges", icon: Trophy },
  { id: "leaderboard", label: "Leaderboard", icon: Award },
  { id: "greenhub", label: "Green Hub", icon: Recycle },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];
const MOBILE_PRIMARY = ["dashboard", "calculator", "coach", "roadmap"];

/* ============================================================================
   SMALL REUSABLE UI PIECES
   ========================================================================== */
function PageHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="page-header">
      <div className="page-header-icon"><Icon size={22} /></div>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

function Card({ children, className = "", style }) {
  return <div className={`glass-card ${className}`} style={style}>{children}</div>;
}

function ProgressBar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color || "var(--accent-grad)" }} />
    </div>
  );
}

function Pill({ children, tone = "default" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={26} /></div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

function RadialScore({ value, max = 100, label, sublabel, size = 140 }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / max));
  return (
    <div className="radial-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-border)" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke="url(#radialGrad)" strokeWidth="10" fill="none"
          strokeDasharray={`${c * pct} ${c}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="radial-arc"
        />
        <defs>
          <linearGradient id="radialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="radial-center">
        <span className="radial-value">{Math.round(value)}</span>
        {label && <span className="radial-label">{label}</span>}
        {sublabel && <span className="radial-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}

function FootprintGauge({ totalTons }) {
  const max = 8;
  const clamped = Math.min(Math.max(totalTons, 0), max);
  const angle = -180 + (clamped / max) * 180;
  const rad = (angle * Math.PI) / 180;
  const cx = 150, cy = 150, r = 110;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);
  const zones = [
    { from: 0, to: PARIS_TARGET, color: "#34D399" },
    { from: PARIS_TARGET, to: NATIONAL_AVG + 1.5, color: "#FBBF24" },
    { from: NATIONAL_AVG + 1.5, to: max, color: "#F87171" },
  ];
  const arcPath = (from, to) => {
    const a1 = -180 + (from / max) * 180, a2 = -180 + (to / max) * 180;
    const r1 = (a1 * Math.PI) / 180, r2 = (a2 * Math.PI) / 180;
    return `M ${cx + r * Math.cos(r1)} ${cy + r * Math.sin(r1)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(r2)} ${cy + r * Math.sin(r2)}`;
  };
  return (
    <svg viewBox="0 0 300 170" className="gauge-svg">
      {zones.map((z, i) => (
        <path key={i} d={arcPath(z.from, z.to)} stroke={z.color} strokeWidth="16" fill="none" />
      ))}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--text)" strokeWidth="3" strokeLinecap="round" className="gauge-needle" />
      <circle cx={cx} cy={cy} r="6" fill="var(--text)" />
      <text x={cx} y={cy - 24} textAnchor="middle" className="gauge-value">{totalTons.toFixed(2)}</text>
      <text x={cx} y={cy - 6} textAnchor="middle" className="gauge-unit">tons CO2e / year</text>
    </svg>
  );
}

/* ============================================================================
   AI HELPERS — Anthropic API (substitutes for Gemini in this sandbox)
   ========================================================================== */
async function askClaude(messages, system) {
  // In the Claude.ai artifact sandbox this calls the Anthropic API directly with
  // no key needed. In a standalone deployment, point this at your own backend
  // proxy (see api/claude.js) which holds the real API key server-side.
  const endpoint = import.meta.env.VITE_CLAUDE_API_URL || "/api/claude";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system,
      messages,
    }),
  });
  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }
  const data = await response.json();
  const text = (data.content || []).map((b) => b.text || "").join("\n").trim();
  return text;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ============================================================================
   PAGE: DASHBOARD
   ========================================================================== */
function DashboardPage({ result, entries, treesPlanted, gami, profile }) {
  const pieData = Object.entries(result.breakdown).map(([name, value]) => ({
    name, value: Number(value.toFixed(3)), color: CATEGORY_META[name].color,
  }));
  const trendData = entries.slice(-8).map((e) => ({ date: e.date, total: Number(e.total.toFixed(2)) }));
  const treesNeeded = Math.max(1, Math.ceil((result.totalTons * 1000) / TREE_ABSORPTION));
  const score = Math.max(0, Math.min(100, Math.round(100 - ((result.totalTons - PARIS_TARGET) / (GLOBAL_AVG - PARIS_TARGET)) * 100)));

  return (
    <div className="page">
      <PageHeader icon={LayoutDashboard} title={`Welcome back${profile.name ? ", " + profile.name : ""}`} subtitle="Here's where your footprint stands today." />

      <div className="stat-grid">
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#34D399,#22D3EE)" }}><Leaf size={18} /></div>
          <div><p className="stat-value">{result.totalTons.toFixed(2)} t</p><p className="stat-label">Annual footprint</p></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#38BDF8,#6366F1)" }}><Target size={18} /></div>
          <div><p className="stat-value">{(result.totalTons - PARIS_TARGET).toFixed(2)} t</p><p className="stat-label">{result.totalTons > PARIS_TARGET ? "Above target" : "Under target"}</p></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#A7F3D0,#34D399)" }}><TreePine size={18} /></div>
          <div><p className="stat-value">{treesNeeded}</p><p className="stat-label">Trees to offset / year</p></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#FBBF24,#F472B6)" }}><Trophy size={18} /></div>
          <div><p className="stat-value">Lvl {levelFromXP(gami.xp)}</p><p className="stat-label">{gami.xp} XP earned</p></div>
        </Card>
      </div>

      <div className="grid-2">
        <Card>
          <h2 className="card-title"><GaugeIcon size={18} /> Footprint gauge</h2>
          <div className="gauge-card">
            <FootprintGauge totalTons={result.totalTons} />
            <div className="compare-list">
              <div className="compare-row"><span>Your sustainability score</span><span>{score} / 100</span></div>
              <div className="compare-row"><span>1.5°C-aligned target</span><span>{PARIS_TARGET.toFixed(1)} t</span></div>
              <div className="compare-row"><span>India average</span><span>{NATIONAL_AVG.toFixed(1)} t</span></div>
              <div className="compare-row"><span>Global average</span><span>{GLOBAL_AVG.toFixed(1)} t</span></div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="card-title"><BarChart3 size={18} /> Emission breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v) => `${v} t CO2e`} contentStyle={tooltipStyle()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <h2 className="card-title"><TrendingUp size={18} /> Your trend</h2>
        {trendData.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No history yet" text="Save a calculation to start building your trend over time." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} unit=" t" />
              <Tooltip formatter={(v) => `${v} t CO2e`} contentStyle={tooltipStyle()} />
              <Line type="monotone" dataKey="total" stroke="#34D399" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={700} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

function tooltipStyle() {
  return { background: "var(--surface-solid)", border: "1px solid var(--surface-border)", borderRadius: 10, fontSize: 12, color: "var(--text)" };
}

/* ============================================================================
   PAGE: CALCULATOR (multi-step wizard)
   ========================================================================== */
const WIZARD_STEPS = ["Transport", "Energy", "Food & Diet", "Water & Waste", "Shopping", "Results"];

function Row({ label, icon: Icon, children }) {
  return (
    <div className="row">
      <label>{Icon && <Icon size={14} className="row-icon" />}{label}</label>
      {children}
    </div>
  );
}

function CalculatorPage({ inputs, setInputs, result, onSave, saveStatus }) {
  const [step, setStep] = useState(0);
  const update = (key, value) => setInputs((p) => ({ ...p, [key]: value }));
  const pieData = Object.entries(result.breakdown).map(([name, value]) => ({ name, value: Number(value.toFixed(3)), color: CATEGORY_META[name].color }));

  return (
    <div className="page">
      <PageHeader icon={CalcIcon} title="Smart Carbon Calculator" subtitle="A few quick steps — your footprint updates live as you go." />

      <div className="wizard-progress">
        {WIZARD_STEPS.map((label, i) => (
          <div key={label} className={`wizard-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}>
            <div className="wizard-dot">{i < step ? <CheckCircle2 size={14} /> : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="grid-2 wizard-grid">
        <Card>
          {step === 0 && (
            <div className="fade-in">
              <h2 className="card-title"><Car size={18} /> Transport — per week</h2>
              <Row label="Car / taxi distance (km)" icon={Car}>
                <input type="number" min="0" value={inputs.carKm} onChange={(e) => update("carKm", Number(e.target.value))} />
              </Row>
              <Row label="Car fuel type" icon={Car}>
                <select value={inputs.carType} onChange={(e) => update("carType", e.target.value)}>
                  <option value="petrol">Petrol</option><option value="diesel">Diesel</option>
                  <option value="cng">CNG</option><option value="ev">Electric</option>
                </select>
              </Row>
              <Row label="Two-wheeler distance (km)" icon={Bike}>
                <input type="number" min="0" value={inputs.twoWheelerKm} onChange={(e) => update("twoWheelerKm", Number(e.target.value))} />
              </Row>
              <Row label="Bus / train distance (km)" icon={Bus}>
                <input type="number" min="0" value={inputs.publicKm} onChange={(e) => update("publicKm", Number(e.target.value))} />
              </Row>
              <Row label="Domestic flights (round trips/yr)" icon={Plane}>
                <input type="number" min="0" value={inputs.domesticFlights} onChange={(e) => update("domesticFlights", Number(e.target.value))} />
              </Row>
              <Row label="International flights (round trips/yr)" icon={Plane}>
                <input type="number" min="0" value={inputs.intlFlights} onChange={(e) => update("intlFlights", Number(e.target.value))} />
              </Row>
            </div>
          )}

          {step === 1 && (
            <div className="fade-in">
              <h2 className="card-title"><Zap size={18} /> Home energy — per month</h2>
              <Row label="Electricity use (kWh)" icon={Zap}>
                <input type="number" min="0" value={inputs.electricity} onChange={(e) => update("electricity", Number(e.target.value))} />
              </Row>
              <Row label="LPG cylinders (14.2 kg)" icon={Flame}>
                <input type="number" min="0" step="0.5" value={inputs.lpgCylinders} onChange={(e) => update("lpgCylinders", Number(e.target.value))} />
              </Row>
              <p className="hint-text"><Info size={13} /> Tip: use the Bill Scanner to auto-fill your electricity number from a photo of your bill.</p>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <h2 className="card-title"><Utensils size={18} /> Food & diet</h2>
              <Row label="Diet pattern" icon={Utensils}>
                <select value={inputs.diet} onChange={(e) => update("diet", e.target.value)}>
                  <option value="vegan">Vegan</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="moderate">Non-veg, moderate</option>
                  <option value="heavy">Non-veg, daily</option>
                </select>
              </Row>
              <p className="hint-text"><Info size={13} /> Food choices are one of the biggest personal levers — even a few plant-based days a week add up.</p>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <h2 className="card-title"><Droplets size={18} /> Water & waste</h2>
              <Row label="Water use (litres/day)" icon={Droplets}>
                <input type="number" min="0" value={inputs.waterLpd} onChange={(e) => update("waterLpd", Number(e.target.value))} />
              </Row>
              <Row label="Waste segregation habit" icon={Trash2}>
                <select value={inputs.waste} onChange={(e) => update("waste", e.target.value)}>
                  <option value="most">Segregate most waste</option>
                  <option value="sometimes">Sometimes</option>
                  <option value="rarely">Rarely</option>
                </select>
              </Row>
            </div>
          )}

          {step === 4 && (
            <div className="fade-in">
              <h2 className="card-title"><ShoppingBag size={18} /> Shopping & lifestyle</h2>
              <Row label="Monthly discretionary shopping (₹)" icon={ShoppingBag}>
                <input type="number" min="0" step="100" value={inputs.shoppingSpend} onChange={(e) => update("shoppingSpend", Number(e.target.value))} />
              </Row>
              <p className="hint-text"><Info size={13} /> This covers clothing, gadgets and other goods — manufacturing emissions are embedded in their price.</p>
            </div>
          )}

          {step === 5 && (
            <div className="fade-in">
              <h2 className="card-title"><CheckCircle2 size={18} /> Your results</h2>
              <div className="gauge-card">
                <FootprintGauge totalTons={result.totalTons} />
              </div>
              <div className="footer-row">
                <button className="btn btn-primary" onClick={onSave}><Save size={15} /> Save to log</button>
                {saveStatus && <span className="status-text">{saveStatus}</span>}
              </div>
            </div>
          )}

          <div className="wizard-nav">
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              <ChevronLeft size={15} /> Back
            </button>
            <button className="btn btn-primary" disabled={step === WIZARD_STEPS.length - 1} onClick={() => setStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="card-title"><Sparkles size={18} /> Live summary</h2>
          <div className="gauge-card">
            <p className="live-total">{result.totalTons.toFixed(2)} <span>t CO2e / year</span></p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {pieData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v) => `${v} t CO2e`} contentStyle={tooltipStyle()} />
            </PieChart>
          </ResponsiveContainer>
          <div className="legend-list">
            {pieData.map((d) => (
              <div key={d.name} className="legend-row">
                <span><span className="legend-dot" style={{ background: d.color }} />{d.name}</span>
                <span>{d.value.toFixed(2)} t</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================================
   PAGE: AI CLIMATE COACH
   ========================================================================== */
function CoachPage({ result, inputs }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your EcoSense AI climate coach. Tell me about your daily routine in plain English, or tap \"Generate my plan\" and I'll analyze your calculator data." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  const systemPrompt = `You are the EcoSense AI climate coach inside a carbon footprint app. The user's current estimated footprint is ${result.totalTons.toFixed(2)} tons CO2e/year, broken down as: ${Object.entries(result.breakdown).map(([k, v]) => `${k}: ${v.toFixed(2)}t`).join(", ")}. For reference, the India average is ${NATIONAL_AVG}t, the global average is ${GLOBAL_AVG}t, and a 1.5°C-aligned target is ${PARIS_TARGET}t. When useful, structure replies with: a short carbon impact summary, 2-3 personalized recommendations, a simple monthly reduction plan, and an estimate of potential CO2 savings. Keep responses concise, warm, and actionable. Use plain text with short paragraphs, no markdown headers.`;

  const send = async (text) => {
    const userMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);
    try {
      const reply = await askClaude(next.map((m) => ({ role: m.role, content: m.content })), systemPrompt);
      setMessages((m) => [...m, { role: "assistant", content: reply || "I couldn't generate a response — please try again." }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong reaching the AI service. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    send(input.trim());
    setInput("");
  };

  const generatePlan = () => {
    if (loading) return;
    send("Based on my current calculator data, give me a carbon impact summary, personalized recommendations, a monthly reduction plan, and potential CO2 savings.");
  };

  return (
    <div className="page">
      <PageHeader icon={Sparkles} title="AI Climate Coach" subtitle="Describe your lifestyle in plain English — get a personalized plan." />
      <Card className="coach-card">
        <div className="coach-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`coach-msg ${m.role}`}>
              <div className="coach-bubble">{m.content}</div>
            </div>
          ))}
          {loading && <div className="coach-msg assistant"><div className="coach-bubble"><Loader2 size={15} className="spin" /> Thinking…</div></div>}
        </div>
        <div className="coach-quick">
          <button className="btn btn-ghost" onClick={generatePlan} disabled={loading}><Sparkles size={14} /> Generate my plan</button>
        </div>
        <div className="coach-input-row">
          <input
            placeholder="e.g. I drive to work daily and eat meat most nights..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={loading}><Send size={15} /></button>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   PAGE: BILL SCANNER
   ========================================================================== */
function ScannerPage({ setInputs }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const base64 = await fileToBase64(file);
      const isPdf = file.type === "application/pdf";
      const content = [
        isPdf
          ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
          : { type: "image", source: { type: "base64", media_type: file.type || "image/jpeg", data: base64 } },
        {
          type: "text",
          text: 'This is an electricity bill. Find the total electricity consumption in units (kWh) for the billing period, and how many months the period covers (usually 1 or 2). Respond with ONLY a JSON object, no markdown, no extra text, in this exact format: {"units": <number>, "periodMonths": <number>, "summary": "<one short sentence about the usage trend>"}',
        },
      ];
      const text = await askClaude([{ role: "user", content }], "You are an OCR and data-extraction assistant for utility bills. Always respond with valid JSON only.");
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (err) {
      setError("Couldn't read the bill clearly. Try a clearer photo, or enter your electricity usage manually in the calculator.");
    } finally {
      setLoading(false);
    }
  };

  const applyToCalculator = () => {
    if (!result) return;
    const monthly = Math.round(result.units / Math.max(1, result.periodMonths || 1));
    setInputs((p) => ({ ...p, electricity: monthly }));
  };

  return (
    <div className="page">
      <PageHeader icon={ScanLine} title="Bill Scanner" subtitle="Upload a photo or PDF of your electricity bill — AI reads the units for you." />
      <Card>
        <div className="scanner-upload">
          <input id="bill-file" type="file" accept="image/*,application/pdf" onChange={onFile} style={{ display: "none" }} />
          <label htmlFor="bill-file" className="btn btn-ghost"><Upload size={15} /> Choose bill image or PDF</label>
          {file && <span className="status-text">{file.name}</span>}
        </div>

        {preview && <img src={preview} alt="Bill preview" className="scanner-preview" />}

        <div className="footer-row">
          <button className="btn btn-primary" onClick={analyze} disabled={!file || loading}>
            {loading ? <Loader2 size={15} className="spin" /> : <ScanLine size={15} />} Analyze bill
          </button>
        </div>

        {error && <p className="hint-text" style={{ color: "var(--danger)" }}><Info size={13} /> {error}</p>}

        {result && (
          <Card className="scanner-result">
            <h3>Extracted data</h3>
            <div className="compare-row"><span>Units consumed</span><span>{result.units} kWh</span></div>
            <div className="compare-row"><span>Billing period</span><span>{result.periodMonths} month(s)</span></div>
            <p className="hint-text" style={{ marginTop: 10 }}><Sparkles size={13} /> {result.summary}</p>
            <div className="footer-row">
              <button className="btn btn-primary" onClick={applyToCalculator}>Apply to calculator <ArrowRight size={14} /></button>
            </div>
          </Card>
        )}
      </Card>
    </div>
  );
}

/* ============================================================================
   PAGE: PREDICTIONS
   ========================================================================== */
function PredictionsPage({ entries, result }) {
  const pred = useMemo(() => computePredictions(entries), [entries]);

  return (
    <div className="page">
      <PageHeader icon={TrendingUp} title="Carbon Prediction Engine" subtitle="Where your footprint is headed if current habits continue." />
      {!pred ? (
        <Card>
          <EmptyState icon={TrendingUp} title="Not enough data yet" text="Save at least two calculations (e.g. one this month, one next) so we can detect a trend and project forward." />
        </Card>
      ) : (
        <>
          <div className="stat-grid">
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: "linear-gradient(135deg,#38BDF8,#34D399)" }}><TrendingUp size={18} /></div>
              <div><p className="stat-value">{(pred.nextTotal / 12).toFixed(2)} t</p><p className="stat-label">Predicted next month</p></div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: "linear-gradient(135deg,#FBBF24,#F87171)" }}><GaugeIcon size={18} /></div>
              <div><p className="stat-value">{pred.yearProjection.toFixed(2)} t</p><p className="stat-label">Projected this year</p></div>
            </Card>
            <Card className="stat-card">
              <div className="stat-icon" style={{ background: "linear-gradient(135deg,#A78BFA,#F472B6)" }}><Target size={18} /></div>
              <div><p className="stat-value">{pred.riskCategory || "—"}</p><p className="stat-label">Watch this category</p></div>
            </Card>
          </div>

          <Card>
            <h2 className="card-title"><TrendingUp size={18} /> Trend & projection</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={pred.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} unit=" t" />
                <Tooltip formatter={(v) => `${v} t CO2e`} contentStyle={tooltipStyle()} />
                <Line type="monotone" dataKey="actual" stroke="#34D399" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="projected" stroke="#F472B6" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <p className="hint-text">
              <Info size={13} /> {pred.avgDelta <= 0
                ? "Your footprint trend is flat or improving — keep it up."
                : `Your footprint has been rising by about ${pred.avgDelta.toFixed(2)} t per logged period. ${pred.riskCategory} is the category changing the most.`}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

/* ============================================================================
   PAGE: ROADMAP
   ========================================================================== */
function RoadmapPage({ inputs, result, roadmapDone, toggleRoadmapItem }) {
  const items = useMemo(() => buildRoadmap(inputs, result), [inputs, result]);
  const doneCount = items.filter((i) => roadmapDone.includes(i.id)).length;

  return (
    <div className="page">
      <PageHeader icon={MapIcon} title="Carbon Reduction Roadmap" subtitle="Your personalized, prioritized action plan." />
      <Card style={{ marginBottom: 20 }}>
        <h2 className="card-title"><CheckCircle2 size={18} /> Progress</h2>
        <ProgressBar value={doneCount} max={items.length || 1} />
        <p className="hint-text" style={{ marginTop: 8 }}>{doneCount} of {items.length} actions completed</p>
      </Card>

      {items.length === 0 ? (
        <Card><EmptyState icon={MapIcon} title="You're doing great" text="No high-impact actions detected right now — keep up your current habits!" /></Card>
      ) : (
        <div className="roadmap-list">
          {items.map((item) => {
            const Icon = item.icon;
            const done = roadmapDone.includes(item.id);
            return (
              <Card key={item.id} className={`roadmap-item ${done ? "done" : ""}`}>
                <div className="tip-icon"><Icon size={18} /></div>
                <div className="roadmap-body">
                  <div className="roadmap-top">
                    <h3>{item.title}</h3>
                    <Pill tone={item.priority === "High" ? "danger" : item.priority === "Medium" ? "warn" : "default"}>{item.priority} priority</Pill>
                  </div>
                  <p>{item.desc}</p>
                  <p className="roadmap-saving">Estimated saving: {item.saving.toFixed(2)} t CO2e/year</p>
                </div>
                <button className={`btn ${done ? "btn-primary" : "btn-ghost"}`} onClick={() => toggleRoadmapItem(item.id)}>
                  {done ? <CheckCircle2 size={15} /> : <Plus size={15} />} {done ? "Done" : "Mark done"}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PAGE: TREE OFFSET
   ========================================================================== */
function OffsetPage({ result, treesPlanted, setTreesPlanted }) {
  const treesNeeded = Math.max(1, Math.ceil((result.totalTons * 1000) / TREE_ABSORPTION));
  const [add, setAdd] = useState("");
  const maxDisplay = 60;
  const displayCount = Math.min(treesNeeded, maxDisplay);

  return (
    <div className="page">
      <PageHeader icon={TreePine} title="Tree Offset Calculator" subtitle={`Each tree absorbs roughly ${TREE_ABSORPTION} kg CO2 per year.`} />
      <div className="stat-grid">
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#34D399,#A7F3D0)" }}><TreePine size={18} /></div>
          <div><p className="stat-value">{treesNeeded}</p><p className="stat-label">Trees needed / year</p></div>
        </Card>
        <Card className="stat-card">
          <div className="stat-icon" style={{ background: "linear-gradient(135deg,#22D3EE,#38BDF8)" }}><CheckCircle2 size={18} /></div>
          <div><p className="stat-value">{treesPlanted}</p><p className="stat-label">Trees you've logged</p></div>
        </Card>
      </div>

      <Card>
        <h2 className="card-title"><TreePine size={18} /> Offset progress</h2>
        <ProgressBar value={treesPlanted} max={treesNeeded} color="linear-gradient(135deg,#34D399,#22D3EE)" />
        <p className="hint-text" style={{ marginTop: 8 }}>
          {treesPlanted >= treesNeeded ? "You've fully offset your annual footprint with logged trees — great work!" : `${treesNeeded - treesPlanted} more trees to fully offset this year's footprint.`}
        </p>
        <div className="goal-input-row">
          <input type="number" min="0" placeholder="Trees planted this month" value={add} onChange={(e) => setAdd(e.target.value)} />
          <button className="btn btn-primary" onClick={() => { const n = parseInt(add, 10); if (!isNaN(n) && n > 0) { setTreesPlanted((p) => p + n); setAdd(""); } }}>
            <Plus size={15} /> Log trees
          </button>
        </div>
      </Card>

      <Card style={{ marginTop: 20 }}>
        <h2 className="card-title"><Leaf size={18} /> Visualizing your offset need</h2>
        <div className="tree-grid">
          {Array.from({ length: displayCount }).map((_, i) => (
            <TreePine key={i} size={22} className={i < treesPlanted ? "tree-filled" : "tree-outline"} />
          ))}
        </div>
        {treesNeeded > maxDisplay && <p className="hint-text">+ {treesNeeded - maxDisplay} more trees needed beyond what's shown</p>}
      </Card>
    </div>
  );
}

/* ============================================================================
   PAGE: GAMIFICATION
   ========================================================================== */
function GamificationPage({ gami, setGami, sustainabilityScore, addXP }) {
  const xp = gami.xp;
  const level = levelFromXP(xp);
  const xpIntoLevel = xp - (level - 1) * 200;
  const today = new Date().toISOString().slice(0, 10);
  const missionState = gami.missions.date === today ? gami.missions.completed : [];

  const toggleMission = (id, xpVal) => {
    setGami((g) => {
      const isToday = g.missions.date === today;
      const completed = isToday ? g.missions.completed : [];
      if (completed.includes(id)) return g;
      const next = { ...g, xp: g.xp + xpVal, missions: { date: today, completed: [...completed, id] } };
      return next;
    });
  };

  return (
    <div className="page">
      <PageHeader icon={Trophy} title="Eco Challenges" subtitle="Earn XP, level up, and unlock achievements as you reduce your footprint." />

      <div className="grid-2">
        <Card>
          <h2 className="card-title"><Trophy size={18} /> Your level</h2>
          <div className="gauge-card">
            <RadialScore value={xpIntoLevel} max={200} label={`Level ${level}`} sublabel={`${xpIntoLevel}/200 XP`} />
          </div>
        </Card>
        <Card>
          <h2 className="card-title"><GaugeIcon size={18} /> Sustainability score</h2>
          <div className="gauge-card">
            <RadialScore value={sustainabilityScore} max={100} label="Score" sublabel="out of 100" />
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <h2 className="card-title"><CheckCircle2 size={18} /> Today's missions</h2>
        {DAILY_MISSIONS.map((m) => {
          const done = missionState.includes(m.id);
          return (
            <div key={m.id} className="mission-row">
              <button className={`mission-check ${done ? "checked" : ""}`} onClick={() => toggleMission(m.id, m.xp)} disabled={done}>
                {done && <CheckCircle2 size={14} />}
              </button>
              <span className={done ? "mission-done" : ""}>{m.label}</span>
              <Pill tone="default">+{m.xp} XP</Pill>
            </div>
          );
        })}
      </Card>

      <Card style={{ marginTop: 20 }}>
        <h2 className="card-title"><Award size={18} /> Achievements</h2>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const unlocked = gami.unlockedBadges.includes(b.id);
            const Icon = b.icon;
            return (
              <div key={b.id} className={`badge-card ${unlocked ? "unlocked" : ""}`}>
                <div className="badge-icon"><Icon size={20} /></div>
                <p className="badge-label">{b.label}</p>
                <p className="badge-desc">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   PAGE: LEADERBOARD
   ========================================================================== */
function LeaderboardPage({ profile, setProfile, sustainabilityScore, result, joinedLeaderboard, setJoinedLeaderboard }) {
  const [name, setName] = useState(profile.name || "");
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const loadBoard = async () => {
    setLoading(true);
    try {
      const res = await window.storage.get("ecosense-leaderboard", true);
      const list = res ? JSON.parse(res.value) : [];
      setBoard(list.sort((a, b) => b.score - a.score).slice(0, 20));
    } catch (err) {
      setBoard([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBoard(); }, []);

  const join = async () => {
    if (!name.trim()) return;
    const entry = { name: name.trim(), score: sustainabilityScore, footprint: Number(result.totalTons.toFixed(2)), date: new Date().toISOString().slice(0, 10) };
    try {
      const res = await window.storage.get("ecosense-leaderboard", true);
      let list = res ? JSON.parse(res.value) : [];
      list = list.filter((e) => e.name !== entry.name);
      list.push(entry);
      await window.storage.set("ecosense-leaderboard", JSON.stringify(list), true);
      setProfile((p) => ({ ...p, name: entry.name }));
      setJoinedLeaderboard(true);
      setStatus("You're on the leaderboard! Visible to everyone using this app.");
      loadBoard();
    } catch (err) {
      setStatus("Couldn't update the leaderboard right now.");
    }
    setTimeout(() => setStatus(""), 3000);
  };

  return (
    <div className="page">
      <PageHeader icon={Award} title="Community Leaderboard" subtitle="This month's challenge: highest sustainability score." />
      <Card style={{ marginBottom: 20 }}>
        <h2 className="card-title"><Users size={18} /> Join the leaderboard</h2>
        <p className="hint-text"><Info size={13} /> Your name and sustainability score will be visible to all EcoSense AI users.</p>
        <div className="goal-input-row">
          <input placeholder="Your display name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-primary" onClick={join}>{joinedLeaderboard ? "Update my score" : "Join"}</button>
        </div>
        {status && <p className="status-text">{status}</p>}
      </Card>

      <Card>
        <h2 className="card-title"><Crown size={18} /> Top performers</h2>
        {loading ? (
          <div className="skeleton-list">{[1, 2, 3].map((i) => <div key={i} className="skeleton-row" />)}</div>
        ) : board.length === 0 ? (
          <EmptyState icon={Award} title="No entries yet" text="Be the first to join the community leaderboard." />
        ) : (
          <div className="leaderboard-list">
            {board.map((e, i) => (
              <div key={e.name} className={`leaderboard-row ${e.name === profile.name ? "me" : ""}`}>
                <span className="leaderboard-rank">{i === 0 ? <Crown size={16} /> : `#${i + 1}`}</span>
                <span className="leaderboard-name">{e.name}</span>
                <span className="leaderboard-score">{e.score} pts</span>
                <span className="leaderboard-fp">{e.footprint} t</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================================================================
   PAGE: GREEN HUB
   ========================================================================== */
function GreenHubPage() {
  return (
    <div className="page">
      <PageHeader icon={Recycle} title="Recycling & Green Hub" subtitle="Tips, guides and suggestions for everyday sustainable living." />

      <Card style={{ marginBottom: 20 }}>
        <h2 className="card-title"><MapIcon size={18} /> Recycling near you</h2>
        <p className="hint-text"><Info size={13} /> Live location-based results need a maps connector. Meanwhile, here's where to look locally:</p>
        <ul className="simple-list">
          <li>Your municipal corporation's dry-waste collection centers (check their website or app)</li>
          <li>E-waste drop-off points at electronics retailers and authorized recyclers</li>
          <li>Community composting programs run by local RWAs or NGOs</li>
        </ul>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h2 className="card-title"><Lightbulb size={18} /> Eco tips</h2>
        <div className="tip-grid">
          {ECO_TIPS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="tip-card">
                <div className="tip-icon"><Icon size={18} /></div>
                <div><p className="tip-title">{t.title}</p><p className="tip-detail">{t.text}</p></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h2 className="card-title"><ShoppingBag size={18} /> Greener product picks</h2>
        <div className="product-list">
          {GREEN_PRODUCTS.map((p) => (
            <div key={p.name} className="product-row">
              <p className="tip-title">{p.name}</p>
              <p className="tip-detail">{p.note}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================================
   PAGE: ANALYTICS
   ========================================================================== */
function AnalyticsPage({ entries, result }) {
  const downloadCSV = () => {
    const header = ["date", "total", ...Object.keys(CATEGORY_META)];
    const rows = entries.map((e) => [e.date, e.total.toFixed(3), ...Object.keys(CATEGORY_META).map((c) => (e.breakdown?.[c] || 0).toFixed(3))]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ecosense-report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = entries.map((e) => ({ date: e.date, total: Number(e.total.toFixed(2)) }));

  return (
    <div className="page">
      <PageHeader icon={BarChart3} title="Analytics & Reports" subtitle="Detailed history, trends and downloadable reports." />

      <Card style={{ marginBottom: 20 }}>
        <h2 className="card-title"><Download size={18} /> Export</h2>
        <p className="hint-text"><Info size={13} /> Download a CSV of your full history — open it in Excel/Sheets, or print this page to PDF from your browser.</p>
        <div className="footer-row">
          <button className="btn btn-primary" onClick={downloadCSV} disabled={entries.length === 0}><Download size={15} /> Download CSV</button>
          <button className="btn btn-ghost" onClick={() => window.print()}><BarChart3 size={15} /> Print report</button>
        </div>
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <h2 className="card-title"><TrendingUp size={18} /> Historical comparison</h2>
        {entries.length === 0 ? (
          <EmptyState icon={BarChart3} title="No history yet" text="Save calculations from the Calculator page to build your analytics." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-border)" />
              <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} unit=" t" />
              <Tooltip formatter={(v) => `${v} t CO2e`} contentStyle={tooltipStyle()} />
              <Bar dataKey="total" fill="#38BDF8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <h2 className="card-title"><CalcIcon size={18} /> Log history</h2>
        {entries.length === 0 ? <p className="hint-text">No entries saved yet.</p> : (
          <div className="history-table">
            <div className="history-row history-head">
              <span>Date</span><span>Total</span>{Object.keys(CATEGORY_META).map((c) => <span key={c}>{c}</span>)}
            </div>
            {entries.slice().reverse().map((e) => (
              <div className="history-row" key={e.date}>
                <span>{e.date}</span><span>{e.total.toFixed(2)} t</span>
                {Object.keys(CATEGORY_META).map((c) => <span key={c}>{(e.breakdown?.[c] || 0).toFixed(2)}</span>)}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================================================================
   PAGE: PROFILE
   ========================================================================== */
function ProfilePage({ profile, setProfile, gami, sustainabilityScore, goal, entries, result }) {
  const [nameInput, setNameInput] = useState(profile.name || "");
  return (
    <div className="page">
      <PageHeader icon={User} title="Your Profile" subtitle="Your progress, achievements and saved goals." />

      <div className="grid-2">
        <Card>
          <h2 className="card-title"><User size={18} /> Display name</h2>
          <div className="goal-input-row">
            <input placeholder="Your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <button className="btn btn-primary" onClick={() => setProfile((p) => ({ ...p, name: nameInput.trim() }))}>Save</button>
          </div>
          <div className="compare-list" style={{ marginTop: 16 }}>
            <div className="compare-row"><span>Sustainability score</span><span>{sustainabilityScore} / 100</span></div>
            <div className="compare-row"><span>Level</span><span>{levelFromXP(gami.xp)}</span></div>
            <div className="compare-row"><span>Total XP</span><span>{gami.xp}</span></div>
            <div className="compare-row"><span>Current footprint</span><span>{result.totalTons.toFixed(2)} t</span></div>
          </div>
        </Card>

        <Card>
          <h2 className="card-title"><Target size={18} /> Active goal</h2>
          {goal ? (
            <>
              <p className="hint-text">Set on {goal.date}: reduce from {goal.baseline.toFixed(2)} t to {goal.target.toFixed(2)} t.</p>
              <ProgressBar value={Math.max(0, goal.baseline - result.totalTons)} max={Math.max(0.01, goal.baseline - goal.target)} />
            </>
          ) : (
            <EmptyState icon={Target} title="No goal set" text="Set a reduction goal from the Roadmap or Dashboard to track progress here." />
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <h2 className="card-title"><Award size={18} /> Badges earned</h2>
        <div className="badge-grid">
          {BADGES.filter((b) => gami.unlockedBadges.includes(b.id)).map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.id} className="badge-card unlocked">
                <div className="badge-icon"><Icon size={20} /></div>
                <p className="badge-label">{b.label}</p>
              </div>
            );
          })}
          {gami.unlockedBadges.length === 0 && <p className="hint-text">No badges yet — start calculating, saving entries and completing roadmap actions.</p>}
        </div>
      </Card>

      <Card style={{ marginTop: 20 }}>
        <h2 className="card-title"><History size={18} /> Recent history</h2>
        {entries.length === 0 ? <p className="hint-text">Nothing saved yet.</p> : (
          <div className="leaderboard-list">
            {entries.slice(-5).reverse().map((e) => (
              <div key={e.date} className="leaderboard-row">
                <span className="leaderboard-name">{e.date}</span>
                <span className="leaderboard-score">{e.total.toFixed(2)} t CO2e</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
/* ============================================================================
   APP SHELL
   ========================================================================== */
export default function App() {
  const [theme, setTheme] = useState("dark");
  const [page, setPage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);

  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [entries, setEntries] = useState([]);
  const [goal, setGoal] = useState(null);
  const [treesPlanted, setTreesPlanted] = useState(0);
  const [profile, setProfile] = useState({ name: "" });
  const [joinedLeaderboard, setJoinedLeaderboard] = useState(false);
  const [gami, setGami] = useState({ xp: 0, unlockedBadges: [], missions: { date: "", completed: [] } });
  const [roadmapDone, setRoadmapDone] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");

  const result = useMemo(() => computeFootprint(inputs), [inputs]);
  const sustainabilityScore = Math.max(0, Math.min(100, Math.round(100 - ((result.totalTons - PARIS_TARGET) / (GLOBAL_AVG - PARIS_TARGET)) * 100)));

  // ---- Load persisted state ----
  useEffect(() => {
    (async () => {
      const safeGet = async (key) => { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } };
      const i = await safeGet("inputs"); if (i) setInputs(i);
      const e = await safeGet("entries"); if (e) setEntries(e);
      const g = await safeGet("goal"); if (g) setGoal(g);
      const t = await safeGet("trees"); if (t !== null) setTreesPlanted(t);
      const p = await safeGet("profile"); if (p) setProfile(p);
      const j = await safeGet("joinedLeaderboard"); if (j !== null) setJoinedLeaderboard(j);
      const ga = await safeGet("gamification"); if (ga) setGami(ga);
      const rm = await safeGet("roadmapDone"); if (rm) setRoadmapDone(rm);
      const th = await safeGet("theme"); if (th) setTheme(th);
      const ob = await safeGet("onboarded"); if (ob) setShowOnboarding(false);
    })();
  }, []);

  // ---- Persist on change ----
  useEffect(() => { window.storage.set("inputs", JSON.stringify(inputs)).catch(() => {}); }, [inputs]);
  useEffect(() => { window.storage.set("entries", JSON.stringify(entries)).catch(() => {}); }, [entries]);
  useEffect(() => { window.storage.set("trees", JSON.stringify(treesPlanted)).catch(() => {}); }, [treesPlanted]);
  useEffect(() => { window.storage.set("profile", JSON.stringify(profile)).catch(() => {}); }, [profile]);
  useEffect(() => { window.storage.set("joinedLeaderboard", JSON.stringify(joinedLeaderboard)).catch(() => {}); }, [joinedLeaderboard]);
  useEffect(() => { window.storage.set("gamification", JSON.stringify(gami)).catch(() => {}); }, [gami]);
  useEffect(() => { window.storage.set("roadmapDone", JSON.stringify(roadmapDone)).catch(() => {}); }, [roadmapDone]);
  useEffect(() => { window.storage.set("theme", JSON.stringify(theme)).catch(() => {}); }, [theme]);

  // ---- Badge unlock check ----
  useEffect(() => {
    const state = { entries, result, roadmapDone, treesPlanted, joinedLeaderboard, xp: gami.xp };
    const newly = BADGES.filter((b) => !gami.unlockedBadges.includes(b.id) && b.check(state)).map((b) => b.id);
    if (newly.length > 0) setGami((g) => ({ ...g, unlockedBadges: [...g.unlockedBadges, ...newly], xp: g.xp + newly.length * 25 }));
  }, [entries, result, roadmapDone, treesPlanted, joinedLeaderboard, gami.xp, gami.unlockedBadges]);

  const saveEntry = () => {
    const entry = { date: new Date().toISOString().slice(0, 10), total: Number(result.totalTons.toFixed(3)), breakdown: { ...result.breakdown } };
    setEntries((prev) => [...prev.filter((e) => e.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date)));
    setGami((g) => ({ ...g, xp: g.xp + 30 }));
    setSaveStatus("Saved to your log (+30 XP)");
    setTimeout(() => setSaveStatus(""), 2500);
  };

  const toggleRoadmapItem = (id) => {
    setRoadmapDone((prev) => {
      if (prev.includes(id)) return prev;
      setGami((g) => ({ ...g, xp: g.xp + 20 }));
      return [...prev, id];
    });
  };

  const dismissOnboarding = () => { setShowOnboarding(false); window.storage.set("onboarded", JSON.stringify(true)).catch(() => {}); };

  const notifications = useMemo(() => {
    const list = [];
    if (result.totalTons > PARIS_TARGET) list.push(`Your footprint is ${(result.totalTons - PARIS_TARGET).toFixed(1)} t above the 1.5°C target — check your Roadmap for quick wins.`);
    else list.push("You're at or under the 1.5°C-aligned target. Great work!");
    if (entries.length === 0) list.push("Save your first calculation to unlock the 'First Step' badge.");
    const undoneMissions = DAILY_MISSIONS.length - (gami.missions.date === new Date().toISOString().slice(0, 10) ? gami.missions.completed.length : 0);
    if (undoneMissions > 0) list.push(`${undoneMissions} eco mission(s) left for today.`);
    return list;
  }, [result, entries, gami]);

  const pageProps = { inputs, setInputs, result, entries, goal, setGoal, treesPlanted, setTreesPlanted, profile, setProfile, gami, setGami, sustainabilityScore, roadmapDone, toggleRoadmapItem, onSave: saveEntry, saveStatus, joinedLeaderboard, setJoinedLeaderboard, addXP: (n) => setGami((g) => ({ ...g, xp: g.xp + n })) };

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage {...pageProps} />;
      case "calculator": return <CalculatorPage {...pageProps} />;
      case "coach": return <CoachPage {...pageProps} />;
      case "scanner": return <ScannerPage {...pageProps} />;
      case "predictions": return <PredictionsPage {...pageProps} />;
      case "roadmap": return <RoadmapPage {...pageProps} />;
      case "offset": return <OffsetPage {...pageProps} />;
      case "gamification": return <GamificationPage {...pageProps} />;
      case "leaderboard": return <LeaderboardPage {...pageProps} />;
      case "greenhub": return <GreenHubPage {...pageProps} />;
      case "analytics": return <AnalyticsPage {...pageProps} />;
      case "profile": return <ProfilePage {...pageProps} />;
      default: return null;
    }
  };

  return (
    <div className={`app ${theme === "light" ? "light" : ""}`}>
      <style>{APP_CSS}</style>

      {showOnboarding && (
        <div className="onboarding-overlay">
          <Card className="onboarding-card">
            <div className="page-header-icon" style={{ marginBottom: 12 }}><Sparkles size={22} /></div>
            <h2>Welcome to EcoSense AI</h2>
            <p>Calculate your carbon footprint, chat with an AI climate coach, scan your electricity bill, predict future emissions, and turn it all into a game with challenges and a global leaderboard.</p>
            <button className="btn btn-primary" onClick={dismissOnboarding}>Get started <ArrowRight size={15} /></button>
          </Card>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo"><Sparkles size={20} /> <span>EcoSense AI</span></div>
        <nav>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`sidebar-link ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                <Icon size={18} /> <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="theme-toggle" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
      </aside>

      {/* Topbar (mobile) */}
      <header className="topbar">
        <div className="sidebar-logo"><Sparkles size={18} /> <span>EcoSense AI</span></div>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setNotifOpen((o) => !o)}><Bell size={18} /></button>
          <button className="icon-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button className="icon-btn" onClick={() => setMobileMenuOpen((o) => !o)}><Menu size={18} /></button>
        </div>
      </header>

      {/* Notification panel */}
      {notifOpen && (
        <div className="notif-panel">
          <h3><Bell size={15} /> Notifications</h3>
          {notifications.map((n, i) => <p key={i}>{n}</p>)}
        </div>
      )}

      {/* Mobile overflow menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`mobile-menu-item ${page === item.id ? "active" : ""}`} onClick={() => { setPage(item.id); setMobileMenuOpen(false); }}>
                <Icon size={20} /> <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <main className="main">{renderPage()}</main>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {NAV_ITEMS.filter((i) => MOBILE_PRIMARY.includes(i.id)).map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`bottom-nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              <Icon size={20} /> <span>{item.label}</span>
            </button>
          );
        })}
        <button className={`bottom-nav-item ${mobileMenuOpen ? "active" : ""}`} onClick={() => setMobileMenuOpen((o) => !o)}>
          <Menu size={20} /> <span>More</span>
        </button>
      </nav>
    </div>
  );
}

/* ============================================================================
   STYLES
   ========================================================================== */
const APP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

* { box-sizing: border-box; }

.app {
  --bg: #070D14;
  --bg-glow-1: rgba(52,211,153,0.12);
  --bg-glow-2: rgba(56,189,248,0.10);
  --surface: rgba(255,255,255,0.045);
  --surface-solid: #111B2E;
  --surface-border: rgba(255,255,255,0.09);
  --text: #EAF2F0;
  --text-muted: #8FA3A0;
  --accent-grad: linear-gradient(135deg,#34D399,#38BDF8);
  --danger: #F87171;
  --warning: #FBBF24;
  font-family: 'Inter', sans-serif;
  color: var(--text);
  background: var(--bg);
  background-image: radial-gradient(circle at 10% 10%, var(--bg-glow-1), transparent 40%), radial-gradient(circle at 90% 20%, var(--bg-glow-2), transparent 40%);
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
  position: relative;
}
.app.light {
  --bg: #F1F7F5;
  --bg-glow-1: rgba(52,211,153,0.10);
  --bg-glow-2: rgba(56,189,248,0.10);
  --surface: rgba(255,255,255,0.75);
  --surface-solid: #FFFFFF;
  --surface-border: rgba(15,40,35,0.08);
  --text: #0E211C;
  --text-muted: #5B6E68;
}

/* Sidebar */
.sidebar {
  display: flex; flex-direction: column; gap: 4px;
  padding: 22px 14px; border-right: 1px solid var(--surface-border);
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}
.sidebar-logo {
  font-family: 'Sora', sans-serif; font-weight: 700; font-size: 17px;
  display: flex; align-items: center; gap: 8px; padding: 6px 10px 20px;
  background: var(--accent-grad); -webkit-background-clip: text; background-clip: text; color: transparent;
}
.sidebar nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.sidebar-link {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: 10px; border: none; background: transparent; color: var(--text-muted);
  font-size: 13.5px; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.15s ease;
}
.sidebar-link:hover { background: var(--surface); color: var(--text); }
.sidebar-link.active { background: var(--surface); color: var(--text); box-shadow: inset 2px 0 0 0 #34D399; }
.theme-toggle {
  margin-top: 12px; display: flex; align-items: center; gap: 8px; justify-content: center;
  padding: 10px; border-radius: 10px; border: 1px solid var(--surface-border); background: var(--surface);
  color: var(--text); font-size: 13px; font-weight: 600; cursor: pointer;
}

/* Topbar (mobile) */
.topbar {
  display: none; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid var(--surface-border);
  position: sticky; top: 0; z-index: 20; background: var(--bg);
}
.topbar-actions { display: flex; gap: 8px; }
.icon-btn {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--surface-border);
  background: var(--surface); color: var(--text); display: flex; align-items: center; justify-content: center; cursor: pointer;
}

/* Notification panel */
.notif-panel {
  position: fixed; top: 60px; right: 16px; width: min(320px, 90vw); z-index: 30;
  background: var(--surface-solid); border: 1px solid var(--surface-border); border-radius: 14px; padding: 14px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.35);
}
.notif-panel h3 { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; font-size: 13px; }
.notif-panel p { font-size: 12.5px; color: var(--text-muted); margin: 6px 0; }

/* Mobile overflow menu */
.mobile-menu {
  position: fixed; bottom: 64px; left: 0; right: 0; z-index: 25;
  background: var(--surface-solid); border-top: 1px solid var(--surface-border);
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 14px;
  max-height: 50vh; overflow-y: auto;
}
.mobile-menu-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px;
  border-radius: 12px; border: 1px solid var(--surface-border); background: var(--surface);
  color: var(--text-muted); font-size: 11px; cursor: pointer;
}
.mobile-menu-item.active { color: #34D399; border-color: #34D399; }

/* Bottom nav (mobile) */
.bottom-nav {
  display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 20;
  background: var(--surface-solid); border-top: 1px solid var(--surface-border);
  justify-content: space-around; padding: 8px 4px;
}
.bottom-nav-item {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  border: none; background: transparent; color: var(--text-muted); font-size: 10.5px; cursor: pointer; padding: 4px 8px;
}
.bottom-nav-item.active { color: #34D399; }

/* Main */
.main { padding: 28px 32px 60px; min-width: 0; }
.page { display: flex; flex-direction: column; gap: 0; max-width: 1100px; }

.page-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
.page-header-icon {
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  background: var(--accent-grad); display: flex; align-items: center; justify-content: center; color: #06251D;
}
.page-header h1 { font-family: 'Sora', sans-serif; font-size: 24px; margin: 0 0 4px; }
.page-header p { font-size: 13.5px; color: var(--text-muted); margin: 0; max-width: 520px; }

/* Glass cards */
.glass-card {
  background: var(--surface); border: 1px solid var(--surface-border);
  border-radius: 16px; padding: 20px; backdrop-filter: blur(16px);
  animation: fadeIn 0.4s ease;
}
.card-title { font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }

.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; gap: 12px; padding: 16px; }
.stat-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #06251D; flex-shrink: 0; }
.stat-value { font-family: 'JetBrains Mono', monospace; font-size: 19px; font-weight: 700; margin: 0; }
.stat-label { font-size: 11.5px; color: var(--text-muted); margin: 2px 0 0; }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* Gauge */
.gauge-card { display: flex; flex-direction: column; align-items: center; }
.gauge-svg { width: 100%; max-width: 280px; }
.gauge-value { font-family: 'Sora', sans-serif; font-size: 30px; font-weight: 700; fill: var(--text); }
.gauge-unit { font-family: 'JetBrains Mono', monospace; font-size: 10px; fill: var(--text-muted); }
.gauge-needle { transition: all 0.6s cubic-bezier(.4,1.4,.4,1); }

.compare-list { width: 100%; margin-top: 12px; }
.compare-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 7px 0; border-top: 1px solid var(--surface-border); }
.compare-row span:first-child { color: var(--text-muted); }
.compare-row span:last-child { font-family: 'JetBrains Mono', monospace; font-weight: 600; }

/* Forms */
.row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.row label { flex: 1; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.row-icon { color: #34D399; flex-shrink: 0; }
.row input, .row select {
  width: 130px; padding: 9px 10px; border-radius: 9px; border: 1px solid var(--surface-border);
  background: var(--surface-solid); color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 12.5px;
}
.row input:focus, .row select:focus { outline: 2px solid #34D399; outline-offset: 1px; }
.hint-text { display: flex; align-items: flex-start; gap: 6px; font-size: 12px; color: var(--text-muted); margin: 10px 0 0; line-height: 1.5; }

/* Wizard */
.wizard-progress { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }
.wizard-step { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: var(--text-muted); padding: 6px 10px; border-radius: 20px; border: 1px solid var(--surface-border); }
.wizard-step.active { color: var(--text); border-color: #34D399; background: rgba(52,211,153,0.08); }
.wizard-step.done { color: #34D399; }
.wizard-dot { width: 20px; height: 20px; border-radius: 50%; background: var(--surface-solid); display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
.wizard-nav { display: flex; justify-content: space-between; margin-top: 18px; }
.wizard-grid { align-items: start; }
.live-total { font-family: 'Sora', sans-serif; font-size: 36px; font-weight: 800; margin: 0 0 10px; }
.live-total span { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.legend-list { margin-top: 10px; }
.legend-row { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; }
.legend-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }

/* Buttons */
.btn {
  font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; padding: 10px 16px;
  border-radius: 10px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
  transition: opacity 0.15s, transform 0.1s;
}
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-primary { background: var(--accent-grad); color: #06251D; }
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-ghost { background: var(--surface-solid); color: var(--text); border: 1px solid var(--surface-border); }
.btn-ghost:hover:not(:disabled) { opacity: 0.85; }
.footer-row { display: flex; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.status-text { font-size: 12.5px; color: #34D399; }

/* Progress bar */
.progress-track { height: 10px; border-radius: 6px; background: var(--surface-solid); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 6px; transition: width 0.6s ease; }

/* Pills */
.pill { font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.04em; }
.pill-default { background: var(--surface-solid); color: var(--text-muted); border: 1px solid var(--surface-border); }
.pill-warn { background: rgba(251,191,36,0.15); color: #FBBF24; }
.pill-danger { background: rgba(248,113,113,0.15); color: #F87171; }

/* Empty states */
.empty-state { text-align: center; padding: 30px 10px; }
.empty-icon { width: 50px; height: 50px; border-radius: 50%; background: var(--surface-solid); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #34D399; }
.empty-state h3 { font-family: 'Sora', sans-serif; font-size: 15px; margin: 0 0 6px; }
.empty-state p { font-size: 12.5px; color: var(--text-muted); max-width: 320px; margin: 0 auto; }

/* Radial score */
.radial-wrap { position: relative; }
.radial-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.radial-value { font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; }
.radial-label { font-size: 12px; color: var(--text-muted); }
.radial-sublabel { font-size: 10.5px; color: var(--text-muted); }
.radial-arc { transition: stroke-dasharray 0.8s ease; }

/* Coach */
.coach-card { display: flex; flex-direction: column; height: 520px; }
.coach-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; }
.coach-msg { display: flex; }
.coach-msg.user { justify-content: flex-end; }
.coach-bubble { max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; }
.coach-msg.assistant .coach-bubble { background: var(--surface-solid); border: 1px solid var(--surface-border); }
.coach-msg.user .coach-bubble { background: var(--accent-grad); color: #06251D; }
.coach-quick { margin-top: 10px; }
.coach-input-row { display: flex; gap: 10px; margin-top: 10px; }
.coach-input-row input { flex: 1; padding: 11px 14px; border-radius: 12px; border: 1px solid var(--surface-border); background: var(--surface-solid); color: var(--text); font-size: 13px; }
.spin { animation: spin 1s linear infinite; }

/* Scanner */
.scanner-upload { display: flex; align-items: center; gap: 12px; }
.scanner-preview { max-width: 100%; max-height: 260px; border-radius: 12px; margin-top: 14px; border: 1px solid var(--surface-border); }
.scanner-result { margin-top: 16px; }

/* Roadmap */
.roadmap-list { display: flex; flex-direction: column; gap: 12px; }
.roadmap-item { display: flex; align-items: flex-start; gap: 14px; }
.roadmap-item.done { opacity: 0.6; }
.roadmap-body { flex: 1; }
.roadmap-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.roadmap-body h3 { font-size: 14px; margin: 0; }
.roadmap-body p { font-size: 12.5px; color: var(--text-muted); margin: 6px 0 0; }
.roadmap-saving { font-family: 'JetBrains Mono', monospace; color: #34D399 !important; font-size: 11.5px; margin-top: 6px; }
.tip-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--surface-solid); display: flex; align-items: center; justify-content: center; color: #34D399; flex-shrink: 0; }

/* Tree offset */
.goal-input-row { display: flex; gap: 10px; margin-top: 14px; }
.goal-input-row input { flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--surface-border); background: var(--surface-solid); color: var(--text); font-family: 'JetBrains Mono', monospace; font-size: 12.5px; }
.tree-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.tree-filled { color: #34D399; }
.tree-outline { color: var(--surface-border); }

/* Gamification */
.mission-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--surface-border); font-size: 13px; }
.mission-row:first-child { border-top: none; }
.mission-row span:nth-child(2) { flex: 1; }
.mission-done { text-decoration: line-through; color: var(--text-muted); }
.mission-check { width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--surface-border); background: var(--surface-solid); color: #34D399; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mission-check.checked { background: #34D399; color: #06251D; border-color: #34D399; }
.badge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.badge-card { padding: 14px; border-radius: 12px; border: 1px solid var(--surface-border); background: var(--surface-solid); text-align: center; opacity: 0.4; }
.badge-card.unlocked { opacity: 1; border-color: #34D399; }
.badge-icon { width: 36px; height: 36px; border-radius: 50%; background: var(--accent-grad); color: #06251D; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; }
.badge-label { font-size: 12px; font-weight: 600; margin: 0; }
.badge-desc { font-size: 10.5px; color: var(--text-muted); margin: 4px 0 0; }

/* Leaderboard */
.leaderboard-list { display: flex; flex-direction: column; gap: 6px; }
.leaderboard-row { display: grid; grid-template-columns: 36px 1fr auto auto; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 10px; background: var(--surface-solid); font-size: 12.5px; }
.leaderboard-row.me { border: 1px solid #34D399; }
.leaderboard-rank { font-family: 'JetBrains Mono', monospace; color: var(--text-muted); display: flex; align-items: center; }
.leaderboard-score { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #34D399; }
.leaderboard-fp { font-family: 'JetBrains Mono', monospace; color: var(--text-muted); }
.skeleton-list { display: flex; flex-direction: column; gap: 8px; }
.skeleton-row { height: 40px; border-radius: 10px; background: linear-gradient(90deg, var(--surface-solid) 25%, var(--surface) 50%, var(--surface-solid) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }

/* Green hub */
.simple-list { font-size: 13px; color: var(--text-muted); line-height: 1.8; padding-left: 20px; margin: 10px 0 0; }
.tip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.tip-card { display: flex; gap: 12px; padding: 14px; border-radius: 12px; background: var(--surface-solid); border: 1px solid var(--surface-border); }
.tip-title { font-size: 13px; font-weight: 600; margin: 0 0 4px; }
.tip-detail { font-size: 12px; color: var(--text-muted); margin: 0; line-height: 1.5; }
.product-list { display: flex; flex-direction: column; gap: 12px; }
.product-row { padding: 12px; border-radius: 10px; background: var(--surface-solid); border: 1px solid var(--surface-border); }

/* Analytics */
.history-table { display: flex; flex-direction: column; font-size: 12px; }
.history-row { display: grid; grid-template-columns: 90px 70px repeat(6, 1fr); gap: 8px; padding: 8px 4px; border-top: 1px solid var(--surface-border); font-family: 'JetBrains Mono', monospace; }
.history-row:first-child { border-top: none; }
.history-head { color: var(--text-muted); font-weight: 600; font-family: 'Inter', sans-serif; }

/* Onboarding */
.onboarding-overlay { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 20px; }
.onboarding-card { max-width: 420px; text-align: center; }
.onboarding-card h2 { font-family: 'Sora', sans-serif; font-size: 20px; margin: 4px 0 10px; }
.onboarding-card p { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin: 0 0 18px; }

/* Animations */
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.fade-in { animation: fadeIn 0.35s ease; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Responsive */
@media (max-width: 980px) {
  .app { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .topbar { display: flex; }
  .bottom-nav { display: flex; }
  .main { padding: 16px 14px 90px; }
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .grid-2 { grid-template-columns: 1fr; }
  .history-row { grid-template-columns: 80px 60px repeat(6, 60px); overflow-x: auto; }
  .history-table { overflow-x: auto; }
}
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
`;
