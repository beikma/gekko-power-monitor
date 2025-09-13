import { WidgetDashboard } from "@/components/WidgetDashboard";

export default function Dashboard() {
  const handleOpenSettings = () => {
    // Navigate to configuration page
    window.location.href = '/configuration';
  };

  return <WidgetDashboard onOpenSettings={handleOpenSettings} />;
}