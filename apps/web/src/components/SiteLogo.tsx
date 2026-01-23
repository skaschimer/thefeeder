"use client";

import { useTheme } from "@/src/contexts/ThemeContext";

interface SiteLogoProps {
  className?: string;
  alt?: string;
}

export function SiteLogo({ className, alt = "The Feeder Logo" }: SiteLogoProps) {
  const { theme } = useTheme();
  const src = theme === "catppuccin" ? "/cat.png" : "/logo.png";
  return <img src={src} alt={alt} className={className} />;
}
