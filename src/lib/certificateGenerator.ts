import fs from 'node:fs'
import path from 'node:path'
import JSZip from 'jszip'
import sharp from 'sharp'

const TEMPLATE_DIR = path.join(process.cwd(), 'Certificate Template')

/** Helper to load Silentha font base64 string */
function getSilenthaFontBase64(): string {
  try {
    const localFontPath = path.join(TEMPLATE_DIR, 'Silentha OT.ttf')
    const sysFontPath = 'C:\\Users\\mohatamim\\AppData\\Local\\Microsoft\\Windows\\Fonts\\Silentha OT.ttf'

    const targetPath = fs.existsSync(localFontPath)
      ? localFontPath
      : fs.existsSync(sysFontPath)
      ? sysFontPath
      : null

    if (targetPath) {
      return fs.readFileSync(targetPath).toString('base64')
    }
  } catch {
    // Fallback if font cannot be read
  }
  return ''
}

/**
 * Maps participant level and event to matching PPTX filename in Certificate Template folder
 */
export function getTemplateFileName(level?: string | null, event?: string | null): string {
  const normLevel = (level || '').toLowerCase().trim()
  const normEvent = (event || '').toLowerCase().trim()

  if (normLevel.includes('school')) {
    if (normEvent.includes('game')) {
      return 'School Level Math Game.pptx'
    }
    return 'School Level Math Olympiad.pptx'
  }

  if (normLevel.includes('intermediate') || normLevel.includes('college')) {
    if (normEvent.includes('article') || normEvent.includes('writing')) {
      return 'Intermediate Level Article Writing.pptx'
    }
    return 'Intermediate Level Math Olympiad.pptx'
  }

  if (normLevel.includes('university')) {
    if (normEvent.includes('poster') || normEvent.includes('presentation')) {
      return 'University Level Poster Presentation.pptx'
    }
    return 'University Level Math Olympiad.pptx'
  }

  // Check event directly if level is ambiguous
  if (normEvent.includes('game')) return 'School Level Math Game.pptx'
  if (normEvent.includes('article')) return 'Intermediate Level Article Writing.pptx'
  if (normEvent.includes('poster')) return 'University Level Poster Presentation.pptx'

  // Default fallback
  return 'University Level Math Olympiad.pptx'
}

/**
 * Generates high-resolution composited certificate image buffer (PNG) for participant
 */
