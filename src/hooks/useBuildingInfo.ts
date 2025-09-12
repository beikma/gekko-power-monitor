import { useState, useEffect, useMemo } from 'react';
import { useGekkoApi } from './useGekkoApi';
import { useBuildingData } from './useBuildingData';

interface BuildingInfo {
  name: string;
  gekkoid: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    country?: string;
    timezone?: string;
  };
  specifications?: {
    totalArea?: number;
    floors?: number;
    rooms?: number;
    yearBuilt?: number;
    buildingType?: string;
  };
  systems?: {
    hvacZones?: number;
    energyManagementVersion?: string;
    installedComponents?: string[];
    networkStations?: string[];
  };
  contact?: {
    owner?: string;
    installer?: string;
    lastServiceDate?: string;
  };
}

interface LocationEnrichment {
  weather: {
    source: string;
    forecast?: any[];
  };
  geocoding: {
    formatted_address?: string;
    place_id?: string;
    types?: string[];
  };
  nearby: {
    utilities?: any[];
    services?: any[];
  };
}

export function useBuildingInfo() {
  const { data, status } = useGekkoApi();
  const { manualInfo } = useBuildingData();
  const [locationData, setLocationData] = useState<LocationEnrichment | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Extract building information from myGEKKO API response
  const buildingInfo: BuildingInfo = useMemo(() => {
    // First get manual data
    const manual = manualInfo ? {
      name: manualInfo.building_name,
      gekkoid: '99Y9-JUTZ-8TYO-6P63',
      location: {
        latitude: manualInfo.latitude,
        longitude: manualInfo.longitude,
        address: manualInfo.address,
        city: manualInfo.city,
        country: manualInfo.country,
        timezone: undefined,
      },
      specifications: {
        totalArea: manualInfo.total_area,
        floors: manualInfo.floors,
        rooms: manualInfo.rooms,
        yearBuilt: manualInfo.year_built,
        buildingType: manualInfo.building_type,
      },
    } : null;

    if (!data || !status) {
      return manual || {
        name: 'myGEKKO Building',
        gekkoid: '99Y9-JUTZ-8TYO-6P63',
      };
    }

    const extractValue = (path: string): any => {
      const keys = path.split('.');
      let value = data;
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return null;
        }
      }
      return value;
    };

    const extractString = (path: string): string | null => {
      const value = extractValue(path);
      return typeof value === 'string' ? value : null;
    };

    const extractNumber = (path: string): number | null => {
      const value = extractValue(path);
      return typeof value === 'number' ? value : null;
    };

    // Extract building metadata from various API sections
    const buildingName = manual?.name || 
                         extractString('globals.system.name') || 
                         extractString('system.building.name') ||
                         extractString('config.building.name') ||
                         'myGEKKO Smart Building';

    const gekkoid = extractString('system.id') || '99Y9-JUTZ-8TYO-6P63';

    // Try to extract location information (prefer manual data)
    const location = {
      latitude: manual?.location?.latitude ||
                extractNumber('globals.location.latitude') || 
                extractNumber('config.location.lat') ||
                extractNumber('location.coordinates.lat'),
      longitude: manual?.location?.longitude ||
                 extractNumber('globals.location.longitude') || 
                 extractNumber('config.location.lng') ||
                 extractNumber('location.coordinates.lng'),
      address: manual?.location?.address ||
               extractString('globals.location.address') ||
               extractString('config.building.address'),
      city: manual?.location?.city ||
            extractString('globals.location.city') ||
            extractString('config.building.city'),
      country: manual?.location?.country ||
               extractString('globals.location.country') ||
               extractString('config.building.country'),
      timezone: extractString('globals.system.timezone') ||
                extractString('config.system.timezone'),
    };

    // Extract building specifications (prefer manual data)
    const specifications = {
      totalArea: manual?.specifications?.totalArea ||
                 extractNumber('config.building.area') ||
                 extractNumber('globals.building.totalArea'),
      floors: manual?.specifications?.floors ||
              extractNumber('config.building.floors') ||
              extractNumber('globals.building.floors'),
      rooms: manual?.specifications?.rooms ||
             extractNumber('config.building.rooms') ||
             Object.keys(data.globals?.raumregelung || {}).length || undefined,
      yearBuilt: manual?.specifications?.yearBuilt ||
                 extractNumber('config.building.yearBuilt') ||
                 extractNumber('globals.building.constructionYear'),
      buildingType: manual?.specifications?.buildingType ||
                    extractString('config.building.type') ||
                    extractString('globals.building.category') ||
                    'Residential',
    };

    // Extract system information
    const systems = {
      hvacZones: Object.keys(data.globals?.raumregelung || {}).length || undefined,
      energyManagementVersion: extractString('system.version') ||
                               extractString('globals.system.version'),
      installedComponents: [
        ...(data.energymanager ? ['Energy Manager'] : []),
        ...(data.globals?.raumregelung ? ['Room Control'] : []),
        ...(data.globals?.meteo ? ['Weather Station'] : []),
        ...(data.alarm ? ['Alarm System'] : []),
        ...(data.globals?.network ? ['Network Monitoring'] : []),
      ],
      networkStations: Object.keys(data.globals?.network || {}).filter(key => 
        key.includes('IOStation') || key.includes('Station')
      ),
    };

    // Extract contact/maintenance info
    const contact = {
      owner: extractString('config.building.owner') ||
             extractString('globals.contact.owner'),
      installer: extractString('config.system.installer') ||
                 extractString('globals.contact.installer'),
      lastServiceDate: extractString('system.lastService') ||
                       extractString('globals.maintenance.lastService'),
    };

    return {
      name: buildingName,
      gekkoid,
      location: Object.values(location).some(v => v !== null && v !== undefined) ? location : undefined,
      specifications: Object.values(specifications).some(v => v !== null && v !== undefined) ? specifications : undefined,
      systems: Object.values(systems).some(v => v !== null && v !== undefined && (!Array.isArray(v) || v.length > 0)) ? systems : undefined,
      contact: Object.values(contact).some(v => v !== null) ? contact : undefined,
    };
  }, [data, status, manualInfo]);

  // Enrich with external location data
  const enrichWithLocationData = async (lat: number, lng: number) => {
    if (isLoadingLocation) return;
    
    setIsLoadingLocation(true);
    
    try {
      // We could integrate with various location APIs here
      // For now, we'll create a placeholder structure
      const enrichedData: LocationEnrichment = {
        weather: {
          source: 'myGEKKO',
          forecast: [], // Could fetch from external weather API
        },
        geocoding: {
          formatted_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          types: ['building', 'residential'],
        },
        nearby: {
          utilities: [],
          services: [],
        },
      };

      setLocationData(enrichedData);
    } catch (error) {
      console.error('Error enriching location data:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Auto-enrich when coordinates are available
  useEffect(() => {
    if (buildingInfo.location?.latitude && buildingInfo.location?.longitude && !locationData) {
      enrichWithLocationData(buildingInfo.location.latitude, buildingInfo.location.longitude);
    }
  }, [buildingInfo.location?.latitude, buildingInfo.location?.longitude, locationData]);

  return {
    buildingInfo,
    locationData,
    isLoadingLocation,
    enrichWithLocationData,
  };
}