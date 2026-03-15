import { useState, useEffect } from "react";
import { X, Target, Clock, ChevronRight, Calendar, Trash2 } from "lucide-react";
import { BubbleItem, getCategoryColor, getCategoryLightBg } from "@/data/bubbleData";
import { Plan, TimeSlot } from "@/hooks/usePlans";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Add fractional hours to an HH:mm time string, clamped at 23:59 */
function addHours(time: string, hours: number): string {
  const [h, m] = (time ?? "06:00").split(":").map(Number);
  const totalMinutes = h * 60 + m + Math.round(Math.max(hours, 0.5) * 60);
  const newH = Math.min(Math.floor(totalMinutes / 60), 23);
  const newM = Math.min(totalMinutes % 60, 59);
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

interface Props {
  bubble: BubbleItem;
  existingPlan?: Plan;
  onClose: () => void;
  onSave: (data: Omit<Plan, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onDelete?: (planId: string) => void;
}

export default function TimePlannerModal({ bubble, existingPlan, onClose, onSave, onDelete }: Props) {
  const color = getCategoryColor(bubble.category);
  const lightBg = getCategoryLightBg(bubble.category);

  const [weeklyTarget, setWeeklyTarget] = useState(
    existingPlan?.weeklyTarget ?? bubble.expectedWeeklyHours,
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    existingPlan?.selectedDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri"],
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(existingPlan?.timeSlots ?? []);

  const dailyAllocation = selectedDays.length > 0 ? weeklyTarget / selectedDays.length : 0;
  const dailyEquivalent = weeklyTarget / 7;

  // Sync time slots when selected days change (add/remove, preserve existing)
  useEffect(() => {
    setTimeSlots(prev => {
      const filtered = prev.filter(s => selectedDays.includes(s.day));
      const existingDays = filtered.map(s => s.day);
      const newSlots: TimeSlot[] = selectedDays
        .filter(d => !existingDays.includes(d))
        .map(day => ({
          day,
          startTime: "06:00",
          endTime: addHours("06:00", dailyAllocation > 0 ? dailyAllocation : 1),
        }));
      return [...filtered, ...newSlots];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays]);

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const updateSlot = (day: string, field: "startTime" | "endTime", value: string) => {
    setTimeSlots(prev =>
      prev.map(s => (s.day === day ? { ...s, [field]: value } : s)),
    );
  };

  const handleSave = () => {
    onSave({
      bubbleId: bubble.id,
      weeklyTarget,
      selectedDays,
      dailyAllocation,
      timeSlots,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white overflow-hidden flex flex-col"
        style={{ border: "4px solid #000", borderBottom: "none", maxHeight: "92vh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ background: lightBg, borderBottom: "3px solid #000" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: color, border: "3px solid #000" }}
            >
              <Calendar size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Time Planner
              </p>
              <p className="text-lg font-black text-foreground">{bubble.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {existingPlan?.id && onDelete && (
              <button
                onClick={() => { onDelete(existingPlan.id!); onClose(); }}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: "#FFEBEE", border: "2px solid #FF5252" }}
                title="Delete plan"
              >
                <Trash2 size={14} color="#FF5252" strokeWidth={2.5} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{ background: "#fff", border: "2px solid #000" }}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4 flex-1">

          {/* Weekly Target */}
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Weekly Target
            </p>
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: lightBg, border: "3px solid #000" }}
            >
              <input
                type="number"
                value={weeklyTarget}
                onChange={e => setWeeklyTarget(Math.max(0, Number(e.target.value)))}
                className="w-24 text-4xl font-black bg-transparent text-foreground focus:outline-none text-center"
                min={0} max={168} step={0.5}
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">hours / week</p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                  ≈ {dailyEquivalent.toFixed(1)}h per day (÷ 7)
                </p>
              </div>
            </div>
          </div>

          {/* Day Selector */}
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Active Days
            </p>
            <div className="flex gap-1.5">
              {DAYS.map(day => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className="flex-1 py-2.5 rounded-lg text-[11px] font-black transition-all active:scale-95"
                    style={{
                      background: active ? color : "#F5F5F5",
                      color: active ? "#fff" : "#999",
                      border: `2px solid ${active ? "#000" : "#DDD"}`,
                      boxShadow: active ? "2px 2px 0px #000" : "none",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Allocation Banner */}
          {selectedDays.length > 0 && (
            <div
              className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#E8F5E9", border: "3px solid #000", boxShadow: "4px 4px 0px #000" }}
            >
              <ChevronRight size={16} color="#4CAF50" strokeWidth={2.5} />
              <div>
                <p className="text-sm font-black text-foreground">
                  {dailyAllocation.toFixed(1)}h per day &nbsp;·&nbsp; {selectedDays.length} day{selectedDays.length !== 1 ? "s" : ""}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium">
                  {weeklyTarget}h ÷ {selectedDays.length} days = {dailyAllocation.toFixed(2)}h / day
                </p>
              </div>
            </div>
          )}

          {/* Time Slots */}
          {DAYS.filter(d => selectedDays.includes(d)).length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                Daily Time Slots
              </p>
              <div className="space-y-2">
                {DAYS.filter(d => selectedDays.includes(d)).map(day => {
                  const slot = timeSlots.find(s => s.day === day);
                  if (!slot) return null;
                  return (
                    <div
                      key={day}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: "#fff", border: "3px solid #000", boxShadow: "3px 3px 0px #000" }}
                    >
                      <span
                        className="w-9 text-xs font-black text-center rounded-md py-1"
                        style={{ background: lightBg, color: color }}
                      >
                        {day}
                      </span>
                      <Clock size={13} color={color} strokeWidth={2.5} className="flex-shrink-0" />
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={e => updateSlot(day, "startTime", e.target.value)}
                        className="text-sm font-bold bg-transparent text-foreground focus:outline-none flex-1"
                      />
                      <span className="text-xs text-muted-foreground font-bold">→</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={e => updateSlot(day, "endTime", e.target.value)}
                        className="text-sm font-bold bg-transparent text-foreground focus:outline-none flex-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={selectedDays.length === 0}
            className="w-full py-4 text-sm font-black text-white rounded-xl mb-5 transition-all active:translate-y-0.5 disabled:opacity-40"
            style={{
              background: color,
              border: "3px solid #000",
              boxShadow: "4px 4px 0px #000",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Target size={16} strokeWidth={2.5} />
              {existingPlan ? "Update Schedule" : "Save Schedule"}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
