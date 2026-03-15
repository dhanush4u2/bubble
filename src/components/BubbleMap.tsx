import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { BubbleItem, getCategoryColor, getCategoryLightBg } from "@/data/bubbleData";
import {
  X, Briefcase, BookOpen, Activity, Heart, Gamepad2,
  Brain, Calendar, ClipboardList, GraduationCap, BookMarked, Rocket,
  Dumbbell, Moon, Wind, Users, UserCheck, Tv, Palette, Smartphone,
  TrendingUp, TrendingDown, Target, Zap, ChevronLeft, Clock,
} from "lucide-react";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { useFirestoreBubbles } from "@/hooks/useFirestoreBubbles";
import { useLifeScore } from "@/hooks/useLifeScore";

// ─── Icon map ────────────────────────────────────────────────────────────────
const BUBBLE_ICONS: Record<string, React.ElementType> = {
  work: Briefcase, upskilling: BookOpen, health: Activity, relationships: Heart, leisure: Gamepad2,
  'work-deep': Brain, 'work-meetings': Calendar, 'work-admin': ClipboardList,
  'upskilling-courses': GraduationCap, 'upskilling-reading': BookMarked, 'upskilling-projects': Rocket,
  'health-gym': Dumbbell, 'health-sleep': Moon, 'health-meditation': Wind,
  'rel-family': Users, 'rel-friends': UserCheck, 'rel-partner': Heart,
  'leisure-entertainment': Tv, 'leisure-hobbies': Palette, 'leisure-social': Smartphone,
};

// ─── Force layout ─────────────────────────────────────────────────────────────
interface Point { x: number; y: number }

function computeLayout(items: BubbleItem[], isDrill: boolean): Record<string, Point> {
  if (items.length === 0) return {};
  if (items.length === 1) return { [items[0].id]: { x: 0, y: 0 } };

  const MIN_DIST = isDrill ? 130 : 180;
  const ORBIT_R  = isDrill ? 110 : 160;
  const positions: Record<string, Point> = {};

  // Seed positions on a circle
  items.forEach((b, i) => {
    const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
    positions[b.id] = { x: ORBIT_R * Math.cos(angle), y: ORBIT_R * Math.sin(angle) };
  });

  // Iterative repulsion + center gravity
  for (let iter = 0; iter < 140; iter++) {
    for (const a of items) {
      let fx = 0, fy = 0;
      for (const b of items) {
        if (a.id === b.id) continue;
        const dx = positions[a.id].x - positions[b.id].x;
        const dy = positions[a.id].y - positions[b.id].y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.1;
        if (d < MIN_DIST) {
          const f = ((MIN_DIST - d) / MIN_DIST) * 3;
          fx += (dx / d) * f;
          fy += (dy / d) * f;
        }
      }
      const g = isDrill ? 0.02 : 0.035;
      fx -= positions[a.id].x * g;
      fy -= positions[a.id].y * g;
      positions[a.id].x += fx;
      positions[a.id].y += fy;
    }
  }
  return positions;
}

// ─── Bubble Node ─────────────────────────────────────────────────────────────
interface BubbleNodeProps {
  bubble: BubbleItem;
  pos: Point;
  baseSize: number;
  isSelected: boolean;
  isDrillable: boolean;
  index: number;
  onSelect: (b: BubbleItem) => void;
  onDrill: (b: BubbleItem) => void;
}

