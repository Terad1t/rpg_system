# Test login API endpoint

$apiUrl = "http://127.0.0.1:8000/api/auth/login"
$credentials = @{
    login = "master"
    password = "master123"
    pin = "1234"
}

Write-Host "Testing login endpoint at: $apiUrl"
Write-Host "Payload: $($credentials | ConvertTo-Json)"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body ($credentials | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 5
    Write-Host "SUCCESS - Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Green
} catch {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
