"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const BackgroundRippleEffect = ({
  rows,
  cols,
  cellSize = 56,
  interactive = true,
  className,
}: {
  rows?: number;
  cols?: number;
  cellSize?: number;
  interactive?: boolean;
  className?: string;
}) => {
  const [clickedCell, setClickedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [rippleKey, setRippleKey] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [autoRows, setAutoRows] = useState(rows ?? 1);
  const [autoCols, setAutoCols] = useState(cols ?? 1);

  useEffect(() => {
    if (rows && cols) {
      setAutoRows(rows);
      setAutoCols(cols);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();
      const nextRows = Math.max(1, Math.ceil(rect.height / cellSize));
      const nextCols = Math.max(1, Math.ceil(rect.width / cellSize));
      setAutoRows(nextRows);
      setAutoCols(nextCols);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, [rows, cols, cellSize]);

  const activeRows = rows ?? autoRows;
  const activeCols = cols ?? autoCols;

  const triggerRipple = (row: number, col: number) => {
    setClickedCell({ row, col });
    setRippleKey((k) => k + 1);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);

    if (row < 0 || col < 0 || row >= activeRows || col >= activeCols) return;
    triggerRipple(row, col);
  };

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      className={cn(
        "absolute inset-0 h-full w-full overflow-hidden select-none",
        "[--cell-border-color:rgba(148,163,184,0.24)] [--cell-fill-color:rgba(14,116,144,0.14)] [--cell-shadow-color:rgba(14,116,144,0.38)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(56,189,248,0.22),transparent_38%),radial-gradient(circle_at_82%_8%,rgba(45,212,191,0.18),transparent_42%)]" />
      <div className="relative h-full w-full overflow-hidden">
        <DivGrid
          key={`base-${rippleKey}-${activeRows}-${activeCols}`}
          className="opacity-75"
          rows={activeRows}
          cols={activeCols}
          cellSize={cellSize}
          borderColor="var(--cell-border-color)"
          fillColor="var(--cell-fill-color)"
          clickedCell={clickedCell}
          onCellClick={triggerRipple}
          interactive={interactive}
        />
      </div>
    </div>
  );
};

type DivGridProps = {
  className?: string;
  rows: number;
  cols: number;
  cellSize: number; // in pixels
  borderColor: string;
  fillColor: string;
  clickedCell: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number) => void;
  interactive?: boolean;
};

type CellStyle = React.CSSProperties & {
  ["--delay"]?: string;
  ["--duration"]?: string;
};

const DivGrid = ({
  className,
  rows = 7,
  cols = 30,
  cellSize = 56,
  borderColor = "#3f3f46",
  fillColor = "rgba(14,165,233,0.3)",
  clickedCell = null,
  onCellClick = () => { },
  interactive = true,
}: DivGridProps) => {
  const cells = useMemo(
    () => Array.from({ length: rows * cols }, (_, idx) => idx),
    [rows, cols],
  );

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    width: cols * cellSize,
    height: rows * cellSize,
  };

  return (
    <div className={cn("relative z-[2]", className)} style={gridStyle}>
      {cells.map((idx) => {
        const rowIdx = Math.floor(idx / cols);
        const colIdx = idx % cols;
        const distance = clickedCell
          ? Math.hypot(clickedCell.row - rowIdx, clickedCell.col - colIdx)
          : 0;
        const delay = clickedCell ? Math.max(0, distance * 55) : 0; // ms
        const duration = 200 + distance * 80; // ms

        const style: CellStyle = clickedCell
          ? {
            "--delay": `${delay}ms`,
            "--duration": `${duration}ms`,
          }
          : {};

        return (
          <div
            key={idx}
            className={cn(
              "cell relative border-[0.5px] opacity-35 transition-all duration-200 will-change-transform hover:opacity-75 hover:brightness-125",
              clickedCell && "animate-cell-ripple [animation-fill-mode:none]",
              !interactive && "pointer-events-none",
            )}
            style={{
              backgroundColor: fillColor,
              borderColor: borderColor,
              ...style,
            }}
            onClick={
              interactive ? () => onCellClick?.(rowIdx, colIdx) : undefined
            }
          />
        );
      })}
    </div>
  );
};
