import { useState } from "react";
import { BubbleItem, BubbleCategory, getCategoryColor, getCategoryGlow, getCategoryBg, defaultBubbles } from "@/data/bubbleData";
import { Plus, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BubbleNodeProps {
  bubble: BubbleItem;
  size: number;
  x: number;
  y: number;
  onSelect: (bubble: BubbleItem) => void;
  delay?: number;
}

const BubbleNode = ({ bubble, size, x, y, onSelect, delay = 0 }: BubbleNodeProps) => {
  const [hovered, setHovered] = useState(false);
  const ratio = bubble.actualWeeklyHours / bubble.expectedWeeklyHours;
  const isOver = ratio > 1;
  const isMissing = ratio < 0.6;
  const displaySize = Math.max(size * (0.7 + ratio * 0.3), size * 0.5);
  const color = getCategoryColor(bubble.category);
  const glow = getCategoryGlow(bubble.category);
  const bg = getCategoryBg(bubble.category);

  return (
    <div
      className="absolute cursor-pointer select-none"
      style={{
        left: x - displaySize / 2,
        top: y - displaySize / 2,
        width: displaySize,
        height: displaySize,
        animationDelay: `${delay}ms`,
      }}
      onClick={() => onSelect(bubble)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-500 animate-bubble-float",
          hovered ? "scale-110" : "scale-100"
        )}
        style={{
          background: bg,
          border: `1.5px solid ${color}${isOver ? '' : '80'}`,
          boxShadow: hovered
            ? `${glow}, inset 0 0 30px ${color}20`
            : isOver
            ? `0 0 20px hsl(0 72% 58% / 0.4), inset 0 0 20px hsl(0 72% 58% / 0.1)`
            : `0 0 20px ${color}30`,
          animationDuration: `${3 + Math.random() * 2}s`,
          animationDelay: `${delay}ms`,
        }}
      >
        <span className="text-2xl mb-0.5">{bubble.icon}</span>
        <span className="text-xs font-semibold text-foreground/90 text-center px-1 leading-tight">{bubble.name}</span>
        <span
          className="text-[10px] mt-0.5 font-medium"
          style={{ color: isOver ? 'hsl(0 72% 60%)' : isMissing ? 'hsl(45 100% 65%)' : color }}
        >
          {bubble.actualWeeklyHours}h
        </span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 glass rounded-xl px-3 py-2 whitespace-nowrap z-20 pointer-events-none animate-fade-up">
          <p className="text-xs font-semibold text-foreground">{bubble.name}</p>
          <p className="text-[10px] text-muted-foreground">{bubble.actualWeeklyHours}h / {bubble.expectedWeeklyHours}h expected</p>
        </div>
      )}
    </div>
  );
};

interface LogTimeModalProps {
  bubble: BubbleItem | null;
  onClose: () => void;
  onLog: (bubbleId: string, minutes: number) => void;
}

const LogTimeModal = ({ bubble, onClose, onLog }: LogTimeModalProps) => {
  const [minutes, setMinutes] = useState(30);
  if (!bubble) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-28">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-3xl p-6 w-full max-w-sm animate-fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{bubble.icon}</span>
          <div>
            <h3 className="font-semibold text-foreground">{bubble.name}</h3>
            <p className="text-xs text-muted-foreground">{bubble.actualWeeklyHours}h logged this week</p>
          </div>
        </div>
        <div className="mb-5">
          <label className="text-xs text-muted-foreground mb-2 block">Log time (minutes)</label>
          <div className="flex gap-2 mb-3">
            {[15, 30, 45, 60, 90, 120].map(m => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-medium transition-all",
                  minutes === m ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                )}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={5}
            max={240}
            step={5}
            value={minutes}
            onChange={e => setMinutes(Number(e.target.value))}
            className="w-full accent-productive"
          />
          <p className="text-center text-sm text-foreground font-medium mt-1">{minutes} minutes</p>
        </div>
        <button
          onClick={() => { onLog(bubble.id, minutes); onClose(); }}
          className="w-full py-3 rounded-2xl font-semibold text-sm transition-all"
          style={{
            background: getCategoryColor(bubble.category),
            color: 'hsl(222 16% 8%)',
            boxShadow: getCategoryGlow(bubble.category),
          }}
        >
          Log {minutes}m to {bubble.name}
        </button>
      </div>
    </div>
  );
};

