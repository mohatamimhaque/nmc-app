import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as XLSX from 'xlsx'

const envPath = resolve(process.cwd(), '.env.local')

if (existsSync(envPath)) {
  const envText = readFileSync(envPath, 'utf8')
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) {
      continue
    }
    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function run() {
  const xlsxPath = resolve(process.cwd(), 'admit_card_urls.xlsx')
  if (!existsSync(xlsxPath)) {
    console.error(`Excel file not found at ${xlsxPath}`)
    process.exit(1)
  }

  console.log('Reading admit_card_urls.xlsx...')
  const workbook = XLSX.readFile(xlsxPath)
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rawData = XLSX.utils.sheet_to_json<any>(worksheet)

  if (!Array.isArray(rawData) || rawData.length === 0) {
    console.error('Invalid Excel file: expected a non-empty list of rows.')
    process.exit(1)
  }

  console.log(`Found ${rawData.length} rows. Mapping and validating...`)

  const updates = rawData
    .filter((row: any) => {
      const serial = row.serial || row.Serial
      return typeof serial === 'string' && serial.trim() !== ''
    })
    .map((row: any) => {
      const serial = String(row.serial || row.Serial).trim()
      const url = String(row.admit_card_url || row.admit_card_url || '').trim()
      return {
        serial,
        admit_card_url: url === '' ? null : url,
      }
    })

  console.log(`Validated ${updates.length} updates. Executing database updates in batches...`)

  const BATCH_SIZE = 150
  let successCount = 0

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE)
    console.log(`Updating batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)...`)

    const { error } = await supabase.rpc('update_admit_cards', {
      updates: batch,
      admin_user: 'system-excel-import',
    })

    if (error) {
      console.error(`Error updating batch starting at index ${i}:`, error.message)
      process.exit(1)
    }

    successCount += batch.length
  }

  console.log(`Update completed successfully! ${successCount} participants updated with admit card URLs.`)
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
