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