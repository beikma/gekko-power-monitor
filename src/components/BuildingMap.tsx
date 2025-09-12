import { MapPin } from "lucide-react";

interface BuildingMapProps {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function BuildingMap({ latitude, longitude, address }: BuildingMapProps) {
  // Create a static map URL using OpenStreetMap tiles with better zoom and marker
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005}%2C${latitude-0.005}%2C${longitude+0.005}%2C${latitude+0.005}&amp;layer=mapnik&amp;marker=${latitude}%2C${longitude}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-energy-primary" />
          <span className="font-medium text-energy-text">Building Location</span>
        </div>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-energy-primary hover:text-energy-primary/80 transition-colors"
        >
          Open in Google Maps
        </a>
      </div>
      
      <div className="relative rounded-lg overflow-hidden border border-energy-border bg-energy-surface">
        <iframe
          src={mapUrl}
          width="100%"
          height="240"
          style={{ border: 0 }}
          loading="lazy"
          title={address ? `Map of ${address}` : "Building location map"}
          className="w-full"
        />
        
        {/* Custom marker overlay for better visibility */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none">
          <div className="relative">
            {/* Pulsing dot */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-energy-primary rounded-full animate-pulse opacity-70"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
            </div>
            
            {/* Building pin icon */}
            <div className="bg-energy-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
              <MapPin className="h-4 w-4" fill="currentColor" />
            </div>
          </div>
        </div>
        
        {/* Coordinates display */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </div>
        
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-energy-surface/10 to-transparent" />
      </div>
      
      {address && (
        <p className="text-xs text-muted-foreground text-center">{address}</p>
      )}
    </div>
  );
}