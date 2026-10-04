# Security Policy

## Scope

Programación Práctica is a static learning application. Production uses a static export with no application backend, account system, or required runtime API.

## Reporting

Do not open public issues containing credentials, private data, access tokens, or sensitive information. Report sensitive security concerns privately to the repository owner.

## Data model

Study progress, quiz history, flashcard history, and theme preferences are stored locally in the browser. The application does not provide cross-device synchronization or server-side account storage.

## Dependency and content safety

- Treat dependency upgrades as code changes and validate them with the repository QA gates.
- Do not introduce runtime LLM/API dependencies without an explicit architecture decision.
- Treat imported learning material and generated content as untrusted until validated against the repository schemas and content validators.

## Supported state

The current default branch and published releases are the supported public surfaces. Historical release artifacts may not include later validation improvements.
