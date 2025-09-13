import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardOverview } from "./components/overview/DashboardOverview";
import EnergyDetailsDashboard from "./components/EnergyDetailsDashboard";
import LightingControlDashboard from "./components/LightingControlDashboard";
import ClimateControlDashboard from "./components/ClimateControlDashboard";
import SecuritySystemDashboard from "./components/SecuritySystemDashboard";
import TeamsIntegration from "./pages/TeamsIntegration";
import BuildingProfile from "./components/BuildingProfile";
import { BulkDataImport } from "./components/BulkDataImport";
import SmartHomeDashboard from "./components/SmartHomeDashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { useGekkoApi } from "./hooks/useGekkoApi";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <DashboardLayout>
              <DashboardOverview />
            </DashboardLayout>
          } />
          
          <Route path="/energy" element={
            <DashboardLayout>
              <EnergyDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/lighting" element={
            <DashboardLayout>
              <LightingDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/climate" element={
            <DashboardLayout>
              <ClimateDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/security" element={
            <DashboardLayout>
              <SecurityDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/building" element={
            <DashboardLayout>
              <BuildingProfile />
            </DashboardLayout>
          } />
          
          <Route path="/analytics" element={
            <DashboardLayout>
              <AnalyticsDashboard />
            </DashboardLayout>
          } />
          
          <Route path="/import" element={
            <DashboardLayout>
              <BulkDataImport />
            </DashboardLayout>
          } />
          
          <Route path="/teams" element={
            <DashboardLayout>
              <TeamsIntegration />
            </DashboardLayout>
          } />
          
          <Route path="/status" element={
            <DashboardLayout title="System Status">
              <SystemStatusPage />
            </DashboardLayout>
          } />
          
          <Route path="/settings" element={
            <DashboardLayout title="Settings">
              <SettingsPage />
            </DashboardLayout>
          } />

          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Wrapper components with data fetching
function EnergyDashboard() {
  const { data, status, isLoading, error } = useGekkoApi({ refreshInterval: 30000 });
  
  // Debug logging
  console.log('EnergyDashboard data:', { data, status, isLoading, error });
  
  if (isLoading) return <div className="p-6 text-center">Loading energy data...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Error: {error}</div>;
  
  return <EnergyDetailsDashboard data={data} />;
}

function LightingDashboard() {
  const { data, status, isLoading, error } = useGekkoApi({ refreshInterval: 30000 });
  
  // Debug logging
  console.log('LightingDashboard data:', { data, status, isLoading, error });
  
  if (isLoading) return <div className="p-6 text-center">Loading lighting data...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Error: {error}</div>;
  
  return <LightingControlDashboard data={data} status={status} />;
}

function ClimateDashboard() {
  const { data, status, isLoading, error } = useGekkoApi({ refreshInterval: 30000 });
  
  // Debug logging
  console.log('ClimateDashboard data:', { data, status, isLoading, error });
  
  if (isLoading) return <div className="p-6 text-center">Loading climate data...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Error: {error}</div>;
  
  return <ClimateControlDashboard data={data} />;
}

function SecurityDashboard() {
  const { data, status } = useGekkoApi({ refreshInterval: 30000 });
  return <SecuritySystemDashboard data={data} />;
}

function AnalyticsDashboard() {
  const { data, status, isLoading, connectionStatus } = useGekkoApi({ refreshInterval: 30000 });
  return <SmartHomeDashboard data={data} status={status} isLoading={isLoading} connectionStatus={connectionStatus} />;
}

// Placeholder components for missing pages
function SystemStatusPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">System Status</h2>
        <p className="text-muted-foreground">System monitoring dashboard coming soon.</p>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Settings</h2>
        <p className="text-muted-foreground">System configuration options coming soon.</p>
      </div>
    </div>
  );
}

export default App;
