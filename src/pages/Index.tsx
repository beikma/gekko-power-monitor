import { PowerCard } from "@/components/PowerCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { useGekkoApi } from "@/hooks/useGekkoApi";
import { Button } from "@/components/ui/button";
import { RefreshCw, Zap, Home, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { data, status, isLoading, error, lastUpdate, refetch, connectionStatus } = useGekkoApi();
  const { toast } = useToast();

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing data...",
      description: "Fetching latest power consumption data",
    });
  };

  // Extract power consumption values from the API data
  const getPowerValues = () => {
    if (!data) return null;
    
    // These are example keys - you'll need to adjust based on actual API response structure
    return {
      totalPower: data.power_total || data.totalPower || 0,
      currentConsumption: data.power_current || data.currentPower || 0,
      dailyConsumption: data.power_daily || data.dailyPower || 0,
      voltage: data.voltage || 230,
      frequency: data.frequency || 50,
    };
  };

  const powerValues = getPowerValues();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Home className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  myGEKKO Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Real-time Energy Monitor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <StatusIndicator 
                status={connectionStatus} 
                lastUpdate={lastUpdate} 
              />
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isLoading}
                className="border-primary/20 hover:bg-primary/5"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">Connection Error</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{error}</p>
          </div>
        )}

        {/* Power Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <PowerCard
            title="Total Power"
            value={powerValues?.totalPower || 0}
            unit="kW"
            trend="up"
            trendValue="+2.3%"
            isLoading={isLoading}
          />
          
          <PowerCard
            title="Current Consumption"
            value={powerValues?.currentConsumption || 0}
            unit="kW"
            trend="down"
            trendValue="-1.2%"
            isLoading={isLoading}
          />
          
          <PowerCard
            title="Daily Usage"
            value={powerValues?.dailyConsumption || 0}
            unit="kWh"
            trend="stable"
            trendValue="0.1%"
            isLoading={isLoading}
          />
          
          <PowerCard
            title="Voltage"
            value={powerValues?.voltage || 0}
            unit="V"
            isLoading={isLoading}
          />
        </div>

        {/* Data Preview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-card border border-border rounded-lg p-6 shadow-card-custom">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Live Data
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" />
                ))}
              </div>
            ) : data ? (
              <pre className="text-xs text-muted-foreground overflow-x-auto bg-background/50 p-3 rounded border">
                {JSON.stringify(data, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No data available</p>
            )}
          </div>
          
          <div className="bg-gradient-card border border-border rounded-lg p-6 shadow-card-custom">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Status Information
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-muted/20 rounded animate-pulse" />
                ))}
              </div>
            ) : status ? (
              <pre className="text-xs text-muted-foreground overflow-x-auto bg-background/50 p-3 rounded border">
                {JSON.stringify(status, null, 2)}
              </pre>
            ) : (
              <p className="text-muted-foreground">No status data available</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
