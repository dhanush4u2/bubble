import { useState, useMemo } from "react";
import { getCategoryColor, getCategoryLightBg, BubbleItem } from "@/data/bubbleData";
import { Target, TrendingUp, TrendingDown, Edit2, Check, AlertTriangle, BookOpen, Zap, CalendarDays } from "lucide-react";
import { useFirestoreBubbles } from "@/hooks/useFirestoreBubbles";
import { useTimeLogs } from "@/hooks/useTimeLogs";
import { useLifeScore } from "@/hooks/useLifeScore";
import { usePlans } from "@/hooks/usePlans";
import TimePlannerModal from "@/components/TimePlannerModal";

/** Generate dynamic life drift alerts from real bubble data */
const generateDriftAlerts = (bubbles: BubbleItem[]) => {
  const alerts: { Icon: React.ElementType; text: string; color: string; bg: string }[] = [];

  bubbles.forEach(b => {
    if (b.expectedWeeklyHours <= 0) return;
    const diff = b.actualWeeklyHours - b.expectedWeeklyHours;
    const ratio = b.actualWeeklyHours / b.expectedWeeklyHours;

    if (diff > 2) {
      alerts.push({
        Icon: AlertTriangle,
        text: `${b.name} is ${diff.toFixed(1)}h above target this week`,
        color: '#FF5252', bg: '#FFEBEE',
      });
    } else if (ratio < 0.5 && b.expectedWeeklyHours >= 5) {
      alerts.push({
        Icon: BookOpen,
        text: `${b.name} is ${Math.abs(diff).toFixed(1)}h below target — at risk this week`,
        color: '#FF9800', bg: '#FFF3E0',
      });
    }
  });

  if (alerts.length === 0) {
    alerts.push({
      Icon: Target,
      text: "All bubbles are within range. You're managing your time well!",
      color: '#4CAF50', bg: '#E8F5E9',
    });
  }

  return alerts;
};

