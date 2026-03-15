import { useState } from "react";
import { Trash2, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Session } from "@/hooks/useSessions";
import { Plan } from "@/hooks/usePlans";
import { BubbleItem, getCategoryColor, getCategoryLightBg } from "@/data/bubbleData";

interface Props {
  sessions: Session[];
  bubbles: BubbleItem[];
  date: string;
  plans?: Plan[];
  onDateChange: (date: string) => void;
  onAddSession: () => void;
  onDeleteSession: (id: string) => void;
}

// ─── SVG constants ───────────────────────────────────────────────────────────
const CX = 160;
const CY = 160;
const OUTER_R = 122;    // top-level session ring radius (center of stroke)
const INNER_R = 94;     // nested session ring radius
const OUTER_SW = 22;    // strokeWidth for top-level
const INNER_SW = 16;    // strokeWidth for nested

const toRad = (deg: number) => (deg * Math.PI) / 180;

const timeToMinutes = (hhmm: string): number => {
  const parts = (hhmm ?? "00:00").split(":");
  return Number(parts[0]) * 60 + Number(parts[1] ?? 0);
};

const minutesToAngleDeg = (minutes: number): number =>
  (minutes / 1440) * 360;

// ─── Single arc element (via strokeDasharray + rotate transform) ─────────────
interface ArcProps {
  r: number;
  strokeWidth: number;
  startMinutes: number;
  durationMinutes: number;
  color: string;
  onClick?: () => void;
  dimmed?: boolean;
  outlined?: boolean; // planned (not yet logged) arc
}

