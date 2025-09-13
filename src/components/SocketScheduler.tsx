import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { SocketSchedule } from '@/hooks/useGarageSocket';
import { useToast } from '@/hooks/use-toast';

interface SocketSchedulerProps {
  schedule: SocketSchedule[];
  onScheduleChange: (schedule: SocketSchedule[]) => void;
}

const DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SocketScheduler({ schedule, onScheduleChange }: SocketSchedulerProps) {
  const [newSchedule, setNewSchedule] = useState<Omit<SocketSchedule, 'id'>>({
    day: 1, // Monday
    onTime: '08:00',
    offTime: '18:00',
    enabled: true
  });
  const { toast } = useToast();

  const addSchedule = () => {
    const id = Date.now().toString();
    const updated = [...schedule, { ...newSchedule, id }];
    onScheduleChange(updated);
    
    // Reset form
    setNewSchedule({
      day: 1,
      onTime: '08:00',
      offTime: '18:00',
      enabled: true
    });

    toast({
      title: 'Schedule added',
      description: `Added schedule for ${DAYS[newSchedule.day]}`,
    });
  };

  const removeSchedule = (id: string) => {
    const updated = schedule.filter(s => s.id !== id);
    onScheduleChange(updated);
    
    toast({
      title: 'Schedule removed',
      description: 'Schedule has been deleted',
    });
  };

  const toggleSchedule = (id: string) => {
    const updated = schedule.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    onScheduleChange(updated);
  };

  const updateSchedule = (id: string, updates: Partial<SocketSchedule>) => {
    const updated = schedule.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    onScheduleChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Current Schedules */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <h3 className="font-semibold">Weekly Schedule</h3>
        </div>

        {schedule.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No schedules configured yet
              </p>
              <p className="text-sm text-muted-foreground">
                Add your first schedule below to automate your garage socket
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {schedule.map((item) => (
              <Card key={item.id} className={`transition-all ${item.enabled ? 'ring-1 ring-primary/20' : 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.enabled}
                          onCheckedChange={() => toggleSchedule(item.id!)}
                        />
                        <Badge variant={item.enabled ? 'default' : 'secondary'}>
                          {DAYS_SHORT[item.day]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-mono bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                            ON {item.onTime}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono bg-red-100 text-red-700 px-2 py-1 rounded text-xs">
                            OFF {item.offTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSchedule(item.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {item.enabled && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Turn ON at</Label>
                        <Input
                          type="time"
                          value={item.onTime}
                          onChange={(e) => updateSchedule(item.id!, { onTime: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Turn OFF at</Label>
                        <Input
                          type="time"
                          value={item.offTime}
                          onChange={(e) => updateSchedule(item.id!, { offTime: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Add New Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="w-4 h-4" />
            Add New Schedule
          </CardTitle>
          <CardDescription>
            Create a daily on/off schedule for your garage socket
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            <Label className="col-span-7 text-sm font-medium">Day of week</Label>
            {DAYS_SHORT.map((day, index) => (
              <Button
                key={day}
                variant={newSchedule.day === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => setNewSchedule({ ...newSchedule, day: index })}
                className="p-2 text-xs"
              >
                {day}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-green-700">Turn ON at</Label>
              <Input
                type="time"
                value={newSchedule.onTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, onTime: e.target.value })}
                className="border-green-200 focus:border-green-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-red-700">Turn OFF at</Label>
              <Input
                type="time"
                value={newSchedule.offTime}
                onChange={(e) => setNewSchedule({ ...newSchedule, offTime: e.target.value })}
                className="border-red-200 focus:border-red-400"
              />
            </div>
          </div>

          <Button onClick={addSchedule} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule for {DAYS[newSchedule.day]}
          </Button>
        </CardContent>
      </Card>

      {schedule.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Schedules run automatically based on your local time.
              Make sure your device time is correct for accurate scheduling.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}