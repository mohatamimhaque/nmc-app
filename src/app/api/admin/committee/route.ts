import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import JSZip from 'jszip'
import sharp from 'sharp'
import * as XLSX from 'xlsx'
import { requireAdminRole } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const {
	R2_ACCOUNT_ID,
	R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY,
	R2_BUCKET_NAME,
	R2_PUBLIC_URL,
} = process.env

const MAX_OUTPUT_SIZE_BYTES = 1 * 1024 * 1024
const MAX_IMAGE_WIDTH = 2400

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_')

const getR2Client = () => {
	if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
		throw new Error('Missing R2 configuration in environment variables.')
	}

	return new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		},
	})
}

const parseBoolean = (value: unknown, defaultValue = true) => {
	if (value === undefined || value === null || value === '') return defaultValue
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return value !== 0
	const text = String(value).trim().toLowerCase()
	if (['false', '0', 'no', 'n'].includes(text)) return false
	if (['true', '1', 'yes', 'y'].includes(text)) return true
	return defaultValue
}

const findZipEntry = (zip: JSZip, filename: string) => {
	const cleaned = filename.replace(/\\/g, '/').replace(/^\/+/, '')
	let entry = zip.file(cleaned)
	if (entry) return entry
	const lower = cleaned.toLowerCase()
	return Object.values(zip.files).find(file => file.name.toLowerCase().endsWith(lower)) ?? null
}

const compressImage = async (buffer: Buffer, extension: string) => {
	let quality = 82
	let pipeline = sharp(buffer)
		.rotate()
		.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })

	const encode = async (q: number) => {
		if (extension === 'png') {
			return pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer()
		}
		if (extension === 'webp') {
			return pipeline.webp({ quality: q }).toBuffer()
		}
		return pipeline.jpeg({ quality: q, mozjpeg: true }).toBuffer()
	}

	let output = await encode(quality)
	while (output.length > MAX_OUTPUT_SIZE_BYTES && quality > 40 && extension !== 'png') {
		quality -= 8
		output = await encode(quality)
	}

	return output
}

const uploadToR2 = async (buffer: Buffer, filename: string, extension: string) => {
	const client = getR2Client()
	const objectKey = `committee/${Date.now()}-${sanitizeFilename(filename)}.${extension}`
	const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'

	await client.send(
		new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: objectKey,
			Body: buffer,
			ContentType: contentType,
			CacheControl: 'public, max-age=31536000, immutable',
		})
	)

	const baseUrl = R2_PUBLIC_URL ?? `https://${R2_BUCKET_NAME}.r2.dev`
	return `${baseUrl}/${objectKey}`
}

