import { useState } from "react";
import { BubbleItem, getCategoryColor, getCategoryLightBg } from "@/data/bubbleData";
import {
  Plus, X, Briefcase, BookOpen, Activity, Heart, Gamepad2,
  Brain, Calendar, ClipboardList, GraduationCap, BookMarked, Rocket,
  Dumbbell, Moon, Wind, Users, UserCheck, Tv, Palette, Smartphone,
  Clock, TrendingUp, TrendingDown, Target, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { useFirestoreBubbles } from "@/hooks/useFirestoreBubbles";
import { useLifeScore } from "@/hooks/useLifeScore";

const BUBBLE_ICONS: Record<string, React.ElementType> = {
  work: Briefcase, upskilling: BookOpen, health: Activity, relationships: Heart, leisure: Gamepad2,
  'work-deep': Brain, 'work-meetings': Calendar, 'work-admin': ClipboardList,
  'upskilling-courses': GraduationCap, 'upskilling-reading': BookMarked, 'upskilling-projects': Rocket,
  'health-gym': Dumbbell, 'health-sleep': Moon, 'health-meditation': Wind,
  'rel-family': Users, 'rel-friends': UserCheck, 'rel-partner': Heart,
  'leisure-entertainment': Tv, 'leisure-hobbies': Palette, 'leisure-social': Smartphone,
};

// ─── Bubble Node with Progress Ring ──────────────────────────────────────────
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
  const [tapped, setTapped] = useState(false);
  const ratio = bubble.expectedWeeklyHours > 0 ? bubble.actualWeeklyHours / bubble.expectedWeeklyHours : 0;
  const isOver = ratio > 1;
  const displaySize = Math.max(size * (0.7 + Math.min(ratio, 1.5) * 0.3), size * 0.5);
  const color = getCategoryColor(bubble.category);
  const lightBg = getCategoryLightBg(bubble.category);
  const IconComponent = BUBBLE_ICONS[bubble.id] || Briefcase;

  // Progress ring
  const ringRadius = displaySize / 2 - 4;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = Math.min(ratio, 1);

  const handleClick = () => {
    setTapped(true);
    setTimeout(() => setTapped(false), 250);
    onSelect(bubble);
  };

  return (
    <div
      className="absolute cursor-pointer select-none"
      style={{
        left: x - displaySize / 2, top: y - displaySize / 2,
        width: displaySize, height: displaySize,
        animationDelay: `${delay}ms`, zIndex: hovered ? 10 : 1,
      }}
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Progress ring SVG */}
      <svg className="absolute inset-0 -rotate-90" width={displaySize} height={displaySize} style={{ zIndex: 2 }}>
        <circle
          cx={displaySize / 2} cy={displaySize / 2} r={ringRadius}
          fill="none" stroke="#E0E0E0" strokeWidth="3" opacity="0.4"
        />
        <circle
          cx={displaySize / 2} cy={displaySize / 2} r={ringRadius}
          fill="none" stroke={isOver ? '#FF5252' : color} strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          strokeDashoffset={ringCircumference * (1 - ringProgress)}
          className="transition-all duration-700"
        />
      </svg>

      <div
        className={cn(
          "w-full h-full rounded-full flex flex-col items-center justify-center transition-all duration-200 animate-bubble-float",
          hovered && "scale-110",
          tapped && "animate-tap-bounce",
        )}
        style={{
          background: lightBg,
          border: `3px solid ${isOver ? '#FF5252' : '#000000'}`,
          boxShadow: hovered ? `6px 6px 0px ${isOver ? '#FF5252' : '#000000'}` : `4px 4px 0px ${isOver ? '#FF5252' : '#000000'}`,
          animationDuration: `${3 + (delay % 3) * 0.5}s`,
          animationDelay: `${delay}ms`,
        }}
      >
        <IconComponent size={displaySize > 90 ? 22 : 16} color={isOver ? '#FF5252' : color} strokeWidth={2.5} />
        <span className="font-bold text-center px-1 leading-tight mt-0.5" style={{ fontSize: displaySize > 100 ? 11 : 9, color: '#000000' }}>
          {bubble.name}
        </span>
        <span className="font-black" style={{ fontSize: displaySize > 100 ? 10 : 8, color: isOver ? '#FF5252' : color }}>
          {bubble.actualWeeklyHours.toFixed(1)}h
        </span>
      </div>

      {hovered && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none animate-fade-up"
          style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 10, padding: '6px 12px' }}>
          <p className="text-xs font-bold text-foreground">{bubble.name}</p>
          <p className="text-[10px] text-muted-foreground">{bubble.actualWeeklyHours.toFixed(1)}h / {bubble.expectedWeeklyHours}h target</p>
          <p className="text-[10px] font-bold" style={{ color: isOver ? '#FF5252' : color }}>
            {Math.round(ratio * 100)}% {isOver ? '(over)' : 'complete'}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Log Time Modal (mobile) ──────────────────────────────────────────────────
