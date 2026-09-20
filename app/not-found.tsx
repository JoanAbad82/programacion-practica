import Link from "next/link";

export default function NotFound() {
  return (
    <section className="system-state" aria-labelledby="pagina-no-encontrada">
      <span className="eyebrow">404</span>
      <h1 id="pagina-no-encontrada">Esta página no existe.</h1>
      <p>
        La dirección puede ser antigua o estar incompleta. Puedes volver al
        inicio o continuar estudiando el Bloque 1.
      </p>
      <div className="actions">
        <Link className="button primary" href="/">Ir al inicio</Link>
        <Link className="button" href="/estudiar">Ir a Estudiar</Link>
      </div>
    </section>
  );
}
