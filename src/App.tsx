
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/utils/supabaseAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Archive from "./pages/Archive";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

// Initialize Query Client for React Query
const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      try {
        console.log("[App] Checking authentication status");
        const user = getCurrentUser();
        console.log("[App] User from localStorage:", user);
        
        const authenticated = !!user;
        const admin = user?.isAdmin || false;
        
        console.log("[App] Authentication check results:", { authenticated, admin });
        
        setIsAuthenticated(authenticated);
        setIsAdmin(admin);
      } catch (error) {
        console.error("[App] Error checking authentication status:", error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Set up event listener for auth changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'current_user') {
        console.log('[App] Auth state changed via storage, updating');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Create a protected route component
  const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
    console.log(`[ProtectedRoute] Checking access - isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}, isAdmin: ${isAdmin}, requireAdmin: ${requireAdmin}`);
    
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center" dir="rtl">טוען...</div>;
    }
    
    if (!isAuthenticated) {
      console.log("[ProtectedRoute] Not authenticated, redirecting to /");
      return <Navigate to="/" replace />;
    }
    
    if (requireAdmin && !isAdmin) {
      console.log("[ProtectedRoute] Not admin, redirecting to /dashboard");
      return <Navigate to="/dashboard" replace />;
    }

    console.log("[ProtectedRoute] Access granted");
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
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
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