interface LogTimeModalProps {
  bubble: BubbleItem | null;
  onClose: () => void;
  onLog: (bubbleId: string, bubbleName: string, minutes: number) => void;
}

const LogTimeModal = ({ bubble, onClose, onLog }: LogTimeModalProps) => {
  const [minutes, setMinutes] = useState(30);
  if (!bubble) return null;
  const color = getCategoryColor(bubble.category);
  const lightBg = getCategoryLightBg(bubble.category);
  const IconComponent = BUBBLE_ICONS[bubble.id] || Briefcase;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-28 lg:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm animate-fade-up"
        style={{ background: '#FFFFFF', border: '4px solid #000000', boxShadow: '6px 6px 0px #000000', borderRadius: 20, padding: 24 }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={20} strokeWidth={2.5} /></button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: lightBg, border: '3px solid #000000' }}>
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
              <button key={m} onClick={() => setMinutes(m)} className="px-3 py-2 text-xs font-bold transition-all"
                style={{ background: minutes === m ? color : '#F5F5F5', color: minutes === m ? '#FFFFFF' : '#000000', border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', borderRadius: 8 }}>
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          <input type="range" min={5} max={240} step={5} value={minutes} onChange={e => setMinutes(Number(e.target.value))} className="w-full" style={{ accentColor: color }} />
          <p className="text-center text-sm font-bold text-foreground mt-1">{minutes} minutes</p>
        </div>
        <button onClick={() => { onLog(bubble.id, bubble.name, minutes); onClose(); }} className="w-full py-3 font-bold text-sm transition-all active:translate-y-0.5"
          style={{ background: color, color: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: 12 }}>
          Log {minutes}m to {bubble.name}
        </button>
      </div>
    </div>
  );
};

// ─── Desktop Right Panel ──────────────────────────────────────────────────────
interface RightPanelProps {
  bubble: BubbleItem | null;
  onLog: (bubbleId: string, bubbleName: string, minutes: number) => void;
  onClose: () => void;
  recentLogs: import("@/hooks/useTimeLogs").TimeLog[];
}

