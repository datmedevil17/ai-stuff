import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconLayoutDashboard,
  IconScan,
  IconScale,
  IconChartPie,
  IconShield,
  IconFlame,
  IconBriefcase,
  IconChevronRight,
  IconUser,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { AgentWorkspace } from "@/components/platform/AgentWorkspace";
import type { TabId } from "@/components/platform/flows";

// ─── Tab metadata ──────────────────────────────────────────────────────────────
type TabMeta = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number; stroke?: number }>;
  role: string;
  color: string;
};

const tabs: TabMeta[] = [
  {
    id: "warroom",
    label: "War Room",
    icon: IconLayoutDashboard,
    role: "Full 6-agent pipeline",
    color: "text-blue-400",
  },
  {
    id: "data-surgeon",
    label: "Data Surgeon",
    icon: IconScan,
    role: "Data Quality & Validation",
    color: "text-sky-400",
  },
  {
    id: "tax-wizard",
    label: "Tax Wizard",
    icon: IconScale,
    role: "Tax Optimisation",
    color: "text-purple-400",
  },
  {
    id: "portfolio-xray",
    label: "Portfolio X-Ray",
    icon: IconChartPie,
    role: "Investment Analysis",
    color: "text-cyan-400",
  },
  {
    id: "risk-shield",
    label: "Risk Shield",
    icon: IconShield,
    role: "Debt & Insurance",
    color: "text-red-400",
  },
  {
    id: "fire-planner",
    label: "FIRE Planner",
    icon: IconFlame,
    role: "Retirement Roadmap",
    color: "text-orange-400",
  },
  {
    id: "exec-narrator",
    label: "Exec Narrator",
    icon: IconBriefcase,
    role: "Strategy Synthesis",
    color: "text-yellow-400",
  },
];

// ─── Platform page ─────────────────────────────────────────────────────────────
export default function Platform() {
  const [activeTab, setActiveTab] = useState<TabId>("warroom");
  const [expanded, setExpanded] = useState(false);

  const active = tabs.find((t) => t.id === activeTab)!;
  const ActiveIcon = active.icon;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0E1A]">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: expanded ? 224 : 60 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="relative flex shrink-0 flex-col border-r border-[#1C2235] bg-[#050911]"
      >
        {/* Logo */}
        <div className="flex h-14 shrink-0 items-center border-b border-[#1C2235] px-3.5 overflow-hidden">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-xs font-black text-white">FP</span>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="ml-2.5 whitespace-nowrap text-sm font-bold text-white"
              >
                FinPersona
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-hidden p-2">
          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-1 ml-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600"
              >
                Overview
              </motion.p>
            )}
          </AnimatePresence>

          <NavItem
            tab={tabs[0]}
            active={activeTab === tabs[0].id}
            expanded={expanded}
            onClick={() => setActiveTab(tabs[0].id)}
          />

          <div className="my-1.5 border-t border-[#1C2235]" />

          <AnimatePresence>
            {expanded && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mb-1 ml-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600"
              >
                Agents
              </motion.p>
            )}
          </AnimatePresence>

          {tabs.slice(1).map((tab) => (
            <NavItem
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              expanded={expanded}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex h-10 shrink-0 items-center justify-center border-t border-[#1C2235] text-neutral-600 transition hover:text-neutral-300"
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.22 }}
          >
            <IconChevronRight size={16} stroke={1.5} />
          </motion.div>
        </button>
      </motion.aside>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center border-b border-[#1C2235] bg-[#0A0E1A] px-6">
          <div className="flex items-center gap-1.5 text-sm text-neutral-500">
            <span>FinPersona</span>
            <span className="text-neutral-700">/</span>
            <span className="text-neutral-300">Platform</span>
            <span className="text-neutral-700">/</span>
            <span className={cn("flex items-center gap-1.5 font-medium", active.color)}>
              <ActiveIcon size={14} stroke={2} />
              {active.label}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-neutral-600">{active.role}</span>
            <div className="h-4 w-px bg-[#1C2235]" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
              <IconUser size={14} stroke={1.5} />
            </div>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 overflow-hidden">
          <AgentWorkspace key={activeTab} tab={activeTab} onNavigateToTab={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

// ─── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({
  tab,
  active,
  expanded,
  onClick,
}: {
  tab: TabMeta;
  active: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      title={!expanded ? tab.label : undefined}
      className={cn(
        "relative flex h-9 w-full items-center rounded-lg px-2.5 transition-colors",
        active
          ? "bg-blue-500/15 text-blue-300"
          : "text-neutral-500 hover:bg-[#161B2A] hover:text-neutral-300"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-blue-500"
        />
      )}

      <Icon size={17} stroke={1.75} className="shrink-0" />

      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.13 }}
            className="ml-2.5 truncate text-left text-sm"
          >
            {tab.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
