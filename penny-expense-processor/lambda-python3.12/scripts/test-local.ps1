# Penny Expense Processor - Local Testing Script (PowerShell)
# Este script ejecuta la Lambda localmente para testing

$ErrorActionPreference = "Stop"

Write-Host "🧪 Penny Expense Processor - Local Test" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Check if event file is provided
if ($args.Count -eq 0) {
    Write-Host "Usage: .\test-local.ps1 <event-file>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\test-local.ps1 events/sqs-event.json"
    Write-Host "  .\test-local.ps1 events/test-event.json"
    exit 1
}

$EventFile = $args[0]

if (-not (Test-Path $EventFile)) {
    Write-Host "❌ Error: Event file not found: $EventFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Building application..." -ForegroundColor Yellow
sam build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Invoking Lambda locally with event: $EventFile" -ForegroundColor Yellow
Write-Host ""

# Invoke locally
sam local invoke `
    -e $EventFile `
    --log-file local-test.log

Write-Host ""
Write-Host "📝 Full logs saved to: local-test.log" -ForegroundColor Cyan
Write-Host ""

