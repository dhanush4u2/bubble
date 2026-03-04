import { useLocation, useNavigate } from "react-router-dom";
import { Home, Timer, BarChart3, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: Home, label: "Map" },
  { path: "/track", icon: Timer, label: "Track" },
  { path: "/insights", icon: BarChart3, label: "Insights" },
  { path: "/goals", icon: Target, label: "Goals" },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="mx-4 mb-4 glass rounded-2xl px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "flex flex-col items-center gap-1 px-5 py-2 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "transition-all duration-200",
                    isActive && "drop-shadow-[0_0_8px_hsl(162_77%_58%)]"
                  )}
                />
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
