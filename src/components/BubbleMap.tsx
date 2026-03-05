import { useState } from "react";
import { BubbleItem, getCategoryColor, getCategoryLightBg, defaultBubbles } from "@/data/bubbleData";
import { Plus, X, Briefcase, BookOpen, Activity, Heart, Gamepad2, Brain, Calendar, ClipboardList, GraduationCap, BookMarked, Rocket, Dumbbell, Moon, Wind, Users, UserCheck, Tv, Palette, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

// Map bubble IDs to Lucide icons
const BUBBLE_ICONS: Record<string, React.ElementType> = {
  work: Briefcase,
  upskilling: BookOpen,
  health: Activity,
  relationships: Heart,
  leisure: Gamepad2,
  'work-deep': Brain,
  'work-meetings': Calendar,
  'work-admin': ClipboardList,
  'upskilling-courses': GraduationCap,
  'upskilling-reading': BookMarked,
  'upskilling-projects': Rocket,
  'health-gym': Dumbbell,
  'health-sleep': Moon,
  'health-meditation': Wind,
  'rel-family': Users,
  'rel-friends': UserCheck,
  'rel-partner': Heart,
  'leisure-entertainment': Tv,
  'leisure-hobbies': Palette,
  'leisure-social': Smartphone,
};

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
  const displaySize = Math.max(size * (0.7 + ratio * 0.3), size * 0.5);
  const color = getCategoryColor(bubble.category);
  const lightBg = getCategoryLightBg(bubble.category);
  const IconComponent = BUBBLE_ICONS[bubble.id] || Briefcase;

  return (
    <div
      className="absolute cursor-pointer select-none"
      style={{
        left: x - displaySize / 2,
        top: y - displaySize / 2,
        width: displaySize,
        height: displaySize,
        animationDelay: `${delay}ms`,
        zIndex: hovered ? 10 : 1,
      }}
      onClick={() => onSelect(bubble)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-200 animate-bubble-float",
          hovered ? "scale-110" : "scale-100"
        )}
        style={{
          background: lightBg,
          border: `4px solid ${isOver ? '#FF5252' : '#000000'}`,
          boxShadow: hovered
            ? `6px 6px 0px ${isOver ? '#FF5252' : '#000000'}`
            : `4px 4px 0px ${isOver ? '#FF5252' : '#000000'}`,
          animationDuration: `${3 + (delay % 3) * 0.5}s`,
          animationDelay: `${delay}ms`,
        }}
      >
        <IconComponent
          size={displaySize > 90 ? 24 : 18}
          color={isOver ? '#FF5252' : color}
          strokeWidth={2.5}
        />
        <span
          className="font-bold text-center px-1 leading-tight mt-1"
          style={{
            fontSize: displaySize > 100 ? 11 : 9,
            color: '#000000',
          }}
        >
          {bubble.name}
        </span>
        <span
          className="font-bold"
          style={{
            fontSize: displaySize > 100 ? 10 : 8,
            color: isOver ? '#FF5252' : color,
          }}
        >
          {bubble.actualWeeklyHours}h
        </span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none animate-fade-up"
          style={{
            background: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '3px 3px 0px #000000',
            borderRadius: 10,
            padding: '6px 12px',
          }}
        >
          <p className="text-xs font-bold text-foreground">{bubble.name}</p>
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

  const color = getCategoryColor(bubble.category);
  const lightBg = getCategoryLightBg(bubble.category);
  const IconComponent = BUBBLE_ICONS[bubble.id] || Briefcase;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-28">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-full max-w-sm animate-fade-up"
        style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          boxShadow: '6px 6px 0px #000000',
          borderRadius: 20,
          padding: 24,
        }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: lightBg, border: '3px solid #000000' }}
          >
            <IconComponent size={22} color={color} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base">{bubble.name}</h3>
            <p className="text-xs text-muted-foreground">{bubble.actualWeeklyHours}h logged this week</p>
          </div>
        </div>
        <div className="mb-5">
          <label className="text-xs font-bold text-foreground mb-2 block uppercase tracking-wider">Log Time</label>
          <div className="flex gap-2 mb-3 flex-wrap">
            {[15, 30, 45, 60, 90, 120].map(m => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className="px-3 py-2 text-xs font-bold transition-all"
                style={{
                  background: minutes === m ? color : '#F5F5F5',
                  color: minutes === m ? '#FFFFFF' : '#000000',
                  border: '2px solid #000000',
                  boxShadow: minutes === m ? '2px 2px 0px #000000' : '2px 2px 0px #000000',
                  borderRadius: 8,
                }}
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
            className="w-full"
            style={{ accentColor: color }}
          />
          <p className="text-center text-sm font-bold text-foreground mt-1">{minutes} minutes</p>
        </div>
        <button
          onClick={() => { onLog(bubble.id, minutes); onClose(); }}
          className="w-full py-3 font-bold text-sm transition-all active:translate-y-0.5"
          style={{
            background: color,
            color: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 12,
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
  const balanceScore = Math.round((totalActual / totalExpected) * 100);

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
    <div className="relative w-full h-full bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
              bubble<span style={{ color: '#4CAF50' }}>.</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Your life, visualized</p>
          </div>
          <div
            className="px-4 py-2 text-right"
            style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}
          >
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Week</p>
            <p className="text-sm font-black text-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2">
          <div
            className="flex-1 px-3 py-2"
            style={{ background: '#E8F5E9', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">This Week</p>
            <p className="text-base font-black" style={{ color: '#4CAF50' }}>
              {totalActual.toFixed(0)}h <span className="text-muted-foreground text-xs font-normal">/ {totalExpected}h</span>
            </p>
          </div>
          <div
            className="flex-1 px-3 py-2"
            style={{ background: '#E3F2FD', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Life Balance</p>
            <p className="text-base font-black" style={{ color: '#2196F3' }}>{balanceScore}%</p>
          </div>
          <div
            className="px-3 py-2 flex items-center gap-1"
            style={{ background: '#F5F5F5', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}
          >
            <button onClick={() => setZoom(z => Math.max(0.7, z - 0.1))} className="font-black text-lg leading-none px-1 text-foreground">−</button>
            <span className="text-[10px] font-bold text-muted-foreground w-7 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="font-black text-lg leading-none px-1 text-foreground">+</button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="absolute inset-0 overflow-hidden" style={{ paddingTop: 140, paddingBottom: 100 }}>
        <div
          className="relative w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
        >
          {bubbles.map((bubble, i) => {
            const layout = BUBBLE_LAYOUT[bubble.id];
            if (!layout) return null;
            const canvasW = window.innerWidth;
            const canvasH = window.innerHeight - 240;
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
            const canvasH = window.innerHeight - 240;
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

      {/* Legend */}
      <div className="absolute bottom-24 left-4 right-4 flex gap-2 flex-wrap justify-center">
        {[
          { label: 'Work', color: '#4CAF50', bg: '#E8F5E9' },
          { label: 'Lifestyle', color: '#FF9800', bg: '#FFF3E0' },
          { label: 'Leisure', color: '#2196F3', bg: '#E3F2FD' },
        ].map(({ label, color, bg }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{ background: bg, border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', borderRadius: 20 }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, border: '1.5px solid #000000' }} />
            <span className="text-[10px] font-bold text-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Add bubble FAB */}
      <button
        className="absolute bottom-28 right-4 w-14 h-14 rounded-full flex items-center justify-center transition-all active:translate-y-0.5"
        style={{
          background: '#000000',
          border: '3px solid #000000',
          boxShadow: '4px 4px 0px #4CAF50',
          color: '#FFFFFF',
        }}
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      <LogTimeModal bubble={selected} onClose={() => setSelected(null)} onLog={handleLog} />
    </div>
  );
};
