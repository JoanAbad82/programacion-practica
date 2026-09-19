# Programación Práctica (nombre provisional)

Bootstrap independiente para una plataforma educativa de Python y PowerShell.

## Phase 1

- Next.js + React + TypeScript.
- Tailwind configurado.
- Rutas base: Estudiar, Tests, Tarjetas, Progreso y Ajustes.
- Modo claro/oscuro/sistema.
- Tipos y JSON Schemas de contenido/progreso.
- Manifiesto canónico del Bloque 1.
- Guardarraíl de independencia entre proyectos.
- Tests de bootstrap sin dependencias externas.
- Scripts Windows `START_HERE.cmd` y PowerShell.

## Validación completa local

Ejecutar `START_HERE.cmd` en Windows. Instala las dependencias, genera `package-lock.json` y ejecuta validación, lint, typecheck, tests y build.

## Publicación GitHub

Después de validar y con GitHub CLI autenticado:

`pwsh -File .\scripts\PUBLISH_TO_GITHUB.ps1`

El repositorio se crea privado por defecto. El slug y el branding son provisionales y pueden renombrarse antes de la publicación V1.

## Contenido

Phase 2 importará el material ya aprobado: 12 unidades, 56 conceptos, 200 preguntas y 80 flashcards.
