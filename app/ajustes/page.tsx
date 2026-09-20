import { ThemeToggle } from "@/components/common/theme-toggle";
import { LocalDataControls } from "@/components/settings/local-data-controls";

export default function SettingsPage() {
  return (
    <section className="settings-page">
      <header className="page-header">
        <span className="eyebrow">Preferencias</span>
        <h1>Ajustes</h1>
        <p>
          Controla la apariencia y los datos de aprendizaje que permanecen en
          este navegador.
        </p>
      </header>

      <div className="settings-grid">
        <section className="settings-card" aria-labelledby="apariencia-ajustes">
          <div>
            <span className="eyebrow">Apariencia</span>
            <h2 id="apariencia-ajustes">Claro, oscuro o sistema</h2>
            <p>
              El modo Sistema sigue la preferencia del dispositivo. La elección
              se conserva localmente.
            </p>
          </div>
          <ThemeToggle />
        </section>

        <LocalDataControls />
      </div>
    </section>
  );
}
