import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { nodeTypes } from "./nodes";
import { flowMap, type TabId } from "./flows";
import type { Status } from "./nodes";
import { consoleLogs, type LogLine } from "./consoleLogs";
import { AgentOutput } from "./AgentOutput";

// ─── Node picker options ───────────────────────────────────────────────────────
const PICKER_OPTS = [
  { type: "inputNode",   icon: "📥", label: "Input Node",   desc: "Data source / entry point" },
  { type: "processNode", icon: "⚙️", label: "Process Node", desc: "Processing / transform step" },
  { type: "outputNode",  icon: "📤", label: "Output Node",  desc: "Result / exit point" },
];

const LOG_ICON: Record<LogLine["level"], string> = {
  info: "▸", success: "✓", warn: "⚠", error: "✗",
};
const LOG_COLOR: Record<LogLine["level"], string> = {
  info: "text-neutral-400", success: "text-emerald-400",
  warn: "text-amber-400",   error: "text-red-400",
};

// Agent node id → tab id mapping for War Room context menu
const AGENT_NODE_TAB: Record<string, TabId> = {
  "wr-ds": "data-surgeon",
  "wr-tw": "tax-wizard",
  "wr-px": "portfolio-xray",
  "wr-rs": "risk-shield",
  "wr-fp": "fire-planner",
  "wr-en": "exec-narrator",
};

// ─── Pipeline type ─────────────────────────────────────────────────────────────
type Pipeline = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  hasResult: boolean;
};

function makePipeline(name: string, nodes: Node[], edges: Edge[]): Pipeline {
  return {
    id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    nodes: nodes.map((n) => ({ ...n, data: { ...n.data, status: "idle" as Status } })),
    edges,
    hasResult: false,
  };
}

// ─── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({
  x,
  y,
  nodeId,
  nodeType,
  onViewPipeline,
  onClose,
}: {
  x: number;
  y: number;
  nodeId: string;
  nodeType: string | undefined;
  onViewPipeline: (nodeId: string) => void;
  onClose: () => void;
}) {
  const isAgent = nodeType === "agentNode" && nodeId in AGENT_NODE_TAB;
  return (
    <div
      className="fixed z-[9999] min-w-[180px] overflow-hidden rounded-xl border border-[#2A3350] bg-[#0F1423] shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {isAgent ? (
        <button
          onClick={() => { onViewPipeline(nodeId); onClose(); }}
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-neutral-200 transition hover:bg-blue-500/15 hover:text-blue-300"
        >
          <span className="text-base">🔀</span>
          View Agent Pipeline
        </button>
      ) : (
        <div className="px-3.5 py-2.5 text-xs text-neutral-600">No actions available</div>
      )}
    </div>
  );
}

