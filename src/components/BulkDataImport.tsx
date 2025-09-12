import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Calendar, TrendingUp } from 'lucide-react';

interface ImportStats {
  totalProcessed: number;
  totalInserted: number;
  totalSkipped: number;
  dateRange: {
    start: string;
    end: string;
  };
  statistics: {
    avgPowerConsumption: number;
    avgPVGeneration: number;
    maxDailyEnergy: number;
  };
}

export function BulkDataImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvData(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCsvData = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;

      const record: any = {};
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        
        // Map common header variations
        if (header.includes('timestamp') || header.includes('date') || header.includes('time')) {
          record.timestamp = value;
        } else if (header.includes('power') && header.includes('current')) {
          record.current_power = parseFloat(value) || 0;
        } else if (header.includes('daily') && header.includes('energy')) {
          record.daily_energy = parseFloat(value) || 0;
        } else if (header.includes('battery')) {
          record.battery_level = parseFloat(value) || 0;
        } else if (header.includes('pv') || header.includes('solar')) {
          record.pv_power = parseFloat(value) || 0;
        } else if (header.includes('grid')) {
          record.grid_power = parseFloat(value) || 0;
        } else if (header.includes('temperature') || header.includes('temp')) {
          record.temperature = parseFloat(value) || null;
        } else if (header.includes('humidity')) {
          record.humidity = parseFloat(value) || null;
        } else if (header.includes('weather')) {
          record.weather_condition = value;
        }
      });

      if (record.timestamp) {
        data.push(record);
      }
    }

    return data;
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please upload a CSV file or paste data first",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const parsedData = parseCsvData(csvData);
      
      if (parsedData.length === 0) {
        toast({
          title: "No Valid Data",
          description: "Could not parse any valid records from the CSV",
          variant: "destructive",
        });
        return;
      }

      console.log(`Parsed ${parsedData.length} records, starting import...`);

      const { data, error } = await supabase.functions.invoke('energy-bulk-import', {
        body: {
          data: parsedData,
          source: 'csv',
          date_range: {
            start: parsedData[0]?.timestamp,
            end: parsedData[parsedData.length - 1]?.timestamp,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        setImportStats(data.summary);
        toast({
          title: "Import Successful",
          description: `Imported ${data.summary.totalInserted} records successfully`,
        });
        setCsvData(''); // Clear the data
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import historical data. Check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Historical Data Import
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import months of historical energy data for advanced ML analysis and weather correlations
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="csvFile">Upload CSV File</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Expected columns: timestamp, current_power, daily_energy, battery_level, pv_power, grid_power, temperature (optional)
            </p>
          </div>

          <div className="text-center text-muted-foreground">— OR —</div>

          <div>
            <Label htmlFor="csvData">Paste CSV Data</Label>
            <Textarea
              id="csvData"
              placeholder="timestamp,current_power,daily_energy,battery_level,pv_power,grid_power,temperature
2024-01-01 00:00:00,1.5,8.2,45,2.1,0.8,15.5
2024-01-01 00:05:00,1.6,8.3,44,2.2,0.9,15.3"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </div>

        {/* Import Button */}
        <Button 
          onClick={handleImport} 
          disabled={isImporting || !csvData.trim()}
          className="w-full"
        >
          {isImporting ? "Importing..." : "Import Historical Data"}
        </Button>

        {/* Import Statistics */}
        {importStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Records
              </div>
              <div className="text-2xl font-bold text-green-600">
                {importStats.totalInserted.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {importStats.totalSkipped > 0 && `${importStats.totalSkipped} skipped`}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Date Range
              </div>
              <div className="text-sm font-medium">
                {new Date(importStats.dateRange.start).toLocaleDateString()}
              </div>
              <div className="text-sm font-medium">
                to {new Date(importStats.dateRange.end).toLocaleDateString()}
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Avg Power
              </div>
              <div className="text-2xl font-bold">
                {importStats.statistics.avgPowerConsumption}
              </div>
              <div className="text-xs text-muted-foreground">kW</div>
            </div>
          </div>
        )}

        {/* Data Format Guide */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Expected CSV Format:
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Required:</strong> timestamp, current_power, daily_energy, battery_level, pv_power, grid_power</p>
            <p><strong>Optional:</strong> temperature, humidity, weather_condition, efficiency_score, cost_estimate</p>
            <p><strong>Note:</strong> Column names are flexible (e.g., "solar_power" = "pv_power")</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}