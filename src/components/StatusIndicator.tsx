import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Clock } from "lucide-react";

interface StatusIndicatorProps {
  status: "connected" | "disconnected" | "loading";
  lastUpdate?: Date;
  className?: string;
}

export function StatusIndicator({ status, lastUpdate, className }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: Wifi,
          color: "text-energy-success",
          bg: "bg-energy-success/20",
          text: "Connected",
        };
      case "disconnected":
        return {
          icon: WifiOff,
          color: "text-energy-danger",
          bg: "bg-energy-danger/20",
          text: "Disconnected",
        };
      case "loading":
        return {
          icon: Clock,
          color: "text-energy-warning",
          bg: "bg-energy-warning/20",
          text: "Connecting...",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", config.bg)}>
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>{config.text}</span>
      </div>
      
      {lastUpdate && status === "connected" && (
        <span className="text-xs text-muted-foreground">
          Last update: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}