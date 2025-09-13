import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation } from "react-router-dom";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingVoiceButton } from "@/components/FloatingVoiceButton";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  const location = useLocation();
  
  const getPageTitle = () => {
    if (title) return title;
    
    const path = location.pathname;
    switch (path) {
      case "/": return "Overview";
      case "/energy": return "Energy Management";
      case "/lighting": return "Lighting Control";
      case "/climate": return "Climate Control";
      case "/security": return "Security System";
      case "/building": return "Building Profile";
      case "/analytics": return "Analytics";
      case "/import": return "Data Import";
      case "/status": return "System Status";
      case "/settings": return "Settings";
      default: return "Dashboard";
    }
  };

  const getDefaultBreadcrumbs = () => {
    if (breadcrumbs) return breadcrumbs;
    
    const path = location.pathname;
    if (path === "/") return [{ label: "Overview" }];
    
    return [
      { label: "Overview", href: "/" },
      { label: getPageTitle() }
    ];
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-40 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              
              {/* Breadcrumbs */}
              <Breadcrumb>
                <BreadcrumbList>
                  {getDefaultBreadcrumbs().map((crumb, index) => (
                    <div key={index} className="flex items-center">
                      {index > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {crumb.href ? (
                          <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-64 bg-muted/50" 
                />
              </div>
              
              {/* Notifications */}
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              {/* User Menu */}
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="p-6">
              {/* Page Title */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {getPageTitle()}
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage and monitor your building systems
                </p>
              </div>

              {/* Page Content */}
              {children}
            </div>
          </main>
        </div>
        
        {/* Floating Voice Button */}
        <FloatingVoiceButton />
      </div>
    </SidebarProvider>
  );
}