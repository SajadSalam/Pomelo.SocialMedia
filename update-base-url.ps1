# PowerShell script to update BASE_URL in .env
param(
    [Parameter(Mandatory=$true)]
    [string]$TunnelUrl
)

$envFile = ".env"
$newBaseUrl = "BASE_URL=`"$TunnelUrl`""

# Read .env file
$envContent = Get-Content $envFile -Raw

# Update or add BASE_URL
if ($envContent -match "BASE_URL=") {
    $envContent = $envContent -replace 'BASE_URL="[^"]*"', $newBaseUrl
} else {
    $envContent += "`n$newBaseUrl"
}

# Write back to .env
$envContent | Set-Content $envFile -NoNewline

Write-Host "✅ Updated BASE_URL to: $TunnelUrl" -ForegroundColor Green
Write-Host "⚠️  Please restart your dev server (pnpm dev) for changes to take effect!" -ForegroundColor Yellow

