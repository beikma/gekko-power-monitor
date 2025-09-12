import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download, Calendar, Database, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportResult {
  year: number;
  totalInserted: number;
  totalSkipped: number;
  success: boolean;
  error?: string;
}

const DATA_TYPES = {
  'costs': 'Energy Costs & Billing',
  'consumption': 'Power Consumption',
  'generation': 'Solar/PV Generation',
  'efficiency': 'System Efficiency',
  'weather': 'Weather Correlation'
};

const RECORD_COUNTS = {
  '500': '500 records',
  '1000': '1,000 records',
  '2500': '2,500 records',
  '5000': '5,000 records',
  '10000': '10,000 records'
};

export function DirectApiImport() {
  const [selectedType, setSelectedType] = useState('costs');
  const [recordCount, setRecordCount] = useState('1000');
  const [selectedYears, setSelectedYears] = useState<number[]>([2024]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const gekkoCredentials = {
    username: 'mustermann@my-gekko.com',
    key: 'HjR9j4BrruA8wZiBeiWXnD',
    gekkoid: 'K999-7UOZ-8ZYZ-6TH3'
  };

  const handleYearToggle = (year: number, checked: boolean) => {
    setSelectedYears(prev => 
      checked 
        ? [...prev, year].sort((a, b) => b - a)
        : prev.filter(y => y !== year)
    );
  };

  const handleDirectImport = async () => {
    if (selectedYears.length === 0) {
      toast({
        title: "No Years Selected",
        description: "Please select at least one year to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults([]);

    const results: ImportResult[] = [];

    for (const year of selectedYears) {
      console.log(`Starting import for year ${year}, type: ${selectedType}`);
      
      try {
        const { data, error } = await supabase.functions.invoke('energy-bulk-import', {
          body: {
            source: 'gekko-historical',
            gekkoParams: {
              ...gekkoCredentials,
              year: year,
              startrow: 0,
              rowcount: parseInt(recordCount),
              dataType: selectedType // Additional parameter for data type
            }
          }
        });

        if (error) {
          throw error;
        }

        if (data?.success) {
          results.push({
            year,
            totalInserted: data.summary.totalInserted,
            totalSkipped: data.summary.totalSkipped,
            success: true
          });
          
          console.log(`Year ${year} completed: ${data.summary.totalInserted} records imported`);
        } else {
          results.push({
            year,
            totalInserted: 0,
            totalSkipped: 0,
            success: false,
            error: 'Import failed without specific error'
          });
        }

      } catch (error) {
        console.error(`Import error for year ${year}:`, error);
        results.push({
          year,
          totalInserted: 0,
          totalSkipped: 0,
          success: false,
          error: error.message || 'Unknown error'
        });
      }

      // Small delay between years
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setImportResults(results);
    
    const totalImported = results.reduce((sum, r) => sum + r.totalInserted, 0);
    const successfulYears = results.filter(r => r.success).length;
    
    if (successfulYears > 0) {
      toast({
        title: "Import Completed",
        description: `Successfully imported ${totalImported.toLocaleString()} records from ${successfulYears} year(s)`,
      });
    } else {
      toast({
        title: "Import Failed",
        description: "Failed to import data from any selected years",
        variant: "destructive",
      });
    }

    setIsImporting(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Direct API Import
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Import specific data types across multiple years directly from myGEKKO API
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription>
            Select data type and years to import directly from your myGEKKO controller
          </AlertDescription>
        </Alert>

        {/* Data Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Data Type</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATA_TYPES).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Record Count Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Records per Year</label>
          <Select value={recordCount} onValueChange={setRecordCount}>
            <SelectTrigger>
              <SelectValue placeholder="Select record count" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RECORD_COUNTS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Year Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Years to Import</label>
          <div className="grid grid-cols-2 gap-3">
            {availableYears.map(year => (
              <div key={year} className="flex items-center space-x-2">
                <Checkbox
                  id={`year-${year}`}
                  checked={selectedYears.includes(year)}
                  onCheckedChange={(checked) => handleYearToggle(year, checked as boolean)}
                />
                <label 
                  htmlFor={`year-${year}`} 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {year}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Selected: {selectedYears.length} year(s) • 
            Total records: {(selectedYears.length * parseInt(recordCount)).toLocaleString()}
          </p>
        </div>

        {/* Import Configuration Summary */}
        <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
          <p><strong>Data Type:</strong> {DATA_TYPES[selectedType as keyof typeof DATA_TYPES]}</p>
          <p><strong>Years:</strong> {selectedYears.join(', ')}</p>
          <p><strong>Records per Year:</strong> {RECORD_COUNTS[recordCount as keyof typeof RECORD_COUNTS]}</p>
          <p><strong>Controller:</strong> {gekkoCredentials.gekkoid}</p>
        </div>

        {/* Import Button */}
        <Button 
          onClick={handleDirectImport} 
          disabled={isImporting || selectedYears.length === 0}
          className="w-full"
        >
          {isImporting 
            ? `Importing ${selectedYears.length} Year(s)...` 
            : `Import ${selectedYears.join(', ')} - ${DATA_TYPES[selectedType as keyof typeof DATA_TYPES]}`
          }
        </Button>

        {/* Import Results */}
        {importResults.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-3">
              {importResults.map(result => (
                <div 
                  key={result.year}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    result.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">{result.year}</span>
                  </div>
                  
                  <div className="text-right">
                    {result.success ? (
                      <div className="text-green-700 dark:text-green-300">
                        <div className="font-semibold">
                          {result.totalInserted.toLocaleString()} imported
                        </div>
                        {result.totalSkipped > 0 && (
                          <div className="text-xs">
                            {result.totalSkipped} skipped
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-700 dark:text-red-300">
                        <div className="font-semibold">Failed</div>
                        <div className="text-xs">{result.error}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Total Imported
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {importResults.reduce((sum, r) => sum + r.totalInserted, 0).toLocaleString()}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Success Rate
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((importResults.filter(r => r.success).length / importResults.length) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}