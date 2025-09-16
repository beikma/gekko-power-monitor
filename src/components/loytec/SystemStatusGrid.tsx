import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Thermometer, 
  Lightbulb, 
  Shield, 
  Blinds, 
  Users, 
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface SystemStatusGridProps {
  data: any;
  status: any;
  mcpClient: any;
}

interface SystemStatus {
  id: string;
  name: string;
  type: 'hvac' | 'lighting' | 'shading' | 'security' | 'occupancy' | 'energy';
  status: 'online' | 'offline' | 'warning' | 'maintenance';
  value?: string;
  lastUpdate?: string;
  icon: React.ReactNode;
  details: {
    connected: number;
    total: number;
    activeAlarms?: number;
  };
}

export function SystemStatusGrid({ data, status, mcpClient }: SystemStatusGridProps) {
  // Mock system status data - in real implementation this would come from your building systems
  const systemStatuses: SystemStatus[] = [
    {
      id: 'hvac',
      name: 'HVAC System',
      type: 'hvac',
      status: 'online',
      value: '22.5°C',
      lastUpdate: '2 min ago',
      icon: <Thermometer className="w-5 h-5" />,
      details: { connected: 8, total: 8, activeAlarms: 0 }
    },
    {
      id: 'lighting',
      name: 'Lighting Control',
      type: 'lighting',
      status: 'online',
      value: '89% Active',
      lastUpdate: '1 min ago',
      icon: <Lightbulb className="w-5 h-5" />,
      details: { connected: 24, total: 26, activeAlarms: 0 }
    },
    {
      id: 'shading',
      name: 'Shading System',
      type: 'shading',
      status: 'warning',
      value: '45% Deployed',
      lastUpdate: '5 min ago',
      icon: <Blinds className="w-5 h-5" />,
      details: { connected: 11, total: 12, activeAlarms: 1 }
    },
    {
      id: 'security',
      name: 'Security System',
      type: 'security',
      status: 'online',
      value: 'Armed',
      lastUpdate: '30 sec ago',
      icon: <Shield className="w-5 h-5" />,
      details: { connected: 16, total: 16, activeAlarms: 0 }
    },
    {
      id: 'occupancy',
      name: 'Occupancy Sensors',
      type: 'occupancy',
      status: 'online',
      value: '32 Present',
      lastUpdate: '1 min ago',
      icon: <Users className="w-5 h-5" />,
      details: { connected: 18, total: 18, activeAlarms: 0 }
    },
    {
      id: 'energy',
      name: 'Energy Management',
      type: 'energy',
      status: 'online',
      value: '8.5 kW',
      lastUpdate: '30 sec ago',
      icon: <Zap className="w-5 h-5" />,
      details: { connected: 12, total: 12, activeAlarms: 0 }
    }
  ];

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'maintenance':
        return <Settings className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Online</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Warning</Badge>;
      case 'offline':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'warning': return 'text-amber-500';
      case 'offline': return 'text-red-500';
      case 'maintenance': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {systemStatuses.map((system) => (
        <Card key={system.id} className="p-4 bg-muted/20 hover:bg-muted/30 transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-muted ${getStatusColor(system.status)}`}>
                {system.icon}
              </div>
              <div>
                <div className="font-medium text-sm">{system.name}</div>
                <div className="text-xs text-muted-foreground">{system.type.toUpperCase()}</div>
              </div>
            </div>
            {getStatusBadge(system.status)}
          </div>

          {/* Current Value */}
          <div className="mb-3">
            <div className="text-lg font-bold">{system.value}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Updated {system.lastUpdate}</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-muted-foreground">Connected:</span>
            <span className="font-medium">
              {system.details.connected}/{system.details.total} devices
            </span>
          </div>

          {/* Alarms */}
          {system.details.activeAlarms !== undefined && (
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-muted-foreground">Active Alarms:</span>
              <span className={`font-medium ${system.details.activeAlarms > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {system.details.activeAlarms}
              </span>
            </div>
          )}

          {/* Progress Bar for Connection Status */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">System Health</span>
              <span className="text-muted-foreground">
                {Math.round((system.details.connected / system.details.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  system.details.connected === system.details.total 
                    ? 'bg-green-500' 
                    : system.details.connected > system.details.total * 0.8
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${(system.details.connected / system.details.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="w-3 h-3 mr-2" />
            Configure
          </Button>
        </Card>
      ))}
    </div>
  );
}