const SessionArc = ({ r, strokeWidth, startMinutes, durationMinutes, color, onClick, dimmed, outlined }: ArcProps) => {
  const circumference = 2 * Math.PI * r;
  const arcLength = Math.max((durationMinutes / 1440) * circumference, 0.5);
  const startAngle = minutesToAngleDeg(startMinutes) - 90; // -90 so midnight is at top

  // For plan arcs: dashed stroke with gaps so it looks like an outline placeholder
  const dash = outlined
    ? `${Math.max(arcLength * 0.7, 2)} ${Math.max(arcLength * 0.08, 3)}`
    : `${arcLength} ${circumference - arcLength}`;

  return (
    <circle
      cx={CX} cy={CY} r={r}
      fill="none"
      stroke={color}
      strokeWidth={outlined ? strokeWidth - 6 : strokeWidth}
      strokeLinecap="round"
      strokeDasharray={dash}
      strokeDashoffset={0}
      transform={`rotate(${startAngle}, ${CX}, ${CY})`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", opacity: outlined ? 0.4 : (dimmed ? 0.3 : 1), transition: "opacity 200ms" }}
    />
  );
};

// ─── Helper to format date label ─────────────────────────────────────────────
const formatDateLabel = (dateStr: string): string => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const offsetDate = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const getDayName = (dateStr: string): string => {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_NAMES[d.getDay()];
};

// ─── Main component ───────────────────────────────────────────────────────────
export const DailyLifeCircle = ({ sessions, bubbles, date, plans = [], onDateChange, onAddSession, onDeleteSession }: Props) => {
  const [selected, setSelected] = useState<Session | null>(null);

  const isToday = date === new Date().toISOString().split("T")[0];
  const topLevel = sessions.filter(s => !s.parentSessionId);
  const nested = sessions.filter(s => !!s.parentSessionId);
  const todayDayName = getDayName(date);

  const totalMinutes = topLevel.reduce((sum, s) => sum + s.duration, 0);

  // Plans for today's day-of-week: collect time slots to show as plan arcs
  const todayPlanSlots: { startMinutes: number; duration: number; color: string; bubbleId: string }[] = [];
  for (const plan of plans) {
    const slot = plan.timeSlots?.find(s => s.day === todayDayName);
    if (!slot) continue;
    const bubble = bubbles.find(b => b.id === plan.bubbleId);
    const color = bubble ? getCategoryColor(bubble.category) : "#CCCCCC";
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    const duration = endMinutes > startMinutes ? endMinutes - startMinutes : 1440 - startMinutes + endMinutes;
    todayPlanSlots.push({ startMinutes, duration, color, bubbleId: plan.bubbleId });
  }

  // Current time indicator (only when viewing today)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentAngle = minutesToAngleDeg(currentMinutes) - 90;
  const needleLen = OUTER_R + OUTER_SW / 2 + 6;
  const needleX = CX + needleLen * Math.cos(toRad(currentAngle));
  const needleY = CY + needleLen * Math.sin(toRad(currentAngle));

  // Major hour labels
  const majorHours = [
    { h: 0, label: "12am" },
    { h: 6, label: "6am" },
    { h: 12, label: "12pm" },
    { h: 18, label: "6pm" },
  ];
  const LABEL_R = OUTER_R + OUTER_SW / 2 + 18;

  // Collect all shared tag pairs for Venn overlap indicators
  const tagOverlaps: { a: Session; b: Session; shared: string[] }[] = [];
  for (let i = 0; i < topLevel.length; i++) {
    for (let j = i + 1; j < topLevel.length; j++) {
      const shared = (topLevel[i].tags ?? []).filter(t => (topLevel[j].tags ?? []).includes(t));
      if (shared.length > 0) tagOverlaps.push({ a: topLevel[i], b: topLevel[j], shared });
    }
  }

  const handleArcClick = (s: Session) => {
    setSelected(prev => (prev?.id === s.id ? null : s));
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Date navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => { onDateChange(offsetDate(date, -1)); setSelected(null); }}
          className="flex items-center justify-center transition-all active:scale-95"
          style={{ background: '#F5F5F5', border: '2px solid #000000', borderRadius: 8, width: 34, height: 34, boxShadow: '2px 2px 0px #000000' }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
        <span className="font-black text-sm text-foreground min-w-[80px] text-center">{formatDateLabel(date)}</span>
        <button
          onClick={() => { if (!isToday) { onDateChange(offsetDate(date, 1)); setSelected(null); } }}
          disabled={isToday}
          className="flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          style={{ background: '#F5F5F5', border: '2px solid #000000', borderRadius: 8, width: 34, height: 34, boxShadow: '2px 2px 0px #000000' }}
        >
          <ChevronRight size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* SVG Clock */}
      <svg viewBox="0 0 320 320" width="100%" style={{ maxWidth: 300 }}>
        {/* Background rings */}
        <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="#EEEEEE" strokeWidth={OUTER_SW} />
        <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="#F5F5F5" strokeWidth={INNER_SW} />

        {/* Hour tick marks */}
        {Array.from({ length: 24 }, (_, h) => {
          const angle = minutesToAngleDeg(h * 60) - 90;
          const isMajor = h % 6 === 0;
          const tickStart = OUTER_R + OUTER_SW / 2 + 2;
          const tickEnd = tickStart + (isMajor ? 10 : 5);
          const x1 = CX + tickStart * Math.cos(toRad(angle));
          const y1 = CY + tickStart * Math.sin(toRad(angle));
          const x2 = CX + tickEnd * Math.cos(toRad(angle));
          const y2 = CY + tickEnd * Math.sin(toRad(angle));
          return (
            <line
              key={h} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={isMajor ? "#000000" : "#CCCCCC"}
              strokeWidth={isMajor ? 2 : 1}
            />
          );
        })}

        {/* Hour labels */}
        {majorHours.map(({ h, label }) => {
          const angle = minutesToAngleDeg(h * 60) - 90;
          const lx = CX + LABEL_R * Math.cos(toRad(angle));
          const ly = CY + LABEL_R * Math.sin(toRad(angle));
          return (
            <text
              key={h} x={lx} y={ly}
              textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: 8, fontWeight: 800, fill: "#111111", fontFamily: "Inter, sans-serif" }}
            >
              {label}
            </text>
          );
        })}

        {/* Planned time arcs (outlined, behind actual sessions) */}
        {todayPlanSlots.map((slot, i) => (
          <SessionArc
            key={`plan-${i}`}
            r={OUTER_R}
            strokeWidth={OUTER_SW}
            startMinutes={slot.startMinutes}
            durationMinutes={slot.duration}
            color={slot.color}
            outlined
          />
        ))}

        {/* Top-level session arcs */}
        {topLevel.map(s => {
          const bubble = bubbles.find(b => b.id === s.bubbleId);
          const color = bubble ? getCategoryColor(bubble.category) : "#4CAF50";
          return (
            <SessionArc
              key={s.id}
              r={OUTER_R}
              strokeWidth={OUTER_SW - 2}
              startMinutes={timeToMinutes(s.startTime)}
              durationMinutes={s.duration}
              color={color}
              onClick={() => handleArcClick(s)}
              dimmed={!!selected && selected.id !== s.id}
            />
          );
        })}

        {/* Nested session arcs */}
        {nested.map(s => {
          const bubble = bubbles.find(b => b.id === s.bubbleId);
          const color = bubble ? getCategoryColor(bubble.category) : "#2196F3";
          return (
            <SessionArc
              key={s.id}
              r={INNER_R}
              strokeWidth={INNER_SW - 2}
              startMinutes={timeToMinutes(s.startTime)}
              durationMinutes={s.duration}
              color={color}
              onClick={() => handleArcClick(s)}
              dimmed={!!selected && selected.id !== s.id}
            />
          );
        })}

        {/* Current time needle (today only) */}
        {isToday && (
          <>
            <line
              x1={CX} y1={CY} x2={needleX} y2={needleY}
              stroke="#000000" strokeWidth={2} strokeLinecap="round"
            />
            <circle cx={CX} cy={CY} r={4} fill="#000000" />
          </>
        )}

        {/* Center: total tracked */}
        <text
          x={CX} y={CY - 9}
          textAnchor="middle"
          style={{ fontSize: 20, fontWeight: 900, fill: "#000000", fontFamily: "Inter, sans-serif" }}
        >
          {(totalMinutes / 60).toFixed(1)}h
        </text>
        <text
          x={CX} y={CY + 11}
          textAnchor="middle"
          style={{ fontSize: 8, fontWeight: 600, fill: "#888888", fontFamily: "Inter, sans-serif" }}
        >
          {sessions.length === 0 ? "no sessions yet" : `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
        </text>
      </svg>

      {/* Tag overlap badges */}
      {tagOverlaps.length > 0 && (
        <div className="w-full mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1.5">Tag Overlaps</p>
          <div className="flex gap-2 flex-wrap">
            {tagOverlaps.map((o, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold"
                style={{ background: '#FFFFFF', border: '2px solid #000000', borderRadius: 20, boxShadow: '2px 2px 0px #000000' }}>
                <span style={{ color: getCategoryColor(bubbles.find(b => b.id === o.a.bubbleId)?.category ?? 'productive') }}>
                  {o.a.bubbleName}
                </span>
                <span className="text-muted-foreground">∩</span>
                <span style={{ color: getCategoryColor(bubbles.find(b => b.id === o.b.bubbleId)?.category ?? 'productive') }}>
                  {o.b.bubbleName}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-foreground">{o.shared.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected session details */}
      {selected && (
        <div className="w-full mt-1 p-4 animate-fade-up"
          style={{
            background: getCategoryLightBg(selected.category),
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 14,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-black text-foreground">{selected.bubbleName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selected.startTime} – {selected.endTime} · {selected.duration}min
                {selected.parentSessionId && " · nested"}
              </p>
              {selected.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic">"{selected.notes}"</p>
              )}
              {(selected.tags ?? []).length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {(selected.tags ?? []).map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] font-bold rounded-full"
                      style={{ background: '#000000', color: '#FFFFFF' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { if (selected.id) onDeleteSession(selected.id); setSelected(null); }}
              className="ml-3 flex-shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Session list */}
      {sessions.length > 0 && (
        <div className="w-full mt-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Sessions</p>
          {sessions.map(s => {
            const bubble = bubbles.find(b => b.id === s.bubbleId);
            const color = getCategoryColor(s.category);
            const lightBg = getCategoryLightBg(s.category);
            const isNested = !!s.parentSessionId;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all"
                style={{
                  background: selected?.id === s.id ? lightBg : '#FFFFFF',
                  border: `2px solid ${selected?.id === s.id ? color : '#000000'}`,
                  boxShadow: '2px 2px 0px #000000',
                  borderRadius: 10,
                  marginLeft: isNested ? 16 : 0,
                }}
                onClick={() => handleArcClick(s)}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground">{s.bubbleName}</p>
                  <p className="text-[10px] text-muted-foreground">{s.startTime} – {s.endTime}</p>
                </div>
                <span className="text-xs font-black flex-shrink-0" style={{ color }}>
                  {s.duration >= 60 ? `${Math.floor(s.duration / 60)}h${s.duration % 60 > 0 ? ` ${s.duration % 60}m` : ""}` : `${s.duration}m`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add session button */}
      <button
        onClick={onAddSession}
        className="mt-5 flex items-center gap-2 px-6 py-3 font-black text-sm transition-all active:translate-y-0.5"
        style={{
          background: '#000000',
          color: '#FFFFFF',
          border: '3px solid #000000',
          boxShadow: '4px 4px 0px #4CAF50',
          borderRadius: 12,
        }}
      >
        <Plus size={16} strokeWidth={3} />
        Add Session
      </button>
    </div>
  );
};
