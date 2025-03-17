import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Settings, LogOut, User as UserIcon, Bell, ChevronDown } from "lucide-react";

export function UserNav() {
  const { user, logoutMutation } = useAuth();

  // Function to get user initials for the avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const displayName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`
    : user?.email || 'Administrator';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center space-x-2 rounded-md px-2 py-1.5 hover:bg-gray-100 transition-all duration-200">
          <Avatar className="h-8 w-8 border-2 border-[#FFC107]/30 shadow-sm">
            {user?.profilePictureUrl ? (
              <AvatarImage src={user.profilePictureUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-[#FFC107] text-black font-semibold">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col space-y-0">
            <span className="text-sm font-semibold leading-none">{displayName}</span>
            {user?.role && (
              <span className="text-xs text-muted-foreground leading-snug capitalize">{user.role}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-gray-200 shadow-md">
        <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => window.location.href = '/admin/settings'} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
          <UserIcon className="mr-2 h-4 w-4 text-[#FFC107]" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.location.href = '/admin/messaging'} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
          <Bell className="mr-2 h-4 w-4 text-[#FFC107]" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => window.location.href = '/admin/settings'} className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100">
          <Settings className="mr-2 h-4 w-4 text-[#FFC107]" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={() => logoutMutation.mutate()} 
          className="text-red-600 focus:text-red-700 cursor-pointer hover:bg-red-50 focus:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}