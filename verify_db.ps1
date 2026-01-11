# Load .env file
$envContent = Get-Content .env
$envVars = @{}
foreach ($line in $envContent) {
    if ($line -match "^(.*?)=(.*)$") {
        $key = $matches[1]
        $value = $matches[2].Trim('"')
        $envVars[$key] = $value
    }
}

$url = $envVars["SUPABASE_URL"]
$key = $envVars["SUPABASE_ANON_KEY"]
if (-not $key) { $key = $envVars["VITE_SUPABASE_ANON_KEY"] }

Write-Host "Checking Supabase Connection..."
# Write-Host "URL: $url" # Debug only

if (-not $url -or -not $key) {
    Write-Error "Missing SUPABASE_URL or Key in .env"
    exit 1
}

# Query exact count of rows in 'profiles' (lightweight)
$headers = @{
    "apikey"        = $key
    "Authorization" = "Bearer $key"
}

try {
    $response = Invoke-RestMethod -Uri "$url/rest/v1/profiles?select=count" -Method Head -Headers $headers -ErrorAction Stop
    Write-Host "Connection Successful! 'profiles' table is accessible."
}
catch {
    Write-Error "Connection Failed: $_"
    exit 1
}
