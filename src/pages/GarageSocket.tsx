import React from 'react';
import { GarageSocketController } from '@/components/GarageSocketController';
import { ApiCommunicationTracker } from '@/components/ApiCommunicationTracker';
import { MyGekkoApiTester } from '@/components/MyGekkoApiTester';
import { SocketAnalyzer } from '@/components/SocketAnalyzer';

export default function GarageSocket() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Garage Socket Control</h1>
        <p className="text-muted-foreground mt-2">
          Control your garage power socket manually or set up automated schedules for daily operation.
        </p>
      </div>
      
      <div className="space-y-6">
        <SocketAnalyzer />
        
        <GarageSocketController />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ApiCommunicationTracker />
          <MyGekkoApiTester />
        </div>
      </div>
    </div>
  );
}