import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmergencyContacts from "./pages/EmergencyContacts";
import SalesPage from "./pages/SalesPage";
import AdminPage from "./pages/AdminPage";
import PrintPage from "./pages/PrintPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Carregando...</span></div>;
  if (!isAuthenticated) return <Navigate to="/lp" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><span className="text-muted-foreground">Carregando...</span></div>;

  return (
    <Routes>
      {/* Dashboard de extintores - página inicial */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* Contatos de emergência */}
      <Route path="/contatos-emergencia" element={<ProtectedRoute><EmergencyContacts /></ProtectedRoute>} />
      
      {/* Login */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      
      {/* Landing page */}
      <Route path="/lp" element={isAuthenticated ? <Navigate to="/" replace /> : <SalesPage />} />
      
      {/* Outras rotas */}
      <Route path="/print" element={<ProtectedRoute><PrintPage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/extintores" element={<Navigate to="/" replace />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
