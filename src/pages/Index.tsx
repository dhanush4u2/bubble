import { BubbleMap } from "@/components/BubbleMap";
import bgCanvas from "@/assets/bg-canvas.jpg";

const Index = () => {
  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{
        background: `url(${bgCanvas}) center/cover no-repeat`,
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, hsl(222 16% 8% / 0.7), hsl(222 16% 8% / 0.5), hsl(222 16% 8% / 0.85))' }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'hsl(210 20% 92%)' }}>
              bubble<span className="text-productive">.</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Your life, visualized</p>
          </div>
          <div className="glass rounded-2xl px-4 py-2">
            <p className="text-xs text-muted-foreground">Week {new Date().getWeek?.() ?? Math.ceil(new Date().getDate() / 7)}</p>
            <p className="text-sm font-semibold text-foreground">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Bubble Map */}
      <div className="absolute inset-0 z-0">
        <BubbleMap />
      </div>
    </div>
  );
};

// Polyfill for getWeek
declare global {
  interface Date {
    getWeek?: () => number;
  }
}

export default Index;
