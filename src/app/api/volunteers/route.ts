import { NextResponse } from 'next/server'
import { isPageVisible } from '@/lib/visibility'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateRandomId(): string {
  let value = ''
  for (let i = 0; i < 8; i += 1) {
    value += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return value
}

async function generateVolunteerUniqueId(supabase: any): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const value = generateRandomId()
    const { data } = await supabase
      .from('volunteers')
      .select('unique_id')
      .eq('unique_id', value)
      .maybeSingle()
    if (!data) return value
  }
  return `V-${Date.now()}`.slice(-8)
}

async function generateNextSerialNo(supabase: any): Promise<string> {
  const { data } = await supabase
    .from('volunteers')
    .select('serial_no')
    .like('serial_no', 'NMC26-V-%')
    .order('serial_no', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data && data.serial_no) {
    const match = data.serial_no.match(/^NMC26-V-(\d+)$/)
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1
      return `NMC26-V-${String(nextNum).padStart(3, '0')}`
    }
  }
  return 'NMC26-V-001'
}

/**
 * POST /api/volunteers
 * Public endpoint to register a volunteer.
 * Only works if page_visibility "volunteer_add_modal" is set to true by admin/superadmin.
 */
export async function POST(request: Request) {
  const isAllowed = await isPageVisible('volunteer_add_modal')
  if (!isAllowed) {
    return NextResponse.json({ error: 'Volunteer registration is currently closed.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      email,
      number,
      image_url,
      segment,
      department,
      student_id,
      year,
      t_shirt_size,
    } = body

    if (!name || !number) {
      return NextResponse.json({ error: 'Name and Phone Number are required.' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const cleanEmail = email && String(email).trim()
      ? String(email).trim().toLowerCase()
      : `${String(number).trim()}@volunteers.nmcbd.app`

    // Check if volunteer email already exists
    const { data: existingVol } = await supabase
      .from('volunteers')
      .select('unique_id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingVol) {
      return NextResponse.json({ error: 'A volunteer with this email address has already registered.' }, { status: 400 })
    }

    // Check if volunteer phone number already exists
    const { data: existingVolPhone } = await supabase
      .from('volunteers')
      .select('unique_id')
      .eq('number', String(number).trim())
      .maybeSingle()

    if (existingVolPhone) {
      return NextResponse.json({ error: 'A volunteer with this phone number has already registered.' }, { status: 400 })
    }

    const finalUniqueId = await generateVolunteerUniqueId(supabase)
    const finalSerialNo = await generateNextSerialNo(supabase)

    const { data, error } = await supabase
      .from('volunteers')
      .insert({
        unique_id: finalUniqueId,
        serial_no: finalSerialNo,
        name: String(name).trim(),
        email: cleanEmail,
        number: number ? String(number).trim() : null,
        image_url: image_url ? String(image_url).trim() : null,
        segment: segment ? String(segment).trim() : null,
        department: department ? String(department).trim() : null,
        student_id: student_id ? String(student_id).trim() : null,
        year: year ? String(year).trim() : null,
        t_shirt_size: t_shirt_size ? String(t_shirt_size).trim() : null,
        is_present: false,
        is_gift_collected: false,
        is_lunch_collected: false,
        updated_by: 'Public Registration',
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-create credentials for the volunteer
    try {
      const service = createServiceClient()

      // Check if user already exists in admin_users or auth
      const { data: existingUser } = await service
        .from('admin_users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle()

      let userId = existingUser?.id

      if (!userId) {
        const { data: authData, error: authError } = await service.auth.admin.createUser({
          email: cleanEmail,
          password: '12345678',
          email_confirm: true,
        })

        if (!authError && authData?.user) {
          userId = authData.user.id
        } else {
          console.warn('Supabase auth createUser warning:', authError?.message)
        }
      }

      if (userId) {
        await service
          .from('admin_users')
          .upsert({
            id: userId,
            email: cleanEmail,
            role: 'volunteer',
            display_name: String(name).trim(),
          })
      }
    } catch (authCreateErr) {
      console.error('Failed to create volunteer auth credentials:', authCreateErr)
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
