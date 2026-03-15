import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Session } from "@/hooks/useSessions";
import { BubbleItem, getCategoryColor, getCategoryLightBg } from "@/data/bubbleData";

interface Props {
  bubbles: BubbleItem[];
  sessions: Session[];   // today's sessions, for nesting selection
  date: string;          // "YYYY-MM-DD"
  onSave: (data: Omit<Session, "id" | "userId" | "createdAt">) => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, "0");

const computeDuration = (start: string, end: string): number => {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? diff : diff + 1440; // handle overnight
};

const formatDuration = (mins: number): string => {
  if (mins <= 0) return "–";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const AddSessionModal = ({ bubbles, sessions, date, onSave, onClose }: Props) => {
  const now = new Date();
  const defaultStart = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const endHour = (now.getHours() + 1) % 24;
  const defaultEnd = `${pad(endHour)}:${pad(now.getMinutes())}`;

  const [selectedBubble, setSelectedBubble] = useState<BubbleItem | null>(null);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [parentId, setParentId] = useState("");
  const [notes, setNotes] = useState("");

  const duration = computeDuration(startTime, endTime);
  const isValid = !!selectedBubble && duration > 0 && duration < 1440;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); }
  };

  const handleSave = () => {
    if (!isValid || !selectedBubble) return;

    // Merge bubble's default tags + any user-added tags
    const allTags = Array.from(new Set([...(selectedBubble.tags ?? []), ...tags]));

    onSave({
      bubbleId: selectedBubble.id,
      bubbleName: selectedBubble.name,
      category: selectedBubble.category,
      tags: allTags,
      startTime,
      endTime,
      duration,
      date,
      ...(parentId ? { parentSessionId: parentId } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
    onClose();
  };

  const topLevelSessions = sessions.filter(s => !s.parentSessionId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-6 lg:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-y-auto animate-fade-up"
        style={{
          maxHeight: "88vh",
          background: '#FFFFFF',
          border: '4px solid #000000',
          boxShadow: '8px 8px 0px #000000',
          borderRadius: 20,
          padding: 24,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-black text-lg text-foreground">New Session</h2>
            <p className="text-[10px] text-muted-foreground">{date}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Bubble selector */}
        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2 block">
            Bubble
          </label>
          <div className="flex gap-2 flex-wrap">
            {bubbles.map(b => {
              const isSelected = selectedBubble?.id === b.id;
              const color = getCategoryColor(b.category);
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBubble(b)}
                  className="px-3 py-2 text-xs font-bold transition-all active:scale-95"
                  style={{
                    background: isSelected ? color : getCategoryLightBg(b.category),
                    color: isSelected ? '#FFFFFF' : '#000000',
                    border: `2px solid ${isSelected ? color : '#000000'}`,
                    boxShadow: '2px 2px 0px #000000',
                    borderRadius: 8,
                  }}
                >
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time range */}
        <div className="flex gap-3 mb-2">
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1.5 block">
              Start
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-bold"
              style={{ border: '3px solid #000000', borderRadius: 10, background: '#FFFFFF', boxShadow: '2px 2px 0px #000000', outline: 'none' }}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1.5 block">
              End
            </label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-bold"
              style={{ border: '3px solid #000000', borderRadius: 10, background: '#FFFFFF', boxShadow: '2px 2px 0px #000000', outline: 'none' }}
            />
          </div>
        </div>
        <p className="text-xs font-bold text-muted-foreground mb-5">
          Duration: <span className="text-foreground">{formatDuration(duration)}</span>
        </p>

        {/* Tags */}
        <div className="mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2 block">
            Tags <span className="font-medium normal-case">(optional — bubble tags auto-added)</span>
          </label>
          {tags.length > 0 && (
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full"
                  style={{ background: '#000000', color: '#FFFFFF' }}
                >
                  #{tag}
                  <button
                    onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                    className="opacity-60 hover:opacity-100 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="type tag + Enter"
              className="flex-1 px-3 py-2 text-xs font-medium"
              style={{ border: '2px solid #000000', borderRadius: 8, background: '#FFFFFF', outline: 'none' }}
            />
            <button
              onClick={addTag}
              style={{ background: '#F5F5F5', border: '2px solid #000000', borderRadius: 8, padding: '6px 10px', boxShadow: '2px 2px 0px #000000' }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Nested under */}
        {topLevelSessions.length > 0 && (
          <div className="mb-5">
            <label className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1.5 block">
              Nested Inside (Optional)
            </label>
            <select
              value={parentId}
              onChange={e => setParentId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm font-medium"
              style={{ border: '2px solid #000000', borderRadius: 8, background: '#FFFFFF', outline: 'none' }}
            >
              <option value="">None — top-level session</option>
              {topLevelSessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.bubbleName} ({s.startTime}–{s.endTime})
                </option>
              ))}
            </select>
            {parentId && (
              <p className="text-[10px] text-muted-foreground mt-1">
                This session will appear on the inner ring of the daily circle.
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="mb-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-foreground mb-1.5 block">
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="what did you work on?"
            className="w-full px-3 py-2.5 text-sm font-medium"
            style={{ border: '2px solid #000000', borderRadius: 8, background: '#FFFFFF', outline: 'none' }}
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="w-full py-3.5 font-black text-sm transition-all active:translate-y-0.5 disabled:opacity-40"
          style={{
            background: selectedBubble ? getCategoryColor(selectedBubble.category) : '#F5F5F5',
            color: selectedBubble ? '#FFFFFF' : '#888888',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 12,
          }}
        >
          {selectedBubble
            ? `Log ${formatDuration(duration)} to ${selectedBubble.name}`
            : "Select a bubble first"}
        </button>
      </div>
    </div>
  );
};
