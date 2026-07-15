import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8')
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue
    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const baseUrl = 'http://localhost:3000'

async function run() {
  const email = 'testadmin@example.com'
  const password = 'testpassword123'

  console.log(`1. Testing Auth Login...`)
  const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!loginRes.ok) {
    console.error(`Login failed: ${loginRes.status} ${loginRes.statusText}`)
    const text = await loginRes.text()
    console.error(text)
    process.exit(1)
  }

  const loginData = await loginRes.json()
  console.log(`Login successful! Admin: ${loginData.user.display_name || loginData.user.email}`)
  const token = loginData.session.access_token
  const authHeader = `Bearer ${token}`

  console.log(`\n2. Testing GET registrations (all list)...`)
  const listRes = await fetch(`${baseUrl}/api/admin/registrations`, {
    headers: { 'Authorization': authHeader }
  })
  if (!listRes.ok) {
    console.error(`List failed: ${listRes.status}`)
    process.exit(1)
  }
  const registrations = await listRes.json()
  console.log(`Retrieved ${registrations.length} registrations.`)

  if (registrations.length === 0) {
    console.warn(`No registrations found in database to perform update tests.`)
    process.exit(0)
  }

  // Pick first registration serial for testing updates
  const testSerial = registrations[0].serial
  console.log(`Using serial "${testSerial}" for testing status updates.`)

  // Test PATCH kit
  console.log(`\n3. Testing PATCH kit status...`)
  const kitRes = await fetch(`${baseUrl}/api/admin/registrations/kit`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      serial: testSerial,
      is_kit_coollect: true
    })
  })
  if (!kitRes.ok) {
    console.error(`PATCH kit failed: ${kitRes.status}`)
    console.error(await kitRes.text())
  } else {
    console.log(`PATCH kit succeeded:`, await kitRes.json())
  }

  // Test PATCH present
  console.log(`\n4. Testing PATCH presence status...`)
  const presentRes = await fetch(`${baseUrl}/api/admin/registrations/present`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      serial: testSerial,
      is_present: true
    })
  })
  if (!presentRes.ok) {
    console.error(`PATCH presence failed: ${presentRes.status}`)
    console.error(await presentRes.text())
  } else {
    console.log(`PATCH presence succeeded:`, await presentRes.json())
  }

  // Test PATCH launch
  console.log(`\n5. Testing PATCH launch status...`)
  const launchRes = await fetch(`${baseUrl}/api/admin/registrations/launch`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    },
    body: JSON.stringify({
      serial: testSerial,
      is_collect_launch: true
    })
  })
  if (!launchRes.ok) {
    console.error(`PATCH launch failed: ${launchRes.status}`)
    console.error(await launchRes.text())
  } else {
    console.log(`PATCH launch succeeded:`, await launchRes.json())
  }

  // Test GET summary/statistics
  console.log(`\n6. Testing GET registration summary (new endpoint)...`)
  const summaryRes = await fetch(`${baseUrl}/api/admin/registrations/summary`, {
    headers: { 'Authorization': authHeader }
  })
  if (!summaryRes.ok) {
    console.error(`GET summary failed: ${summaryRes.status}`)
    console.error(await summaryRes.text())
  } else {
    console.log(`GET summary succeeded. Statistics:`, JSON.stringify(await summaryRes.json(), null, 2))
  }

  // Test GET single registration
  console.log(`\n7. Testing GET single registration (new endpoint)...`)
  const singleRes = await fetch(`${baseUrl}/api/admin/registrations/single?serial=${testSerial}`, {
    headers: { 'Authorization': authHeader }
  })
  if (!singleRes.ok) {
    console.error(`GET single registration failed: ${singleRes.status}`)
    console.error(await singleRes.text())
  } else {
    console.log(`GET single registration succeeded:`, JSON.stringify(await singleRes.json(), null, 2))
  }
}

run().catch(console.error)
