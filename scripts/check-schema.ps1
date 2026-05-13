$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdGx0bGZ6eGx6Y3Z1aWR0bHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2ODIyNSwiZXhwIjoyMDkzNzQ0MjI1fQ.gm6Fem2Q67TCqLlwHgxRc16OlK8qFyHOiouirMApb-w"
$headers = @{
    "apikey"        = $key
    "Authorization" = "Bearer $key"
    "Content-Type"  = "application/json"
}

Write-Host "Checking if admin_users table exists..."
try {
    $r = Invoke-RestMethod -Uri "https://aitltlfzxlzcvuidtltd.supabase.co/rest/v1/admin_users?select=id,email&limit=5" -Headers $headers
    Write-Host "TABLE EXISTS. Rows found: $($r.Count)"
    $r | ConvertTo-Json
} catch {
    Write-Host "ERROR - table likely missing or RLS blocking:"
    Write-Host $_.ErrorDetails.Message
}
