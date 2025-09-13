import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Lightbulb, Sun, Moon } from "lucide-react";
import { WidgetProps } from "@/types/widget";
import { useState } from "react";

export function LightingControlWidget({ data, status, isLoading, size = 'medium' }: WidgetProps) {
  const [quickToggle, setQuickToggle] = useState(false);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Extract lighting data
  const activeLights = status?.lighting?.active || data?.lights?.active || 3;
  const totalLights = status?.lighting?.total || data?.lights?.total || 12;
  const autoMode = status?.lighting?.autoMode || false;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-energy-warning" />
          Lighting Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Active Lights</span>
          <span className="text-lg font-bold text-energy-warning">
            {activeLights}/{totalLights}
          </span>
        </div>

        {size !== 'small' && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Quick Control</span>
              </div>
              <Switch
                checked={quickToggle}
                onCheckedChange={setQuickToggle}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Sun className="h-3 w-3" />
                All On
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Moon className="h-3 w-3" />
                All Off
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Auto Mode</span>
              <span className={`font-medium ${autoMode ? 'text-energy-success' : 'text-muted-foreground'}`}>
                {autoMode ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}