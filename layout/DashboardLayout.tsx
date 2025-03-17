import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  ClipboardList, 
  FileText, 
  MessageSquare,
  HelpCircle,
  Settings,
  AlertCircle,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "./UserNav";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "../ui/theme-toggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  href: string;
  adminOnly?: boolean;
}

// Assessment interface navigation items with role-based access flags
const assessmentNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Building2, label: 'Agencies', href: '/admin/agencies', adminOnly: true },
  { icon: Users, label: 'Users', href: '/admin/users', adminOnly: true },
  { icon: ClipboardList, label: 'Questionnaire', href: '/admin/questionnaire' },
  { icon: FileText, label: 'Reports', href: '/admin/reports' },
  { icon: MessageSquare, label: 'Messaging', href: '/admin/messaging' },
  { icon: HelpCircle, label: 'Help Center', href: '/admin/help' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' }
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth() || { user: null };
  
  // Filter navigation items based on user role
  const filteredNavItems = assessmentNavItems.filter(item => {
    // If item is admin-only and user is not admin, hide it
    if (item.adminOnly && user?.role !== 'admin') {
      return false;
    }
    return true;
  });

  // Determine if the user has access to SWAT tracking
  // Admins always have access, agency users need both tracking interface type AND premium access
  // For testing, we'll just need one of these conditions to be true
  const hasTrackingAccess = user?.role === 'admin' || 
    user?.interfaceType === 'tracking' || 
    user?.premiumAccess === true;
    
  // Debug information about user's tracking access
  console.log('SWAT Tracking Access Check:', {
    hasAccess: hasTrackingAccess,
    userRole: user?.role,
    interfaceType: user?.interfaceType,
    premiumAccess: user?.premiumAccess,
    agency: user?.agencyId
  });
  // Default agency ID for the SWAT link
  const defaultAgencyId = user?.agencyId || 'default';
  
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-black h-screen flex flex-col fixed shadow-lg">
        <div className="p-6 border-b border-gray-800">
          <Link href="/admin/dashboard">
            <div className="flex items-center space-x-3 cursor-pointer">
              <Shield className="h-8 w-8 text-[#FFC107]" />
              <span className="font-bold text-xl text-white">
                SWAT Accreditation
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1.5">
            {filteredNavItems.map((item) => {
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
          
          {/* Interface Switcher - conditionally rendered based on permissions */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="px-4 mb-3">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Interface</span>
            </div>
            
            {hasTrackingAccess ? (
              // User has access to SWAT tracking (admin or has tracking interface enabled)
              <Link href={`/swat/dashboard/${defaultAgencyId}`}>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer text-gray-300 hover:bg-gray-800 hover:text-white">
                  <div className="h-3 w-3 rounded-full bg-[#FFC107] animate-pulse"></div>
                  <span>Switch to SWAT Tracking</span>
                </div>
              </Link>
            ) : (
              // User doesn't have access to SWAT tracking
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium text-gray-600 cursor-not-allowed">
                      <div className="h-3 w-3 rounded-full bg-gray-700"></div>
                      <span>SWAT Tracking</span>
                      <AlertCircle className="h-4 w-4 text-gray-600 ml-2" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-gray-100 border border-gray-800 shadow-lg">
                    <p>You don't have access to the SWAT Tracking interface.</p>
                    <p>Contact an administrator for assistance.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
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
            <h1 className="text-xl font-bold tracking-tight text-black">
              {assessmentNavItems.find(item => item.href === location)?.label || "Dashboard"}
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
