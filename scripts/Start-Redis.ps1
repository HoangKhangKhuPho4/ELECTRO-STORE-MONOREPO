#Requires -Version 5.1
<#
.SYNOPSIS
  Tao 2 container Redis DOC LAP (standalone, khong gom vao Compose project):
    redis-auth        -> localhost:6379  (auth-service)
    redis-statistics  -> localhost:6380  (statistics-service)

.EXAMPLE
  .\scripts\Start-Redis.ps1

.EXAMPLE
  .\scripts\Start-Redis.ps1 -Down
#>
param(
    [switch]$Down
)

$ErrorActionPreference = 'Stop'

function Get-DockerExe {
    $cmd = Get-Command docker.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\resources\bin\docker.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    throw 'Khong tim thay docker.exe. Mo Docker Desktop roi thu lai.'
}

$docker = Get-DockerExe

if ($Down) {
    Write-Host 'Dang dung / xoa redis-auth + redis-statistics...' -ForegroundColor Yellow
    & $docker rm -f redis-auth redis-statistics 2>$null | Out-Null
    Write-Host 'Da xoa 2 container.' -ForegroundColor Green
    return
}

# Xoa ban cu (compose hoac standalone) roi tao moi doc lap
Write-Host 'Tao lai 2 container Redis doc lap (khong nam trong Compose stack)...' -ForegroundColor Cyan
& $docker rm -f redis-auth redis-statistics 2>$null | Out-Null
& $docker volume create redis-auth-data | Out-Null
& $docker volume create redis-statistics-data | Out-Null

& $docker run -d `
    --name redis-auth `
    -p 6379:6379 `
    -v redis-auth-data:/data `
    --restart unless-stopped `
    redis:7-alpine redis-server --appendonly yes
if ($LASTEXITCODE -ne 0) { throw 'Tao redis-auth that bai.' }

& $docker run -d `
    --name redis-statistics `
    -p 6380:6379 `
    -v redis-statistics-data:/data `
    --restart unless-stopped `
    redis:7-alpine redis-server --appendonly yes
if ($LASTEXITCODE -ne 0) { throw 'Tao redis-statistics that bai.' }

Start-Sleep -Seconds 2
Write-Host ''
Write-Host 'OK — 2 container RIENG, khong chung volume, khong chung Compose group:' -ForegroundColor Green
Write-Host '  redis-auth        -> localhost:6379   volume: redis-auth-data'
Write-Host '  redis-statistics  -> localhost:6380   volume: redis-statistics-data'
Write-Host ''
Write-Host 'Tren Docker Desktop: 2 dong rieng (khong nam trong electro-store-mi...).' -ForegroundColor DarkGray
& $docker ps --filter "name=redis-" --format "table {{.Names}}\t{{.ID}}\t{{.Ports}}\t{{.Status}}"
