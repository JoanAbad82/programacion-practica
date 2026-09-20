"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const storageKey = "pp-theme";
const changeEvent = "pp-theme-change";
const themes: Theme[] = ["system", "light", "dark"];

function isTheme(value: string | null): value is Theme {
  return value !== null && themes.includes(value as Theme);
}

function getSnapshot(): Theme {
  const saved = window.localStorage.getItem(storageKey);
  return isTheme(saved) ? saved : "system";
}

function getServerSnapshot(): Theme {
  return "system";
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) listener();
  };
  const onLocalChange = () => listener();

  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onLocalChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onLocalChange);
  };
}

function applyTheme(theme: Theme) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <label className="theme-control">
      <span>Tema</span>
      <select
        aria-label="Apariencia de la aplicación"
        onChange={(event) => {
          const next = event.target.value as Theme;
          window.localStorage.setItem(storageKey, next);
          applyTheme(next);
          window.dispatchEvent(new Event(changeEvent));
        }}
        value={theme}
      >
        <option value="system">Sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Oscuro</option>
      </select>
    </label>
  );
}
