$url = "https://aitltlfzxlzcvuidtltd.supabase.co/rest/v1/admin_users"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpdGx0bGZ6eGx6Y3Z1aWR0bHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2ODIyNSwiZXhwIjoyMDkzNzQ0MjI1fQ.gm6Fem2Q67TCqLlwHgxRc16OlK8qFyHOiouirMApb-w"

$headers = @{
  "apikey"        = $key
  "Authorization" = "Bearer $key"
  "Content-Type"  = "application/json"
  "Prefer"        = "resolution=ignore-duplicates"
}

$body = '[{"id":"00000000-0000-0000-0000-000000000010","email":"mohatamimhaque@outlook.com","role":"super_admin"}]'

try {
  $response = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $body
  Write-Host "SUCCESS: admin_users row inserted"
  $response | ConvertTo-Json
} catch {
  Write-Host "ERROR: $($_.Exception.Message)"
  Write-Host $_.ErrorDetails.Message
}
