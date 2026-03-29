import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconBolt,
  IconShieldCheck,
  IconTargetArrow,
  IconTrendingUp,
} from "@tabler/icons-react";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

type PlanId = "steady" | "growth" | "aggressive";

type PlanOption = {
  id: PlanId;
  label: string;
  expectedReturn: number;
  description: string;
};

type AgentCard = {
  id: string;
  name: string;
  badge: string;
  blurb: string;
  signal: number;
  highlights: string[];
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type CaseProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  role: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyEmi: number;
  currentCorpus: number;
  dependents: number;
  goals: string[];
  topActions: string[];
};

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "steady",
    label: "Steady",
    expectedReturn: 0.08,
    description: "Lower volatility, debt-heavy path.",
  },
  {
    id: "growth",
    label: "Growth",
    expectedReturn: 0.11,
    description: "Balanced equity and debt mix.",
  },
  {
    id: "aggressive",
    label: "Aggressive",
    expectedReturn: 0.14,
    description: "Equity-first plan for faster upside.",
  },
];

const AGENT_CARDS: AgentCard[] = [
  {
    id: "data-surgeon",
    name: "Data Surgeon",
    badge: "Data Quality",
    blurb: "Cleans missing fields, catches financial anomalies, and validates profile confidence before analysis starts.",
    signal: 92,
    highlights: ["Schema integrity checks", "Expense-income anomaly alerts", "Source confidence tagging"],
  },
  {
    id: "tax-wizard",
    name: "Tax Wizard",
    badge: "Tax Optimisation",
    blurb: "Compares old vs new regime and surfaces immediate deduction opportunities for higher take-home efficiency.",
    signal: 84,
    highlights: ["Regime comparison", "80C/80D opportunity map", "NPS deduction suggestions"],
  },
  {
    id: "portfolio-xray",
    name: "Portfolio X-Ray",
    badge: "Allocation Intelligence",
    blurb: "Shows allocation drift, concentrated risk pockets, and rebalancing moves aligned to your horizon.",
    signal: 88,
    highlights: ["Current vs target allocation", "Concentration warnings", "Goal-linked rebalance hints"],
  },
  {
    id: "risk-shield",
    name: "Risk Shield",
    badge: "Protection Layer",
    blurb: "Scores debt stress, insurance adequacy, and household resilience so critical risk gaps are prioritized first.",
    signal: 79,
    highlights: ["EMI stress classification", "Term-cover deficit estimate", "Emergency buffer recommendation"],
  },
  {
    id: "fire-planner",
    name: "FIRE Planner",
    badge: "Retirement Engine",
    blurb: "Builds your freedom number, monthly SIP roadmap, and retirement trajectory using a scenario-based model.",
    signal: 86,
    highlights: ["Freedom corpus projection", "SIP track planning", "Inflation-adjusted timeline"],
  },
  {
    id: "exec-narrator",
    name: "Exec Narrator",
    badge: "Decision Summary",
    blurb: "Synthesizes all signals into top priorities so the next actions are clear and execution-ready.",
    signal: 90,
    highlights: ["Top-3 strategic moves", "Priority sequencing", "Executive plain-language summary"],
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    question: "What does this project do end-to-end?",
    answer:
      "FinPersona ingests user data from forms, chat, and documents, creates a unified financial profile, identifies personas, runs a 6-agent analysis workflow, and returns a ranked action plan.",
  },
  {
    id: "faq-2",
    question: "How are recommendations generated?",
    answer:
      "Recommendations combine three layers: deterministic financial rules, clustering against similar profiles, and LLM reasoning. The final strategy is then synthesized by the Exec Narrator agent.",
  },
  {
    id: "faq-3",
    question: "What do the six agents cover?",
    answer:
      "The agents cover data quality, tax optimization, portfolio allocation, debt and insurance risk, FIRE planning, and an executive summary that converts all outputs into top-priority next steps.",
  },
];

