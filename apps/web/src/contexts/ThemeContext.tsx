"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Theme = "vaporwave" | "clean" | "directory" | "catppuccin";

const THEMES: Theme[] = ["vaporwave", "clean", "directory", "catppuccin"];

function isValidTheme(v: unknown): v is Theme {
  return typeof v === "string" && THEMES.includes(v as Theme);
}

// Get initial theme from data-theme attribute (set by inline script) or localStorage
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "vaporwave";
  
  try {
    // First try to read from data-theme already applied by inline script
    const dataTheme = document.documentElement.getAttribute("data-theme");
    if (dataTheme && isValidTheme(dataTheme)) {
      return dataTheme;
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem("theme");
    if (saved && isValidTheme(saved)) {
      return saved;
    }
  } catch (e) {
    // Ignore errors
  }
  
  return "vaporwave";
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync theme from localStorage on mount (in case it changed in another tab)
    try {
      const savedTheme = localStorage.getItem("theme");
      if (isValidTheme(savedTheme)) {
        // Only update if different from current state
        if (savedTheme !== theme) {
          setThemeState(savedTheme);
          document.documentElement.setAttribute("data-theme", savedTheme);
        }
      } else if (savedTheme) {
        // Invalid theme, reset to default
        localStorage.setItem("theme", "vaporwave");
        setThemeState("vaporwave");
        document.documentElement.setAttribute("data-theme", "vaporwave");
      }
    } catch (error) {
      console.warn("Failed to load theme from localStorage:", error);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue && isValidTheme(e.newValue)) {
        setThemeState(e.newValue);
        document.documentElement.setAttribute("data-theme", e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Always try to save, with retry on failure
    try {
      localStorage.setItem("theme", newTheme);
    } catch (error) {
      console.warn("Failed to save theme to localStorage:", error);
      // Retry after a short delay (may be temporary issue like quota exceeded)
      setTimeout(() => {
        try {
          localStorage.setItem("theme", newTheme);
        } catch (e) {
          // Ignore if still fails
        }
      }, 100);
    }
    
    // Broadcast to other tabs
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "theme",
        newValue: newTheme,
      })
    );
  };

  const toggleTheme = () => {
    const i = THEMES.indexOf(theme);
    setTheme(THEMES[(i + 1) % THEMES.length]);
  };

  // Don't render children until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
