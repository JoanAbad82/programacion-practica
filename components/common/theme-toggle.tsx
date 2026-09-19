"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const order: Theme[] = ["system", "light", "dark"];
const labels: Record<Theme, string> = { system: "Sistema", light: "Claro", dark: "Oscuro" };

function applyTheme(theme: Theme) {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = window.localStorage.getItem("pp-theme") as Theme | null;
    const next = saved && order.includes(saved) ? saved : "system";
    setTheme(next);
    applyTheme(next);
  }, []);

  function cycle() {
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
    window.localStorage.setItem("pp-theme", next);
    applyTheme(next);
  }

  return <button className="theme-button" onClick={cycle} aria-label="Cambiar apariencia">Tema: {labels[theme]}</button>;
}
