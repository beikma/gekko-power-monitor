import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Home, Power, Settings } from 'lucide-react';
import { useGarageSocket } from '@/hooks/useGarageSocket';
import { SocketScheduler } from './SocketScheduler';
import { useToast } from '@/hooks/use-toast';

export function GarageSocketController() {
  const { socket, isLoading, error, toggleSocket, updateSchedule, refetch } = useGarageSocket();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('control');

  const handleToggle = async () => {
    try {
      await toggleSocket();
      toast({
        title: socket?.isOn ? 'Socket turned off' : 'Socket turned on',
        description: `${socket?.name} is now ${socket?.isOn ? 'off' : 'on'}`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to toggle socket',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse" />
            <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse delay-75" />
            <div className="w-4 h-4 bg-primary/20 rounded-full animate-pulse delay-150" />
          </div>
          <p className="text-center text-muted-foreground mt-4">Loading garage socket...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !socket) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {error || 'No garage socket found'}
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {socket.name}
                  <Badge variant={socket.isOn ? 'default' : 'secondary'}>
                    {socket.isOn ? 'ON' : 'OFF'}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {socket.location}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Power className={`w-5 h-5 ${socket.isOn ? 'text-green-500' : 'text-muted-foreground'}`} />
              <Switch
                checked={socket.isOn}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-green-500"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 m-4 mb-0">
              <TabsTrigger value="control" className="flex items-center gap-2">
                <Power className="w-4 h-4" />
                Control
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="control" className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
                  socket.isOn 
                    ? 'bg-green-100 text-green-600 shadow-lg shadow-green-500/25' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Power className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Socket is {socket.isOn ? 'ON' : 'OFF'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tap the switch above to toggle power
                  </p>
                </div>

                <Button
                  onClick={handleToggle}
                  variant={socket.isOn ? 'destructive' : 'default'}
                  size="lg"
                  className="w-full"
                >
                  Turn {socket.isOn ? 'OFF' : 'ON'}
                </Button>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Active Schedules:</span>
                  <Badge variant="outline">
                    {socket.schedule.filter(s => s.enabled).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Device ID:</span>
                  <code className="text-xs bg-background px-2 py-1 rounded">
                    {socket.id}
                  </code>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="p-6">
              <SocketScheduler
                schedule={socket.schedule}
                onScheduleChange={updateSchedule}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}