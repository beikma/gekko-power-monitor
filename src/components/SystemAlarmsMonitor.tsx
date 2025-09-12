import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Wifi, WifiOff, Settings, Thermometer, Cloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SystemAlarm {
  id: string;
  description: string;
  alarm_type: string;
  start_time: string;
  end_time?: string;
  status: string;
  severity: string;
  created_at: string;
}

export function SystemAlarmsMonitor() {
  const [alarms, setAlarms] = useState<SystemAlarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const { toast } = useToast();

  useEffect(() => {
    fetchAlarms();
  }, [filter]);

  const fetchAlarms = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('system_alarms')
        .select('*')
        .order('start_time', { ascending: false })
        .limit(50);

      if (filter === 'active') {
        query = query.eq('status', 'active');
      } else if (filter === 'resolved') {
        query = query.eq('status', 'resolved');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setAlarms(data || []);
    } catch (error) {
      console.error('Error fetching alarms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system alarms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAlarmIcon = (alarmType: string) => {
    switch (alarmType) {
      case 'connection':
        return WifiOff;
      case 'hardware':
        return Settings;
      case 'heating':
        return Thermometer;
      case 'weather':
        return Cloud;
      default:
        return AlertTriangle;
    }
  };

  const getAlarmColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const activeAlarms = alarms.filter(alarm => alarm.status === 'active');
  const criticalAlarms = alarms.filter(alarm => alarm.severity === 'critical' || alarm.severity === 'high');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alarms Monitor
            </CardTitle>
            <CardDescription>
              Real-time monitoring of system alerts and maintenance notifications
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={activeAlarms.length > 0 ? 'destructive' : 'secondary'}>
              {activeAlarms.length} Active
            </Badge>
            <Badge variant={criticalAlarms.length > 0 ? 'destructive' : 'outline'}>
              {criticalAlarms.length} Critical
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({alarms.length})
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              Active ({activeAlarms.length})
            </Button>
            <Button
              variant={filter === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('resolved')}
            >
              Resolved
            </Button>
          </div>

          {/* Alarms list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading alarms...
              </div>
            ) : alarms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No system alarms found</p>
                <p className="text-xs">All systems operating normally</p>
              </div>
            ) : (
              alarms.map((alarm) => {
                const AlarmIcon = getAlarmIcon(alarm.alarm_type);
                return (
                  <div
                    key={alarm.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <AlarmIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">
                            {alarm.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getAlarmColor(alarm.severity)} className="text-xs">
                              {alarm.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alarm.alarm_type}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alarm.status)}
                          <div className="text-xs text-muted-foreground text-right">
                            <div>{formatDate(alarm.start_time)}</div>
                            <div className="font-medium">
                              Duration: {formatDuration(alarm.start_time, alarm.end_time)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {alarms.filter(a => a.alarm_type === 'connection').length}
              </div>
              <div className="text-xs text-muted-foreground">Connection</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {alarms.filter(a => a.alarm_type === 'hardware').length}
              </div>
              <div className="text-xs text-muted-foreground">Hardware</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {alarms.filter(a => a.alarm_type === 'heating').length}
              </div>
              <div className="text-xs text-muted-foreground">Heating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {alarms.filter(a => a.alarm_type === 'configuration').length}
              </div>
              <div className="text-xs text-muted-foreground">Config</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}