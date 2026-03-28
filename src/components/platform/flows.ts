import type { Node, Edge } from "@xyflow/react";

const IDLE = "idle";
const Y = 210;
const DX = 280;

function n(
  id: string,
  type: string,
  x: number,
  y: number,
  data: Record<string, unknown>
): Node {
  return { id, type, position: { x, y }, data };
}

function e(
  id: string,
  source: string,
  target: string,
  animated = false
): Edge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated,
    style: { stroke: "#3B82F6", strokeWidth: 2 },
  };
}

// ─── Data Surgeon ──────────────────────────────────────────────────────────────
export const dataSurgeonFlow = {
  nodes: [
    n("ds-in", "inputNode", 50, Y, {
      label: "User Profile",
      description: "Raw financial data from ingestion layer",
      icon: "📋",
      status: IDLE,
    }),
    n("ds-1", "processNode", 50 + DX, Y, {
      label: "Validate Schema",
      description: "Check field types & value constraints",
      icon: "✅",
      status: IDLE,
    }),
    n("ds-2", "processNode", 50 + DX * 2, Y, {
      label: "Detect Missing",
      description: "Flag incomplete or null financial fields",
      icon: "🔍",
      status: IDLE,
    }),
    n("ds-3", "processNode", 50 + DX * 3, Y, {
      label: "Score Quality",
      description: "Compute data quality score 0 – 100",
      icon: "📊",
      status: IDLE,
    }),
    n("ds-out", "outputNode", 50 + DX * 4, Y, {
      label: "Quality Report",
      description: "DQ score + missing-field flags",
      icon: "🔬",
      status: IDLE,
    }),
  ],
  edges: [
    e("ds-e1", "ds-in", "ds-1"),
    e("ds-e2", "ds-1", "ds-2"),
    e("ds-e3", "ds-2", "ds-3"),
    e("ds-e4", "ds-3", "ds-out"),
  ],
};

// ─── Tax Wizard ────────────────────────────────────────────────────────────────
export const taxWizardFlow = {
  nodes: [
    n("tw-in", "inputNode", 50, Y, {
      label: "Income Data",
      description: "Salary, other income & deductions",
      icon: "💰",
      status: IDLE,
    }),
    n("tw-1", "processNode", 50 + DX, Y, {
      label: "Compare Regimes",
      description: "Old vs New regime tax computation",
      icon: "⚖️",
      status: IDLE,
    }),
    n("tw-2", "processNode", 50 + DX * 2, Y, {
      label: "80C / 80D Gap",
      description: "Identify missing deduction opportunities",
      icon: "📉",
      status: IDLE,
    }),
    n("tw-3", "processNode", 50 + DX * 3, Y, {
      label: "HRA / NPS Check",
      description: "Maximise HRA claims & NPS contributions",
      icon: "🏠",
      status: IDLE,
    }),
    n("tw-out", "outputNode", 50 + DX * 4, Y, {
      label: "Tax Strategy",
      description: "Optimal regime + full deduction roadmap",
      icon: "⚖️",
      status: IDLE,
    }),
  ],
  edges: [
    e("tw-e1", "tw-in", "tw-1"),
    e("tw-e2", "tw-1", "tw-2"),
    e("tw-e3", "tw-2", "tw-3"),
    e("tw-e4", "tw-3", "tw-out"),
  ],
};

// ─── Portfolio X-Ray ───────────────────────────────────────────────────────────
export const portfolioXRayFlow = {
  nodes: [
    n("px-in", "inputNode", 50, Y, {
      label: "Asset Data",
      description: "Equity, debt, gold & real estate holdings",
      icon: "📈",
      status: IDLE,
    }),
    n("px-1", "processNode", 50 + DX, Y, {
      label: "Allocation Review",
      description: "Current asset mix vs target allocation",
      icon: "🥧",
      status: IDLE,
    }),
    n("px-2", "processNode", 50 + DX * 2, Y, {
      label: "Rebalancing Plan",
      description: "Shift recommendations to reach target",
      icon: "⚡",
      status: IDLE,
    }),
    n("px-3", "processNode", 50 + DX * 3, Y, {
      label: "Goal-Corpus Gap",
      description: "Projected corpus vs required by goal date",
      icon: "🎯",
      status: IDLE,
    }),
    n("px-out", "outputNode", 50 + DX * 4, Y, {
      label: "Portfolio Report",
      description: "Investment strategy & rebalancing steps",
      icon: "📡",
      status: IDLE,
    }),
  ],
  edges: [
    e("px-e1", "px-in", "px-1"),
    e("px-e2", "px-1", "px-2"),
    e("px-e3", "px-2", "px-3"),
    e("px-e4", "px-3", "px-out"),
  ],
};

