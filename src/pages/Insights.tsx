import { defaultBubbles, getCategoryColor, getCategoryBg } from "@/data/bubbleData";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";

const RADIAN = Math.PI / 180;

const aiInsights = [
  {
    icon: "⚡",
    type: "warning",
    text: "Leisure exceeded goal by 4h this week. Reducing by 3h gives you enough time to complete your upskilling targets.",
    color: "hsl(0 72% 60%)",
  },
  {
    icon: "🕐",
    type: "info",
    text: "Your most productive hours are between 9am and 12pm based on your focus session patterns.",
    color: "hsl(232 100% 74%)",
  },
  {
    icon: "📈",
    type: "success",
    text: "Work consistency is up 12% vs last week. Keep this momentum going!",
    color: "hsl(162 77% 58%)",
  },
  {
    icon: "⚠️",
    type: "warning",
    text: "Learning hours are 50% below target. Your upskilling goals may be at risk this month.",
    color: "hsl(45 100% 65%)",
  },
];

const weekTrend = [
  { day: "Mon", tracked: 8.5 },
  { day: "Tue", tracked: 10.2 },
  { day: "Wed", tracked: 7.8 },
  { day: "Thu", tracked: 11.0 },
  { day: "Fri", tracked: 9.3 },
  { day: "Sat", tracked: 4.2 },
  { day: "Sun", tracked: 2.1 },
];

export default function InsightsPage() {
  const totalActual = defaultBubbles.reduce((s, b) => s + b.actualWeeklyHours, 0);
  const totalExpected = defaultBubbles.reduce((s, b) => s + b.expectedWeeklyHours, 0);

  const pieData = defaultBubbles.map(b => ({
    name: b.name,
    value: b.actualWeeklyHours,
    color: getCategoryColor(b.category),
    icon: b.icon,
    category: b.category,
  }));

  const categoryData = [
    { name: "Productive", actual: 41, expected: 50, color: "hsl(162 77% 58%)" },
    { name: "Lifestyle", actual: 15, expected: 18, color: "hsl(20 100% 70%)" },
    { name: "Leisure", actual: 18, expected: 14, color: "hsl(88 55% 58%)" },
  ];

  return (
    <div className="min-h-screen pb-24 pt-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground">Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Tracked", value: `${totalActual.toFixed(0)}h`, color: "hsl(162 77% 58%)", trend: "up" },
          { label: "Target", value: `${totalExpected}h`, color: "hsl(232 100% 74%)", trend: "equal" },
          { label: "Coverage", value: `${Math.round((totalActual / totalExpected) * 100)}%`, color: "hsl(20 100% 70%)", trend: "down" },
        ].map(({ label, value, color, trend }) => (
          <div key={label} className="glass rounded-2xl p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
            <div className="flex justify-center mt-1">
              {trend === "up" ? <TrendingUp size={12} className="text-productive" /> :
               trend === "down" ? <TrendingDown size={12} className="text-lifestyle" /> :
               <Minus size={12} className="text-muted-foreground" />}
            </div>
          </div>
        ))}
      </div>

      {/* Life Distribution Pie */}
      <div className="glass rounded-3xl p-5 mb-5">
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">Life Distribution</p>
        <div className="flex items-center gap-4">
          <div style={{ width: 150, height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-xs text-muted-foreground flex-1">{item.icon} {item.name}</span>
                <span className="text-xs font-semibold text-foreground">{item.value.toFixed(1)}h</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expected vs Actual bars */}
      <div className="glass rounded-3xl p-5 mb-5">
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">Expected vs Actual</p>
        <div className="space-y-3">
          {defaultBubbles.map(bubble => {
            const ratio = bubble.actualWeeklyHours / bubble.expectedWeeklyHours;
            const isOver = ratio > 1;
            const color = getCategoryColor(bubble.category);
            return (
              <div key={bubble.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-foreground">{bubble.icon} {bubble.name}</span>
                  <span className="text-xs" style={{ color: isOver ? 'hsl(0 72% 60%)' : color }}>
                    {bubble.actualWeeklyHours}h / {bubble.expectedWeeklyHours}h
                  </span>
                </div>
                <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(ratio * 100, 100)}%`,
                      background: isOver ? 'hsl(0 72% 60%)' : color,
                    }}
                  />
                  {/* Expected marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white/30"
                    style={{ left: `${Math.min(100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly trend bar chart */}
      <div className="glass rounded-3xl p-5 mb-5">
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">Daily Activity</p>
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekTrend} barSize={20}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215 12% 50%)', fontSize: 10 }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'hsl(222 14% 11%)', border: '1px solid hsl(222 14% 18%)', borderRadius: 12, fontSize: 11 }}
                itemStyle={{ color: 'hsl(162 77% 58%)' }}
                labelStyle={{ color: 'hsl(210 20% 75%)' }}
              />
              <Bar dataKey="tracked" fill="hsl(162 77% 58%)" radius={[6, 6, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-bubble-accent" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest">AI Coach</p>
        </div>
        <div className="space-y-3">
          {aiInsights.map((insight, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-4 animate-fade-up"
              style={{ animationDelay: `${i * 100}ms`, borderLeft: `2px solid ${insight.color}` }}
            >
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0">{insight.icon}</span>
                <p className="text-sm text-foreground/85 leading-relaxed">{insight.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
