import { useMemo } from "react";
import { getCategoryColor, getCategoryLightBg, BubbleItem } from "@/data/bubbleData";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Brain, Zap, Clock, AlertTriangle, Target, Activity } from "lucide-react";
import { useFirestoreBubbles } from "@/hooks/useFirestoreBubbles";
import { useTimeLogs, TimeLog } from "@/hooks/useTimeLogs";
import { useLifeScore } from "@/hooks/useLifeScore";

const ComicCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={className} style={{ background: '#FFFFFF', border: '4px solid #000000', boxShadow: '6px 6px 0px #000000', borderRadius: 16, padding: 20 }}>
    {children}
  </div>
);

/** Build daily activity chart from real Firestore logs for the current week */
const buildWeekTrend = (logs: TimeLog[]) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const dayTotals: Record<string, number> = {};
  days.forEach(d => { dayTotals[d] = 0; });

  logs.forEach(log => {
    const d = new Date(log.date);
    if (d >= weekStart) {
      const dayName = days[d.getDay()];
      dayTotals[dayName] += log.duration / 60;
    }
  });

  return days.map(day => ({ day, tracked: Math.round(dayTotals[day] * 10) / 10 }));
};

/** Generate dynamic insights from real bubble data */
const generateInsights = (bubbles: BubbleItem[]) => {
  const insights: { Icon: React.ElementType; text: string; color: string; bg: string }[] = [];

  bubbles.forEach(b => {
    if (b.expectedWeeklyHours <= 0) return;
    const ratio = b.actualWeeklyHours / b.expectedWeeklyHours;
    const diff = b.actualWeeklyHours - b.expectedWeeklyHours;

    if (ratio > 1.2) {
      insights.push({
        Icon: AlertTriangle,
        text: `${b.name} is ${Math.abs(diff).toFixed(1)}h over target this week. Consider reallocating time.`,
        color: '#FF5252', bg: '#FFEBEE',
      });
    } else if (ratio < 0.5 && b.actualWeeklyHours > 0) {
      insights.push({
        Icon: TrendingDown,
        text: `${b.name} is ${Math.abs(diff).toFixed(1)}h behind target — you may fall short this week.`,
        color: '#FF9800', bg: '#FFF3E0',
      });
    } else if (ratio >= 0.8 && ratio <= 1.1) {
      insights.push({
        Icon: Target,
        text: `${b.name} is on track at ${Math.round(ratio * 100)}% of your weekly goal. Keep it up!`,
        color: '#4CAF50', bg: '#E8F5E9',
      });
    }
  });

  // Add a general insight if no specific ones
  if (insights.length === 0) {
    const totalActual = bubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);
    if (totalActual === 0) {
      insights.push({
        Icon: Clock,
        text: "Start logging time to get personalized insights about your week.",
        color: '#2196F3', bg: '#E3F2FD',
      });
    } else {
      insights.push({
        Icon: Activity,
        text: "You're building momentum! Keep tracking consistently to unlock deeper insights.",
        color: '#4CAF50', bg: '#E8F5E9',
      });
    }
  }

  return insights.slice(0, 4);
};