// ─── Risk Shield ───────────────────────────────────────────────────────────────
export const riskShieldFlow = {
  nodes: [
    n("rs-in", "inputNode", 50, Y, {
      label: "Debt & Insurance",
      description: "EMIs, loans & existing policies",
      icon: "🛡️",
      status: IDLE,
    }),
    n("rs-1", "processNode", 50 + DX, Y, {
      label: "EMI Stress Test",
      description: "EMI/income ratio risk classification",
      icon: "📉",
      status: IDLE,
    }),
    n("rs-2", "processNode", 50 + DX * 2, Y, {
      label: "HLV Calculation",
      description: "Human Life Value for life-cover sizing",
      icon: "❤️",
      status: IDLE,
    }),
    n("rs-3", "processNode", 50 + DX * 3, Y, {
      label: "Insurance Gap",
      description: "Detect under-coverage in life & health",
      icon: "⚠️",
      status: IDLE,
    }),
    n("rs-out", "outputNode", 50 + DX * 4, Y, {
      label: "Risk Report",
      description: "Debt stress level + insurance recs",
      icon: "🛡️",
      status: IDLE,
    }),
  ],
  edges: [
    e("rs-e1", "rs-in", "rs-1"),
    e("rs-e2", "rs-1", "rs-2"),
    e("rs-e3", "rs-2", "rs-3"),
    e("rs-e4", "rs-3", "rs-out"),
  ],
};

// ─── FIRE Planner ──────────────────────────────────────────────────────────────
export const firePlannerFlow = {
  nodes: [
    n("fp-in", "inputNode", 50, Y, {
      label: "Retirement Goals",
      description: "Target age, lifestyle expenses, savings",
      icon: "🎯",
      status: IDLE,
    }),
    n("fp-1", "processNode", 50 + DX, Y, {
      label: "Freedom Number",
      description: "Corpus = 25 × annual expenses (4% rule)",
      icon: "🔢",
      status: IDLE,
    }),
    n("fp-2", "processNode", 50 + DX * 2, Y, {
      label: "SIP Roadmap",
      description: "Monthly SIP to hit corpus by target date",
      icon: "📅",
      status: IDLE,
    }),
    n("fp-3", "processNode", 50 + DX * 3, Y, {
      label: "Asset Glide Path",
      description: "Equity → debt shifts as retirement nears",
      icon: "🔄",
      status: IDLE,
    }),
    n("fp-out", "outputNode", 50 + DX * 4, Y, {
      label: "FIRE Roadmap",
      description: "Month-by-month plan to independence",
      icon: "🔥",
      status: IDLE,
    }),
  ],
  edges: [
    e("fp-e1", "fp-in", "fp-1"),
    e("fp-e2", "fp-1", "fp-2"),
    e("fp-e3", "fp-2", "fp-3"),
    e("fp-e4", "fp-3", "fp-out"),
  ],
};

