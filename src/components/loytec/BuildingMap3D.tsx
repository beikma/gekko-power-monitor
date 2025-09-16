import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Home, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  temperature?: number;
  co2?: number;
  occupancy?: number;
  status: 'good' | 'warning' | 'critical';
}

interface BuildingMap3DProps {
  data: any;
  mcpClient: any;
}

export function BuildingMap3D({ data, mcpClient }: BuildingMap3DProps) {
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  
  // Mock building zones data - in real implementation this would come from your building data
  const buildingZones: Zone[] = [
    {
      id: 'office-1',
      name: 'Office Area 1',
      x: 20,
      y: 20,
      width: 140,
      height: 80,
      floor: 0,
      temperature: 22.5,
      co2: 420,
      occupancy: 8,
      status: 'good'
    },
    {
      id: 'conference-1',
      name: 'Conference Room A',
      x: 180,
      y: 20,
      width: 100,
      height: 60,
      floor: 0,
      temperature: 24.1,
      co2: 580,
      occupancy: 12,
      status: 'warning'
    },
    {
      id: 'lobby',
      name: 'Main Lobby',
      x: 20,
      y: 120,
      width: 200,
      height: 60,
      floor: 0,
      temperature: 21.8,
      co2: 450,
      occupancy: 5,
      status: 'good'
    },
    {
      id: 'server-room',
      name: 'Server Room',
      x: 240,
      y: 80,
      width: 60,
      height: 40,
      floor: 0,
      temperature: 18.2,
      co2: 380,
      occupancy: 0,
      status: 'good'
    }
  ];

  const floors = [
    { id: 0, name: 'Ground Floor', zones: buildingZones.filter(z => z.floor === 0) },
    { id: 1, name: 'First Floor', zones: [] },
    { id: 2, name: 'Second Floor', zones: [] }
  ];

  const currentFloor = floors.find(f => f.id === selectedFloor) || floors[0];

  const getZoneColor = (status: Zone['status']) => {
    switch (status) {
      case 'good': return 'fill-green-500/20 stroke-green-500';
      case 'warning': return 'fill-amber-500/20 stroke-amber-500';
      case 'critical': return 'fill-red-500/20 stroke-red-500';
      default: return 'fill-gray-500/20 stroke-gray-500';
    }
  };

  const getStatusIcon = (status: Zone['status']) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-amber-500" />;
      case 'critical': return <AlertCircle className="w-3 h-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Floor Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Floor Selection:</span>
          <div className="flex gap-1">
            {floors.map((floor) => (
              <Button
                key={floor.id}
                variant={selectedFloor === floor.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFloor(floor.id)}
                className="h-8"
              >
                {floor.name}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === '2d' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('2d')}
            className="h-8"
          >
            2D View
          </Button>
          <Button
            variant={viewMode === '3d' ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode('3d')}
            className="h-8"
          >
            3D View
          </Button>
        </div>
      </div>

      {/* Building Map */}
      <div className="relative bg-muted/30 rounded-lg border-2 border-dashed border-muted p-4">
        <div className="relative mx-auto" style={{ width: '320px', height: '200px' }}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 320 200"
            className="border border-muted rounded"
          >
            {/* Building outline */}
            <rect
              x="10"
              y="10"
              width="300"
              height="180"
              fill="none"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            
            {/* Zones */}
            {currentFloor.zones.map((zone) => (
              <g key={zone.id}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  className={cn(
                    getZoneColor(zone.status),
                    "cursor-pointer transition-all duration-200 hover:opacity-80",
                    selectedZone?.id === zone.id && "stroke-2"
                  )}
                  strokeWidth="1"
                  onClick={() => setSelectedZone(zone)}
                />
                
                {/* Zone label */}
                <text
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-xs font-medium pointer-events-none"
                >
                  {zone.name}
                </text>
                
                {/* Status indicator */}
                <circle
                  cx={zone.x + zone.width - 10}
                  cy={zone.y + 10}
                  r="4"
                  className={zone.status === 'good' ? 'fill-green-500' : 
                           zone.status === 'warning' ? 'fill-amber-500' : 'fill-red-500'}
                />
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Zone Details */}
      {selectedZone && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="font-medium">{selectedZone.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {getStatusIcon(selectedZone.status)}
              <Badge variant={selectedZone.status === 'good' ? 'default' : 
                             selectedZone.status === 'warning' ? 'secondary' : 'destructive'}>
                {selectedZone.status}
              </Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Temperature</div>
              <div className="font-medium">{selectedZone.temperature}°C</div>
            </div>
            <div>
              <div className="text-muted-foreground">CO₂ Level</div>
              <div className="font-medium">{selectedZone.co2} ppm</div>
            </div>
            <div>
              <div className="text-muted-foreground">Occupancy</div>
              <div className="font-medium">{selectedZone.occupancy} people</div>
            </div>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Good</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span>Warning</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Critical</span>
        </div>
      </div>
    </div>
  );
}