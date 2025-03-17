import { Bell, User, Search, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";

export const TopBar = () => {
  const { user } = useAuth();
  
  // Function to get user initials for the avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };
  
  return (
    <div className="border-b border-border bg-card/90 backdrop-blur-sm shadow-sm z-10 sticky top-0">
      <div className="flex h-16 items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-yellow-500" />
          <h2 className="text-lg font-bold tracking-tight">SWAT Accreditation</h2>
        </div>
        
        {/* Search input for medium+ screens */}
        <div className="hidden md:flex relative max-w-md w-full mx-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search..." 
            className="pl-9 bg-background/80 border-input focus-visible:ring-yellow-500 focus-visible:border-yellow-500"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative hover:bg-yellow-50 dark:hover:bg-gray-800">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-yellow-500"></span>
          </Button>
          <Avatar className="h-9 w-9 border-2 border-yellow-300/30 shadow-sm">
            {user?.profilePictureUrl ? (
              <AvatarImage src={user.profilePictureUrl} alt={user?.firstName || "User"} />
            ) : (
              <AvatarFallback className="bg-yellow-100 text-yellow-900 font-semibold">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-sm">
            <p className="font-semibold">{user?.firstName || "Administrator"}</p>
            <p className="text-muted-foreground text-xs capitalize">{user?.role || "Administrator"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