// ─── Exec Narrator ─────────────────────────────────────────────────────────────
export const execNarratorFlow = {
  nodes: [
    n("en-in", "inputNode", 50, Y, {
      label: "All Agent Reports",
      description: "Outputs from all 5 specialist agents",
      icon: "📚",
      status: IDLE,
    }),
    n("en-1", "processNode", 50 + DX, Y, {
      label: "Synthesise",
      description: "Merge 5 reports into a unified view",
      icon: "🧩",
      status: IDLE,
    }),
    n("en-2", "processNode", 50 + DX * 2, Y, {
      label: "Rank Priorities",
      description: "Score actions by impact × urgency",
      icon: "🏆",
      status: IDLE,
    }),
    n("en-3", "processNode", 50 + DX * 3, Y, {
      label: "Form Strategy",
      description: "Build Top 3 actions with timelines",
      icon: "🎖️",
      status: IDLE,
    }),
    n("en-out", "outputNode", 50 + DX * 4, Y, {
      label: "Gold Strategy",
      description: "Executive summary: 3 priority moves",
      icon: "💎",
      status: IDLE,
    }),
  ],
  edges: [
    e("en-e1", "en-in", "en-1"),
    e("en-e2", "en-1", "en-2"),
    e("en-e3", "en-2", "en-3"),
    e("en-e4", "en-3", "en-out"),
  ],
};

// ─── War Room (full pipeline) ──────────────────────────────────────────────────
const WY = 300;
const WDX = 270;

export const warRoomFlow = {
  nodes: [
    n("wr-user", "inputNode", 50, WY, {
      label: "User Profile",
      description: "Gold Profile from ingestion layer",
      icon: "👤",
      status: IDLE,
    }),
    n("wr-persona", "processNode", 50 + WDX, WY, {
      label: "Persona Engine",
      description: "Rule-Based + K-Means + LLM tagger",
      icon: "🧠",
      status: IDLE,
    }),
    n("wr-ds", "agentNode", 50 + WDX * 2, WY, {
      label: "Data Surgeon",
      role: "Data Quality & Validation",
      icon: "🔬",
      status: IDLE,
      color: "bg-blue-500/20",
    }),
    n("wr-tw", "agentNode", 50 + WDX * 3, WY, {
      label: "Tax Wizard",
      role: "Tax Optimisation",
      icon: "⚖️",
      status: IDLE,
      color: "bg-purple-500/20",
    }),
    n("wr-px", "agentNode", 50 + WDX * 4, WY, {
      label: "Portfolio X-Ray",
      role: "Investment Analysis",
      icon: "📡",
      status: IDLE,
      color: "bg-cyan-500/20",
    }),
    n("wr-rs", "agentNode", 50 + WDX * 5, WY, {
      label: "Risk Shield",
      role: "Debt & Insurance",
      icon: "🛡️",
      status: IDLE,
      color: "bg-red-500/20",
    }),
    n("wr-fp", "agentNode", 50 + WDX * 6, WY, {
      label: "FIRE Planner",
      role: "Retirement Roadmap",
      icon: "🔥",
      status: IDLE,
      color: "bg-orange-500/20",
    }),
    n("wr-en", "agentNode", 50 + WDX * 7, WY, {
      label: "Exec Narrator",
      role: "Strategy Synthesis",
      icon: "🎖️",
      status: IDLE,
      color: "bg-yellow-500/20",
    }),
    n("wr-out", "outputNode", 50 + WDX * 8, WY, {
      label: "Gold Strategy",
      description: "Top 3 priority financial moves",
      icon: "💎",
      status: IDLE,
    }),
  ],
  edges: [
    e("wr-e1", "wr-user", "wr-persona", true),
    e("wr-e2", "wr-persona", "wr-ds", true),
    e("wr-e3", "wr-ds", "wr-tw", true),
    e("wr-e4", "wr-tw", "wr-px", true),
    e("wr-e5", "wr-px", "wr-rs", true),
    e("wr-e6", "wr-rs", "wr-fp", true),
    e("wr-e7", "wr-fp", "wr-en", true),
    e("wr-e8", "wr-en", "wr-out", true),
  ],
};

export type TabId =
  | "warroom"
  | "data-surgeon"
  | "tax-wizard"
  | "portfolio-xray"
  | "risk-shield"
  | "fire-planner"
  | "exec-narrator";

export const flowMap: Record<
  TabId,
  { nodes: Node[]; edges: Edge[] }
> = {
  warroom: warRoomFlow,
  "data-surgeon": dataSurgeonFlow,
  "tax-wizard": taxWizardFlow,
  "portfolio-xray": portfolioXRayFlow,
  "risk-shield": riskShieldFlow,
  "fire-planner": firePlannerFlow,
  "exec-narrator": execNarratorFlow,
};
