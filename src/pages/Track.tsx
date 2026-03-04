import { useState, useEffect, useRef } from "react";
import { defaultBubbles, getCategoryColor, getCategoryGlow, BubbleItem } from "@/data/bubbleData";
import { Play, Pause, RotateCcw, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUS_DURATIONS = [15, 25, 45, 60, 90];

export default function TrackPage() {
  const [selectedBubble, setSelectedBubble] = useState<BubbleItem | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<{ bubble: BubbleItem; minutes: number; time: string }[]>([]);
  const [manualMinutes, setManualMinutes] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setTimeLeft(timerMinutes * 60);
    setIsRunning(false);
  }, [timerMinutes]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (selectedBubble) {
              setSessions(prev => [{
                bubble: selectedBubble,
                minutes: timerMinutes,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }, ...prev]);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, selectedBubble, timerMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (timerMinutes * 60);
  const circumference = 2 * Math.PI * 90;

  const allBubbles = [
    ...defaultBubbles,
    ...defaultBubbles.flatMap(b => b.children || [])
  ];

  const handleLogManual = () => {
    if (!selectedBubble) return;
    setSessions(prev => [{
      bubble: selectedBubble,
      minutes: manualMinutes,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }, ...prev]);
  };

  return (
    <div className="min-h-screen pb-24 pt-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Track Time</h1>
        <p className="text-sm text-muted-foreground">Log what you're working on</p>
      </div>

      {/* Bubble Selector */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Select Bubble</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {defaultBubbles.map(bubble => (
            <button
              key={bubble.id}
              onClick={() => setSelectedBubble(bubble)}
              className={cn(
                "flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-200",
                selectedBubble?.id === bubble.id ? "scale-105" : "glass opacity-70 hover:opacity-100"
              )}
              style={selectedBubble?.id === bubble.id ? {
                background: getCategoryColor(bubble.category) + '25',
                border: `1.5px solid ${getCategoryColor(bubble.category)}`,
                boxShadow: getCategoryGlow(bubble.category),
              } : {}}
            >
              <span>{bubble.icon}</span>
              <span className="text-sm font-medium text-foreground">{bubble.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pomodoro Timer */}
      <div className="glass rounded-3xl p-6 mb-5">
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest text-center">Focus Timer</p>

        {/* Duration selector */}
        <div className="flex gap-2 mb-6 justify-center">
          {FOCUS_DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setTimerMinutes(d)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all",
                timerMinutes === d ? "bg-productive text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              {d}m
            </button>
          ))}
        </div>

        {/* Circular timer */}
        <div className="flex items-center justify-center mb-6">
          <div className={cn("relative", isRunning && "animate-timer-pulse")} style={{ width: 210, height: 210 }}>
            <svg className="absolute inset-0 -rotate-90" width="210" height="210">
              <circle cx="105" cy="105" r="90" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
              <circle
                cx="105" cy="105" r="90"
                fill="none"
                stroke={selectedBubble ? getCategoryColor(selectedBubble.category) : 'hsl(162 77% 58%)'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground tracking-tighter">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              {selectedBubble ? (
                <span className="text-xs text-muted-foreground mt-1">{selectedBubble.icon} {selectedBubble.name}</span>
              ) : (
                <span className="text-xs text-muted-foreground mt-1">Select a bubble</span>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { setTimeLeft(timerMinutes * 60); setIsRunning(false); }}
            className="glass rounded-full p-3 text-muted-foreground hover:text-foreground transition-all"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => selectedBubble && setIsRunning(r => !r)}
            disabled={!selectedBubble}
            className="rounded-full p-4 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
            style={{
              background: selectedBubble ? getCategoryColor(selectedBubble.category) : 'hsl(222 14% 18%)',
              color: 'hsl(222 16% 8%)',
              boxShadow: selectedBubble && isRunning ? getCategoryGlow(selectedBubble.category) : undefined,
            }}
          >
            {isRunning ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <div className="glass rounded-full p-3 text-muted-foreground">
            <Clock size={18} />
          </div>
        </div>
      </div>

      {/* Manual Log */}
      <div className="glass rounded-3xl p-5 mb-5">
        <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">Quick Log</p>
        <div className="flex gap-2 mb-3">
          {[15, 30, 45, 60, 90, 120].map(m => (
            <button
              key={m}
              onClick={() => setManualMinutes(m)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-medium transition-all",
                manualMinutes === m ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              {m < 60 ? `${m}m` : `${m / 60}h`}
            </button>
          ))}
        </div>
        <button
          onClick={handleLogManual}
          disabled={!selectedBubble}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
          style={{
            background: selectedBubble ? getCategoryColor(selectedBubble.category) : 'hsl(222 14% 18%)',
            color: 'hsl(222 16% 8%)',
          }}
        >
          {selectedBubble ? `Log ${manualMinutes}m to ${selectedBubble.name}` : 'Select a bubble first'}
        </button>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Today's Sessions</p>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s, i) => (
              <div key={i} className="glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <CheckCircle size={16} className="text-productive flex-shrink-0" />
                <span className="text-lg">{s.bubble.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.bubble.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-productive">{s.minutes}m</p>
                  <p className="text-[10px] text-muted-foreground">{s.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
