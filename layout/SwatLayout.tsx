import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Shield,
  UserCog,
  Briefcase,
  Calendar,
  Award,
  HelpCircle,
  Settings,
  MessageSquare,
  Layers,
  MapPin,
  FileText,
  BarChart,
  ClipboardCheck
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "./UserNav";
import { ThemeToggle } from "../ui/theme-toggle";
import { Badge } from "../ui/badge";

interface SwatLayoutProps {
  children: React.ReactNode;
}

// SWAT tracking interface navigation items
const swatNavItems = (agencyId: string) => [
  { icon: Shield, label: 'SWAT Dashboard', href: `/swat/dashboard/${agencyId}` },
  { icon: UserCog, label: 'Personnel', href: `/swat/personnel/${agencyId}` },
  { icon: Briefcase, label: 'Equipment', href: `/swat/equipment/${agencyId}` },
  { icon: Calendar, label: 'Training', href: `/swat/training/${agencyId}` },
  { icon: Award, label: 'Certifications', href: `/swat/certifications/${agencyId}` },
  { icon: MapPin, label: 'Deployments', href: `/swat/deployments/${agencyId}` },
  { icon: BarChart, label: 'Reports & Data', href: `/swat/reports/${agencyId}` },
  { icon: FileText, label: 'Resources Library', href: `/swat/resources/${agencyId}` },
  { icon: ClipboardCheck, label: 'Corrective Actions', href: `/swat/corrective-actions/${agencyId}` },
  { icon: MessageSquare, label: 'Messages', href: `/swat/messages/${agencyId}` },
  { icon: HelpCircle, label: 'Help Center', href: '/admin/help' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' }
];

export function SwatLayout({ children }: SwatLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth() || { user: null };
  const agencyId = user?.agencyId || 'default';
  
  // Get the navigation items
  const navItems = swatNavItems(agencyId);

  // Get current page title
  const currentPage = navItems.find(item => item.href === location);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-black h-screen flex flex-col fixed shadow-lg">
        <div className="p-6 border-b border-gray-800">
          <Link href={`/swat/dashboard/${agencyId}`}>
            <div className="flex items-center space-x-3 cursor-pointer">
              <Shield className="h-8 w-8 text-[#FFC107]" />
              <span className="font-bold text-xl text-white">
                SWAT Tracking
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <div className="mb-6 px-4 py-3 bg-gray-900 rounded-md border border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FFC107] uppercase tracking-wider">Premium Module</span>
              <Badge variant="outline" className="border-[#FFC107] bg-transparent text-[#FFC107] px-2 text-xs">Active</Badge>
            </div>
            {user?.agencyId && (
              <div className="flex items-center mt-2 text-xs text-gray-400">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                <span>Agency ID: {user.agencyId.substring(0, 8)}...</span>
              </div>
            )}
          </div>
          
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                        isActive 
                          ? "bg-[#FFC107] text-black shadow-md font-semibold" 
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", isActive ? "text-black" : "text-gray-400")} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          
          {/* Interface Switcher */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="px-4 mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Interface</span>
            </div>
            <Link href='/admin/dashboard'>
              <div className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer text-gray-300 hover:bg-gray-800 hover:text-white">
                <div className="h-3 w-3 rounded-full bg-[#FFC107] animate-pulse"></div>
                <span>Switch to Assessment</span>
              </div>
            </Link>
            
            <div className="mt-6 px-4">
              <ThemeToggle className="w-full justify-start bg-gray-900 hover:bg-gray-800 text-gray-300 py-2 px-3 rounded-md border border-gray-800" />
            </div>
          </div>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col ml-64">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-bold tracking-tight text-black flex items-center">
              {currentPage?.icon && <currentPage.icon className="h-5 w-5 mr-2 text-[#FFC107]" />}
              {currentPage?.label || "Operations"}
            </h1>
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}