const GoalsContent = () => {
  const { bubbles, updateExpectedHours } = useFirestoreBubbles();
  const { logs } = useTimeLogs();
  const lifeScore = useLifeScore(bubbles, logs);
  const { savePlan, deletePlan, getPlanForBubble } = usePlans();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [planningBubble, setPlanningBubble] = useState<BubbleItem | null>(null);
  const driftAlerts = useMemo(() => generateDriftAlerts(bubbles), [bubbles]);

  const totalExpected = bubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);
  const TOTAL_HOURS_IN_WEEK = 168;
  const allocatedPercent = Math.round((totalExpected / TOTAL_HOURS_IN_WEEK) * 100);
  const unallocated = TOTAL_HOURS_IN_WEEK - totalExpected;

  const handleSave = (id: string) => {
    updateExpectedHours(id, editValue);
    setEditingId(null);
  };

  return (
    <>
      {/* Life Score Summary */}
      <div className="mb-5" style={{ background: '#F3E5F5', border: '4px solid #000000', boxShadow: '6px 6px 0px #000000', borderRadius: 16, padding: 20 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={20} strokeWidth={2.5} color="#9C27B0" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Life Score</p>
              <p className="text-2xl font-black" style={{ color: '#9C27B0' }}>{lifeScore.total}<span className="text-sm font-medium text-muted-foreground"> / 100</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-muted-foreground uppercase">Balance</p>
            <p className="text-lg font-black" style={{ color: '#2196F3' }}>{lifeScore.balance}%</p>
          </div>
        </div>
      </div>

      <div className="mb-5" style={{ background: '#FFFFFF', border: '4px solid #000000', boxShadow: '6px 6px 0px #000000', borderRadius: 16, padding: 20 }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Weekly Budget</p>
            <p className="text-3xl font-black text-foreground mt-1">{totalExpected}<span className="text-base font-medium text-muted-foreground">h / 168h</span></p>
          </div>
          <div className="text-right px-3 py-2" style={{ background: '#E3F2FD', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 10 }}>
            <p className="text-[9px] font-black text-muted-foreground uppercase">Unallocated</p>
            <p className="text-xl font-black" style={{ color: '#2196F3' }}>{unallocated}h</p>
          </div>
        </div>
        <div className="h-4 overflow-hidden flex gap-0.5 mb-3" style={{ border: '3px solid #000000', borderRadius: 8 }}>
          {bubbles.map(b => (
            <div key={b.id} className="h-full transition-all duration-700"
              style={{ width: `${(b.expectedWeeklyHours / TOTAL_HOURS_IN_WEEK) * 100}%`, background: getCategoryColor(b.category) }} />
          ))}
          <div className="h-full flex-1" style={{ background: '#F5F5F5' }} />
        </div>
        <p className="text-xs font-bold text-muted-foreground">{allocatedPercent}% of your week is planned</p>
      </div>

      <div className="space-y-3 mb-6">
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-3">Category Targets</p>
        {bubbles.map((bubble, i) => {
          const ratio = bubble.expectedWeeklyHours > 0 ? bubble.actualWeeklyHours / bubble.expectedWeeklyHours : 0;
          const isOver = ratio > 1;
          const isMissing = ratio < 0.6;
          const color = getCategoryColor(bubble.category);
          const lightBg = getCategoryLightBg(bubble.category);
          const isEditing = editingId === bubble.id;
          return (
            <div key={bubble.id} className="animate-fade-up"
              style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: 14, padding: 16, animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: lightBg, border: '2.5px solid #000000' }}>
                  <div className="w-4 h-4 rounded-full" style={{ background: color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-foreground">{bubble.name}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input type="number" value={editValue} onChange={e => setEditValue(Number(e.target.value))}
                          className="w-16 text-center text-sm font-bold bg-neutral rounded-lg px-2 py-1 text-foreground focus:outline-none"
                          style={{ border: '2px solid #000000' }} min={0} max={168} />
                        <span className="text-xs font-bold text-muted-foreground">h/wk</span>
                        <button onClick={() => handleSave(bubble.id)} className="flex items-center justify-center"
                          style={{ background: '#4CAF50', border: '2px solid #000000', borderRadius: 6, width: 28, height: 28 }}>
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black" style={{ color }}>{bubble.expectedWeeklyHours}h/wk</span>
                        <button
                          onClick={() => setPlanningBubble(bubble)}
                          className="flex items-center justify-center"
                          title="Plan schedule"
                          style={{ background: getPlanForBubble(bubble.id) ? color : '#F5F5F5', border: '2px solid #000000', borderRadius: 6, width: 24, height: 24 }}>
                          <CalendarDays size={11} color={getPlanForBubble(bubble.id) ? "#FFFFFF" : "#000000"} strokeWidth={2.5} />
                        </button>
                        <button onClick={() => { setEditingId(bubble.id); setEditValue(bubble.expectedWeeklyHours); }}
                          className="flex items-center justify-center"
                          style={{ background: '#F5F5F5', border: '2px solid #000000', borderRadius: 6, width: 24, height: 24 }}>
                          <Edit2 size={11} color="#000000" strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative h-2.5 overflow-hidden mb-1.5" style={{ background: lightBg, border: '2px solid #000000', borderRadius: 6 }}>
                    <div className="absolute left-0 top-0 h-full transition-all duration-700"
                      style={{ width: `${Math.min(ratio * 100, 100)}%`, background: isOver ? '#FF5252' : color }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">{bubble.actualWeeklyHours.toFixed(1)}h logged</span>
                    <div className="flex items-center gap-1">
                      {isOver ? (<><TrendingUp size={10} color="#FF5252" strokeWidth={2.5} /><span className="text-[10px] font-bold" style={{ color: '#FF5252' }}>+{(bubble.actualWeeklyHours - bubble.expectedWeeklyHours).toFixed(1)}h over</span></>)
                        : isMissing ? (<><TrendingDown size={10} color="#FF9800" strokeWidth={2.5} /><span className="text-[10px] font-bold" style={{ color: '#FF9800' }}>{(bubble.expectedWeeklyHours - bubble.actualWeeklyHours).toFixed(1)}h behind</span></>)
                        : (<><Target size={10} color={color} strokeWidth={2.5} /><span className="text-[10px] font-bold" style={{ color }}>On track</span></>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-foreground mb-3">Life Drift Alerts</p>
        <div className="space-y-2">
          {driftAlerts.map(({ Icon, text, color, bg }, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3"
              style={{ background: bg, border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: 12, borderLeft: `6px solid ${color}` }}>
              <Icon size={16} color={color} strokeWidth={2.5} className="flex-shrink-0" />
              <p className="text-sm font-medium text-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Time Planner Modal */}
      {planningBubble && (
        <TimePlannerModal
          bubble={planningBubble}
          existingPlan={getPlanForBubble(planningBubble.id)}
          onClose={() => setPlanningBubble(null)}
          onSave={savePlan}
          onDelete={deletePlan}
        />
      )}
    </>
  );
};

export default function GoalsPage() {
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden h-full overflow-y-auto pb-24 pt-6 px-4 bg-background">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground font-display">Goals</h1>
          <p className="text-sm text-muted-foreground font-medium">Design your ideal week</p>
        </div>
        <GoalsContent />
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex h-full bg-background">
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground font-display">Goals</h1>
            <p className="text-muted-foreground font-medium mt-1">Design your ideal week</p>
          </div>
          <div className="max-w-2xl">
            <GoalsContent />
          </div>
        </div>
      </div>
    </>
  );
}
