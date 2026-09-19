param(
  [string]$Owner = "JoanAbad82",
  [string]$Repo = "programacion-practica",
  [switch]$Public
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw "GitHub CLI (gh) no esta instalado o no esta en PATH." }
$visibility = if ($Public) { "--public" } else { "--private" }
& gh auth status
& gh repo create "$Owner/$Repo" $visibility --source . --remote origin --push
Write-Host "PUBLISHED=https://github.com/$Owner/$Repo"