const RightPanel = ({ bubble, onLog, onClose, recentLogs }: RightPanelProps) => {
  const [minutes, setMinutes] = useState(30);

  const panelContent = bubble ? (() => {
    const color = getCategoryColor(bubble.category);
    const lightBg = getCategoryLightBg(bubble.category);
    const IconComponent = BUBBLE_ICONS[bubble.id] || Briefcase;
    const ratio = bubble.expectedWeeklyHours > 0 ? bubble.actualWeeklyHours / bubble.expectedWeeklyHours : 0;
    const isOver = ratio > 1;
    const isBehind = ratio < 0.6;

    return (
      <>
        {/* Bubble header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: lightBg, border: '3px solid #000000', boxShadow: '3px 3px 0px #000000' }}>
              <IconComponent size={22} color={color} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">{bubble.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{bubble.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1"><X size={18} strokeWidth={2.5} /></button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 text-center" style={{ background: lightBg, border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', borderRadius: 12 }}>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Logged</p>
            <p className="text-xl font-black" style={{ color }}>{bubble.actualWeeklyHours.toFixed(1)}h</p>
          </div>
          <div className="p-3 text-center" style={{ background: '#F5F5F5', border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', borderRadius: 12 }}>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-1">Target</p>
            <p className="text-xl font-black text-foreground">{bubble.expectedWeeklyHours}h</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs font-bold text-muted-foreground">Progress</span>
            <span className="text-xs font-black" style={{ color: isOver ? '#FF5252' : color }}>{Math.round(ratio * 100)}%</span>
          </div>
          <div className="h-3 overflow-hidden" style={{ background: lightBg, border: '2px solid #000000', borderRadius: 6 }}>
            <div className="h-full transition-all duration-700" style={{ width: `${Math.min(ratio * 100, 100)}%`, background: isOver ? '#FF5252' : color }} />
          </div>
          <div className="flex items-center gap-1 mt-2">
            {isOver ? (
              <><TrendingUp size={11} color="#FF5252" strokeWidth={2.5} /><span className="text-[11px] font-bold" style={{ color: '#FF5252' }}>+{(bubble.actualWeeklyHours - bubble.expectedWeeklyHours).toFixed(1)}h over target</span></>
            ) : isBehind ? (
              <><TrendingDown size={11} color="#FF9800" strokeWidth={2.5} /><span className="text-[11px] font-bold" style={{ color: '#FF9800' }}>{(bubble.expectedWeeklyHours - bubble.actualWeeklyHours).toFixed(1)}h behind target</span></>
            ) : (
              <><Target size={11} color={color} strokeWidth={2.5} /><span className="text-[11px] font-bold" style={{ color }}>On track</span></>
            )}
          </div>
        </div>

        {/* Quick log */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-3">Quick Log</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[15, 30, 45, 60, 90, 120].map(m => (
              <button key={m} onClick={() => setMinutes(m)} className="px-3 py-2 text-xs font-bold transition-all"
                style={{ background: minutes === m ? color : '#F5F5F5', color: minutes === m ? '#FFFFFF' : '#000000', border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', borderRadius: 8 }}>
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
          <button onClick={() => onLog(bubble.id, bubble.name, minutes)} className="w-full py-3 font-black text-sm transition-all active:translate-y-0.5"
            style={{ background: color, color: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: 12 }}>
            Log {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`} to {bubble.name}
          </button>
        </div>

        {/* Recent logs for this bubble */}
        {recentLogs.filter(l => l.bubbleId === bubble.id).length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-3">Activity Log</p>
            <div className="space-y-2">
              {recentLogs.filter(l => l.bubbleId === bubble.id).slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5"
                  style={{ background: '#FAFAFA', border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', borderRadius: 10 }}>
                  <div className="flex items-center gap-2">
                    <Clock size={13} color="#777" strokeWidth={2.5} />
                    <span className="text-xs font-medium text-muted-foreground">{log.date}</span>
                  </div>
                  <span className="text-xs font-black" style={{ color }}>{log.duration}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  })() : (
    <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
      <div className="w-20 h-20 rounded-full mx-auto mb-5 animate-bubble-pulse"
        style={{ background: '#E8F5E9', border: '4px solid #000000', boxShadow: '4px 4px 0px #000000' }} />
      <p className="font-black text-foreground text-lg mb-2">Select a Bubble</p>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[180px]">Click any bubble on the map to see details and log time</p>
    </div>
  );

  return (
    <aside
      className="hidden lg:flex flex-col w-80 shrink-0 min-h-screen overflow-y-auto"
      style={{ background: '#FFFFFF', borderLeft: '4px solid #000000' }}
    >
      <div className="px-6 py-6 border-b-4 border-black">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Details</p>
      </div>
      <div className="flex-1 px-6 py-6 overflow-y-auto">
        {panelContent}
      </div>
    </aside>
  );
};

// ─── Bubble Layout ────────────────────────────────────────────────────────────
const BUBBLE_LAYOUT: Record<string, { x: number; y: number; size: number }> = {
  work:          { x: 0.22, y: 0.28, size: 130 },
  upskilling:    { x: 0.58, y: 0.22, size: 100 },
  health:        { x: 0.78, y: 0.52, size: 95 },
  relationships: { x: 0.50, y: 0.65, size: 90 },
  leisure:       { x: 0.20, y: 0.65, size: 115 },
};

// ─── Main BubbleMap ───────────────────────────────────────────────────────────
export const BubbleMap = () => {
  const { bubbles, updateBubbleHours } = useFirestoreBubbles();
  const [selected, setSelected] = useState<BubbleItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expandedBubble, setExpandedBubble] = useState<string | null>(null);
  const { logs, logTime } = useTimeLogs();
  const lifeScore = useLifeScore(bubbles, logs);

  const totalExpected = bubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);
  const totalActual = bubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);
  const balanceScore = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;

  const handleLog = async (bubbleId: string, bubbleName: string, minutes: number) => {
    await updateBubbleHours(bubbleId, minutes);
    await logTime(bubbleId, bubbleName, minutes, "manual");
  };

  const handleBubbleClick = (bubble: BubbleItem) => {
    if (expandedBubble === bubble.id) {
      setExpandedBubble(null);
    } else if (bubble.children?.length) {
      setExpandedBubble(bubble.id);
      setSelected(bubble);
    } else {
      setSelected(bubble);
    }
  };

  return (
    <div className="flex w-full h-full">
      {/* Canvas + Mobile UI */}
      <div className="relative flex-1 h-screen bg-background overflow-hidden">
        {/* Header — shown on mobile only */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-3 lg:pt-6">
          <div className="flex items-center justify-between mb-3 lg:hidden">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
                bubble<span style={{ color: '#4CAF50' }}>.</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Your life, visualized</p>
            </div>
            <div className="px-4 py-2 text-right" style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Week</p>
              <p className="text-sm font-black text-foreground">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Desktop canvas header */}
          <div className="hidden lg:flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-foreground">Life Map</h2>
              <p className="text-xs text-muted-foreground">Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2" style={{ background: '#E8F5E9', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">This Week</p>
                <p className="text-base font-black" style={{ color: '#4CAF50' }}>{totalActual.toFixed(0)}h <span className="text-muted-foreground text-xs font-normal">/ {totalExpected}h</span></p>
              </div>
              <div className="px-4 py-2" style={{ background: '#F3E5F5', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Life Score</p>
                <div className="flex items-center gap-1">
                  <Zap size={14} strokeWidth={2.5} color="#9C27B0" />
                  <p className="text-base font-black" style={{ color: '#9C27B0' }}>{lifeScore.total}</p>
                </div>
              </div>
              <div className="px-4 py-2" style={{ background: '#E3F2FD', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Balance</p>
                <p className="text-base font-black" style={{ color: '#2196F3' }}>{balanceScore}%</p>
              </div>
            </div>
          </div>

          {/* Mobile stats row */}
          <div className="flex gap-2 lg:hidden">
            <div className="flex-1 px-3 py-2" style={{ background: '#E8F5E9', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">This Week</p>
              <p className="text-base font-black" style={{ color: '#4CAF50' }}>{totalActual.toFixed(0)}h <span className="text-muted-foreground text-xs font-normal">/ {totalExpected}h</span></p>
            </div>
            <div className="flex-1 px-3 py-2" style={{ background: '#F3E5F5', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Life Score</p>
              <div className="flex items-center gap-1">
                <Zap size={14} strokeWidth={2.5} color="#9C27B0" />
                <p className="text-base font-black" style={{ color: '#9C27B0' }}>{lifeScore.total}</p>
              </div>
            </div>
            <div className="px-3 py-2 flex items-center gap-1" style={{ background: '#F5F5F5', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
              <button onClick={() => setZoom(z => Math.max(0.7, z - 0.1))} className="font-black text-lg leading-none px-1 text-foreground">−</button>
              <span className="text-[10px] font-bold text-muted-foreground w-7 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="font-black text-lg leading-none px-1 text-foreground">+</button>
            </div>
          </div>
        </div>

        {/* Bubble Canvas */}
        <div className="absolute inset-0 overflow-hidden" style={{ paddingTop: 140, paddingBottom: 100 }}>
          <div className="relative w-full h-full transition-transform duration-300" style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            {bubbles.map((bubble, i) => {
              const layout = BUBBLE_LAYOUT[bubble.id];
              if (!layout) return null;
              const canvasW = typeof window !== 'undefined' ? window.innerWidth - (window.innerWidth >= 1024 ? 576 : 0) : 400;
              const canvasH = typeof window !== 'undefined' ? window.innerHeight - 240 : 500;
              return (
                <BubbleNode key={bubble.id} bubble={bubble} size={layout.size}
                  x={layout.x * canvasW} y={layout.y * canvasH}
                  onSelect={handleBubbleClick} delay={i * 100} />
              );
            })}

            {expandedBubble && (() => {
              const parent = bubbles.find(b => b.id === expandedBubble);
              const parentLayout = BUBBLE_LAYOUT[expandedBubble];
              if (!parent?.children || !parentLayout) return null;
              const canvasW = typeof window !== 'undefined' ? window.innerWidth - (window.innerWidth >= 1024 ? 576 : 0) : 400;
              const canvasH = typeof window !== 'undefined' ? window.innerHeight - 240 : 500;
              const px = parentLayout.x * canvasW;
              const py = parentLayout.y * canvasH;
              return parent.children.map((child, i) => {
                const angle = (i / parent.children!.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <BubbleNode key={child.id} bubble={child} size={65}
                    x={px + Math.cos(angle) * 110} y={py + Math.sin(angle) * 110}
                    onSelect={setSelected} delay={i * 80} />
                );
              });
            })()}
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-24 left-4 right-4 flex gap-2 flex-wrap justify-center lg:bottom-6">
          {[
            { label: 'Work', color: '#4CAF50', bg: '#E8F5E9' },
            { label: 'Learning', color: '#2196F3', bg: '#E3F2FD' },
            { label: 'Health', color: '#FF9800', bg: '#FFF3E0' },
            { label: 'People', color: '#E91E63', bg: '#FCE4EC' },
            { label: 'Leisure', color: '#9C27B0', bg: '#F3E5F5' },
          ].map(({ label, color, bg }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5"
              style={{ background: bg, border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', borderRadius: 20 }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, border: '1.5px solid #000000' }} />
              <span className="text-[10px] font-bold text-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* FAB — mobile only */}
        <button className="lg:hidden absolute bottom-28 right-4 w-14 h-14 rounded-full flex items-center justify-center transition-all active:translate-y-0.5"
          style={{ background: '#000000', border: '3px solid #000000', boxShadow: '4px 4px 0px #4CAF50', color: '#FFFFFF' }}>
          <Plus size={24} strokeWidth={3} />
        </button>

        {/* Desktop FAB */}
        <button className="hidden lg:flex absolute bottom-8 right-8 w-14 h-14 rounded-full items-center justify-center transition-all active:translate-y-0.5"
          style={{ background: '#000000', border: '3px solid #000000', boxShadow: '4px 4px 0px #4CAF50', color: '#FFFFFF' }}>
          <Plus size={24} strokeWidth={3} />
        </button>

        {/* Mobile Log Modal */}
        <LogTimeModal bubble={selected} onClose={() => setSelected(null)} onLog={handleLog} />
      </div>

      {/* Desktop Right Panel */}
      <RightPanel bubble={selected} onLog={handleLog} onClose={() => setSelected(null)} recentLogs={logs} />
    </div>
  );
};