const CASE_PROFILES: CaseProfile[] = [
  {
    id: "case-aarav",
    name: "Aarav Mehta",
    age: 29,
    city: "Bengaluru",
    role: "Senior Software Engineer",
    monthlyIncome: 185000,
    monthlyExpenses: 72000,
    monthlyEmi: 18000,
    currentCorpus: 2450000,
    dependents: 1,
    goals: ["Early retirement at 48", "Home down payment in 4 years"],
    topActions: [
      "Switch to New Regime + NPS to save ~₹41,000/year",
      "Reduce concentrated mid-cap exposure by 12%",
      "Increase emergency reserve from 2.4 to 6 months",
    ],
  },
  {
    id: "case-neha",
    name: "Neha Gupta",
    age: 36,
    city: "Pune",
    role: "Marketing Director",
    monthlyIncome: 240000,
    monthlyExpenses: 126000,
    monthlyEmi: 42000,
    currentCorpus: 3980000,
    dependents: 2,
    goals: ["Child education corpus", "Debt-light portfolio by age 42"],
    topActions: [
      "Close personal loan first to cut EMI stress from 28% to 20%",
      "Add ₹2.0Cr term cover gap identified by Risk Shield",
      "Rebalance idle cash into short-duration debt and index funds",
    ],
  },
  {
    id: "case-suresh",
    name: "Suresh Iyer",
    age: 43,
    city: "Chennai",
    role: "Operations Manager",
    monthlyIncome: 165000,
    monthlyExpenses: 93000,
    monthlyEmi: 26000,
    currentCorpus: 6120000,
    dependents: 3,
    goals: ["Retirement at 55", "Family health security"],
    topActions: [
      "Raise SIP by ₹22,000/month to stay on retirement trajectory",
      "Improve health cover by ₹15L for family floater adequacy",
      "Move from 14% crypto + thematic bets to diversified core equity",
    ],
  },
];

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function formatInr(value: number): string {
  return `₹${inr.format(Math.max(0, Math.round(value)))}`;
}

