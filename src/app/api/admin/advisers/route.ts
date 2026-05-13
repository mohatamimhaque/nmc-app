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
	const objectKey = `advisers/${Date.now()}-${sanitizeFilename(filename)}.${extension}`
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
	const advisersInput = Array.isArray(body?.advisers) ? body.advisers : []

	const { supabase } = guard

	const { error: deleteError } = await supabase
		.from('advisers')
		.delete()
		.gte('sort_order', 0)

	if (deleteError) {
		return NextResponse.json({ error: deleteError.message }, { status: 400 })
	}

	const advisers = advisersInput
		.filter((item: any) => item?.id)
		.map((item: any, index: number) => ({
			id: String(item.id),
			name: item?.name ? String(item.name) : null,
			designation: item?.designation ? String(item.designation) : null,
			department: item?.department ? String(item.department) : null,
			institution: item?.institution ? String(item.institution) : null,
			expertise_tags: Array.isArray(item?.expertise_tags) ? item.expertise_tags : [],
			photo_url: item?.photo_url ? String(item.photo_url) : null,
			email: item?.email ? String(item.email) : null,
			phone: item?.phone ? String(item.phone) : null,
			linkedin_url: item?.linkedin_url ? String(item.linkedin_url) : null,
			bio: item?.bio ? String(item.bio) : null,
			show_email: item?.show_email === true,
			show_phone: item?.show_phone === true,
			is_visible: item?.is_visible !== false,
			is_disabled: item?.is_disabled === true,
			sort_order: index + 1,
		}))

	if (advisers.length) {
		const { error } = await supabase.from('advisers').insert(advisers)
		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 })
		}
	}

	return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
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
	const { data: existing } = await supabase
		.from('advisers')
		.select('sort_order')
		.order('sort_order', { ascending: false })
		.limit(1)

	const startOrder = (existing?.[0]?.sort_order ?? 0) + 1
	let photosMatched = 0
	let skipped = 0

	const rows = await Promise.all(rawRows.map(async (rawRow, index) => {
		const row = Object.fromEntries(
			Object.entries(rawRow).map(([key, value]) => [String(key).trim().toLowerCase(), value])
		)

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
		if (!name) {
			skipped += 1
			return null
		}

		return {
			name,
			designation: row.designation ? String(row.designation).trim() : null,
			department: row.department ? String(row.department).trim() : null,
			institution: row.institution ? String(row.institution).trim() : null,
			expertise_tags: row.expertise ? String(row.expertise).split(',').map(item => item.trim()).filter(Boolean) : [],
			email: row.email ? String(row.email).trim() : null,
			phone: row.phone ? String(row.phone).trim() : null,
			linkedin_url: row.linkedin ? String(row.linkedin).trim() : null,
			bio: row.bio ? String(row.bio).trim() : null,
			photo_url: photoUrl,
			show_email: Boolean(row.email),
			show_phone: Boolean(row.phone),
			is_visible: parseBoolean(row.is_visible, true),
			is_disabled: false,
			sort_order: startOrder + index,
		}
	}))

	const insertRows = rows.filter((row): row is NonNullable<typeof row> => Boolean(row))
	if (!insertRows.length) {
		return NextResponse.json({ error: 'No valid rows to import.' }, { status: 400 })
	}

	const { data, error } = await supabase
		.from('advisers')
		.insert(insertRows)
		.select('*')

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 400 })
	}

	return NextResponse.json({
		inserted: data ?? [],
		summary: `${insertRows.length} advisers added - ${photosMatched} photos matched - ${skipped} skipped`,
	})
}
