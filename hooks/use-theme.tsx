import React, { useContext, useEffect, useState } from "react";
import { Theme, ThemeContext, ThemeContextType } from "../contexts/theme-context";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light");
  
  // Function to save theme preference to user settings
  const saveThemePreference = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && user.id) {
        const response = await fetch(`/api/users/${user.id}/preferences`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ theme })
        });
        
        if (!response.ok) {
          throw new Error("Failed to save theme preference");
        }
      }
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };
  
  // Initialize theme from user preferences or localStorage
  useEffect(() => {
    // First check localStorage
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    
    // Remove any existing theme classes
    document.documentElement.classList.remove("light", "dark");
    
    if (savedTheme) {
      setTheme(savedTheme);
      
      if (savedTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", systemTheme);
        document.documentElement.classList.add(systemTheme);
      } else {
        document.documentElement.setAttribute("data-theme", savedTheme);
        document.documentElement.classList.add(savedTheme);
      }
    } else {
      // Default to light mode
      setTheme("light");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, []);
  
  // Apply theme changes
  useEffect(() => {
    // Remove current theme class first
    document.documentElement.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", systemTheme);
      document.documentElement.classList.add(systemTheme);
      
      // Add a listener for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const newTheme = mediaQuery.matches ? "dark" : "light";
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      document.documentElement.setAttribute("data-theme", theme);
      document.documentElement.classList.add(theme);
    }
    
    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, saveThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}