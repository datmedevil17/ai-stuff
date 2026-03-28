import { cn } from "@/lib/utils";
import type { TabId } from "./flows";

// ─── Shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
      {children}
    </p>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warn" | "error" | "info";
}) {
  const colors = {
    default: "bg-neutral-800 text-neutral-300",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    error: "bg-red-500/15 text-red-400 border border-red-500/30",
    info: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  };
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", colors[variant])}>
      {children}
    </span>
  );
}

// Circular SVG progress ring
function CircleProgress({ value, color = "#10B981" }: { value: number; color?: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1C2235" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
      <text x="36" y="40" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
        {value}
      </text>
    </svg>
  );
}

// Horizontal bar
function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#1C2235]">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// Donut chart (CSS conic-gradient)
function Donut({
  segments,
}: {
  segments: Array<{ pct: number; color: string; label: string }>;
}) {
  let cum = 0;
  const gradient = segments
    .map((s) => {
      const part = `${s.color} ${cum}% ${cum + s.pct}%`;
      cum += s.pct;
      return part;
    })
    .join(", ");
  return (
    <div className="relative h-[72px] w-[72px] shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
      <div className="absolute inset-[24%] rounded-full bg-[#0A0E1A]" />
    </div>
  );
}

// ─── Wrapper ───────────────────────────────────────────────────────────────────
export function AgentOutput({ tab, visible }: { tab: TabId; visible: boolean }) {
  if (!visible) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <span className="text-3xl opacity-30">📊</span>
        <p className="text-sm text-neutral-600">Run the agent to see output</p>
      </div>
    );
  }

  const map: Record<TabId, React.ReactNode> = {
    "data-surgeon": <DataSurgeonOutput />,
    "tax-wizard": <TaxWizardOutput />,
    "portfolio-xray": <PortfolioXRayOutput />,
    "risk-shield": <RiskShieldOutput />,
    "fire-planner": <FirePlannerOutput />,
    "exec-narrator": <ExecNarratorOutput />,
    warroom: <WarRoomOutput />,
  };

  return (
    <div className="h-full overflow-y-auto px-4 py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
      {map[tab]}
    </div>
  );
}