export async function PATCH(request: Request) {
	const guard = await requireAdminRole(['super_admin', 'admin'])
	if ('response' in guard) {
		return guard.response
	}

	const body = await request.json().catch(() => null)
	const subCommitteesInput = Array.isArray(body?.subCommittees) ? body.subCommittees : []
	const membersInput = Array.isArray(body?.members) ? body.members : []

	const { supabase } = guard

	const { error: deleteMembersError } = await supabase
		.from('committee_members')
		.delete()
		.gte('sort_order', 0)

	if (deleteMembersError) {
		return NextResponse.json({ error: deleteMembersError.message }, { status: 400 })
	}

	const { error: deleteSubCommitteesError } = await supabase
		.from('sub_committees')
		.delete()
		.gte('sort_order', 0)

	if (deleteSubCommitteesError) {
		return NextResponse.json({ error: deleteSubCommitteesError.message }, { status: 400 })
	}

	const subCommittees = subCommitteesInput
		.filter((item: any) => item?.id)
		.map((item: any, index: number) => ({
			id: String(item.id),
			name: String(item.name ?? 'Untitled Sub-Committee'),
			display_label: item?.display_label ? String(item.display_label) : null,
			is_visible: item?.is_visible !== false,
			sort_order: index + 1,
		}))

	if (subCommittees.length) {
		const { error } = await supabase.from('sub_committees').insert(subCommittees)
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 })
		}
	}

	const members = membersInput
		.filter((item: any) => item?.id && item?.sub_committee_id)
		.map((item: any, index: number) => ({
			id: String(item.id),
			sub_committee_id: String(item.sub_committee_id),
			name: item?.name ? String(item.name) : null,
			role: item?.role ? String(item.role) : null,
			designation: item?.designation ? String(item.designation) : null,
			department: item?.department ? String(item.department) : null,
			photo_url: item?.photo_url ? String(item.photo_url) : null,
			email: item?.email ? String(item.email) : null,
			phone: item?.phone ? String(item.phone) : null,
			facebook_url: item?.facebook_url ? String(item.facebook_url) : null,
			linkedin_url: item?.linkedin_url ? String(item.linkedin_url) : null,
			show_email: item?.show_email === true,
			show_phone: item?.show_phone === true,
			is_visible: item?.is_visible !== false,
			is_disabled: item?.is_disabled === true,
			sort_order: index + 1,
		}))

	if (members.length) {
		const { error } = await supabase.from('committee_members').insert(members)
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 })
		}
	}

	return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
	try {
		const guard = await requireAdminRole(['super_admin', 'admin'])
		if ('response' in guard) {
			return guard.response
		}

		const formData = await request.formData()
		const xlsxFile = formData.get('xlsx')
		const zipFile = formData.get('zip')

		if (!(xlsxFile instanceof File) || !(zipFile instanceof File)) {
			return NextResponse.json({ error: 'Both .xlsx and .zip files are required.' }, { status: 400 })
		}

		const workbook = XLSX.read(Buffer.from(await xlsxFile.arrayBuffer()), { type: 'buffer' })
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

		const zip = await JSZip.loadAsync(Buffer.from(await zipFile.arrayBuffer()))

		const { supabase } = guard
		const { data: existingSubCommittees, error: subCommitteesError } = await supabase
			.from('sub_committees')
			.select('id, name, display_label, is_visible, sort_order')
			.order('sort_order', { ascending: true })

		if (subCommitteesError) {
			return NextResponse.json({ error: subCommitteesError.message }, { status: 400 })
		}

		const subCommitteesByKey = new Map<string, {
			id: string
			name: string
			display_label: string | null
			is_visible: boolean
			sort_order: number
		}>()

		const existingList = existingSubCommittees ?? []
		let maxSortOrder = existingList.reduce((max, item) => Math.max(max, item.sort_order ?? 0), 0)

		existingList.forEach(item => {
			const key = normalizeKey(item.name)
			if (!subCommitteesByKey.has(key)) {
				subCommitteesByKey.set(key, item)
			}
		})

		let photosMatched = 0
		let skipped = 0
		let createdSubCommittees: typeof existingList = []
		const pendingSubCommitteeNames = new Map<string, string>()

		const normalizedRows = rawRows.map(rawRow => normalizeExcelRow(rawRow))
		const rowSubCommitteeNames = normalizedRows
			.map(row => getSubCommitteeName(row))
			.filter(Boolean)
			.map(name => String(name))

		rowSubCommitteeNames.forEach(name => {
			const key = normalizeKey(name)
			if (!subCommitteesByKey.has(key) && !pendingSubCommitteeNames.has(key)) {
				pendingSubCommitteeNames.set(key, name)
			}
		})

		if (pendingSubCommitteeNames.size) {
			const newSubCommittees = Array.from(pendingSubCommitteeNames.values()).map(name => {
				maxSortOrder += 1
				return {
					id: randomUUID(),
					name: name.trim() || 'Untitled Sub-Committee',
					display_label: null,
					is_visible: true,
					sort_order: maxSortOrder,
				}
			})

			const { error } = await supabase
				.from('sub_committees')
				.insert(newSubCommittees)

			if (error) {
				return NextResponse.json({ error: error.message }, { status: 400 })
			}

			createdSubCommittees = newSubCommittees
			createdSubCommittees.forEach(item => {
				const key = normalizeKey(item.name)
				if (!subCommitteesByKey.has(key)) {
					subCommitteesByKey.set(key, item)
				}
			})
		}

		const requestedSubCommitteeIds = Array.from(new Set(
			normalizedRows
				.map(row => {
					const name = getSubCommitteeName(row)
					if (!name) return null
					const matched = subCommitteesByKey.get(normalizeKey(name))
					return matched?.id ?? null
				})
				.filter(Boolean)
		)) as string[]

		const { data: existingMembers } = await supabase
			.from('committee_members')
			.select('sub_committee_id, sort_order')
			.in('sub_committee_id', requestedSubCommitteeIds)
			.order('sort_order', { ascending: false })

		const nextSortOrderBySubCommittee = new globalThis.Map<string, number>()
		(existingMembers ?? []).forEach(item => {
			const current = nextSortOrderBySubCommittee.get(item.sub_committee_id) ?? 0
			nextSortOrderBySubCommittee.set(item.sub_committee_id, Math.max(current, item.sort_order ?? 0))
		})

		const rows = await Promise.all(normalizedRows.map(async row => {
			const subCommitteeName = getSubCommitteeName(row)
			const subCommitteeKey = subCommitteeName ? normalizeKey(subCommitteeName) : ''
			const subCommittee = subCommitteeKey ? subCommitteesByKey.get(subCommitteeKey) : null

			const photoFilename = row.photo_filename ? String(row.photo_filename).trim() : ''
			let photoUrl: string | null = null

			if (photoFilename) {
				const entry = findZipEntry(zip, photoFilename)
				if (entry) {
					const extension = photoFilename.toLowerCase().endsWith('.png')
						? 'png'
						: photoFilename.toLowerCase().endsWith('.webp')
							? 'webp'
							: 'jpg'

					const buffer = await entry.async('nodebuffer')
					const compressed = await compressImage(buffer, extension)
					photoUrl = await uploadToR2(compressed, photoFilename, extension)
					photosMatched += 1
				}
			}

			const name = row.name ? String(row.name).trim() : ''
			if (!name || !subCommittee) {
				skipped += 1
				return null
			}

			const currentSortOrder = nextSortOrderBySubCommittee.get(subCommittee.id) ?? 0
			nextSortOrderBySubCommittee.set(subCommittee.id, currentSortOrder + 1)

			return {
				id: randomUUID(),
				sub_committee_id: subCommittee.id,
				name,
				role: row.role ? String(row.role).trim() : null,
				designation: row.designation ? String(row.designation).trim() : null,
				department: row.department ? String(row.department).trim() : null,
				email: row.email ? String(row.email).trim() : null,
				phone: row.phone ? String(row.phone).trim() : null,
				facebook_url: row.facebook ? String(row.facebook).trim() : null,
				linkedin_url: row.linkedin ? String(row.linkedin).trim() : null,
				photo_url: photoUrl,
				show_email: Boolean(row.email),
				show_phone: Boolean(row.phone),
				is_visible: parseBoolean(row.is_visible, true),
				is_disabled: false,
				sort_order: currentSortOrder + 1,
			}
		}))

		const insertRows = rows.filter(Boolean)
		if (!insertRows.length) {
			return NextResponse.json({ error: 'No valid rows to import.' }, { status: 400 })
		}

		const { error } = await supabase
			.from('committee_members')
			.insert(insertRows)

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 })
		}

		return NextResponse.json({
			inserted: insertRows,
			createdSubCommittees,
			summary: `${insertRows.length} members added · ${photosMatched} photos matched · ${createdSubCommittees.length} sub-committees created · ${skipped} skipped`,
		})
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Bulk import failed.'
		const stack = error instanceof Error ? error.stack ?? '' : ''
		console.error('Bulk import failed', error)
		return NextResponse.json({
			error: message,
			stack,
		}, { status: 500 })
	}
}

function normalizeExcelRow(rawRow: Record<string, unknown>) {
	return Object.fromEntries(
		Object.entries(rawRow).map(([key, value]) => {
			const normalizedKey = String(key).trim().toLowerCase().replace(/[\s-]+/g, '_')
			return [normalizedKey, value]
		})
	) as Record<string, unknown>
}

function getSubCommitteeName(normalized: Record<string, unknown>) {
	const value = normalized.sub_committee ?? normalized.sub_committee_name ?? normalized.subcommittee
	return value ? String(value).trim() : ''
}

function normalizeKey(value: string) {
	return value.trim().toLowerCase().replace(/\s+/g, ' ')
}
