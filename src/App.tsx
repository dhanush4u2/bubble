import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TrackPage from "./pages/Track";
import InsightsPage from "./pages/Insights";
import GoalsPage from "./pages/Goals";
import NotFound from "./pages/NotFound";
import { BottomNav, DesktopSidebar } from "./components/BottomNav";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div className="flex min-h-screen bg-background">
              {/* Desktop sidebar — hidden on mobile */}
              <DesktopSidebar />

              {/* Main content */}
              <div className="flex-1 flex flex-col min-w-0">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/track" element={<TrackPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/goals" element={<GoalsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </div>

            {/* Mobile bottom nav — hidden on desktop */}
            <BottomNav />
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
