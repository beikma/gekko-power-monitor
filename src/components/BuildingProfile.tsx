import { Building, MapPin, Settings, Users, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBuildingInfo } from "@/hooks/useBuildingInfo";
import { useBuildingData } from "@/hooks/useBuildingData";
import BuildingMap from "./BuildingMap";
import BuildingImageUpload from "./BuildingImageUpload";

export default function BuildingProfile() {
  const { buildingInfo, locationData, isLoadingLocation } = useBuildingInfo();
  const { manualInfo } = useBuildingData();

  const handleOpenInMaps = () => {
    if (buildingInfo.location?.latitude && buildingInfo.location?.longitude) {
      const url = `https://www.google.com/maps?q=${buildingInfo.location.latitude},${buildingInfo.location.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="energy-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-energy-primary" />
          Building Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Building Image Upload - only show if we have a database building ID */}
        {manualInfo?.id && (
          <BuildingImageUpload 
            buildingId={manualInfo.id}
            onImageUploaded={(url) => console.log('Image uploaded:', url)}
          />
        )}

        {/* Building Map */}
        {buildingInfo.location?.latitude && buildingInfo.location?.longitude && (
          <BuildingMap
            latitude={buildingInfo.location.latitude}
            longitude={buildingInfo.location.longitude}
            address={buildingInfo.location.address}
          />
        )}

        {/* Basic Information */}
        <div>
          <h4 className="font-medium text-energy-text mb-3 flex items-center gap-2">
            <Building className="h-4 w-4" />
            Basic Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Building Name:</span>
              <p className="font-medium text-energy-text">{buildingInfo.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">GEKKO ID:</span>
              <p className="font-mono text-xs bg-energy-surface/50 px-2 py-1 rounded border">
                {buildingInfo.gekkoid}
              </p>
            </div>
            {buildingInfo.specifications?.buildingType && (
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {buildingInfo.specifications.buildingType}
                </Badge>
              </div>
            )}
            {buildingInfo.specifications?.yearBuilt && (
              <div>
                <span className="text-muted-foreground">Built:</span>
                <p className="font-medium text-energy-text">{buildingInfo.specifications.yearBuilt}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        {buildingInfo.location && (
          <div>
            <h4 className="font-medium text-energy-text mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </h4>
            <div className="space-y-2 text-sm">
              {buildingInfo.location.address && (
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.location.address}</p>
                </div>
              )}
              {(buildingInfo.location.city || buildingInfo.location.country) && (
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium text-energy-text">
                    {[buildingInfo.location.city, buildingInfo.location.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              {buildingInfo.location.latitude && buildingInfo.location.longitude && (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-muted-foreground">Coordinates:</span>
                    <p className="font-mono text-xs text-energy-text">
                      {buildingInfo.location.latitude.toFixed(6)}, {buildingInfo.location.longitude.toFixed(6)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInMaps}
                    className="h-8"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Maps
                  </Button>
                </div>
              )}
              {buildingInfo.location.timezone && (
                <div>
                  <span className="text-muted-foreground">Timezone:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.location.timezone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Specifications */}
        {buildingInfo.specifications && (
          <div>
            <h4 className="font-medium text-energy-text mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Specifications
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {buildingInfo.specifications.totalArea && (
                <div>
                  <span className="text-muted-foreground">Total Area:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.specifications.totalArea} m²</p>
                </div>
              )}
              {buildingInfo.specifications.floors && (
                <div>
                  <span className="text-muted-foreground">Floors:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.specifications.floors}</p>
                </div>
              )}
              {buildingInfo.specifications.rooms && (
                <div>
                  <span className="text-muted-foreground">Rooms:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.specifications.rooms}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Systems */}
        {buildingInfo.systems && (
          <div>
            <h4 className="font-medium text-energy-text mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Installed Systems
            </h4>
            <div className="space-y-3">
              {buildingInfo.systems.installedComponents && buildingInfo.systems.installedComponents.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Components:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {buildingInfo.systems.installedComponents.map((component) => (
                      <Badge key={component} variant="secondary" className="text-xs">
                        {component}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {buildingInfo.systems.hvacZones && (
                <div className="text-sm">
                  <span className="text-muted-foreground">HVAC Zones:</span>
                  <span className="font-medium text-energy-text ml-2">{buildingInfo.systems.hvacZones}</span>
                </div>
              )}
              {buildingInfo.systems.networkStations && buildingInfo.systems.networkStations.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">Network Stations:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {buildingInfo.systems.networkStations.map((station) => (
                      <Badge key={station} variant="outline" className="text-xs">
                        {station}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        {buildingInfo.contact && (
          <div>
            <h4 className="font-medium text-energy-text mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact & Maintenance
            </h4>
            <div className="space-y-2 text-sm">
              {buildingInfo.contact.owner && (
                <div>
                  <span className="text-muted-foreground">Owner:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.contact.owner}</p>
                </div>
              )}
              {buildingInfo.contact.installer && (
                <div>
                  <span className="text-muted-foreground">Installer:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.contact.installer}</p>
                </div>
              )}
              {buildingInfo.contact.lastServiceDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last Service:</span>
                  <p className="font-medium text-energy-text">{buildingInfo.contact.lastServiceDate}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location Enrichment Status */}
        {buildingInfo.location?.latitude && buildingInfo.location?.longitude && (
          <div className="pt-4 border-t border-energy-border">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Location data:</span>
              <span className={isLoadingLocation ? "text-energy-warning" : "text-energy-success"}>
                {isLoadingLocation ? "Loading..." : "Enhanced"}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}