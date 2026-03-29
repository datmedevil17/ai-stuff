import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

export type Status = "idle" | "running" | "complete" | "error";

const S: Record<Status, { dot: string; border: string; glow: string }> = {
  idle: { dot: "bg-neutral-600", border: "border-[#2A3350]", glow: "" },
  running: {
    dot: "bg-amber-400 animate-pulse",
    border: "border-amber-500/50",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.18)]",
  },
  complete: {
    dot: "bg-emerald-400",
    border: "border-emerald-500/40",
    glow: "shadow-[0_0_24px_rgba(16,185,129,0.15)]",
  },
  error: {
    dot: "bg-red-400",
    border: "border-red-500/40",
    glow: "shadow-[0_0_24px_rgba(239,68,68,0.15)]",
  },
};

const handleStyle: React.CSSProperties = {
  background: "#3B82F6",
  width: 10,
  height: 10,
  border: "2px solid #0A0E1A",
};

// ─── Delete button (hover) ────────────────────────────────────────────────────
function DeleteBtn({ id }: { id: string }) {
  const { deleteElements } = useReactFlow();
  const onDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteElements({ nodes: [{ id }] });
    },
    [id, deleteElements]
  );
  return (
    <button
      onClick={onDelete}
      title="Delete node"
      className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-[#1C2235] border border-[#2A3350] text-neutral-500 text-xs transition hover:bg-red-500/80 hover:text-white hover:border-red-500 group-hover:flex"
    >
      ×
    </button>
  );
}

// ─── Input Node ────────────────────────────────────────────────────────────────
type InputNodeData = {
  id: string;
  data: { label: string; description: string; icon: string; status: Status };
};
export function InputNode({ id, data }: InputNodeData) {
  const s = S[data.status];
  return (
    <div className={cn("group relative w-[190px] rounded-xl border bg-[#161B2A] px-4 py-3 transition-all duration-300", s.border, s.glow)}>
      <DeleteBtn id={id} />
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{data.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Input</span>
        </div>
        <div className={cn("h-2 w-2 rounded-full", s.dot)} />
      </div>
      <p className="text-sm font-semibold text-white">{data.label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{data.description}</p>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

// ─── Process Node ──────────────────────────────────────────────────────────────
type ProcessNodeData = {
  id: string;
  data: { label: string; description: string; icon: string; status: Status };
};
export function ProcessNode({ id, data }: ProcessNodeData) {
  const s = S[data.status];
  return (
    <div className={cn("group relative w-[200px] rounded-xl border bg-[#161B2A] px-4 py-3 transition-all duration-300", s.border, s.glow)}>
      <DeleteBtn id={id} />
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{data.icon}</span>
          <span className="text-sm font-semibold text-white">{data.label}</span>
        </div>
        <div className={cn("h-2 w-2 shrink-0 rounded-full", s.dot)} />
      </div>
      <p className="text-xs leading-relaxed text-neutral-500">{data.description}</p>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

// ─── Output Node ──────────────────────────────────────────────────────────────
type OutputNodeData = {
  id: string;
  data: { label: string; description: string; icon: string; status: Status };
};
export function OutputNode({ id, data }: OutputNodeData) {
  const s = S[data.status];
  return (
    <div className={cn("group relative w-[190px] rounded-xl border bg-[#161B2A] px-4 py-3 transition-all duration-300", s.border, s.glow)}>
      <DeleteBtn id={id} />
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">{data.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Output</span>
        </div>
        <div className={cn("h-2 w-2 rounded-full", s.dot)} />
      </div>
      <p className="text-sm font-semibold text-white">{data.label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{data.description}</p>
      {data.status === "complete" && (
        <p className="mt-1.5 text-[10px] font-semibold text-emerald-400/70">↗ click to view results</p>
      )}
    </div>
  );
}

// ─── Agent Node (War Room) ────────────────────────────────────────────────────
type AgentNodeData = {
  id: string;
  data: { label: string; role: string; icon: string; status: Status; color: string };
};
export function AgentNode({ id, data }: AgentNodeData) {
  const s = S[data.status];
  return (
    <div className={cn("group relative w-[200px] rounded-2xl border bg-[#161B2A] p-4 transition-all duration-300", s.border, s.glow)}>
      <DeleteBtn id={id} />
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div className="mb-3 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl text-xl", data.color)}>
          {data.icon}
        </div>
        <div className={cn("mt-1 h-2 w-2 rounded-full", s.dot)} />
      </div>
      <p className="text-sm font-bold leading-tight text-white">{data.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{data.role}</p>
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  );
}

export const nodeTypes = {
  inputNode: InputNode,
  processNode: ProcessNode,
  outputNode: OutputNode,
  agentNode: AgentNode,
};