// Bubble layout positions for the canvas
const BUBBLE_LAYOUT: Record<string, { x: number; y: number; size: number }> = {
  work:          { x: 0.22, y: 0.28, size: 130 },
  upskilling:    { x: 0.58, y: 0.22, size: 100 },
  health:        { x: 0.78, y: 0.52, size: 95 },
  relationships: { x: 0.50, y: 0.65, size: 90 },
  leisure:       { x: 0.20, y: 0.65, size: 115 },
};

export const BubbleMap = () => {
  const [bubbles, setBubbles] = useState(defaultBubbles);
  const [selected, setSelected] = useState<BubbleItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expandedBubble, setExpandedBubble] = useState<string | null>(null);

  const totalExpected = bubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);
  const totalActual = bubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);

  const handleLog = (bubbleId: string, minutes: number) => {
    setBubbles(prev => prev.map(b => {
      if (b.id === bubbleId) return { ...b, actualWeeklyHours: b.actualWeeklyHours + minutes / 60 };
      const child = b.children?.find(c => c.id === bubbleId);
      if (child) return { ...b, actualWeeklyHours: b.actualWeeklyHours + minutes / 60 };
      return b;
    }));
  };

  const handleBubbleClick = (bubble: BubbleItem) => {
    if (expandedBubble === bubble.id) {
      setExpandedBubble(null);
    } else if (bubble.children?.length) {
      setExpandedBubble(bubble.id);
    } else {
      setSelected(bubble);
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Stats header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        <div className="glass rounded-2xl px-4 py-2.5 flex-1">
          <p className="text-[10px] text-muted-foreground mb-0.5">This Week</p>
          <p className="text-base font-bold text-productive">{totalActual.toFixed(0)}h <span className="text-muted-foreground text-xs font-normal">/ {totalExpected}h</span></p>
        </div>
        <div className="glass rounded-2xl px-4 py-2.5 flex-1">
          <p className="text-[10px] text-muted-foreground mb-0.5">Life Balance</p>
          <p className="text-base font-bold text-bubble-accent">{Math.round((totalActual / totalExpected) * 100)}%</p>
        </div>
        <div className="glass rounded-2xl px-3 py-2.5 flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.7, z - 0.1))} className="text-muted-foreground hover:text-foreground px-1 text-lg leading-none">−</button>
          <span className="text-xs text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="text-muted-foreground hover:text-foreground px-1 text-lg leading-none">+</button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ paddingTop: 80, paddingBottom: 90 }}
      >
        <div
          className="relative w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {bubbles.map((bubble, i) => {
            const layout = BUBBLE_LAYOUT[bubble.id];
            if (!layout) return null;
            const canvasW = window.innerWidth;
            const canvasH = window.innerHeight - 170;
            return (
              <BubbleNode
                key={bubble.id}
                bubble={bubble}
                size={layout.size}
                x={layout.x * canvasW}
                y={layout.y * canvasH}
                onSelect={handleBubbleClick}
                delay={i * 100}
              />
            );
          })}

          {/* Sub-bubbles when expanded */}
          {expandedBubble && (() => {
            const parent = bubbles.find(b => b.id === expandedBubble);
            const parentLayout = BUBBLE_LAYOUT[expandedBubble];
            if (!parent?.children || !parentLayout) return null;
            const canvasW = window.innerWidth;
            const canvasH = window.innerHeight - 170;
            const px = parentLayout.x * canvasW;
            const py = parentLayout.y * canvasH;
            const radius = 110;
            return parent.children.map((child, i) => {
              const angle = (i / parent.children!.length) * Math.PI * 2 - Math.PI / 2;
              const cx = px + Math.cos(angle) * radius;
              const cy = py + Math.sin(angle) * radius;
              return (
                <BubbleNode
                  key={child.id}
                  bubble={child}
                  size={65}
                  x={cx}
                  y={cy}
                  onSelect={setSelected}
                  delay={i * 80}
                />
              );
            });
          })()}
        </div>
      </div>

      {/* Category legend */}
      <div className="absolute bottom-24 left-4 right-4 flex gap-2 flex-wrap justify-center">
        {[
          { label: 'Productive', color: 'productive' },
          { label: 'Lifestyle', color: 'lifestyle' },
          { label: 'Leisure', color: 'leisure' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 glass rounded-full px-3 py-1">
            <div className={`w-2 h-2 rounded-full bg-${color}`} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Add bubble FAB */}
      <button className="absolute bottom-28 right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{ background: 'hsl(162 77% 58%)', boxShadow: '0 0 30px hsl(162 77% 58% / 0.4)', color: 'hsl(222 16% 8%)' }}>
        <Plus size={22} />
      </button>

      <LogTimeModal bubble={selected} onClose={() => setSelected(null)} onLog={handleLog} />
    </div>
  );
};
