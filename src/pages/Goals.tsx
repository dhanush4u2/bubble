import { useState } from "react";
import { defaultBubbles, getCategoryColor, getCategoryBg } from "@/data/bubbleData";
import { Target, TrendingUp, TrendingDown, Edit2, Check } from "lucide-react";

export default function GoalsPage() {
  const [bubbles, setBubbles] = useState(defaultBubbles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  const totalExpected = bubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);
  const totalActual = bubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);

  const handleSave = (id: string) => {
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, expectedWeeklyHours: editValue } : b));
    setEditingId(null);
  };

  const TOTAL_HOURS_IN_WEEK = 168;
  const allocatedPercent = Math.round((totalExpected / TOTAL_HOURS_IN_WEEK) * 100);
  const unallocated = TOTAL_HOURS_IN_WEEK - totalExpected;

  return (
    <div className="min-h-screen pb-24 pt-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Goals</h1>
        <p className="text-sm text-muted-foreground">Design your ideal week</p>
      </div>

      {/* Week overview */}
      <div className="glass rounded-3xl p-5 mb-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">Weekly Budget</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totalExpected}<span className="text-base font-normal text-muted-foreground">h / 168h</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Unallocated</p>
            <p className="text-xl font-bold text-bubble-accent">{unallocated}h</p>
          </div>
        </div>

        {/* Stacked bar */}
        <div className="h-3 rounded-full overflow-hidden flex gap-0.5 mb-3">
          {bubbles.map(b => (
            <div
              key={b.id}
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(b.expectedWeeklyHours / TOTAL_HOURS_IN_WEEK) * 100}%`,
                background: getCategoryColor(b.category),
                opacity: 0.8,
              }}
            />
          ))}
          <div
            className="h-full rounded-full flex-1"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{allocatedPercent}% of your week is planned</p>
      </div>

      {/* Goals list */}
      <div className="space-y-3 mb-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Category Targets</p>
        {bubbles.map((bubble, i) => {
          const ratio = bubble.actualWeeklyHours / bubble.expectedWeeklyHours;
          const isOver = ratio > 1;
          const isMissing = ratio < 0.6;
          const color = getCategoryColor(bubble.category);
          const isEditing = editingId === bubble.id;

          return (
            <div
              key={bubble.id}
              className="glass rounded-2xl p-4 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: getCategoryBg(bubble.category) }}
                >
                  {bubble.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-foreground">{bubble.name}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={e => setEditValue(Number(e.target.value))}
                          className="w-16 text-center text-sm bg-white/10 rounded-lg px-2 py-1 text-foreground border border-white/20 focus:outline-none"
                          min={0}
                          max={168}
                        />
                        <span className="text-xs text-muted-foreground">h/wk</span>
                        <button onClick={() => handleSave(bubble.id)} className="text-productive hover:scale-110 transition-all">
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color }}>{bubble.expectedWeeklyHours}h/wk</span>
                        <button
                          onClick={() => { setEditingId(bubble.id); setEditValue(bubble.expectedWeeklyHours); }}
                          className="text-muted-foreground hover:text-foreground transition-all"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((bubble.actualWeeklyHours / bubble.expectedWeeklyHours) * 100, 100)}%`,
                        background: isOver ? 'hsl(0 72% 60%)' : color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{bubble.actualWeeklyHours.toFixed(1)}h logged</span>
                    <div className="flex items-center gap-1">
                      {isOver ? (
                        <><TrendingUp size={10} className="text-red-400" /><span className="text-[10px] text-red-400">+{(bubble.actualWeeklyHours - bubble.expectedWeeklyHours).toFixed(1)}h over</span></>
                      ) : isMissing ? (
                        <><TrendingDown size={10} className="text-yellow-400" /><span className="text-[10px] text-yellow-400">{(bubble.expectedWeeklyHours - bubble.actualWeeklyHours).toFixed(1)}h behind</span></>
                      ) : (
                        <><Target size={10} style={{ color }} /><span className="text-[10px]" style={{ color }}>On track</span></>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Life Drift Alerts */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Life Drift Alerts</p>
        <div className="space-y-2">
          {[
            { icon: "🎮", text: "Leisure 4h above target this week", color: "hsl(0 72% 60%)" },
            { icon: "📚", text: "Learning 5h below target — upskilling at risk", color: "hsl(45 100% 65%)" },
          ].map((alert, i) => (
            <div key={i} className="glass rounded-2xl px-4 py-3 flex items-center gap-3" style={{ borderLeft: `2px solid ${alert.color}` }}>
              <span className="text-lg">{alert.icon}</span>
              <p className="text-sm text-foreground/85">{alert.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
