"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const order: Theme[] = ["system", "light", "dark"];
const labels: Record<Theme, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
};

const storageKey = "pp-theme";
const themeChangeEvent = "pp-theme-change";

function isTheme(value: string | null): value is Theme {
  return value !== null && order.includes(value as Theme);
}

function applyTheme(theme: Theme) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
}

function getThemeSnapshot(): Theme {
  const saved = window.localStorage.getItem(storageKey);
  return isTheme(saved) ? saved : "system";
}

function getServerThemeSnapshot(): Theme {
  return "system";
}

function subscribeToTheme(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) {
      listener();
    }
  };

  const onThemeChange = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(themeChangeEvent, onThemeChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(themeChangeEvent, onThemeChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function cycle() {
    const next = order[(order.indexOf(theme) + 1) % order.length];

    window.localStorage.setItem(storageKey, next);
    applyTheme(next);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <button
      className="theme-button"
      onClick={cycle}
      aria-label="Cambiar apariencia"
      type="button"
    >
      Tema: {labels[theme]}
    </button>
  );
}
