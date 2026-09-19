$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
Write-Host "=== PROGRAMACION PRACTICA / PHASE 1 ==="
Write-Host "Root: $Root"
node --version
npm --version
npm install
npm run validate:bootstrap
npm run lint
npm run typecheck
npm test
npm run build
Write-Host ""
Write-Host "PHASE1_LOCAL_VALIDATION=PASS"
Write-Host "HEAD=$(git rev-parse HEAD 2>$null)"
Write-Host "TREE=$(git rev-parse HEAD^{tree} 2>$null)"
