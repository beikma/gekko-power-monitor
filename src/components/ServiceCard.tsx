import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Check, Zap, DollarSign, Users } from "lucide-react";

interface ServiceCardProps {
  service: any;
  isInstalled: boolean;
  onInstall: () => void;
  featured?: boolean;
}

export function ServiceCard({ service, isInstalled, onInstall, featured = false }: ServiceCardProps) {
  const getPricingDisplay = () => {
    if (service.pricing_model === 'free') {
      return { text: 'Free', color: 'bg-green-100 text-green-800' };
    } else if (service.pricing_model === 'subscription') {
      return { 
        text: service.price_per_month > 0 ? `$${service.price_per_month}/mo` : 'Subscription',
        color: 'bg-blue-100 text-blue-800'
      };
    } else if (service.pricing_model === 'usage-based') {
      return { 
        text: service.price_per_usage > 0 ? `$${service.price_per_usage}/use` : 'Pay per use',
        color: 'bg-purple-100 text-purple-800'
      };
    }
    return { text: 'Contact', color: 'bg-gray-100 text-gray-800' };
  };

  const pricing = getPricingDisplay();

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${featured ? 'border-primary shadow-md' : ''} ${isInstalled ? 'bg-muted/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {service.icon_url && (
                <img src={service.icon_url} alt="" className="w-6 h-6 rounded" />
              )}
              <CardTitle className="text-lg">{service.name}</CardTitle>
              {featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            </div>
            <p className="text-sm text-muted-foreground">{service.provider}</p>
          </div>
          <Badge className={pricing.color}>{pricing.text}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {service.short_description || service.description}
        </p>

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {service.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{service.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Installation Type */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {service.installation_type === 'widget' && <Zap className="h-3 w-3" />}
          {service.installation_type === 'integration' && <Users className="h-3 w-3" />}
          {service.installation_type === 'agent' && <Users className="h-3 w-3" />}
          <span className="capitalize">{service.installation_type}</span>
          <span>•</span>
          <span>{service.category}</span>
        </div>

        {/* Action Button */}
        <Button 
          onClick={onInstall}
          disabled={isInstalled}
          className="w-full"
          variant={isInstalled ? "secondary" : "default"}
        >
          {isInstalled ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Installed
            </>
          ) : (
            <>
              Install Service
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}