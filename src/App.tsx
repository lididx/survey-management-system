
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/utils/localAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Archive from "./pages/Archive";
import NotFound from "./pages/NotFound";

// Initialize Query Client for React Query
const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    try {
      console.log("[App] Checking authentication status");
      const user = getCurrentUser();
      console.log("[App] User from localStorage:", user);
      setIsAuthenticated(!!user);
    } catch (error) {
      console.error("[App] Error checking authentication status:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center" dir="rtl">טוען...</div>;
    }
    
    console.log("[ProtectedRoute] isAuthenticated:", isAuthenticated);
    if (!isAuthenticated) {
      console.log("[ProtectedRoute] Not authenticated, redirecting to /");
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/archive" 
              element={
                <ProtectedRoute>
                  <Archive />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
