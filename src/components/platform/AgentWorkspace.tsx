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

// ─── Node Config Panel ─────────────────────────────────────────────────────────
function NodeConfigPanel({
  node,
  onUpdate,
  onClose,
}: {
  node: Node;
  onUpdate: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(String(node.data.label ?? ""));
  const isAgent = "role" in node.data;
  const descKey = isAgent ? "role" : "description";
  const [desc, setDesc] = useState(String(node.data[descKey] ?? ""));
  const [icon, setIcon] = useState(String(node.data.icon ?? ""));

  const apply = () => {
    onUpdate(node.id, { label, [descKey]: desc, icon });
    onClose();
  };

  const typeLabel: Record<string, string> = {
    inputNode: "Input", processNode: "Process",
    outputNode: "Output", agentNode: "Agent",
  };

  const inputCls =
    "w-full rounded-lg border border-[#2A3350] bg-[#0A0E1A] px-3 py-2 text-sm text-white " +
    "placeholder-neutral-700 focus:border-blue-500 focus:outline-none transition";

  return (
    <div className="absolute right-4 top-4 z-50 w-72 overflow-hidden rounded-xl border border-[#2A3350] bg-[#0F1423] shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1C2235] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon || "·"}</span>
          <p className="text-sm font-semibold text-white">Configure Node</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#1C2235] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            {typeLabel[node.type ?? ""] ?? node.type}
          </span>
          <button onClick={onClose} className="text-xs text-neutral-600 transition hover:text-neutral-300">
            ✕
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3 p-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            Label
          </label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            {isAgent ? "Role" : "Description"}
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={2}
            className={cn(inputCls, "resize-none")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
            Icon
          </label>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2A3350] bg-[#0A0E1A] text-xl">
              {icon || "·"}
            </span>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Paste an emoji…"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-[#1C2235] px-4 py-3">
        <button
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 transition hover:text-neutral-300"
        >
          Cancel
        </button>
        <button
          onClick={apply}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500"
        >
          Apply Changes
        </button>
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

  const tabLabel = tab === "warroom"
    ? "war-room"
    : tab.replace(/-/g, "-");

  return (
    <div className="shrink-0 border-t border-[#1C2235]">
      {/* Title bar */}
      <div className="flex h-9 items-center gap-3 border-b border-[#1C2235] bg-[#0A0E1A] px-4">
        {/* macOS traffic lights */}
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
            <span className="font-mono text-[10px] text-neutral-600">
              {logs.length} lines
            </span>
          )}
        </div>
      </div>

      {/* Terminal body */}
      {!minimized && (
        <div className="h-[190px] overflow-y-auto bg-[#050911] p-3">
          {/* Prompt header */}
          <div className="mb-2 font-mono text-xs text-neutral-600">
            $ finpersona run {tabLabel}
          </div>

          {logs.length === 0 && !isRunning && (
            <span className="font-mono text-xs text-neutral-700">
              Waiting for agent to start…
            </span>
          )}

          {logs.map((log, i) => (
            <div key={i} className="mb-0.5 flex items-start gap-2">
              <span className="shrink-0 font-mono text-[10px] text-neutral-700 tabular-nums">
                {log.time}
              </span>
              <span className={cn("shrink-0 font-mono text-xs", LOG_COLOR[log.level])}>
                {LOG_ICON[log.level]}
              </span>
              <span className={cn("font-mono text-xs", LOG_COLOR[log.level])}>
                {log.text}
              </span>
            </div>
          ))}

          {isRunning && (
            <span className="mt-0.5 inline-block animate-pulse font-mono text-xs text-emerald-500">
              █
            </span>
          )}
          <div ref={endRef} />
        </div>
      )}
    </div>
  );
}

// ─── AgentWorkspace ───────────────────────────────────────────────────────────
type Props = { tab: TabId };

export function AgentWorkspace({ tab }: Props) {
  const flow = flowMap[tab];

  const [nodes, setNodes, onNodesChange] = useNodesState(flow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Output panel (right)
  const [showPanel, setShowPanel] = useState(false);

  // Terminal (bottom)
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [logLines, setLogLines] = useState<TerminalLog[]>([]);

  // Node config
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = selectedNodeId ? (nodes.find((n) => n.id === selectedNodeId) ?? null) : null;

  // Node picker
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const nodeCounter = useRef(1000);

  // Close picker on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as EventTarget & globalThis.Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Connect handler
  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((prev) =>
        addEdge({ ...conn, type: "smoothstep", style: { stroke: "#3B82F6", strokeWidth: 2 } }, prev)
      ),
    [setEdges]
  );

  // Node click → open config
  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Pane click → close config
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Update node data from config panel
  const updateNodeData = useCallback(
    (id: string, updates: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...updates } } : n))
      );
    },
    [setNodes]
  );

  // Add node from picker
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

  // Run animation
  const run = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setIsDone(false);
    setLogLines([]);
    setTerminalOpen(true);
    setTerminalMinimized(false);

    const ids = flow.nodes.map((nd) => nd.id);
    const PER_NODE = 800;
    const totalMs = ids.length * PER_NODE + 500;

    setNodes((nds) =>
      nds.map((nd) => ({ ...nd, data: { ...nd.data, status: "idle" as Status } }))
    );

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
        setNodes((nds) =>
          nds.map((nd) =>
            nd.id === id ? { ...nd, data: { ...nd.data, status: "running" as Status } } : nd
          )
        );
      }, base);
      setTimeout(() => {
        setNodes((nds) =>
          nds.map((nd) =>
            nd.id === id ? { ...nd, data: { ...nd.data, status: "complete" as Status } } : nd
          )
        );
        if (idx === ids.length - 1) {
          setIsRunning(false);
          setIsDone(true);
        }
      }, base + 600);
    });
  }, [isRunning, flow.nodes, tab, setNodes]);

  const reset = useCallback(() => {
    setNodes((nds) =>
      nds.map((nd) => ({ ...nd, data: { ...nd.data, status: "idle" as Status } }))
    );
    setIsDone(false);
    setLogLines([]);
  }, [setNodes]);

  const isWarRoom = tab === "warroom";

  const runLabel = isRunning
    ? "Running…"
    : isDone
    ? "Completed"
    : isWarRoom
    ? "Deploy All Agents"
    : "Run Agent";

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

        {/* Selected node indicator */}
        {selectedNode && (
          <div className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/8 px-2.5 py-1">
            <span className="text-xs text-neutral-400">Editing:</span>
            <span className="text-xs font-semibold text-blue-300">
              {String(selectedNode.data.label ?? "")}
            </span>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="ml-0.5 text-[10px] text-neutral-600 hover:text-neutral-300 transition"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1" />

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
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                  Add Node
                </p>
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
              <div className="border-t border-[#1C2235] px-3 py-1.5">
                <p className="text-[10px] text-neutral-700">
                  Click node to configure · Delete key removes selected
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Output panel toggle */}
        <button
          onClick={() => setShowPanel((v) => !v)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs transition",
            showPanel
              ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
              : "border-[#2A3350] bg-[#161B2A] text-neutral-400 hover:text-neutral-200"
          )}
        >
          Output
        </button>

        {/* Terminal toggle */}
        <button
          onClick={() => {
            if (terminalOpen) {
              setTerminalMinimized((v) => !v);
            } else {
              setTerminalOpen(true);
              setTerminalMinimized(false);
            }
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
      </div>

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
            onPaneClick={onPaneClick}
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

          {/* Node config panel — floats over canvas */}
          {selectedNode && (
            <NodeConfigPanel
              key={selectedNodeId!}
              node={selectedNode}
              onUpdate={updateNodeData}
              onClose={() => setSelectedNodeId(null)}
            />
          )}
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
              {!isDone && !isRunning ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <p className="text-xs text-neutral-700">Run the agent to see output</p>
                </div>
              ) : isRunning ? (
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
    </div>
  );
}