// ─── 1. Data Surgeon ──────────────────────────────────────────────────────────
function DataSurgeonOutput() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <CircleProgress value={92} color="#10B981" />
        <div>
          <p className="text-2xl font-bold text-white">92<span className="ml-1 text-sm text-neutral-500">/100</span></p>
          <p className="text-xs text-neutral-500">Data Quality Score</p>
          <Badge variant="success">✓ Verified</Badge>
        </div>
      </div>

      <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <SectionLabel>Quality Dimensions</SectionLabel>
        <div className="space-y-2">
          {[
            { label: "Completeness", value: 95 },
            { label: "Consistency", value: 90 },
            { label: "Accuracy", value: 88 },
          ].map((d) => (
            <div key={d.label}>
              <div className="mb-1 flex justify-between text-xs text-neutral-400">
                <span>{d.label}</span>
                <span>{d.value}%</span>
              </div>
              <Bar value={d.value} max={100} color="#10B981" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <SectionLabel>Flags (2)</SectionLabel>
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 p-2.5">
            <span className="text-amber-400">⚠</span>
            <p className="text-xs text-neutral-300">EPF balance (₹80,000) seems low for income bracket — assuming recent graduate.</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-blue-500/5 p-2.5">
            <span className="text-blue-400">ℹ</span>
            <p className="text-xs text-neutral-300">No HRA data provided — using standard deductions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Tax Wizard ────────────────────────────────────────────────────────────
function TaxWizardOutput() {
  const old = 182500;
  const nw = 156000;
  const max = 200000;
  const savings = old - nw;
  const savingsPct = ((savings / old) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Regime comparison */}
      <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <SectionLabel>Regime Comparison</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {/* Old */}
          <div className="rounded-lg border border-[#2A3350] p-3 text-center">
            <p className="mb-1 text-[10px] text-neutral-500 uppercase tracking-wider">Old Regime</p>
            <p className="text-lg font-bold text-white">₹1,82,500</p>
            <div className="mt-2 flex justify-center">
              <div className="w-3/4 overflow-hidden rounded-sm bg-[#1C2235]" style={{ height: 80 }}>
                <div className="w-full rounded-sm bg-red-500/60 transition-all duration-1000" style={{ height: `${(old / max) * 80}px`, marginTop: `${80 - (old / max) * 80}px` }} />
              </div>
            </div>
          </div>
          {/* New */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
            <p className="mb-1 text-[10px] text-emerald-500 uppercase tracking-wider">New Regime ✓</p>
            <p className="text-lg font-bold text-white">₹1,56,000</p>
            <div className="mt-2 flex justify-center">
              <div className="w-3/4 overflow-hidden rounded-sm bg-[#1C2235]" style={{ height: 80 }}>
                <div className="w-full rounded-sm bg-emerald-500/70 transition-all duration-1000" style={{ height: `${(nw / max) * 80}px`, marginTop: `${80 - (nw / max) * 80}px` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Savings callout */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3">
        <span className="text-2xl">💰</span>
        <div>
          <p className="text-lg font-bold text-emerald-400">₹26,500 saved</p>
          <p className="text-xs text-neutral-500">{savingsPct}% lower tax in New Regime</p>
        </div>
      </div>

      {/* Gaps */}
      <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <SectionLabel>Deduction Gaps</SectionLabel>
        <div className="space-y-2">
          {[
            "Section 80C limit unutilized by ₹70,000",
            "No Section 80CCD(1B) NPS contribution detected",
          ].map((g) => (
            <div key={g} className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-400">⚠</span>
              <p className="text-xs text-neutral-300">{g}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. Portfolio X-Ray ───────────────────────────────────────────────────────
function PortfolioXRayOutput() {
  const current = [
    { pct: 57, color: "#3B82F6", label: "Equity", val: "56%" },
    { pct: 19, color: "#8B5CF6", label: "Crypto", val: "19%" },
    { pct: 24, color: "#10B981", label: "Debt/Cash", val: "25%" },
  ];
  const target = [
    { pct: 70, color: "#3B82F6", label: "Equity", val: "70%" },
    { pct: 5, color: "#8B5CF6", label: "Crypto", val: "5%" },
    { pct: 25, color: "#10B981", label: "Debt/Cash", val: "25%" },
  ];

  return (
    <div className="space-y-4">
      {/* Two donuts */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Current", data: current },
          { label: "Target", data: target },
        ].map(({ label, data }) => (
          <div key={label} className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-3">
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
            <div className="flex items-center gap-3">
              <Donut segments={data} />
              <div className="space-y-1">
                {data.map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-[10px] text-neutral-400">{s.label}</span>
                    <span className="text-[10px] font-bold text-white">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <SectionLabel>Critical Insights</SectionLabel>
        <div className="space-y-2">
          <div className="flex items-start gap-2 rounded-lg bg-red-500/5 p-2.5">
            <span className="text-red-400">✗</span>
            <p className="text-xs text-neutral-300">Crypto exposure 19% is critically high. Recommend rebalancing to &lt;5%.</p>
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-red-500/5 p-2.5">
            <span className="text-red-400">✗</span>
            <p className="text-xs text-neutral-300">Emergency fund ₹50,000 is critically low. Needs to be at least ₹1.35L (3× expenses).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. Risk Shield ───────────────────────────────────────────────────────────
function RiskShieldOutput() {
  return (
    <div className="space-y-4">
      {/* EMI */}
      <div className="rounded-xl border border-emerald-500/30 bg-[#161B2A] p-4">
        <SectionLabel>EMI Stress Level</SectionLabel>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-sm font-bold text-white">SAFE</span>
          </div>
          <Badge variant="success">9% of Income</Badge>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-neutral-500">
            <span>EMI / Income ratio</span>
            <span className="text-emerald-400">9% (Safe &lt;40%)</span>
          </div>
          <Bar value={9} max={100} color="#10B981" />
        </div>
      </div>

      {/* Insurance gap */}
      <div className="rounded-xl border border-red-500/40 bg-[#161B2A] p-4">
        <SectionLabel>Insurance Gap</SectionLabel>
        <div className="space-y-3">
          {[
            { label: "Human Life Value", value: "₹2,25,00,000", color: "text-white" },
            { label: "Current Term Cover", value: "₹0", color: "text-red-400" },
            { label: "Deficit", value: "₹2,25,00,000", color: "text-red-400 font-bold" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-[#1C2235] pb-2 last:border-0 last:pb-0">
              <span className="text-xs text-neutral-500">{row.label}</span>
              <span className={cn("text-sm", row.color)}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
        <span className="text-lg">💡</span>
        <div>
          <p className="text-xs font-semibold text-white">Immediate Priority</p>
          <p className="mt-0.5 text-xs text-neutral-400">Purchase a ₹2.5 Cr term insurance plan before age 25 to lock in a premium of ~₹800/month.</p>
        </div>
      </div>
    </div>
  );
}

// ─── 5. FIRE Planner ──────────────────────────────────────────────────────────
function FirePlannerOutput() {
  // SVG compound growth curve (22 years, pre-computed log values)
  const points = "0,75 32,72 64,66 96,56 128,43 160,27 192,13 224,4 256,1";

  return (
    <div className="space-y-4">
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-orange-500/30 bg-[#161B2A] p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Freedom Number</p>
          <p className="mt-1 text-base font-bold text-white">₹4.8 Crore</p>
          <p className="text-[10px] text-neutral-600">Inflation-adjusted</p>
        </div>
        <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Target Age</p>
          <p className="mt-1 text-2xl font-bold text-white">45</p>
          <p className="text-[10px] text-neutral-600">22 years from now</p>
        </div>
      </div>

      {/* SIP */}
      <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <SectionLabel>Monthly SIP Required</SectionLabel>
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold text-white">₹35,000 <span className="text-sm text-neutral-500">/mo</span></p>
          <div className="text-right text-xs text-neutral-600">
            <p>Return: 12% p.a.</p>
            <p>Inflation: 6% p.a.</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-neutral-600">
            <span>Current ₹5.3L</span>
            <span>Target ₹4.8Cr</span>
          </div>
          <Bar value={53} max={4800} color="#F97316" />
        </div>
      </div>

      {/* Growth chart */}
      <div className="rounded-xl border border-[#2A3350] bg-[#161B2A] p-4">
        <SectionLabel>Projected Growth (Age 23 → 45)</SectionLabel>
        <svg viewBox="0 0 256 80" className="w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline points={points} fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points={`${points} 256,80 0,80`} fill="url(#fg)" />
          {/* Target line */}
          <line x1="0" y1="1" x2="256" y2="1" stroke="#F97316" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.4" />
          <text x="252" y="10" fontSize="7" fill="#F97316" textAnchor="end" opacity="0.7">₹4.8Cr</text>
        </svg>
      </div>
    </div>
  );
}

// ─── 6. Exec Narrator ─────────────────────────────────────────────────────────
const priorities = [
  {
    n: "01",
    title: "Build the Emergency Fortress",
    desc: "Pause equity investments for 2 months to build your bank balance to ₹1.35 Lakhs.",
    gradient: "from-amber-500/40 to-amber-500/5",
    accent: "text-amber-400",
    border: "border-amber-500/30",
  },
  {
    n: "02",
    title: "Close the Risk Gap",
    desc: "Buy a ₹2.5 Cr term life insurance policy immediately to protect your 2 dependents.",
    gradient: "from-red-500/40 to-red-500/5",
    accent: "text-red-400",
    border: "border-red-500/30",
  },
  {
    n: "03",
    title: "Optimise the New Regime",
    desc: "Shift to New Tax Regime to save ₹26,500, then route ₹50,000 into NPS for long-term wealth.",
    gradient: "from-blue-500/40 to-blue-500/5",
    accent: "text-blue-400",
    border: "border-blue-500/30",
  },
];

function ExecNarratorOutput() {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-yellow-500">Executive Summary</p>
        <p className="text-xs leading-relaxed text-neutral-300">
          You are off to a great start with a high income and early investments, but you are carrying
          uncompensated risks. We need to secure your base before chasing aggressive growth.
        </p>
      </div>

      {/* Priority cards */}
      <div className="space-y-3">
        <SectionLabel>Top 3 Priorities</SectionLabel>
        {priorities.map((p) => (
          <div key={p.n} className={cn("relative overflow-hidden rounded-xl border bg-[#161B2A] p-4", p.border)}>
            <div className={cn("absolute right-0 top-0 h-full w-24 bg-gradient-to-l opacity-40", p.gradient)} />
            <div className="relative flex items-start gap-3">
              <span className={cn("text-xl font-black", p.accent)}>{p.n}</span>
              <div>
                <p className="text-sm font-bold text-white">{p.title}</p>
                <p className="mt-0.5 text-xs text-neutral-400">{p.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 7. War Room (combined) ───────────────────────────────────────────────────
const warRoomSummaries = [
  { icon: "🔬", agent: "Data Surgeon", summary: "DQ Score: 92/100 — 2 advisory flags", badge: "success" as const },
  { icon: "⚖️", agent: "Tax Wizard", summary: "New Regime saves ₹26,500 — 2 gaps found", badge: "success" as const },
  { icon: "📡", agent: "Portfolio X-Ray", summary: "Crypto 19% critical — emergency fund low", badge: "warn" as const },
  { icon: "🛡️", agent: "Risk Shield", summary: "EMI safe — ₹2.25Cr insurance deficit", badge: "error" as const },
  { icon: "🔥", agent: "FIRE Planner", summary: "SIP ₹35,000/mo — retire at age 45", badge: "success" as const },
  { icon: "🎖️", agent: "Exec Narrator", summary: "Gold Strategy: 3 priority actions", badge: "success" as const },
];

function WarRoomOutput() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">Gold Strategy — Final Output</p>
        <p className="mt-1 text-xs text-neutral-300">All 6 agents completed. See Exec Narrator tab for full breakdown.</p>
      </div>

      <div className="space-y-2">
        <SectionLabel>Agent Summaries</SectionLabel>
        {warRoomSummaries.map((s) => (
          <div key={s.agent} className="flex items-center gap-3 rounded-lg border border-[#2A3350] bg-[#161B2A] px-3 py-2.5">
            <span className="text-base">{s.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white">{s.agent}</p>
              <p className="truncate text-[10px] text-neutral-500">{s.summary}</p>
            </div>
            <Badge variant={s.badge}>
              {s.badge === "success" ? "✓" : s.badge === "warn" ? "⚠" : "✗"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
