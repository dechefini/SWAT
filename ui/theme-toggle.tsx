import React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "@/hooks/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./tooltip";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={className}>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-9 w-9 rounded-md transition-all duration-200",
                    theme === "dark" && "bg-primary/5 text-primary hover:bg-primary/10",
                    theme === "light" && "bg-primary/5 text-primary hover:bg-primary/10",
                    theme === "system" && "bg-muted hover:bg-muted/80"
                  )}
                >
                  {theme === "light" ? (
                    <Sun className="h-5 w-5" />
                  ) : theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Monitor className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className="bg-popover text-popover-foreground border border-border shadow-md">
              <p>Change theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground border border-border shadow-md">
          <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer hover:bg-accent">
            <Sun className="mr-2 h-4 w-4 text-yellow-500" />
            <span>Light</span>
            {theme === "light" && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer hover:bg-accent">
            <Moon className="mr-2 h-4 w-4 text-indigo-400" />
            <span>Dark</span>
            {theme === "dark" && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer hover:bg-accent">
            <Monitor className="mr-2 h-4 w-4 text-green-500" />
            <span>System</span>
            {theme === "system" && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// This component should be used in places where we want a simple toggle
// between light and dark mode only (no system option)
export function SimpleThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };
  
  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="border-border/50 hover:border-border shadow-sm transition-all duration-200"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-400" />
      )}
    </Button>
  );
}