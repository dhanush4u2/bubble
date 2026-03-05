import { useLocation, useNavigate } from "react-router-dom";
import { Map, Timer, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Map, label: "Map" },
  { path: "/track", icon: Timer, label: "Track" },
  { path: "/insights", icon: BarChart3, label: "Insights" },
  { path: "/goals", icon: Target, label: "Goals" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div
        className="flex items-center justify-around px-2 py-3"
        style={{
          background: '#FFFFFF',
          borderTop: '4px solid #000000',
        }}
      >
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all duration-150",
              )}
              style={isActive ? {
                background: '#000000',
                borderRadius: 12,
              } : {}}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#FFFFFF' : '#777777'}
              />
              <span
                className="text-[10px] font-bold tracking-wide"
                style={{ color: isActive ? '#FFFFFF' : '#777777' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