const InsightsContent = () => {
  const { bubbles } = useFirestoreBubbles();
  const { logs } = useTimeLogs();
  const lifeScore = useLifeScore(bubbles, logs);

  const totalActual = bubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);
  const totalExpected = bubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);
  const pieData = bubbles.map(b => ({ name: b.name, value: b.actualWeeklyHours, color: getCategoryColor(b.category), lightBg: getCategoryLightBg(b.category) }));
  const weekTrend = useMemo(() => buildWeekTrend(logs), [logs]);
  const dynamicInsights = useMemo(() => generateInsights(bubbles), [bubbles]);

  return (
    <>
      {/* Life Score Card */}
      <ComicCard className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={18} strokeWidth={2.5} color="#9C27B0" />
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Life Score</p>
          </div>
          <p className="text-3xl font-black" style={{ color: lifeScore.total >= 70 ? '#4CAF50' : lifeScore.total >= 40 ? '#FF9800' : '#FF5252' }}>
            {lifeScore.total}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Coverage', value: lifeScore.coverage, color: '#4CAF50' },
            { label: 'Balance', value: lifeScore.balance, color: '#2196F3' },
            { label: 'Consistency', value: lifeScore.consistency, color: '#FF9800' },
            { label: 'Productive', value: lifeScore.productivity, color: '#9C27B0' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-sm font-black" style={{ color }}>{value}%</p>
              <div className="h-1.5 mt-1 overflow-hidden" style={{ background: '#F5F5F5', borderRadius: 4 }}>
                <div className="h-full transition-all duration-700" style={{ width: `${value}%`, background: color, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </ComicCard>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Tracked", value: `${totalActual.toFixed(0)}h`, color: '#4CAF50', bg: '#E8F5E9', trend: "up" },
          { label: "Target", value: `${totalExpected}h`, color: '#2196F3', bg: '#E3F2FD', trend: "equal" },
          { label: "Coverage", value: `${totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0}%`, color: '#FF9800', bg: '#FFF3E0', trend: "down" },
        ].map(({ label, value, color, bg, trend }) => (
          <div key={label} className="text-center py-3 px-2" style={{ background: bg, border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 12 }}>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
            <p className="text-lg font-black" style={{ color }}>{value}</p>
            <div className="flex justify-center mt-1">
              {trend === "up" ? <TrendingUp size={12} color="#4CAF50" strokeWidth={2.5} /> : trend === "down" ? <TrendingDown size={12} color="#FF9800" strokeWidth={2.5} /> : <Minus size={12} color="#777" strokeWidth={2.5} />}
            </div>
          </div>
        ))}
      </div>

      <ComicCard className="mb-5">
        <p className="text-[10px] font-black mb-4 uppercase tracking-widest text-foreground">Life Distribution</p>
        <div className="flex items-center gap-4">
          <div style={{ width: 150, height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData.filter(p => p.value > 0)} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" stroke="#000000" strokeWidth={2}>
                  {pieData.filter(p => p.value > 0).map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color, border: '1.5px solid #000000' }} />
                <span className="text-xs font-medium text-foreground flex-1">{item.name}</span>
                <span className="text-xs font-black text-foreground">{item.value.toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </div>
      </ComicCard>

      <ComicCard className="mb-5">
        <p className="text-[10px] font-black mb-4 uppercase tracking-widest text-foreground">Expected vs Actual</p>
        <div className="space-y-3">
          {bubbles.map(bubble => {
            const ratio = bubble.expectedWeeklyHours > 0 ? bubble.actualWeeklyHours / bubble.expectedWeeklyHours : 0;
            const isOver = ratio > 1;
            const color = getCategoryColor(bubble.category);
            const lightBg = getCategoryLightBg(bubble.category);
            return (
              <div key={bubble.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{bubble.name}</span>
                  <span className="text-xs font-black" style={{ color: isOver ? '#FF5252' : color }}>{bubble.actualWeeklyHours.toFixed(1)}h / {bubble.expectedWeeklyHours}h</span>
                </div>
                <div className="relative h-3 overflow-hidden" style={{ background: lightBg, border: '2px solid #000000', borderRadius: 6 }}>
                  <div className="absolute left-0 top-0 h-full transition-all duration-700" style={{ width: `${Math.min(ratio * 100, 100)}%`, background: isOver ? '#FF5252' : color }} />
                </div>
              </div>
            );
          })}
        </div>
      </ComicCard>

      <ComicCard className="mb-5">
        <p className="text-[10px] font-black mb-4 uppercase tracking-widest text-foreground">Daily Activity</p>
        <div style={{ height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekTrend} barSize={22}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#777', fontSize: 10, fontWeight: 700 }} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', borderRadius: 8, fontSize: 11, fontWeight: 700 }} itemStyle={{ color: '#4CAF50' }} labelStyle={{ color: '#000000', fontWeight: 800 }} />
              <Bar dataKey="tracked" fill="#4CAF50" radius={[6, 6, 0, 0]} stroke="#000000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ComicCard>

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={16} strokeWidth={2.5} color="#000000" />
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Insights Engine</p>
        </div>
        <div className="space-y-3">
          {dynamicInsights.map(({ Icon, text, color, bg }, i) => (
            <div key={i} className="flex gap-3 items-start p-4 animate-fade-up"
              style={{ background: bg, border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', borderRadius: 12, animationDelay: `${i * 100}ms`, borderLeft: `6px solid ${color}` }}>
              <Icon size={18} strokeWidth={2.5} color={color} className="flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default function InsightsPage() {
  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden min-h-screen pb-24 pt-6 px-4 bg-background">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground font-display">Insights</h1>
          <p className="text-sm text-muted-foreground font-medium">Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
        <InsightsContent />
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex min-h-screen bg-background">
        <div className="flex-1 overflow-y-auto px-10 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground font-display">Insights</h1>
            <p className="text-muted-foreground font-medium mt-1">Week of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="max-w-2xl">
            <InsightsContent />
          </div>
        </div>
      </div>
    </>
  );
}