// ─── Pipeline Bar ──────────────────────────────────────────────────────────────
function PipelineBar({
  pipelines,
  activePipelineId,
  onSelect,
  onAdd,
  onDelete,
  onRename,
}: {
  pipelines: Pipeline[];
  activePipelineId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus();
  }, [editingId]);

  const startEdit = (pl: Pipeline, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(pl.id);
    setEditName(pl.name);
  };

  const commitEdit = (id: string) => {
    if (editName.trim()) onRename(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-[#1C2235] bg-[#080C18] px-3 py-1.5 scrollbar-none">
      <span className="mr-1 shrink-0 text-[10px] font-bold uppercase tracking-widest text-neutral-600">
        Pipelines
      </span>
      {pipelines.map((pl) => (
        <div
          key={pl.id}
          onClick={() => onSelect(pl.id)}
          className={cn(
            "group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition",
            pl.id === activePipelineId
              ? "border-blue-500/40 bg-blue-500/12 text-blue-300"
              : "border-[#1C2235] bg-[#0F1423] text-neutral-500 hover:border-[#2A3350] hover:text-neutral-300"
          )}
        >
          {pl.hasResult && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" title="Has results" />
          )}
          {editingId === pl.id ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => commitEdit(pl.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit(pl.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-20 bg-transparent outline-none text-xs text-white"
            />
          ) : (
            <span onDoubleClick={(e) => startEdit(pl, e)}>{pl.name}</span>
          )}
          {pipelines.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(pl.id); }}
              className="ml-0.5 hidden text-neutral-600 transition hover:text-red-400 group-hover:inline"
              title="Delete pipeline"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAdd}
        className="ml-1 shrink-0 rounded-lg border border-dashed border-[#2A3350] px-2.5 py-1 text-xs text-neutral-600 transition hover:border-[#3B4A6B] hover:text-neutral-400"
      >
        + New
      </button>
    </div>
  );
}

// ─── Run Selector ──────────────────────────────────────────────────────────────
function RunSelector({
  pipelines,
  onRun,
  onClose,
}: {
  pipelines: Pipeline[];
  onRun: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set([pipelines[0]?.id]));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="absolute right-4 top-14 z-50 w-64 overflow-hidden rounded-xl border border-[#2A3350] bg-[#0F1423] shadow-[0_8px_40px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between border-b border-[#1C2235] px-4 py-3">
        <p className="text-sm font-semibold text-white">Run Pipeline</p>
        <button onClick={onClose} className="text-xs text-neutral-600 hover:text-neutral-300 transition">✕</button>
      </div>
      <div className="space-y-1 p-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600">Select pipelines to run</p>
        {pipelines.map((pl) => (
          <label key={pl.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-[#161B2A]">
            <input
              type="checkbox"
              checked={selected.has(pl.id)}
              onChange={() => toggle(pl.id)}
              className="accent-blue-500"
            />
            <span className="text-sm text-neutral-300">{pl.name}</span>
            {pl.hasResult && <span className="ml-auto text-[10px] text-emerald-400">ran</span>}
          </label>
        ))}
      </div>
      <div className="border-t border-[#1C2235] px-3 py-2">
        <button
          disabled={selected.size === 0}
          onClick={() => { onRun([...selected]); onClose(); }}
          className="w-full rounded-lg bg-blue-600 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Run {selected.size > 0 ? `${selected.size} Pipeline${selected.size > 1 ? "s" : ""}` : ""}
        </button>
      </div>
    </div>
  );
}

// ─── Compare Modal ─────────────────────────────────────────────────────────────
function CompareModal({
  pipelines,
  onClose,
}: {
  pipelines: Pipeline[];
  onClose: () => void;
}) {
  const ranPipelines = pipelines.filter((p) => p.hasResult);
  const [leftId, setLeftId] = useState(ranPipelines[0]?.id ?? "");
  const [rightId, setRightId] = useState(ranPipelines[1]?.id ?? ranPipelines[0]?.id ?? "");

  const selectCls =
    "w-full rounded-lg border border-[#2A3350] bg-[#0A0E1A] px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none transition";

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col bg-[#050911]/90 backdrop-blur-sm">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center border-b border-[#1C2235] bg-[#080C18] px-6">
        <p className="text-sm font-bold text-white">Compare Pipelines</p>
        <button
          onClick={onClose}
          className="ml-auto rounded-lg border border-[#2A3350] px-3 py-1.5 text-xs text-neutral-400 transition hover:border-[#3B4A6B] hover:text-neutral-200"
        >
          Close
        </button>
      </div>

      {/* Two-column comparison */}
      <div className="flex flex-1 overflow-hidden divide-x divide-[#1C2235]">
        {/* Left */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-[#1C2235] bg-[#0A0E1A] px-4 py-2">
            <select value={leftId} onChange={(e) => setLeftId(e.target.value)} className={selectCls}>
              {ranPipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-auto">
            <AgentOutput tab="warroom" visible={true} />
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="border-b border-[#1C2235] bg-[#0A0E1A] px-4 py-2">
            <select value={rightId} onChange={(e) => setRightId(e.target.value)} className={selectCls}>
              {ranPipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 overflow-auto">
            <AgentOutput tab="warroom" visible={true} />
          </div>
        </div>
      </div>

      {/* Delta summary */}
      <div className="shrink-0 border-t border-[#1C2235] bg-[#080C18] px-6 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
          Key Differences — {ranPipelines.find((p) => p.id === leftId)?.name ?? "Pipeline A"} vs{" "}
          {ranPipelines.find((p) => p.id === rightId)?.name ?? "Pipeline B"}
        </p>
        <div className="flex gap-6">
          {[
            { label: "Risk Score", left: "72 / 100", right: "68 / 100", delta: "▼ 4", color: "text-red-400" },
            { label: "Tax Savings", left: "₹1.2L", right: "₹1.5L", delta: "▲ ₹30K", color: "text-emerald-400" },
            { label: "FIRE Corpus", left: "₹4.8Cr", right: "₹5.1Cr", delta: "▲ ₹30L", color: "text-emerald-400" },
            { label: "Priority Action", left: "Increase SIP", right: "Clear HLoan", delta: "—", color: "text-neutral-500" },
          ].map((row) => (
            <div key={row.label} className="flex-1 rounded-lg border border-[#1C2235] bg-[#0A0E1A] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">{row.label}</p>
              <div className="mt-1 flex items-end justify-between gap-1">
                <span className="text-xs text-neutral-400">{row.left}</span>
                <span className={cn("text-[10px] font-semibold", row.color)}>{row.delta}</span>
                <span className="text-xs text-neutral-400">{row.right}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Terminal Drawer ───────────────────────────────────────────────────────────
type TerminalLog = LogLine & { time: string };

function TerminalDrawer({
  tab,
  logs,
  isRunning,
  minimized,
  onMinimize,
  onClose,
}: {
  tab: TabId;
  logs: TerminalLog[];
  isRunning: boolean;
  minimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!minimized) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, minimized]);

  const tabLabel = tab === "warroom" ? "war-room" : tab.replace(/-/g, "-");

  return (
    <div className="shrink-0 border-t border-[#1C2235]">
      <div className="flex h-9 items-center gap-3 border-b border-[#1C2235] bg-[#0A0E1A] px-4">
        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            title="Close terminal"
            className="h-3 w-3 rounded-full bg-red-500/60 transition hover:bg-red-500"
          />
          <button
            onClick={onMinimize}
            title={minimized ? "Expand" : "Minimise"}
            className="h-3 w-3 rounded-full bg-yellow-500/60 transition hover:bg-yellow-500"
          />
          <div className="h-3 w-3 rounded-full bg-emerald-500/20" />
        </div>

        <span className="font-mono text-[11px] text-neutral-500 select-none">
          finpersona — {tabLabel} — agent logs
        </span>

        <div className="ml-auto flex items-center gap-3">
          {isRunning && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-amber-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              running
            </span>
          )}
          {logs.length > 0 && !isRunning && (
            <span className="font-mono text-[10px] text-neutral-600">{logs.length} lines</span>
          )}
        </div>
      </div>

      {!minimized && (
        <div className="h-[190px] overflow-y-auto bg-[#050911] p-3">
          <div className="mb-2 font-mono text-xs text-neutral-600">$ finpersona run {tabLabel}</div>

          {logs.length === 0 && !isRunning && (
            <span className="font-mono text-xs text-neutral-700">Waiting for agent to start…</span>
          )}

          {logs.map((log, i) => (
            <div key={i} className="mb-0.5 flex items-start gap-2">
              <span className="shrink-0 font-mono text-[10px] text-neutral-700 tabular-nums">{log.time}</span>
              <span className={cn("shrink-0 font-mono text-xs", LOG_COLOR[log.level])}>{LOG_ICON[log.level]}</span>
              <span className={cn("font-mono text-xs", LOG_COLOR[log.level])}>{log.text}</span>
            </div>
          ))}

          {isRunning && (
            <span className="mt-0.5 inline-block animate-pulse font-mono text-xs text-emerald-500">█</span>
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}

// ─── AgentWorkspace ───────────────────────────────────────────────────────────
type Props = { tab: TabId; onNavigateToTab?: (tab: TabId) => void };

export function AgentWorkspace({ tab, onNavigateToTab }: Props) {
  const flow = flowMap[tab];
  const isWarRoom = tab === "warroom";

  // ── Pipeline state (war room only) ────────────────────────────────────────
  const initRef = useRef<{ list: Pipeline[]; id: string } | null>(null);
  if (initRef.current === null) {
    const first = makePipeline("Pipeline 1", flow.nodes, flow.edges);
    initRef.current = { list: [first], id: first.id };
  }

  const [pipelineList, setPipelineList] = useState<Pipeline[]>(initRef.current.list);
  const [activePId, setActivePId] = useState<string>(initRef.current.id);

  const activePipeline = pipelineList.find((p) => p.id === activePId) ?? pipelineList[0];

  // ── React Flow state ───────────────────────────────────────────────────────
  const [nodes, setNodes, onNodesChange] = useNodesState(activePipeline.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activePipeline.edges);

  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Output panel
  const [showPanel, setShowPanel] = useState(false);

  // Terminal
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [logLines, setLogLines] = useState<TerminalLog[]>([]);

  // Node picker
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const nodeCounter = useRef(1000);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string; nodeType: string | undefined } | null>(null);

  // Run selector (war room multi-pipeline)
  const [showRunSelector, setShowRunSelector] = useState(false);
  const runSelectorRef = useRef<HTMLDivElement>(null);

  // Compare modal
  const [showCompare, setShowCompare] = useState(false);

  const ranPipelinesCount = pipelineList.filter((p) => p.hasResult).length;

  // ── Close picker on outside click ─────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as EventTarget & globalThis.Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Close context menu on click ───────────────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const h = () => setContextMenu(null);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [contextMenu]);

  // ── Save current nodes/edges back to active pipeline before switching ─────
  const saveCurrentPipeline = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      setPipelineList((prev) =>
        prev.map((p) => (p.id === activePId ? { ...p, nodes: currentNodes, edges: currentEdges } : p))
      );
    },
    [activePId]
  );

  // ── Switch pipeline ────────────────────────────────────────────────────────
  const switchPipeline = useCallback(
    (id: string) => {
      if (id === activePId) return;
      // Save current
      setPipelineList((prev) =>
        prev.map((p) =>
          p.id === activePId ? { ...p, nodes: [...nodes], edges: [...edges] } : p
        )
      );
      // Load target
      const target = pipelineList.find((p) => p.id === id);
      if (target) {
        setNodes(target.nodes.map((n) => ({ ...n })));
        setEdges(target.edges.map((e) => ({ ...e })));
        setIsDone(target.hasResult);
      }
      setActivePId(id);
      setShowPanel(false);
    },
    [activePId, nodes, edges, pipelineList, setNodes, setEdges]
  );

  // ── Add pipeline ───────────────────────────────────────────────────────────
  const addPipeline = useCallback(() => {
    // Save current first
    const currentNodes = [...nodes];
    const currentEdges = [...edges];
    setPipelineList((prev) => {
      const updated = prev.map((p) =>
        p.id === activePId ? { ...p, nodes: currentNodes, edges: currentEdges } : p
      );
      const newPl = makePipeline(
        `Pipeline ${updated.length + 1}`,
        flow.nodes,
        flow.edges
      );
      setActivePId(newPl.id);
      setNodes(newPl.nodes.map((n) => ({ ...n })));
      setEdges(newPl.edges.map((e) => ({ ...e })));
      setIsDone(false);
      setShowPanel(false);
      return [...updated, newPl];
    });
  }, [nodes, edges, activePId, flow.nodes, flow.edges, setNodes, setEdges]);

  // ── Delete pipeline ────────────────────────────────────────────────────────
  const deletePipeline = useCallback(
    (id: string) => {
      setPipelineList((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((p) => p.id !== id);
        if (id === activePId) {
          const target = next[0];
          setActivePId(target.id);
          setNodes(target.nodes.map((n) => ({ ...n })));
          setEdges(target.edges.map((e) => ({ ...e })));
          setIsDone(target.hasResult);
          setShowPanel(false);
        }
        return next;
      });
    },
    [activePId, setNodes, setEdges]
  );

  // ── Rename pipeline ────────────────────────────────────────────────────────
  const renamePipeline = useCallback((id: string, name: string) => {
    setPipelineList((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  // ── Connect handler ────────────────────────────────────────────────────────
  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((prev) =>
        addEdge({ ...conn, type: "smoothstep", style: { stroke: "#3B82F6", strokeWidth: 2 } }, prev)
      ),
    [setEdges]
  );

  // ── Node click → open output panel if outputNode ──────────────────────────
  const onNodeClick = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      if (node.type === "outputNode" && isDone) {
        setShowPanel(true);
      }
    },
    [isDone]
  );

  // ── Node right-click → context menu (war room) ────────────────────────────
  const onNodeContextMenu = useCallback(
    (e: React.MouseEvent, node: Node) => {
      if (!isWarRoom) return;
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id, nodeType: node.type });
    },
    [isWarRoom]
  );

  // ── Add node from picker ───────────────────────────────────────────────────
  const addNode = useCallback(
    (type: string, icon: string, label: string) => {
      const id = `custom-${nodeCounter.current++}`;
      setNodes((prev) => [
        ...prev,
        {
          id,
          type,
          position: { x: 280 + (nodeCounter.current % 6) * 35, y: 100 + (nodeCounter.current % 5) * 45 },
          data: { label, description: "Custom node — drag handles to connect", icon, status: "idle" as Status },
        },
      ]);
      setShowPicker(false);
    },
    [setNodes]
  );

  // ── Run animation (single pipeline) ───────────────────────────────────────
  const runSingle = useCallback(
    (pipelineId: string) => {
      // Get nodes for this pipeline
      const target = pipelineList.find((p) => p.id === pipelineId);
      const targetNodes = pipelineId === activePId ? nodes : (target?.nodes ?? nodes);

      setIsRunning(true);
      setIsDone(false);
      setLogLines([]);
      setTerminalOpen(true);
      setTerminalMinimized(false);

      const ids = targetNodes.map((nd) => nd.id);
      const PER_NODE = 800;
      const totalMs = ids.length * PER_NODE + 500;

      const resetStatus = (nds: Node[]) =>
        nds.map((nd) => ({ ...nd, data: { ...nd.data, status: "idle" as Status } }));

      if (pipelineId === activePId) {
        setNodes(resetStatus);
      } else {
        setPipelineList((prev) =>
          prev.map((p) => (p.id === pipelineId ? { ...p, nodes: resetStatus(p.nodes) } : p))
        );
      }

      const logs = consoleLogs[tab];
      logs.forEach((log, i) => {
        const delay = Math.round((i / logs.length) * totalMs * 0.92);
        setTimeout(() => {
          const now = new Date();
          const time = `${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, "0")}`;
          setLogLines((prev) => [...prev, { ...log, time }]);
        }, delay);
      });

      ids.forEach((id, idx) => {
        const base = idx * PER_NODE;
        setTimeout(() => {
          if (pipelineId === activePId) {
            setNodes((nds) =>
              nds.map((nd) =>
                nd.id === id ? { ...nd, data: { ...nd.data, status: "running" as Status } } : nd
              )
            );
          }
        }, base);
        setTimeout(() => {
          if (pipelineId === activePId) {
            setNodes((nds) =>
              nds.map((nd) =>
                nd.id === id ? { ...nd, data: { ...nd.data, status: "complete" as Status } } : nd
              )
            );
          }
          if (idx === ids.length - 1) {
            setIsRunning(false);
            setIsDone(true);
            setPipelineList((prev) =>
              prev.map((p) => (p.id === pipelineId ? { ...p, hasResult: true } : p))
            );
          }
        }, base + 600);
      });
    },
    [activePId, nodes, pipelineList, tab, setNodes]
  );

  // ── Run handler ────────────────────────────────────────────────────────────
  const run = useCallback(() => {
    if (isRunning) return;
    if (isWarRoom && pipelineList.length > 1) {
      setShowRunSelector(true);
      return;
    }
    runSingle(activePId);
  }, [isRunning, isWarRoom, pipelineList.length, runSingle, activePId]);

  const runSelected = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      // Run them sequentially with slight delay
      ids.forEach((id, i) => {
        if (i === 0) runSingle(id);
        else {
          const target = pipelineList.find((p) => p.id === id);
          const nodeCount = target?.nodes.length ?? 9;
          setTimeout(() => runSingle(id), i * nodeCount * 800 + 1000);
        }
      });
    },
    [runSingle, pipelineList]
  );

  const reset = useCallback(() => {
    setNodes((nds) =>
      nds.map((nd) => ({ ...nd, data: { ...nd.data, status: "idle" as Status } }))
    );
    setIsDone(false);
    setLogLines([]);
    setShowPanel(false);
  }, [setNodes]);

  const runLabel = isRunning ? "Running…" : isDone ? "Completed" : isWarRoom ? "Deploy All Agents" : "Run Agent";

  return (
    <div className="flex h-full flex-col">
      {/* ── Action bar ── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-[#1C2235] bg-[#0A0E1A] px-4 py-2">
        {/* Status */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isRunning ? "bg-amber-400 animate-pulse" : isDone ? "bg-emerald-400" : "bg-neutral-600"
            )}
          />
          <span className="text-xs text-neutral-500">
            {isRunning ? "Running…" : isDone ? "Complete" : "Idle"}
          </span>
        </div>

        <div className="flex-1" />

        {/* Compare button (war room, 2+ results) */}
        {isWarRoom && ranPipelinesCount >= 2 && (
          <button
            onClick={() => setShowCompare(true)}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-1.5 text-xs text-purple-400 transition hover:border-purple-400/60 hover:text-purple-300"
          >
            ⚡ Compare
          </button>
        )}

        {/* Add Node picker */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-[#2A3350] bg-[#161B2A] px-3 py-1.5 text-xs text-neutral-300 transition hover:border-[#3B4A6B] hover:text-white"
          >
            + Add Node <span className="text-neutral-600">▾</span>
          </button>

          {showPicker && (
            <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border border-[#2A3350] bg-[#0F1423] shadow-2xl">
              <div className="border-b border-[#1C2235] px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Add Node</p>
              </div>
              {PICKER_OPTS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => addNode(opt.type, opt.icon, opt.label)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-[#161B2A]"
                >
                  <span className="text-base">{opt.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-white">{opt.label}</p>
                    <p className="text-[10px] text-neutral-600">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Terminal toggle */}
        <button
          onClick={() => {
            if (terminalOpen) setTerminalMinimized((v) => !v);
            else { setTerminalOpen(true); setTerminalMinimized(false); }
          }}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs transition",
            terminalOpen && !terminalMinimized
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : "border-[#2A3350] bg-[#161B2A] text-neutral-400 hover:text-neutral-200"
          )}
        >
          Terminal
        </button>

        {isDone && (
          <button
            onClick={reset}
            className="rounded-lg border border-[#2A3350] px-3 py-1.5 text-xs text-neutral-400 transition hover:border-[#3B4A6B] hover:text-neutral-200"
          >
            Reset
          </button>
        )}

        {/* Run button with selector for multi-pipeline */}
        <div className="relative" ref={runSelectorRef}>
          <button
            onClick={run}
            disabled={isRunning}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-semibold transition",
              isDone
                ? "cursor-default border border-emerald-600/40 bg-emerald-600/10 text-emerald-400"
                : "bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {runLabel}
          </button>
          {showRunSelector && (
            <RunSelector
              pipelines={pipelineList}
              onRun={runSelected}
              onClose={() => setShowRunSelector(false)}
            />
          )}
        </div>
      </div>

      {/* ── Pipeline bar (war room only) ── */}
      {isWarRoom && (
        <PipelineBar
          pipelines={pipelineList}
          activePipelineId={activePId}
          onSelect={switchPipeline}
          onAdd={addPipeline}
          onDelete={deletePipeline}
          onRename={renamePipeline}
        />
      )}

      {/* ── Canvas + Output panel ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="relative flex-1 overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={() => setContextMenu(null)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.35 }}
            minZoom={0.2}
            maxZoom={2}
            deleteKeyCode="Delete"
            proOptions={{ hideAttribution: true }}
            style={{ background: "#0A0E1A" }}
          >
            <Background variant={BackgroundVariant.Dots} color="#1C2235" gap={24} size={1.5} />
            <Controls
              style={{ background: "#161B2A", border: "1px solid #2A3350", borderRadius: 8 }}
            />
            <MiniMap
              nodeColor="#1C2235"
              maskColor="rgba(10,14,26,0.65)"
              style={{ background: "#0A0E1A", border: "1px solid #1C2235", borderRadius: 8 }}
            />
          </ReactFlow>
        </div>

        {/* Output panel */}
        {showPanel && (
          <div className="flex w-[340px] shrink-0 flex-col border-l border-[#1C2235] bg-[#0A0E1A]">
            <div className="flex shrink-0 items-center border-b border-[#1C2235] px-4 py-3">
              <p className="text-sm font-semibold text-white">Results</p>
              <div className="ml-auto">
                <button
                  onClick={() => setShowPanel(false)}
                  className="text-xs text-neutral-600 transition hover:text-neutral-300"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {isRunning ? (
                <div className="flex h-full flex-col items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <p className="text-xs text-neutral-600">Processing…</p>
                </div>
              ) : (
                <AgentOutput tab={tab} visible={isDone} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Terminal drawer ── */}
      {terminalOpen && (
        <TerminalDrawer
          tab={tab}
          logs={logLines}
          isRunning={isRunning}
          minimized={terminalMinimized}
          onMinimize={() => setTerminalMinimized((v) => !v)}
          onClose={() => setTerminalOpen(false)}
        />
      )}

      {/* ── Context menu ── */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          nodeType={contextMenu.nodeType}
          onViewPipeline={(nodeId) => {
            const targetTab = AGENT_NODE_TAB[nodeId];
            if (targetTab && onNavigateToTab) onNavigateToTab(targetTab);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* ── Compare modal ── */}
      {showCompare && (
        <CompareModal
          pipelines={pipelineList}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}
