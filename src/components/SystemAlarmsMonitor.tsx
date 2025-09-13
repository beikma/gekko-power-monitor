import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, CheckCircle, Clock, Wifi, WifiOff, Settings, Thermometer, Cloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MyGekkoAlarm {
  id: string;
  timestamp: string;
  status: string;
  description: string;
  category: string;
  priority: string;
  acknowledged: boolean;
  resolved: boolean;
}

export function SystemAlarmsMonitor() {
  const [alarms, setAlarms] = useState<MyGekkoAlarm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const { toast } = useToast();

  useEffect(() => {
    fetchAlarms();
  }, [filter]);

  const fetchAlarms = async () => {
    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const proxyUrl = 'https://kayttwmmdcubfjqrpztw.supabase.co/functions/v1/gekko-proxy';
      const params = new URLSearchParams({
        endpoint: `list/alarm/lists/list0/status`,
        startrow: '0',
        rowcount: '100',
        year: currentYear.toString(),
        username: 'mustermann@my-gekko.com',
        key: 'HjR9j4BrruA8wZiBeiWXnD',
        gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
      });
      
      console.log('🚨 Fetching myGEKKO alarms from:', `${proxyUrl}?${params}`);
      const response = await fetch(`${proxyUrl}?${params}`);
      
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} ${response.statusText}`);
        throw new Error(`API Error: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('📡 Raw response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.log('Raw response was:', responseText);
        throw new Error('Invalid JSON response from myGEKKO API');
      }
      
      console.log('📋 Parsed alarm data:', data);
      
      // Transform myGEKKO alarm data to our format
      const transformedAlarms = transformMyGekkoAlarms(data);
      
      // Apply filter
      let filteredAlarms = transformedAlarms;
      if (filter === 'active') {
        filteredAlarms = transformedAlarms.filter(alarm => !alarm.resolved);
      } else if (filter === 'resolved') {
        filteredAlarms = transformedAlarms.filter(alarm => alarm.resolved);
      }
      
      setAlarms(filteredAlarms);
      console.log(`✅ Loaded ${filteredAlarms.length} alarms (filter: ${filter})`);
      
    } catch (error) {
      console.error('❌ Error fetching myGEKKO alarms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch myGEKKO system alarms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Transform myGEKKO alarm data to our component format
  const transformMyGekkoAlarms = (data: any): MyGekkoAlarm[] => {
    console.log('🔍 Raw myGEKKO alarm response:', JSON.stringify(data, null, 2));
    
    // Handle different possible response structures
    let alarmArray = [];
    
    if (data.alarms && Array.isArray(data.alarms)) {
      alarmArray = data.alarms;
    } else if (data.items && Array.isArray(data.items)) {
      alarmArray = data.items;
    } else if (data.list && Array.isArray(data.list)) {
      alarmArray = data.list;
    } else if (Array.isArray(data)) {
      alarmArray = data;
    } else {
      console.log('⚠️ Unexpected alarm data structure:', data);
      return [];
    }

    console.log(`📊 Found ${alarmArray.length} alarms in response`);
    
    return alarmArray.map((alarm: any, index: number) => {
      const transformedAlarm = {
        id: alarm.id || alarm.alarmId || `alarm_${index}`,
        timestamp: alarm.timestamp || alarm.alarmTime || alarm.date || new Date().toISOString(),
        status: alarm.status || (alarm.okTime ? 'resolved' : 'active'),
        description: alarm.text || alarm.description || alarm.message || `Alarm ${index + 1}`,
        category: alarm.category || alarm.type || alarm.group || 'system',
        priority: alarm.priority || alarm.severity || alarm.level || 'medium',
        acknowledged: alarm.acknowledged || !!alarm.okTime || false,
        resolved: alarm.resolved || !!alarm.okTime || false
      };
      
      console.log(`🔄 Transformed alarm ${index}:`, transformedAlarm);
      return transformedAlarm;
    });
  };

  const getAlarmIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'connection':
      case 'network':
        return WifiOff;
      case 'hardware':
      case 'device':
        return Settings;
      case 'heating':
      case 'hvac':
      case 'temperature':
        return Thermometer;
      case 'weather':
      case 'meteo':
        return Cloud;
      default:
        return AlertTriangle;
    }
  };

  const getAlarmColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
      case '1':
        return 'destructive';
      case 'medium':
      case '2':
        return 'default';
      case 'low':
      case '3':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (alarm: MyGekkoAlarm) => {
    if (alarm.resolved) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (alarm.acknowledged) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (timestamp: string) => {
    const start = new Date(timestamp);
    const now = new Date();
    const duration = now.getTime() - start.getTime();
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  const activeAlarms = alarms.filter(alarm => !alarm.resolved);
  const criticalAlarms = alarms.filter(alarm => alarm.priority === 'critical' || alarm.priority === 'high' || alarm.priority === '1');

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
              Real-time monitoring of myGEKKO system alerts and notifications
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchAlarms}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
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
                const AlarmIcon = getAlarmIcon(alarm.category);
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
                            <Badge variant={getAlarmColor(alarm.priority)} className="text-xs">
                              {alarm.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alarm.category}
                            </Badge>
                            {alarm.acknowledged && (
                              <Badge variant="secondary" className="text-xs">
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(alarm)}
                          <div className="text-xs text-muted-foreground text-right">
                            <div>{formatDate(alarm.timestamp)}</div>
                            <div className="font-medium">
                              {formatDuration(alarm.timestamp)}
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
                {alarms.filter(a => a.category.toLowerCase().includes('connection') || a.category.toLowerCase().includes('network')).length}
              </div>
              <div className="text-xs text-muted-foreground">Network</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {alarms.filter(a => a.category.toLowerCase().includes('hardware') || a.category.toLowerCase().includes('device')).length}
              </div>
              <div className="text-xs text-muted-foreground">Hardware</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {alarms.filter(a => a.category.toLowerCase().includes('heating') || a.category.toLowerCase().includes('hvac')).length}
              </div>
              <div className="text-xs text-muted-foreground">HVAC</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {alarms.filter(a => a.category.toLowerCase().includes('system') || a.category.toLowerCase().includes('config')).length}
              </div>
              <div className="text-xs text-muted-foreground">System</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}