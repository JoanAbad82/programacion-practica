# Programación Práctica — Release Candidate 1

**Versión:** `0.1.0-rc.1`

> Nota V1: este documento describe el candidato `0.1.0-rc.1` y se conserva como
> registro histórico. La versión estable es **1.0.0**; consulta
> [`docs/V1_PUBLICATION_REPORT.md`](docs/V1_PUBLICATION_REPORT.md) para el
> informe de publicación y la puerta de Cloudflare Pages.

## Alcance

Este candidato contiene el Bloque 1 completo de **Fundamentos y Comandos Básicos**
con experiencia de estudio, 200 preguntas, 80 tarjetas, progreso unificado,
modos adaptativos y una interfaz responsive y accesible.

## Puerta de aceptación

RC1 solo puede considerarse preparado cuando pasan conjuntamente:

- integridad del contenido canónico;
- Study Experience;
- Quiz Engine;
- Flashcards Engine;
- Progress & Mastery;
- UX / Responsive / Accessibility;
- QA final;
- lint;
- TypeScript;
- toda la suite automatizada;
- dos builds limpios con la misma superficie de rutas;
- smoke test HTTP sobre las rutas principales y los estados de error;
- inventario SHA-256 del código fuente del candidato;
- worktree Git limpio tras el commit.

## Persistencia

El progreso permanece únicamente en `localStorage` del navegador mediante tres
espacios versionados e independientes:

- `pp-study-progress-v1`
- `pp-quiz-history-v1`
- `pp-flashcard-history-v1`

La preferencia visual `pp-theme` es independiente y no se borra al reiniciar
el progreso educativo.

## Limitaciones conocidas de RC1

- El progreso no se sincroniza entre navegadores o dispositivos.
- No hay cuentas de usuario ni backend.
- No se ejecuta código Python o PowerShell dentro de la aplicación.
- El contenido disponible corresponde únicamente al Bloque 1.
- No existe uso de LLM o IA en tiempo de ejecución.
- Borrar los datos del navegador elimina el progreso local.

RC1 es un candidato para validación final, no una declaración de release estable.
