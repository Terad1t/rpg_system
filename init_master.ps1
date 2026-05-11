# Initialize Master account

$apiUrl = "http://127.0.0.1:8000/api/auth/initialize-master"
$masterData = @{
    login = "master"
    password = "masterpass"
    pin = "1234"
}

Write-Host "Initializing Master account..."
Write-Host "Endpoint: $apiUrl"
Write-Host "Credentials: login=master"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST `
        -Body ($masterData | ConvertTo-Json) `
        -ContentType "application/json" `
        -Headers @{"X-Master-Bootstrap-Token" = "dev-bootstrap-token-change-me"} `
        -TimeoutSec 5
    
    Write-Host "SUCCESS - Master initialized:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "If you see '400 Bad Request' with 'Master already exists', the Master is already created." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next: Try logging in with credentials master/masterpass/1234" -ForegroundColor Cyan
