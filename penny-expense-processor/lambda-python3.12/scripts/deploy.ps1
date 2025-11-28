# Penny Expense Processor - Deployment Script (PowerShell)
# Este script automatiza el build y deployment de Lambda #2

$ErrorActionPreference = "Stop"

Write-Host "🚀 Penny Expense Processor - Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if samconfig.toml exists
if (-not (Test-Path "samconfig.toml")) {
    Write-Host "❌ Error: samconfig.toml no encontrado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Copia samconfig.toml.example a samconfig.toml y configura los parámetros:"
    Write-Host "  Copy-Item samconfig.toml.example samconfig.toml"
    Write-Host "  # Edita samconfig.toml con tus valores"
    exit 1
}

# Build
Write-Host ""
Write-Host "📦 Building application..." -ForegroundColor Yellow
sam build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Deploy
Write-Host ""
Write-Host "🚀 Deploying to AWS..." -ForegroundColor Yellow

if ($args[0] -eq "--guided") {
    sam deploy --guided
} else {
    sam deploy
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""

# Get stack outputs
Write-Host "📊 Stack Outputs:" -ForegroundColor Cyan
aws cloudformation describe-stacks `
    --stack-name penny-expense-processor `
    --query 'Stacks[0].Outputs' `
    --output table

Write-Host ""
Write-Host "🎉 Lambda #2 deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Verify Lambda #1 (webhook) is sending messages to SQS"
Write-Host "  2. Send a test image to your Telegram bot"
Write-Host "  3. Check CloudWatch logs:"
Write-Host "     aws logs tail /aws/lambda/penny-expense-processor --follow"
Write-Host ""

