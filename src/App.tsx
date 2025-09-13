import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider as MyToastProvider } from "@/components/ui/toast-provider";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import EnergyDetailsDashboard from "./components/EnergyDetailsDashboard";
import Configuration from "./pages/Configuration";
import BuildingProfile from "./components/BuildingProfile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import GarageSocket from "./pages/GarageSocket";
import { useGekkoApi } from "./hooks/useGekkoApi";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MyToastProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            } />
            
            <Route path="/energy" element={
              <DashboardLayout>
                <EnergyDashboard />
              </DashboardLayout>
            } />
            
            <Route path="/control" element={
              <DashboardLayout>
                <GarageSocket />
              </DashboardLayout>
            } />
            
            <Route path="/configuration" element={
              <DashboardLayout>
                <Configuration />
              </DashboardLayout>
            } />
            
            <Route path="/building" element={
              <DashboardLayout>
                <BuildingProfile />
              </DashboardLayout>
            } />

            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </MyToastProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Wrapper components with data fetching - defined as proper React components
const EnergyDashboard: React.FC = () => {
  const { data, status, isLoading, error } = useGekkoApi({ refreshInterval: 30000 });
  
  if (isLoading) return <div className="p-6 text-center">Loading energy data...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Error: {error}</div>;
  
  return <EnergyDetailsDashboard data={status} />;
};

export default App;
