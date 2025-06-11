
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthManager } from "@/hooks/useAuthManager";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Archive from "@/pages/Archive";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";

const AuthenticatedApp = () => {
  const { user, isLoading } = useAuthManager();

  // Create a protected route component
  const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
    console.log(`[ProtectedRoute] Checking access - isLoading: ${isLoading}, user: ${user?.email}, requireAdmin: ${requireAdmin}`);
    
    if (isLoading) {
      return <div className="min-h-screen flex items-center justify-center" dir="rtl">טוען...</div>;
    }
    
    if (!user) {
      console.log("[ProtectedRoute] Not authenticated, redirecting to /");
      return <Navigate to="/" replace />;
    }
    
    if (requireAdmin && !user.isAdmin && user.role !== 'מנהל מערכת') {
      console.log("[ProtectedRoute] Not admin, redirecting to /dashboard");
      return <Navigate to="/dashboard" replace />;
    }

    console.log("[ProtectedRoute] Access granted");
    return <>{children}</>;
  };

  return (
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
  );
};

export default AuthenticatedApp;
