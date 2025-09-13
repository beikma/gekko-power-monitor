import { WidgetDashboard } from "@/components/WidgetDashboard";

export default function Dashboard() {
  const handleOpenSettings = () => {
    // Navigate to settings page
    window.location.href = '/settings';
  };

  return <WidgetDashboard onOpenSettings={handleOpenSettings} />;
}