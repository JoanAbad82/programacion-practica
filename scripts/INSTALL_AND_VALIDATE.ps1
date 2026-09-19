$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
    $PSNativeCommandUseErrorActionPreference = $true
}

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "=== PROGRAMACION PRACTICA / PHASE 1 FINAL VALIDATION ==="
Write-Host "Root: $Root"

node --version
npm --version

Write-Host ""
Write-Host "--- npm install ---"
npm install

Write-Host ""
Write-Host "--- bootstrap validator ---"
npm run validate:bootstrap

Write-Host ""
Write-Host "--- lint ---"
npm run lint

Write-Host ""
Write-Host "--- typecheck ---"
npm run typecheck

Write-Host ""
Write-Host "--- tests ---"
npm test

Write-Host ""
Write-Host "--- production build ---"
npm run build

$TsBuildInfo = Join-Path $Root "tsconfig.tsbuildinfo"
if (Test-Path $TsBuildInfo) {
    Remove-Item $TsBuildInfo -Force
}

Write-Host ""
Write-Host "--- post-build bootstrap validator ---"
npm run validate:bootstrap

# Only legitimate Phase-1 normalization/toolchain files are staged.
$stageCandidates = @(
    "package.json",
    "package-lock.json",
    ".gitignore",
    "scripts/validate-bootstrap.mjs",
    "scripts/INSTALL_AND_VALIDATE.ps1",
    "tsconfig.json",
    "next-env.d.ts",
    "PHASE1_STATUS.md"
)

$existingCandidates = @(
    $stageCandidates | Where-Object { Test-Path (Join-Path $Root $_) }
)

if ($existingCandidates.Count -gt 0) {
    git add -- $existingCandidates
}

$staged = @(git diff --cached --name-only)

if ($staged.Count -gt 0) {
    git commit -m "fix: stabilize phase 1 bootstrap validation"
}

$Head = (git rev-parse HEAD).Trim()
$Tree = (git rev-parse 'HEAD^{tree}').Trim()
$Status = @(git status --porcelain)

Write-Host ""
Write-Host "============================================================"
Write-Host " PHASE 1 FINAL RESULT"
Write-Host "============================================================"
Write-Host "PHASE1_LOCAL_VALIDATION=PASS"
Write-Host "HEAD=$Head"
Write-Host "TREE=$Tree"

if ($Status.Count -eq 0) {
    Write-Host "STATUS=CLEAN"
    Write-Host "PHASE1_STATUS=CLOSED_PASS"
} else {
    Write-Host "STATUS=DIRTY"
    $Status | ForEach-Object { Write-Host $_ }
    Write-Host "PHASE1_STATUS=NOT_CLOSED"
    exit 2
}
