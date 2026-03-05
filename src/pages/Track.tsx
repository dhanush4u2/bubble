import { useState, useEffect, useRef } from "react";
import { defaultBubbles, getCategoryColor, getCategoryLightBg, BubbleItem } from "@/data/bubbleData";
import { Play, Pause, RotateCcw, CheckCircle, Briefcase, BookOpen, Activity, Heart, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUS_DURATIONS = [15, 25, 45, 60, 90];

const BUBBLE_ICONS: Record<string, React.ElementType> = {
  work: Briefcase,
  upskilling: BookOpen,
  health: Activity,
  relationships: Heart,
  leisure: Gamepad2,
};

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
  const circumference = 2 * Math.PI * 85;

  const activeColor = selectedBubble ? getCategoryColor(selectedBubble.category) : '#4CAF50';

  const handleLogManual = () => {
    if (!selectedBubble) return;
    setSessions(prev => [{
      bubble: selectedBubble,
      minutes: manualMinutes,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }, ...prev]);
  };

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 bg-background">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-foreground font-display">Track Time</h1>
        <p className="text-sm text-muted-foreground font-medium">Log what you're working on</p>
      </div>

      {/* Bubble Selector */}
      <div className="mb-5">
        <p className="text-[10px] font-black text-foreground mb-3 uppercase tracking-widest">Select Bubble</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {defaultBubbles.map(bubble => {
            const isSelected = selectedBubble?.id === bubble.id;
            const color = getCategoryColor(bubble.category);
            const lightBg = getCategoryLightBg(bubble.category);
            const Icon = BUBBLE_ICONS[bubble.id] || Briefcase;
            return (
              <button
                key={bubble.id}
                onClick={() => setSelectedBubble(bubble)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 transition-all duration-150"
                style={{
                  background: isSelected ? color : lightBg,
                  border: `3px solid ${isSelected ? '#000000' : '#000000'}`,
                  boxShadow: isSelected ? '3px 3px 0px #000000' : '2px 2px 0px #000000',
                  borderRadius: 12,
                  transform: isSelected ? 'translate(-1px, -1px)' : 'none',
                }}
              >
                <Icon size={16} color={isSelected ? '#FFFFFF' : color} strokeWidth={2.5} />
                <span
                  className="text-sm font-bold"
                  style={{ color: isSelected ? '#FFFFFF' : '#000000' }}
                >
                  {bubble.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pomodoro Timer */}
      <div
        className="mb-5"
        style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          boxShadow: '6px 6px 0px #000000',
          borderRadius: 20,
          padding: 20,
        }}
      >
        <p className="text-[10px] font-black mb-4 uppercase tracking-widest text-center text-foreground">Focus Timer</p>

        {/* Duration selector */}
        <div className="flex gap-2 mb-6 justify-center">
          {FOCUS_DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setTimerMinutes(d)}
              className="px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                background: timerMinutes === d ? '#000000' : '#F5F5F5',
                color: timerMinutes === d ? '#FFFFFF' : '#000000',
                border: '2px solid #000000',
                boxShadow: timerMinutes === d ? '2px 2px 0px #4CAF50' : '2px 2px 0px #000000',
                borderRadius: 8,
              }}
            >
              {d}m
            </button>
          ))}
        </div>

        {/* Circular timer */}
        <div className="flex items-center justify-center mb-6">
          <div
            className={cn("relative", isRunning && "animate-timer-pulse")}
            style={{ width: 210, height: 210 }}
          >
            <svg className="absolute inset-0 -rotate-90" width="210" height="210">
              <circle cx="105" cy="105" r="85" fill="none" stroke="#F5F5F5" strokeWidth="8" />
              <circle
                cx="105" cy="105" r="85"
                fill="none"
                stroke={activeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                className="transition-all duration-1000"
              />
            </svg>
            <div
              className="absolute inset-0 rounded-full flex flex-col items-center justify-center m-4"
              style={{ border: '4px solid #000000' }}
            >
              <span className="text-4xl font-black text-foreground tracking-tighter">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs font-medium text-muted-foreground mt-1">
                {selectedBubble ? selectedBubble.name : 'Select a bubble'}
              </span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { setTimeLeft(timerMinutes * 60); setIsRunning(false); }}
            className="flex items-center justify-center transition-all active:translate-y-0.5"
            style={{
              background: '#F5F5F5',
              border: '3px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              borderRadius: '50%',
              width: 48,
              height: 48,
            }}
          >
            <RotateCcw size={18} strokeWidth={2.5} color="#000000" />
          </button>
          <button
            onClick={() => selectedBubble && setIsRunning(r => !r)}
            disabled={!selectedBubble}
            className="flex items-center justify-center transition-all active:translate-y-0.5 disabled:opacity-40"
            style={{
              background: activeColor,
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              borderRadius: '50%',
              width: 64,
              height: 64,
            }}
          >
            {isRunning
              ? <Pause size={26} strokeWidth={2.5} color="#FFFFFF" />
              : <Play size={26} strokeWidth={2.5} color="#FFFFFF" />}
          </button>
          <div
            className="flex items-center justify-center"
            style={{
              background: '#F5F5F5',
              border: '3px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              borderRadius: '50%',
              width: 48,
              height: 48,
            }}
          >
            <span className="text-xs font-bold text-muted-foreground">{timerMinutes}m</span>
          </div>
        </div>
      </div>

      {/* Manual Log */}
      <div
        className="mb-5"
        style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          boxShadow: '6px 6px 0px #000000',
          borderRadius: 20,
          padding: 20,
        }}
      >
        <p className="text-[10px] font-black mb-4 uppercase tracking-widest text-foreground">Quick Log</p>
        <div className="flex gap-2 mb-4 flex-wrap">
          {[15, 30, 45, 60, 90, 120].map(m => (
            <button
              key={m}
              onClick={() => setManualMinutes(m)}
              className="px-3 py-2 text-xs font-bold transition-all"
              style={{
                background: manualMinutes === m ? '#000000' : '#F5F5F5',
                color: manualMinutes === m ? '#FFFFFF' : '#000000',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 8,
              }}
            >
              {m < 60 ? `${m}m` : `${m / 60}h`}
            </button>
          ))}
        </div>
        <button
          onClick={handleLogManual}
          disabled={!selectedBubble}
          className="w-full py-3.5 font-black text-sm transition-all active:translate-y-0.5 disabled:opacity-40"
          style={{
            background: selectedBubble ? activeColor : '#F5F5F5',
            color: selectedBubble ? '#FFFFFF' : '#000000',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 12,
          }}
        >
          {selectedBubble ? `Log ${manualMinutes}m to ${selectedBubble.name}` : 'Select a bubble first'}
        </button>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-foreground mb-3 uppercase tracking-widest">Today's Sessions</p>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s, i) => {
              const color = getCategoryColor(s.bubble.category);
              const lightBg = getCategoryLightBg(s.bubble.category);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 animate-fade-up"
                  style={{
                    background: '#FFFFFF',
                    border: '3px solid #000000',
                    boxShadow: '3px 3px 0px #000000',
                    borderRadius: 12,
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: lightBg, border: '2px solid #000000' }}
                  >
                    <CheckCircle size={14} color={color} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{s.bubble.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color }}>{s.minutes}m</p>
                    <p className="text-[10px] text-muted-foreground">{s.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