export default function App() {
  const [monthlyIncome, setMonthlyIncome] = useState(120000);
  const [savingRate, setSavingRate] = useState(35);
  const [years, setYears] = useState(15);
  const [planId, setPlanId] = useState<PlanId>("growth");
  const [activeAgentId, setActiveAgentId] = useState<string>(AGENT_CARDS[0].id);
  const [activeCaseId, setActiveCaseId] = useState<string>(CASE_PROFILES[0].id);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  const selectedPlan = useMemo(
    () => PLAN_OPTIONS.find((option) => option.id === planId) ?? PLAN_OPTIONS[1],
    [planId],
  );

  const monthlyInvestable = useMemo(
    () => (monthlyIncome * savingRate) / 100,
    [monthlyIncome, savingRate],
  );

  const projectedCorpus = useMemo(() => {
    const months = years * 12;
    const monthlyRate = selectedPlan.expectedReturn / 12;

    if (months <= 0) return 0;
    if (monthlyRate <= 0) return monthlyInvestable * months;

    return monthlyInvestable * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }, [years, selectedPlan.expectedReturn, monthlyInvestable]);

  const fireTarget = useMemo(() => monthlyIncome * 12 * 25, [monthlyIncome]);

  const fireProgress = useMemo(
    () => Math.min(100, Math.round((projectedCorpus / (fireTarget || 1)) * 100)),
    [projectedCorpus, fireTarget],
  );

  const activeAgent = useMemo(
    () => AGENT_CARDS.find((agent) => agent.id === activeAgentId) ?? AGENT_CARDS[0],
    [activeAgentId],
  );

  const activeCase = useMemo(
    () => CASE_PROFILES.find((profile) => profile.id === activeCaseId) ?? CASE_PROFILES[0],
    [activeCaseId],
  );

  const caseInvestable = useMemo(
    () => Math.max(0, activeCase.monthlyIncome - activeCase.monthlyExpenses - activeCase.monthlyEmi),
    [activeCase],
  );

  const caseSavingRate = useMemo(
    () => Math.round((caseInvestable / Math.max(1, activeCase.monthlyIncome)) * 100),
    [caseInvestable, activeCase],
  );

  return (
    <div className="min-h-screen bg-[#041427] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <BackgroundRippleEffect cellSize={64} />

        <div className="pointer-events-none relative z-10 mx-auto max-w-6xl px-5 pb-18 pt-8 md:px-8 md:pb-24 md:pt-10">
          <header className="pointer-events-auto flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-300/10 px-4 py-1.5 text-sm text-sky-200">
              <span className="h-2 w-2 rounded-full bg-sky-300" />
              FinPersona AI
            </div>
            <div className="hidden items-center gap-6 text-sm text-neutral-300 md:flex">
              <Link to="/enter" className="transition hover:text-white">Profile</Link>
              <Link to="/platform" className="transition hover:text-white">Platform</Link>
            </div>
          </header>

          <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="pointer-events-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200">
                <IconBolt size={14} />
                Live Interactive Homepage
              </div>

              <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-[1.05] text-white md:text-6xl">
                Build your money strategy with a click-reactive AI command center.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
                Tune your savings, test risk profiles, and explore multi-agent insights instantly before starting full analysis.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/enter"
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-300/40 bg-sky-400/20 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/30"
                >
                  Start Smart Profile
                  <IconArrowRight size={16} />
                </Link>

                <Link
                  to="/platform"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Open Agent Platform
                </Link>
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Readiness</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">{fireProgress}%</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Monthly SIP</p>
                  <p className="mt-1 text-lg font-semibold text-sky-300">{formatInr(monthlyInvestable)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 col-span-2 sm:col-span-1">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400">Projected Corpus</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-200">{formatInr(projectedCorpus)}</p>
                </div>
              </div>
            </div>

            <div className="pointer-events-auto rounded-3xl border border-sky-200/15 bg-[#071b34]/85 p-5 shadow-[0_25px_80px_rgba(3,15,32,0.65)] backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Live Projection Sandbox</p>
                <span className="rounded-full bg-emerald-300/15 px-2.5 py-1 text-[11px] text-emerald-300">
                  {Math.round(selectedPlan.expectedReturn * 100)}% return track
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Monthly Income</span>
                    <span>{formatInr(monthlyIncome)}</span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={5000}
                    value={monthlyIncome}
                    onChange={(event) => setMonthlyIncome(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer accent-sky-400"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Savings Rate</span>
                    <span>{savingRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={70}
                    step={1}
                    value={savingRate}
                    onChange={(event) => setSavingRate(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer accent-cyan-400"
                  />
                </label>

                <label className="block">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span>Projection Horizon</span>
                    <span>{years} years</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={1}
                    value={years}
                    onChange={(event) => setYears(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer accent-emerald-400"
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {PLAN_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setPlanId(option.id)}
                    className={
                      planId === option.id
                        ? "rounded-xl border border-sky-300/40 bg-sky-300/15 p-2 text-left"
                        : "rounded-xl border border-white/10 bg-white/5 p-2 text-left transition hover:border-white/25 hover:bg-white/10"
                    }
                  >
                    <p className="text-sm font-semibold text-white">{option.label}</p>
                    <p className="mt-1 text-[11px] text-slate-300">{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-[#041122] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">FIRE Progress</p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                    style={{ width: `${fireProgress}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400">Target Corpus</p>
                    <p className="font-semibold text-white">{formatInr(fireTarget)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Projected Corpus</p>
                    <p className="font-semibold text-cyan-200">{formatInr(projectedCorpus)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 md:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Realistic Person Insights</p>
            <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">How FinPersona reads a real profile</h2>
          </div>
          <p className="max-w-md text-sm text-slate-300">
            Switch between realistic users to see the kind of financial snapshot and action plan the project produces.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#061a31] p-5 md:p-7">
          <div className="flex flex-wrap gap-2">
            {CASE_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setActiveCaseId(profile.id)}
                className={
                  activeCaseId === profile.id
                    ? "rounded-full border border-cyan-300/40 bg-cyan-300/15 px-3 py-1.5 text-xs text-cyan-200"
                    : "rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
                }
              >
                {profile.name}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-white/10 bg-[#041122] p-4">
              <p className="text-sm font-semibold text-white">
                {activeCase.name}, {activeCase.age} · {activeCase.city}
              </p>
              <p className="mt-1 text-xs text-slate-300">{activeCase.role} · Dependents: {activeCase.dependents}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400">Monthly Income</p>
                  <p className="font-semibold text-white">{formatInr(activeCase.monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Monthly Expenses</p>
                  <p className="font-semibold text-white">{formatInr(activeCase.monthlyExpenses)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Monthly EMI</p>
                  <p className="font-semibold text-white">{formatInr(activeCase.monthlyEmi)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Current Corpus</p>
                  <p className="font-semibold text-cyan-200">{formatInr(activeCase.currentCorpus)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <p className="text-slate-400">Savings Capacity</p>
                <p className="mt-1 font-semibold text-emerald-300">{formatInr(caseInvestable)} / month ({caseSavingRate}%)</p>
                <p className="mt-2 text-xs text-slate-300">Goals: {activeCase.goals.join(" • ")}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#041122] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Exec Narrator Output</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Top Actions Generated</h3>

              <div className="mt-4 space-y-2.5">
                {activeCase.topActions.map((action) => (
                  <div key={action} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-100">
                    <IconShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-300" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Interactive Agent Preview</p>
            <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Explore The 6-Agent Brain</h2>
          </div>
          <p className="max-w-md text-sm text-slate-300">
            Click any specialist to inspect what signal it contributes before final strategy synthesis.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-2 sm:grid-cols-2">
            {AGENT_CARDS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => setActiveAgentId(agent.id)}
                className={
                  activeAgentId === agent.id
                    ? "rounded-2xl border border-sky-300/40 bg-sky-300/12 p-3 text-left"
                    : "rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/30 hover:bg-white/10"
                }
              >
                <p className="text-sm font-semibold text-white">{agent.name}</p>
                <p className="mt-1 text-xs text-slate-300">{agent.badge}</p>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#071a32] p-6">
            <div className="flex items-center gap-2 text-emerald-300">
              <IconTargetArrow size={18} />
              <span className="text-xs uppercase tracking-wider">{activeAgent.badge}</span>
            </div>

            <h3 className="mt-3 text-2xl font-semibold text-white">{activeAgent.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{activeAgent.blurb}</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#041122] p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Signal Strength</span>
                <span>{activeAgent.signal}/100</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-400"
                  style={{ width: `${activeAgent.signal}%` }}
                />
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-200">
                {activeAgent.highlights.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <IconShieldCheck size={14} className="mt-0.5 shrink-0 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#031122]">
        <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
          <div className="mb-6 flex items-center gap-2 text-cyan-300">
            <IconTrendingUp size={18} />
            <p className="text-xs uppercase tracking-[0.18em]">Quick Answers</p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;

              return (
                <div key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-semibold text-white">{item.question}</span>
                    <span className="text-cyan-300">{isOpen ? "−" : "+"}</span>
                  </button>

                  {isOpen && <p className="px-4 pb-4 text-sm leading-relaxed text-slate-300">{item.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-slate-400 md:flex-row md:px-8">
        <p>© {new Date().getFullYear()} FinPersona. Built for actionable financial strategy.</p>
        <div className="flex items-center gap-5">
          <Link to="/enter" className="transition hover:text-white">Start</Link>
          <Link to="/platform" className="transition hover:text-white">Platform</Link>
        </div>
      </footer>
    </div>
  );
}
