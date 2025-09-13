import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Star, Zap, Shield, Bot, Eye, TrendingUp } from "lucide-react";
import { useMarketplaceServices } from "@/hooks/useMarketplaceServices";
import { ServiceInstallDialog } from "@/components/ServiceInstallDialog";
import { ServiceCard } from "@/components/ServiceCard";

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);

  const { services, installedServices, isLoading } = useMarketplaceServices();

  const categories = [
    { value: "all", label: "All Services", icon: Star },
    { value: "Energy Management", label: "Energy Management", icon: Zap },
    { value: "Security", label: "Security", icon: Shield },
    { value: "Voice AI", label: "Voice AI", icon: Bot },
    { value: "Maintenance", label: "Maintenance", icon: Eye },
    { value: "Weather", label: "Weather", icon: TrendingUp },
  ];

  const filteredServices = services?.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const featuredServices = filteredServices.filter(service => service.is_featured);
  const regularServices = filteredServices.filter(service => !service.is_featured);

  const handleInstallService = (service) => {
    setSelectedService(service);
    setInstallDialogOpen(true);
  };

  const isServiceInstalled = (serviceId) => {
    return installedServices?.some(installed => installed.service_id === serviceId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI/ML Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Discover and install AI-powered services to enhance your smart home system
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services, features, or providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Featured Services</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service) => (
              <ServiceCard
                key={service.service_id}
                service={service}
                isInstalled={isServiceInstalled(service.service_id)}
                onInstall={() => handleInstallService(service)}
                featured={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Services */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {featuredServices.length > 0 ? "All Services" : "Available Services"}
          <span className="text-sm text-muted-foreground ml-2">
            ({regularServices.length} service{regularServices.length !== 1 ? 's' : ''})
          </span>
        </h2>
        
        {regularServices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No services found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filter
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularServices.map((service) => (
              <ServiceCard
                key={service.service_id}
                service={service}
                isInstalled={isServiceInstalled(service.service_id)}
                onInstall={() => handleInstallService(service)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Install Dialog */}
      <ServiceInstallDialog
        service={selectedService}
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
      />
    </div>
  );
}