const BubbleNode = ({ bubble, pos, baseSize, isSelected, isDrillable, index, onSelect, onDrill }: BubbleNodeProps) => {
  const ratio = bubble.expectedWeeklyHours > 0 ? bubble.actualWeeklyHours / bubble.expectedWeeklyHours : 0;
  const isOver = ratio > 1;
  const displaySize = Math.max(baseSize * (0.65 + Math.min(ratio, 1.5) * 0.35), baseSize * 0.55);

  const color = getCategoryColor(bubble.category);
  const lightBg = getCategoryLightBg(bubble.category);
  const Icon = BUBBLE_ICONS[bubble.id] ?? Briefcase;

  const ringR = displaySize / 2 - 5;
  const ringC = 2 * Math.PI * ringR;

  const lastTapRef = useRef(0);
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastTapRef.current < 200 && isDrillable) {
      onDrill(bubble);
    } else {
      onSelect(bubble);
    }
    lastTapRef.current = now;
  }, [bubble, isDrillable, onSelect, onDrill]);

  const iconSize = displaySize > 90 ? 20 : displaySize > 70 ? 15 : 12;
  const fontSize = displaySize > 90 ? 10 : displaySize > 70 ? 8 : 7;

  return (
    <motion.div
      data-bubble="true"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, x: pos.x - displaySize / 2, y: pos.y - displaySize / 2 }}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 240, damping: 22, delay: index * 0.045 }}
      whileTap={{ scale: 0.88 }}
      style={{ position: 'absolute', top: 0, left: 0, width: displaySize, height: displaySize, zIndex: isSelected ? 20 : 1, cursor: 'pointer' }}
      onClick={handleClick}
    >
      {/* Progress ring */}
      <svg width={displaySize} height={displaySize} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={displaySize / 2} cy={displaySize / 2} r={ringR} fill="none" stroke="#E0E0E0" strokeWidth="2.5" opacity="0.45" />
        <circle cx={displaySize / 2} cy={displaySize / 2} r={ringR} fill="none"
          stroke={isOver ? '#FF5252' : color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${ringC * Math.min(ratio, 1)} ${ringC}`}
          style={{ transition: 'stroke-dasharray 800ms ease' }}
        />
      </svg>

      {/* Bubble body */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
        background: isSelected ? color : lightBg,
        border: `3px solid ${isOver ? '#FF5252' : '#000000'}`,
        boxShadow: isSelected ? `5px 5px 0px ${isOver ? '#FF5252' : '#000000'}` : `3px 3px 0px ${isOver ? '#FF5252' : '#000000'}`,
        userSelect: 'none',
      }}>
        <Icon size={iconSize} color={isSelected ? '#FFFFFF' : (isOver ? '#FF5252' : color)} strokeWidth={2.5} />
        <span style={{ fontSize, fontWeight: 800, color: isSelected ? '#FFFFFF' : '#000000', textAlign: 'center', padding: '0 6px', lineHeight: 1.2 }}>
          {bubble.name}
        </span>
        <span style={{ fontSize: Math.max(fontSize - 1, 6), fontWeight: 900, color: isSelected ? 'rgba(255,255,255,0.8)' : (isOver ? '#FF5252' : color) }}>
          {bubble.actualWeeklyHours.toFixed(1)}h
        </span>
        {isDrillable && !isSelected && bubble.children && bubble.children.length > 0 && (
          <span style={{ fontSize: 6, color: isSelected ? 'rgba(255,255,255,0.6)' : '#999', lineHeight: 1 }}>
            ↓ {bubble.children.length}
          </span>
        )}
      </div>

      {/* Selection pulse ring */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1.18, opacity: 1 }}
          style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: `2px dashed ${color}`, pointerEvents: 'none' }}
        />
      )}
    </motion.div>
  );
};

// ─── Log Time Modal (mobile) ──────────────────────────────────────────────────
const LogTimeModal = ({ bubble, onClose, onLog }: { bubble: BubbleItem | null; onClose: () => void; onLog: (id: string, name: string, mins: number) => void }) => {
  const [minutes, setMinutes] = useState(30);
  if (!bubble) return null;
  const color = getCategoryColor(bubble.category);
  const lightBg = getCategoryLightBg(bubble.category);
  const IconComponent = BUBBLE_ICONS[bubble.id] ?? Briefcase;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-28 lg:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-sm"
        style={{ background: '#FFFFFF', border: '4px solid #000000', boxShadow: '6px 6px 0px #000000', borderRadius: 20, padding: 24 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground"><X size={20} strokeWidth={2.5} /></button>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: lightBg, border: '3px solid #000000' }}>
            <IconComponent size={22} color={color} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">{bubble.name}</h3>
            <p className="text-xs text-muted-foreground">{bubble.actualWeeklyHours.toFixed(1)}h logged this week</p>
          </div>
        </div>
        <div className="mb-5">
          <label className="text-xs font-black uppercase tracking-wider text-foreground mb-2 block">Log Time</label>
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
      </motion.div>
    </div>
  );
};

// ─── Desktop Right Panel ──────────────────────────────────────────────────────
const RightPanel = ({ bubble, onLog, onClose, recentLogs }: {
  bubble: BubbleItem | null;
  onLog: (id: string, name: string, mins: number) => void;
  onClose: () => void;
  recentLogs: import("@/hooks/useTimeLogs").TimeLog[];
}) => {
  const [minutes, setMinutes] = useState(30);

  const panelContent = bubble ? (() => {
    const color = getCategoryColor(bubble.category);
    const lightBg = getCategoryLightBg(bubble.category);
    const IconComponent = BUBBLE_ICONS[bubble.id] ?? Briefcase;
    const ratio = bubble.expectedWeeklyHours > 0 ? bubble.actualWeeklyHours / bubble.expectedWeeklyHours : 0;
    const isOver = ratio > 1;
    const isBehind = ratio < 0.6;

    return (
      <>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: lightBg, border: '3px solid #000000', boxShadow: '3px 3px 0px #000000' }}>
              <IconComponent size={22} color={color} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">{bubble.name}</h3>
              <p className="text-xs text-muted-foreground capitalize">{bubble.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1"><X size={18} strokeWidth={2.5} /></button>
        </div>
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
              <><TrendingUp size={11} color="#FF5252" strokeWidth={2.5} /><span className="text-[11px] font-bold" style={{ color: '#FF5252' }}>+{(bubble.actualWeeklyHours - bubble.expectedWeeklyHours).toFixed(1)}h over</span></>
            ) : isBehind ? (
              <><TrendingDown size={11} color="#FF9800" strokeWidth={2.5} /><span className="text-[11px] font-bold" style={{ color: '#FF9800' }}>{(bubble.expectedWeeklyHours - bubble.actualWeeklyHours).toFixed(1)}h behind</span></>
            ) : (
              <><Target size={11} color={color} strokeWidth={2.5} /><span className="text-[11px] font-bold" style={{ color }}>On track</span></>
            )}
          </div>
        </div>
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
    <div className="flex flex-col items-center justify-center text-center py-16">
      <div className="w-20 h-20 rounded-full mx-auto mb-5" style={{ background: '#E8F5E9', border: '4px solid #000000', boxShadow: '4px 4px 0px #000000' }} />
      <p className="font-black text-foreground text-lg mb-2">Select a Bubble</p>
      <p className="text-sm text-muted-foreground max-w-[180px]">Tap any bubble to see details and log time</p>
    </div>
  );

  return (
    <aside className="hidden lg:flex flex-col w-80 shrink-0 min-h-screen overflow-y-auto"
      style={{ background: '#FFFFFF', borderLeft: '4px solid #000000' }}>
      <div className="px-6 py-6 border-b-4 border-black">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Details</p>
      </div>
      <div className="flex-1 px-6 py-6 overflow-y-auto">{panelContent}</div>
    </aside>
  );
};

// ─── Main BubbleMap ───────────────────────────────────────────────────────────
export const BubbleMap = () => {
  const { bubbles, updateBubbleHours, loaded } = useFirestoreBubbles();
  const { logs, logTime } = useTimeLogs();
  const lifeScore = useLifeScore(bubbles, logs);

  const [selected, setSelected] = useState<BubbleItem | null>(null);
  const [drillBubble, setDrillBubble] = useState<BubbleItem | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  // Canvas pan/zoom via MotionValues (no re-renders during drag)
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const scaleVal = useMotionValue(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const isPanRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const didDragRef = useRef(false);
  const pinchRef = useRef({ active: false, dist: 0, startScale: 1 });

  // Center canvas — wait one animation frame so DOM has laid out
  const centerCanvas = useCallback(() => {
    requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0) return;
      panX.set(width / 2);
      panY.set(height / 2);
      scaleVal.set(1);
    });
  }, [panX, panY, scaleVal]);

  // Center on mount, on drill, and when Firestore data first arrives
  useEffect(() => { centerCanvas(); }, [centerCanvas]);
  useEffect(() => { if (loaded) centerCanvas(); }, [loaded, centerCanvas]);
  useEffect(() => { centerCanvas(); }, [drillBubble, centerCanvas]);

  // Display bubbles: top-level or drilled children
  const displayBubbles = useMemo(
    () => drillBubble ? (drillBubble.children ?? []) : bubbles,
    [drillBubble, bubbles]
  );
  const baseSize = drillBubble ? 85 : 110;
  const positions = useMemo(() => computeLayout(displayBubbles, !!drillBubble), [displayBubbles, drillBubble]);

  // ── Pointer handlers for pan ─────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-bubble]')) return;
    isPanRef.current = true;
    didDragRef.current = false;
    panStartRef.current = { x: e.clientX, y: e.clientY, px: panX.get(), py: panY.get() };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  }, [panX, panY]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) didDragRef.current = true;
    if (didDragRef.current) {
      panX.set(panStartRef.current.px + dx);
      panY.set(panStartRef.current.py + dy);
    }
  }, [panX, panY]);

  const onPointerUp = useCallback(() => {
    isPanRef.current = false;
    // Delay reset so the click handler can read didDragRef before we clear it
    setTimeout(() => { didDragRef.current = false; }, 50);
  }, []);

  // ── Touch pinch zoom ─────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    pinchRef.current = { active: true, dist: Math.sqrt(dx * dx + dy * dy), startScale: scaleVal.get() };
  }, [scaleVal]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !pinchRef.current.active) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDist = Math.sqrt(dx * dx + dy * dy);
    const next = Math.min(Math.max(pinchRef.current.startScale * (newDist / pinchRef.current.dist), 0.35), 3.5);
    scaleVal.set(next);
  }, [scaleVal]);

  const onTouchEnd = useCallback(() => { pinchRef.current.active = false; }, []);

  // ── Wheel zoom — must be non-passive to call preventDefault ────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      scaleVal.set(Math.min(Math.max(scaleVal.get() * delta, 0.25), 4));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [scaleVal]);

  // ── Bubble interactions ──────────────────────────────────────────────────
  const handleSelect = useCallback((b: BubbleItem) => {
    if (didDragRef.current) return;
    setSelected(prev => prev?.id === b.id ? null : b);
    setShowLogModal(true);
  }, []);

  const handleDrill = useCallback((b: BubbleItem) => {
    if (b.children && b.children.length > 0) {
      setDrillBubble(b);
      setSelected(null);
      setShowLogModal(false);
    }
  }, []);

  const handleBack = useCallback(() => {
    setDrillBubble(null);
    setSelected(null);
    setShowLogModal(false);
  }, []);

  const handleLog = useCallback(async (bubbleId: string, bubbleName: string, minutes: number) => {
    await updateBubbleHours(bubbleId, minutes);
    await logTime(bubbleId, bubbleName, minutes, "manual");
    setShowLogModal(false);
    setSelected(null);
  }, [updateBubbleHours, logTime]);

  const totalActual = bubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);
  const totalExpected = bubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!loaded) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-bold text-sm text-muted-foreground">Loading your life map...</p>
        </div>
      </div>
    );
  }

  // ── Canvas (shared mobile + desktop) ─────────────────────────────────────
  const canvas = (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Canvas layer — panned and scaled */}
      <motion.div
        style={{ x: panX, y: panY, scale: scaleVal, position: 'absolute', top: 0, left: 0, width: 1, height: 1 }}
      >
        <AnimatePresence mode="sync">
          {displayBubbles.map((b, i) => {
            const pos = positions[b.id];
            if (!pos) return null;
            return (
              <BubbleNode
                key={`${drillBubble?.id ?? 'root'}-${b.id}`}
                bubble={b}
                pos={pos}
                baseSize={baseSize}
                isSelected={selected?.id === b.id}
                isDrillable={!drillBubble && (b.children?.length ?? 0) > 0}
                index={i}
                onSelect={handleSelect}
                onDrill={handleDrill}
              />
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Drill breadcrumb / back button */}
      <AnimatePresence>
        {drillBubble && (
          <motion.button
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={handleBack}
            className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2.5 font-black text-sm"
            style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: 12 }}
          >
            <ChevronLeft size={16} strokeWidth={3} />
            {drillBubble.name}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hint text */}
      {!drillBubble && displayBubbles.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-[10px] font-medium text-muted-foreground/60 text-center">
            drag to pan · pinch to zoom · double-tap to explore
          </p>
        </div>
      )}
    </div>
  );

  // ── Top stats bar ─────────────────────────────────────────────────────────
  const statsBar = (
    <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-safe pt-4 pb-3 pointer-events-none">
      {/* Mobile header */}
      <div className="flex items-center justify-between mb-2 lg:hidden pointer-events-auto">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground font-display">
            bubble<span style={{ color: '#4CAF50' }}>.</span>
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium">Your life, visualized</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1.5" style={{ background: '#E8F5E9', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Week</p>
            <p className="text-sm font-black" style={{ color: '#4CAF50' }}>{totalActual.toFixed(0)}h</p>
          </div>
          <div className="px-3 py-1.5" style={{ background: '#F3E5F5', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">Score</p>
            <div className="flex items-center gap-0.5">
              <Zap size={12} strokeWidth={2.5} color="#9C27B0" />
              <p className="text-sm font-black" style={{ color: '#9C27B0' }}>{lifeScore.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:flex items-center justify-between pointer-events-auto">
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
        </div>
      </div>
    </div>
  );

  // ── Category legend ───────────────────────────────────────────────────────
  const legend = (
    <div className="absolute bottom-20 left-0 right-0 flex gap-2 flex-wrap justify-center px-4 pointer-events-none z-10 lg:bottom-6">
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
  );

  return (
    <div className="flex w-full h-full">
      {/* Canvas area */}
      <div className="relative flex-1 overflow-hidden" style={{ height: '100%' }}>
        {statsBar}
        <div className="absolute inset-0" style={{ paddingTop: 96 }}>
          {canvas}
        </div>
        {legend}

        {/* Mobile log modal */}
        <AnimatePresence>
          {showLogModal && selected && (
            <LogTimeModal
              bubble={selected}
              onClose={() => { setShowLogModal(false); setSelected(null); }}
              onLog={handleLog}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Desktop right panel */}
      <RightPanel
        bubble={selected}
        onLog={handleLog}
        onClose={() => setSelected(null)}
        recentLogs={logs}
      />
    </div>
  );
};
