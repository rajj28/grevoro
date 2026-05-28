# GREVORO — Full Dev Stack Launcher
# Run from repo root: .\start-dev.ps1

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

Write-Host "`n[1/5] Checking .env..." -ForegroundColor Cyan
if (-not (Test-Path "$ROOT\.env")) {
    Copy-Item "$ROOT\.env.example" "$ROOT\.env"
    Write-Host "  Created .env from .env.example" -ForegroundColor Yellow
    Write-Host "  IMPORTANT: Review .env and set JWT_SECRET before continuing." -ForegroundColor Red
} else {
    Write-Host "  .env found." -ForegroundColor Green
}

Write-Host "`n[2/5] Starting Docker infra (postgres, redis, mongo)..." -ForegroundColor Cyan
docker compose up -d postgres redis mongo
if ($LASTEXITCODE -ne 0) { Write-Error "Docker failed. Is Docker Desktop running?"; exit 1 }
Write-Host "  Waiting 5s for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n[3/5] Generating Prisma client..." -ForegroundColor Cyan
pnpm exec prisma generate --schema=infra/prisma/schema.prisma
if ($LASTEXITCODE -ne 0) { Write-Error "Prisma generate failed."; exit 1 }

Write-Host "`n[4/5] Running DB migrations..." -ForegroundColor Cyan
pnpm exec prisma migrate deploy --schema=infra/prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "  migrate deploy failed — trying db push..." -ForegroundColor Yellow
    pnpm exec prisma db push --schema=infra/prisma/schema.prisma
}

Write-Host "`n[5/5] Starting dev servers..." -ForegroundColor Cyan
Write-Host "  API  → http://localhost:4000/health" -ForegroundColor White
Write-Host "  Web  → http://localhost:3000" -ForegroundColor White
Write-Host "  Bull → http://localhost:4000/api/admin/queues" -ForegroundColor White
Write-Host "  Press Ctrl+C to stop all.`n" -ForegroundColor Gray

# Start API in background terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT'; pnpm --filter @grevoro/api dev" -WindowStyle Normal

# Start Worker in background terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT'; pnpm --filter @grevoro/worker dev" -WindowStyle Normal

# Start Web in this window
pnpm --filter @grevoro/web dev
