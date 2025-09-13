import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, MapPin, Settings, Zap, Users, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useBuildingData } from '@/hooks/useBuildingData';
import { Separator } from '@/components/ui/separator';
import { MCPTestPanel } from '@/components/MCPTestPanel';
import { ForecastCard } from '@/components/ForecastCard';

export default function Admin() {
  const navigate = useNavigate();
  const { manualInfo, isLoading, isSaving, saveBuildingInfo, deleteBuildingInfo } = useBuildingData();
  
  const [formData, setFormData] = useState({
    building_name: manualInfo?.building_name || 'myGEKKO Smart Building',
    address: manualInfo?.address || '',
    city: manualInfo?.city || '',
    country: manualInfo?.country || '',
    postal_code: manualInfo?.postal_code || '',
    latitude: manualInfo?.latitude?.toString() || '',
    longitude: manualInfo?.longitude?.toString() || '',
    total_area: manualInfo?.total_area?.toString() || '',
    floors: manualInfo?.floors?.toString() || '',
    rooms: manualInfo?.rooms?.toString() || '',
    year_built: manualInfo?.year_built?.toString() || '',
    building_type: manualInfo?.building_type || '',
    usage_type: manualInfo?.usage_type || '',
    occupancy: manualInfo?.occupancy?.toString() || '',
    energy_rating: manualInfo?.energy_rating || '',
    heating_system: manualInfo?.heating_system || '',
    cooling_system: manualInfo?.cooling_system || '',
    renewable_energy: manualInfo?.renewable_energy || false,
    solar_panels: manualInfo?.solar_panels || false,
    notes: manualInfo?.notes || '',
  });

  // Update form data when manualInfo changes
  useState(() => {
    if (manualInfo) {
      setFormData({
        building_name: manualInfo.building_name || 'myGEKKO Smart Building',
        address: manualInfo.address || '',
        city: manualInfo.city || '',
        country: manualInfo.country || '',
        postal_code: manualInfo.postal_code || '',
        latitude: manualInfo.latitude?.toString() || '',
        longitude: manualInfo.longitude?.toString() || '',
        total_area: manualInfo.total_area?.toString() || '',
        floors: manualInfo.floors?.toString() || '',
        rooms: manualInfo.rooms?.toString() || '',
        year_built: manualInfo.year_built?.toString() || '',
        building_type: manualInfo.building_type || '',
        usage_type: manualInfo.usage_type || '',
        occupancy: manualInfo.occupancy?.toString() || '',
        energy_rating: manualInfo.energy_rating || '',
        heating_system: manualInfo.heating_system || '',
        cooling_system: manualInfo.cooling_system || '',
        renewable_energy: manualInfo.renewable_energy || false,
        solar_panels: manualInfo.solar_panels || false,
        notes: manualInfo.notes || '',
      });
    }
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      const dataToSave = {
        building_name: formData.building_name,
        address: formData.address || null,
        city: formData.city || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        total_area: formData.total_area ? parseFloat(formData.total_area) : null,
        floors: formData.floors ? parseInt(formData.floors) : null,
        rooms: formData.rooms ? parseInt(formData.rooms) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        building_type: formData.building_type || null,
        usage_type: formData.usage_type || null,
        occupancy: formData.occupancy ? parseInt(formData.occupancy) : null,
        energy_rating: formData.energy_rating || null,
        heating_system: formData.heating_system || null,
        cooling_system: formData.cooling_system || null,
        renewable_energy: formData.renewable_energy,
        solar_panels: formData.solar_panels,
        notes: formData.notes || null,
      };

      await saveBuildingInfo(dataToSave);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete all building information? This action cannot be undone.')) {
      await deleteBuildingInfo();
      // Reset form
      setFormData({
        building_name: 'myGEKKO Smart Building',
        address: '', city: '', country: '', postal_code: '',
        latitude: '', longitude: '', total_area: '', floors: '', rooms: '',
        year_built: '', building_type: '', usage_type: '', occupancy: '',
        energy_rating: '', heating_system: '', cooling_system: '',
        renewable_energy: false, solar_panels: false, notes: '',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Building Admin
                </h1>
                <p className="text-sm text-muted-foreground">Manage building information and settings</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Building Information</h2>
            <div className="flex gap-3">
              {manualInfo && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Basic Information */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-energy-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="building_name">Building Name *</Label>
                  <Input
                    id="building_name"
                    value={formData.building_name}
                    onChange={(e) => handleInputChange('building_name', e.target.value)}
                    placeholder="Enter building name"
                  />
                </div>
                <div>
                  <Label htmlFor="building_type">Building Type</Label>
                  <Select value={formData.building_type} onValueChange={(value) => handleInputChange('building_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="mixed-use">Mixed Use</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="usage_type">Usage Type</Label>
                  <Select value={formData.usage_type} onValueChange={(value) => handleInputChange('usage_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select usage type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single Family</SelectItem>
                      <SelectItem value="multi-family">Multi Family</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year_built">Year Built</Label>
                  <Input
                    id="year_built"
                    type="number"
                    value={formData.year_built}
                    onChange={(e) => handleInputChange('year_built', e.target.value)}
                    placeholder="e.g. 2020"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-energy-primary" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="Enter postal code"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', e.target.value)}
                    placeholder="e.g. 47.3769"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', e.target.value)}
                    placeholder="e.g. 8.5417"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Physical Specifications */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-energy-primary" />
                Physical Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="total_area">Total Area (m²)</Label>
                  <Input
                    id="total_area"
                    type="number"
                    value={formData.total_area}
                    onChange={(e) => handleInputChange('total_area', e.target.value)}
                    placeholder="e.g. 250"
                  />
                </div>
                <div>
                  <Label htmlFor="floors">Number of Floors</Label>
                  <Input
                    id="floors"
                    type="number"
                    value={formData.floors}
                    onChange={(e) => handleInputChange('floors', e.target.value)}
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <Label htmlFor="rooms">Number of Rooms</Label>
                  <Input
                    id="rooms"
                    type="number"
                    value={formData.rooms}
                    onChange={(e) => handleInputChange('rooms', e.target.value)}
                    placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <Label htmlFor="occupancy">Max Occupancy</Label>
                  <Input
                    id="occupancy"
                    type="number"
                    value={formData.occupancy}
                    onChange={(e) => handleInputChange('occupancy', e.target.value)}
                    placeholder="e.g. 4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Energy Systems */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-energy-primary" />
                Energy Systems
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="energy_rating">Energy Rating</Label>
                  <Select value={formData.energy_rating} onValueChange={(value) => handleInputChange('energy_rating', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select energy rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+++">A+++</SelectItem>
                      <SelectItem value="A++">A++</SelectItem>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="heating_system">Heating System</Label>
                  <Input
                    id="heating_system"
                    value={formData.heating_system}
                    onChange={(e) => handleInputChange('heating_system', e.target.value)}
                    placeholder="e.g. Heat Pump, Gas Boiler"
                  />
                </div>
                <div>
                  <Label htmlFor="cooling_system">Cooling System</Label>
                  <Input
                    id="cooling_system"
                    value={formData.cooling_system}
                    onChange={(e) => handleInputChange('cooling_system', e.target.value)}
                    placeholder="e.g. Air Conditioning, Natural Ventilation"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="renewable_energy">Renewable Energy Systems</Label>
                    <p className="text-sm text-muted-foreground">Building has renewable energy installations</p>
                  </div>
                  <Switch
                    id="renewable_energy"
                    checked={formData.renewable_energy}
                    onCheckedChange={(checked) => handleInputChange('renewable_energy', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="solar_panels">Solar Panels</Label>
                    <p className="text-sm text-muted-foreground">Building has solar panel installations</p>
                  </div>
                  <Switch
                    id="solar_panels"
                    checked={formData.solar_panels}
                    onCheckedChange={(checked) => handleInputChange('solar_panels', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card className="energy-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-energy-primary" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes about the building..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Energy Forecasting Demo */}
          <ForecastCard />

          {/* MCP Server Integration */}
          <MCPTestPanel />
        </div>
      </main>
    </div>
  );
}