"use client";

import { useTheme } from "@/src/contexts/ThemeContext";
import type { Theme } from "@/src/contexts/ThemeContext";

const themeLabel: Record<Theme, string> = {
  vaporwave: "Vaporwave",
  clean: "Clean",
  directory: "Diretório",
  catppuccin: "Catppuccin",
};

const themeIcon: Record<Theme, string> = {
  vaporwave: "🎨",
  clean: "📄",
  directory: "📑",
  catppuccin: "🧋",
};

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      onClick={toggleTheme}
      onKeyDown={handleKeyDown}
      className="theme-toggle"
      aria-label={`Próximo tema (atual: ${themeLabel[theme]})`}
      aria-live="polite"
      title={`Tema atual: ${themeLabel[theme]}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.375rem",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "0.25rem 0.5rem",
        minWidth: "44px",
        minHeight: "44px",
        transition: "opacity 0.2s ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: "0.875rem",
        }}
      >
        {themeIcon[theme]}
      </span>
      <span
        className="hidden sm:inline"
        style={{
          fontSize: "0.625rem",
          fontWeight: "500",
          letterSpacing: "0.05em",
        }}
      >
        THEME
      </span>
    </button>
  );
}
