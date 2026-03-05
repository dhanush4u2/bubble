import { useAuth } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/Login";
import { ReactNode } from "react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 animate-bubble-pulse"
            style={{ background: '#E8F5E9', border: '4px solid #000000', boxShadow: '4px 4px 0px #000000' }}
          />
          <p className="font-black text-foreground text-lg font-display">bubble<span className="text-productive">.</span></p>
          <p className="text-sm text-muted-foreground mt-1">Loading your life map...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <>{children}</>;
};
