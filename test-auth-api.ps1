# Test authentication API endpoints
# Usage: Run this in PowerShell to test signup, login, logout, and get current user

$baseUrl = "http://localhost:3001"

# Colors for output
$success = "Green"
$error = "Red"
$info = "Cyan"

Write-Host "🚀 Testing Invoice App Authentication API`n" -ForegroundColor $info

# TEST 1: SIGNUP
Write-Host "1️⃣  Testing SIGNUP..." -ForegroundColor $info

$signupData = @{
    email = "john@example.com"
    username = "johndoe"
    password = "MyPassword123!"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/signup" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $signupData `
        -SkipHttpErrorCheck

    $signupBody = $signupResponse.Content | ConvertFrom-Json
    
    if ($signupResponse.StatusCode -eq 201) {
        Write-Host "✅ Signup successful!" -ForegroundColor $success
        Write-Host "Response: $(ConvertTo-Json $signupBody)" -ForegroundColor $success
    } else {
        Write-Host "❌ Signup failed!" -ForegroundColor $error
        Write-Host "Response: $(ConvertTo-Json $signupBody)" -ForegroundColor $error
    }
} catch {
    Write-Host "❌ Signup error: $_" -ForegroundColor $error
}

# Get token from signup response
$token = $signupResponse.Headers['Set-Cookie']

Write-Host "`n2️⃣  Testing LOGIN..." -ForegroundColor $info

$loginData = @{
    email = "john@example.com"
    password = "MyPassword123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body $loginData `
        -SkipHttpErrorCheck

    $loginBody = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "✅ Login successful!" -ForegroundColor $success
        Write-Host "Response: $(ConvertTo-Json $loginBody)" -ForegroundColor $success
    } else {
        Write-Host "❌ Login failed!" -ForegroundColor $error
        Write-Host "Response: $(ConvertTo-Json $loginBody)" -ForegroundColor $error
    }
} catch {
    Write-Host "❌ Login error: $_" -ForegroundColor $error
}

Write-Host "`n3️⃣  Testing GET CURRENT USER..." -ForegroundColor $info

try {
    $meResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" `
        -Method GET `
        -SkipHttpErrorCheck

    $meBody = $meResponse.Content | ConvertFrom-Json
    
    if ($meResponse.StatusCode -eq 200) {
        Write-Host "✅ Get current user successful!" -ForegroundColor $success
        Write-Host "Response: $(ConvertTo-Json $meBody)" -ForegroundColor $success
    } else {
        Write-Host "❌ Get current user failed!" -ForegroundColor $error
        Write-Host "Response: $(ConvertTo-Json $meBody)" -ForegroundColor $error
    }
} catch {
    Write-Host "❌ Get current user error: $_" -ForegroundColor $error
}

Write-Host "`n4️⃣  Testing LOGOUT..." -ForegroundColor $info

try {
    $logoutResponse = Invoke-WebRequest -Uri "$baseUrl/api/auth/logout" `
        -Method POST `
        -SkipHttpErrorCheck

    $logoutBody = $logoutResponse.Content | ConvertFrom-Json
    
    if ($logoutResponse.StatusCode -eq 200) {
        Write-Host "✅ Logout successful!" -ForegroundColor $success
        Write-Host "Response: $(ConvertTo-Json $logoutBody)" -ForegroundColor $success
    } else {
        Write-Host "❌ Logout failed!" -ForegroundColor $error
        Write-Host "Response: $(ConvertTo-Json $logoutBody)" -ForegroundColor $error
    }
} catch {
    Write-Host "❌ Logout error: $_" -ForegroundColor $error
}

Write-Host "`n✅ API Testing Complete!" -ForegroundColor $success
