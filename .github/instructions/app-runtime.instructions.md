---
applyTo: "app/**,components/**,lib/**"
---

For application/runtime code:
- preserve Next.js static export;
- do not introduce SSR/server actions/runtime backend dependencies;
- preserve deterministic quiz/session seeds and reproducibility;
- preserve local progress compatibility or provide explicit migration handling;
- use existing tests and helpers before adding parallel logic.
