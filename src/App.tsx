import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import Generating from "./pages/Generating";
import Results from "./pages/Results";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { PageErrorBoundary } from "@/components/errors/PageErrorBoundary";

const queryClient = new QueryClient();

const GeneratingRoute = () => (
  <PageErrorBoundary pageName="Generation">
    <Generating />
  </PageErrorBoundary>
);

const ResultsRoute = () => (
  <PageErrorBoundary pageName="Results">
    <Results />
  </PageErrorBoundary>
);

const RouteAwareToasters = () => {
  const { pathname } = useLocation();
  const isWizardRoute = pathname === "/project/new" || /^\/project\/[^/]+\/planner$/.test(pathname);

  if (isWizardRoute) return null;

  return (
    <>
      <Toaster />
      <Sonner visibleToasts={1} duration={2500} />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <RouteAwareToasters />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/project/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
            <Route path="/project/:projectId/generating" element={<ProtectedRoute><GeneratingRoute /></ProtectedRoute>} />
            <Route path="/project/:projectId/results" element={<ProtectedRoute><ResultsRoute /></ProtectedRoute>} />
            <Route path="/project/:projectId/planner" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
