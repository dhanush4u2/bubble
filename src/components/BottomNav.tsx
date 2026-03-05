import { useLocation, useNavigate } from "react-router-dom";
import { Map, Timer, BarChart3, Target, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", icon: Map, label: "Map" },
  { path: "/track", icon: Timer, label: "Track" },
  { path: "/insights", icon: BarChart3, label: "Insights" },
  { path: "/goals", icon: Target, label: "Goals" },
];

// ─── Desktop Sidebar (lg+) ──────────────────────────────────────────────────
export const DesktopSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <aside
      className="hidden lg:flex flex-col w-64 shrink-0 min-h-screen"
      style={{
        background: '#FFFFFF',
        borderRight: '4px solid #000000',
      }}
    >
      {/* Logo */}
      <div className="px-6 py-8 border-b-4 border-black">
        <h1 className="text-3xl font-black tracking-tight text-foreground font-display">
          bubble<span className="text-productive">.</span>
        </h1>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">Life Architecture</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-150",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={isActive ? {
                boxShadow: '3px 3px 0px hsl(var(--productive))',
              } : {}}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User profile */}
      {user && (
        <div className="px-4 py-5 border-t-4 border-black">
          <div className="flex items-center gap-3 mb-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                className="w-9 h-9 rounded-full"
                style={{ border: '2px solid #000000' }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: '#E8F5E9', border: '2px solid #000000' }}
              >
                <User size={16} strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-black text-foreground truncate">{user.displayName ?? "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all"
            style={{
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 10,
              background: '#F5F5F5',
            }}
          >
            <LogOut size={13} strokeWidth={2.5} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
};

// ─── Mobile Bottom Nav (< lg) ────────────────────────────────────────────────
export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
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
              className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all duration-150"
              style={isActive ? { background: '#000000', borderRadius: 12 } : {}}
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
