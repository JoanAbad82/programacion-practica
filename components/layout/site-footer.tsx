import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-row">
        <p>
          Programación Práctica · aprendizaje local, sin generación de contenido
          por IA en tiempo real.
        </p>
        <nav aria-label="Navegación secundaria">
          <Link href="/progreso">Progreso</Link>
          <Link href="/ajustes">Ajustes</Link>
        </nav>
      </div>
    </footer>
  );
}
