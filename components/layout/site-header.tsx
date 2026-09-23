"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/common/theme-toggle";

const links = [
  ["Estudiar", "/estudiar"],
  ["Tests", "/tests"],
  ["Tarjetas", "/tarjetas"],
  ["Progreso", "/progreso"],
  ["Ajustes", "/ajustes"],
] as const;

function isCurrent(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell header-row">
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <span>Programación Práctica</span>
        </Link>

        <button
          aria-controls="primary-navigation"
          aria-expanded={open}
          aria-label={open ? "Cerrar menú principal" : "Abrir menú principal"}
          className="nav-toggle"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <span aria-hidden="true">{open ? "×" : "☰"}</span>
          <span>Menú</span>
        </button>

        <nav
          aria-label="Navegación principal"
          className={`nav ${open ? "is-open" : ""}`}
          id="primary-navigation"
        >
          <div className="nav-links">
            {links.map(([label, href]) => (
              <Link
                aria-current={isCurrent(pathname, href) ? "page" : undefined}
                href={href}
                key={href}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
