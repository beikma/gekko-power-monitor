import { Thermometer, Wind, Droplets, Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ClimateControlDashboardProps {
  data: any;
}

export default function ClimateControlDashboard({ data }: ClimateControlDashboardProps) {
  // Debug logging
  console.log('ClimateControlDashboard received data:', data);
  console.log('ClimateControlDashboard weather:', data?.globals?.meteo);
  console.log('ClimateControlDashboard roomtemps:', data?.roomtemps);
  
  // Extract weather data
  const weather = data?.globals?.meteo || {};
  const temperature = parseFloat(weather.temperature?.value) || 0;
  const humidity = parseFloat(weather.humidity?.value) || 0;
  const windSpeed = parseFloat(weather.wind?.value) || 0;

  // Extract room temperatures
  const roomTemps = data?.roomtemps || {};
  const rooms = Object.entries(roomTemps)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, room]: [string, any]) => {
      const values = room.sumstate?.value?.split(';') || [];
      return {
        id: key,
        current: parseFloat(values[0]) || 0,
        target: parseFloat(values[1]) || 0,
        valve: parseFloat(values[2]) || 0,
        status: parseInt(values[3]) || 0,
        heating: values[2] === '100.00'
      };
    })
    .filter(room => room.current > 0);

  // Extract heating circuits
  const heatingCircuits = data?.heatingcircuits || {};
  const circuits = Object.entries(heatingCircuits)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, circuit]: [string, any]) => {
      const values = circuit.sumstate?.value?.split(';') || [];
      return {
        id: key,
        flow: parseFloat(values[1]) || 0,
        return: parseFloat(values[2]) || 0,
        pump: parseFloat(values[4]) || 0,
        active: parseInt(values[0]) === 1
      };
    });

  // Extract ventilation data
  const vents = data?.vents || {};
  const ventilation = Object.entries(vents)
    .filter(([key]) => key.startsWith('item'))
    .map(([key, vent]: [string, any]) => {
      const values = vent.sumstate?.value?.split(';') || [];
      return {
        id: key,
        speed: parseInt(values[1]) || 0,
        mode: parseInt(values[4]) || 0,
        supply: parseFloat(values[8]) || 0,
        extract: parseFloat(values[9]) || 0,
        outside: parseFloat(values[10]) || 0,
        active: parseInt(values[0]) === 1
      };
    })
    .filter(vent => vent.supply > 0 || vent.extract > 0);

  const avgRoomTemp = rooms.length > 0 ? 
    rooms.reduce((sum, room) => sum + room.current, 0) / rooms.length : 0;

  const heatingRooms = rooms.filter(room => room.heating).length;
  const totalRooms = rooms.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Weather Overview */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-energy-primary" />
            Outdoor Weather
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-energy-text">{temperature.toFixed(1)}°C</div>
              <div className="text-xs text-muted-foreground">Temperature</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-energy-primary">{humidity.toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Humidity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{windSpeed.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">km/h Wind</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={temperature < 0 ? "destructive" : temperature < 10 ? "secondary" : "default"}>
              {temperature < 0 ? "Freezing" : temperature < 10 ? "Cold" : temperature < 20 ? "Cool" : "Mild"}
            </Badge>
            <Badge variant={humidity > 80 ? "secondary" : "outline"}>
              {humidity > 80 ? "High Humidity" : "Normal"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Room Temperature Overview */}
      <Card className="energy-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-energy-primary" />
            Room Climate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-energy-text">{avgRoomTemp.toFixed(1)}°C</div>
            <div className="text-sm text-muted-foreground">Average Indoor Temp</div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Heating Active:</span>
            <Badge variant={heatingRooms > 0 ? "default" : "secondary"}>
              {heatingRooms}/{totalRooms} Rooms
            </Badge>
          </div>
          <Progress value={(heatingRooms / totalRooms) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Ventilation Status */}
      {ventilation.length > 0 && (
        <Card className="energy-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-energy-primary" />
              Ventilation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ventilation.slice(0, 3).map((vent, index) => (
                <div key={vent.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Zone {index + 1}</span>
                    <div className="text-xs text-muted-foreground">
                      Supply: {vent.supply.toFixed(1)}°C | Extract: {vent.extract.toFixed(1)}°C
                    </div>
                  </div>
                  <Badge variant={vent.active ? "default" : "secondary"}>
                    {vent.active ? `Speed ${vent.speed}` : "Off"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Room List */}
      <Card className="energy-card lg:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-energy-primary" />
            Individual Room Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rooms.map((room, index) => {
              const tempDiff = room.current - room.target;
              const getTrendIcon = () => {
                if (tempDiff > 1) return <TrendingUp className="h-4 w-4 text-orange-500" />;
                if (tempDiff < -1) return <TrendingDown className="h-4 w-4 text-blue-500" />;
                return <Minus className="h-4 w-4 text-green-500" />;
              };

              return (
                <div key={room.id} className="p-3 border border-energy-border rounded-lg bg-energy-surface/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">Room {index + 1}</span>
                    {getTrendIcon()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Current:</span>
                      <span className="text-sm font-medium">{room.current.toFixed(1)}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Target:</span>
                      <span className="text-sm">{room.target.toFixed(1)}°C</span>
                    </div>
                    <Progress value={room.valve} className="h-1 mt-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Valve:</span>
                      <Badge variant={room.heating ? "default" : "secondary"} className="text-xs">
                        {room.valve.toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Heating Circuits */}
      {circuits.length > 0 && (
        <Card className="energy-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-energy-primary" />
              Heating Circuits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {circuits.map((circuit, index) => (
                <div key={circuit.id} className="p-3 border border-energy-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Circuit {index + 1}</span>
                    <Badge variant={circuit.active ? "default" : "secondary"}>
                      {circuit.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Flow:</span>
                      <div className="font-medium">{circuit.flow.toFixed(1)}°C</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Return:</span>
                      <div className="font-medium">{circuit.return.toFixed(1)}°C</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pump:</span>
                      <div className="font-medium">{circuit.pump.toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}