import Link from "next/link";
import { ThemeToggle } from "@/components/common/theme-toggle";

const links = [
  ["Estudiar", "/estudiar"],
  ["Tests", "/tests"],
  ["Tarjetas", "/tarjetas"],
  ["Progreso", "/progreso"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-row">
        <Link className="brand" href="/">Programación Práctica <small style={{fontWeight: 500, opacity: .6}}>(provisional)</small></Link>
        <nav className="nav" aria-label="Navegación principal">
          {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/ajustes">Ajustes</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