export async function generateCertificateBuffer(options: {
  fullName: string
  serial: string
  level?: string | null
  event?: string | null
}): Promise<Buffer> {
  const { fullName, serial, level, event } = options
  const fileName = getTemplateFileName(level, event)
  const pptxPath = path.join(TEMPLATE_DIR, fileName)

  const targetPath = fs.existsSync(pptxPath) ? pptxPath : path.resolve('Certificate Template', fileName)
  if (!fs.existsSync(targetPath)) {
    throw new Error(`Certificate template "${fileName}" not found.`)
  }

  const pptxBuffer = fs.readFileSync(targetPath)
  const zip = await JSZip.loadAsync(pptxBuffer)
  const imgFile = zip.file('ppt/media/image1.jpg')
  if (!imgFile) {
    throw new Error('Background image not found inside certificate template.')
  }

  const bgBuffer = await imgFile.async('nodebuffer')
  const metadata = await sharp(bgBuffer).metadata()
  const width = metadata.width || 3580
  const height = metadata.height || 2552

  // Center name vertically between top award line ("This Certificate is Awarded to") and bottom line
  const nameY = Math.round(height * 0.488)
  
  // Position serial number in clean bottom-right whitespace below red border lines (98.2% height, 95% width)
  const serialY = Math.round(height * 0.982)
  const serialX = Math.round(width * 0.965)

  // Format serial display
  const serialDisplay = serial.toUpperCase().startsWith('S/N:')
    ? serial
    : `S/N: ${serial}`

  // Escape special HTML chars for SVG rendering
  const safeName = fullName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  const safeSerial = serialDisplay
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

  // Enhanced larger font size for name (base 200px, responsive scaling for longer names)
  let fontSize = 200
  if (safeName.length > 32) fontSize = 130
  else if (safeName.length > 26) fontSize = 155
  else if (safeName.length > 20) fontSize = 175

  // Serial font size (42px bold, Times New Roman)
  const serialFontSize = 42

  const fontBase64 = getSilenthaFontBase64()
  const fontFaceStyle = fontBase64
    ? `@font-face {
        font-family: 'Silentha';
        src: url('data:font/ttf;charset=utf-8;base64,${fontBase64}') format('truetype');
        font-weight: normal;
        font-style: normal;
      }`
    : ''

  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        ${fontFaceStyle}
        .name {
          font-family: 'Silentha', 'Great Vibes', 'Brush Script MT', 'Times New Roman', serif;
          font-size: ${fontSize}px;
          font-weight: normal;
          fill: #1e293b;
          text-anchor: middle;
          letter-spacing: 0.5px;
        }
        .serial {
          font-family: 'Times New Roman', serif;
          font-size: ${serialFontSize}px;
          font-weight: 700;
          fill: #1e293b;
          text-anchor: end;
          letter-spacing: 0.5px;
        }
      </style>
      <text x="${width / 2}" y="${nameY}" class="name">${safeName}</text>
      <text x="${serialX}" y="${serialY}" class="serial">${safeSerial}</text>
    </svg>
  `)

  const outputBuffer = await sharp(bgBuffer)
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .png({ quality: 100 })
    .toBuffer()

  return outputBuffer
}

/**
 * Wraps a JPEG image buffer into a standalone single-page A4 Landscape PDF buffer.
 * Zero external font file dependencies or runtime filesystem lookups.
 */
function jpegToPdfBuffer(jpegBuffer: Buffer, imgWidth: number, imgHeight: number): Buffer {
  const pdfWidth = 841.89
  const pdfHeight = 595.28

  const contentStream = `q\n${pdfWidth.toFixed(2)} 0 0 ${pdfHeight.toFixed(2)} 0 0 cm\n/Im1 Do\nQ\n`
  const contentLen = Buffer.byteLength(contentStream, 'utf8')

  const header = '%PDF-1.4\n'
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth.toFixed(2)} ${pdfHeight.toFixed(2)}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  const obj4Head = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBuffer.length} >>\nstream\n`
  const obj4Tail = '\nendstream\nendobj\n'
  const obj5 = `5 0 obj\n<< /Length ${contentLen} >>\nstream\n${contentStream}endstream\nendobj\n`

  const offsets = [0]
  let currentOffset = Buffer.byteLength(header, 'binary')

  offsets.push(currentOffset)
  currentOffset += Buffer.byteLength(obj1, 'binary')

  offsets.push(currentOffset)
  currentOffset += Buffer.byteLength(obj2, 'binary')

  offsets.push(currentOffset)
  currentOffset += Buffer.byteLength(obj3, 'binary')

  offsets.push(currentOffset)
  currentOffset += Buffer.byteLength(obj4Head, 'binary') + jpegBuffer.length + Buffer.byteLength(obj4Tail, 'binary')

  offsets.push(currentOffset)
  currentOffset += Buffer.byteLength(obj5, 'binary')

  const startXref = currentOffset

  let xref = `xref\n0 6\n0000000000 65535 f \n`
  for (let i = 1; i <= 5; i++) {
    xref += offsets[i].toString().padStart(10, '0') + ' 00000 n \n'
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`

  return Buffer.concat([
    Buffer.from(header, 'binary'),
    Buffer.from(obj1, 'binary'),
    Buffer.from(obj2, 'binary'),
    Buffer.from(obj3, 'binary'),
    Buffer.from(obj4Head, 'binary'),
    jpegBuffer,
    Buffer.from(obj4Tail, 'binary'),
    Buffer.from(obj5, 'binary'),
    Buffer.from(xref, 'binary'),
    Buffer.from(trailer, 'binary'),
  ])
}

/**
 * Generates official high-resolution PDF document buffer for participant certificate
 */
export async function generateCertificatePdfBuffer(options: {
  fullName: string
  serial: string
  level?: string | null
  event?: string | null
}): Promise<Buffer> {
  const pngBuffer = await generateCertificateBuffer(options)
  const meta = await sharp(pngBuffer).metadata()
  const jpegBuffer = await sharp(pngBuffer).jpeg({ quality: 98 }).toBuffer()

  return jpegToPdfBuffer(jpegBuffer, meta.width || 3580, meta.height || 2552)
}
