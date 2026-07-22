import { NextResponse } from 'next/server'
import { requireVolunteerAccess } from '@/lib/admin-auth'
import PDFDocument from 'pdfkit'

export const runtime = 'nodejs'

function sanitizePdfText(text: string | null | undefined): string {
  if (!text) return ''
  // Strip non-ASCII characters to prevent PDFKit rendering crashes
  return text.replace(/[^\x20-\x7E\n\t]/g, '')
}

function truncateText(text: string, maxLength: number): string {
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 3) + '...'
  }
  return text
}

function drawStatsBox(
  doc: any,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  subtext: string,
  color: string
) {
  // Draw card background
  doc.fillColor('#f8fafc')
     .roundedRect(x, y, width, height, 6)
     .fill()
  
  // Draw card border
  doc.strokeColor('#cbd5e1')
     .lineWidth(1)
     .roundedRect(x, y, width, height, 6)
     .stroke()
  
  // Draw label
  doc.fillColor('#64748b')
     .font('Helvetica-Bold')
     .fontSize(7.5)
     .text(label.toUpperCase(), x + 10, y + 8)
  
  // Draw value
  doc.fillColor(color)
     .font('Helvetica-Bold')
     .fontSize(16)
     .text(value, x + 10, y + 18)
  
  // Draw subtext
  doc.fillColor('#475569')
     .font('Helvetica')
     .fontSize(7.5)
     .text(subtext, x + 10, y + 36)
}

function drawBreakdownTable(
  doc: any,
  x: number,
  y: number,
  width: number,
  title: string,
  headers: string[],
  rows: [string, string | number][]
) {
  // Draw title
  doc.fillColor('#334155')
     .font('Helvetica-Bold')
     .fontSize(9)
     .text(title.toUpperCase(), x, y)
  
  const tableY = y + 15
  const rowHeight = 16
  
  // Draw table header background
  doc.fillColor('#f1f5f9')
     .rect(x, tableY, width, rowHeight)
     .fill()
  
  // Draw header text
  doc.fillColor('#475569')
     .font('Helvetica-Bold')
     .fontSize(8)
  doc.text(headers[0], x + 6, tableY + 4, { width: width - 80 })
  doc.text(headers[1], x + width - 70, tableY + 4, { width: 64, align: 'right' })
  
  // Draw header bottom border
  doc.strokeColor('#cbd5e1')
     .lineWidth(0.5)
     .moveTo(x, tableY + rowHeight)
     .lineTo(x + width, tableY + rowHeight)
     .stroke()
  
  let currentY = tableY + rowHeight
  rows.forEach(([name, count], index) => {
    // Zebra striping
    if (index % 2 === 0) {
      doc.fillColor('#f8fafc')
         .rect(x, currentY, width, rowHeight)
         .fill()
    }
    
    doc.fillColor('#1e293b')
       .font('Helvetica')
       .fontSize(8)
    doc.text(truncateText(sanitizePdfText(name), 30), x + 6, currentY + 4, { width: width - 80 })
    doc.font('Helvetica-Bold')
       .text(String(count), x + width - 70, currentY + 4, { width: 64, align: 'right' })
    
    doc.strokeColor('#cbd5e1')
       .lineWidth(0.5)
       .moveTo(x, currentY + rowHeight)
       .lineTo(x + width, currentY + rowHeight)
       .stroke()
    
    currentY += rowHeight
  })
}

function drawVolunteerHeaders(doc: any, y: number) {
  const rowHeight = 20
  
  // Header background
  doc.fillColor('#f1f5f9')
     .rect(30, y, 841.89 - 60, rowHeight)
     .fill()
  
  let x = 30
  doc.fillColor('#334155')
     .font('Helvetica-Bold')
     .fontSize(8.5)
  
  doc.text('#', x, y + 6, { width: 20, align: 'center' })
  x += 20
  
  doc.text('Serial / ID', x + 5, y + 6, { width: 75, align: 'left' })
  x += 85
  
  doc.text('Volunteer Name & Email', x + 5, y + 6, { width: 170, align: 'left' })
  x += 180
  
  doc.text('Mobile', x + 5, y + 6, { width: 75, align: 'left' })
  x += 85
  
  doc.text('Dept & Year', x + 5, y + 6, { width: 130, align: 'left' })
  x += 140
  
  doc.text('Segment', x + 5, y + 6, { width: 80, align: 'left' })
  x += 90
  
  doc.text('Size', x, y + 6, { width: 30, align: 'center' })
  x += 30
  
  doc.text('Present', x, y + 6, { width: 50, align: 'center' })
  x += 50
  
  doc.text('Gift', x, y + 6, { width: 40, align: 'center' })
  x += 40
  
  doc.text('Lunch', x, y + 6, { width: 40, align: 'center' })
  
  // Bottom border line
  doc.strokeColor('#cbd5e1')
     .lineWidth(1)
     .moveTo(30, y + rowHeight)
     .lineTo(841.89 - 30, y + rowHeight)
     .stroke()
}

function drawVolunteerRow(
  doc: any,
  y: number,
  v: any,
  index: number
) {
  const rowHeight = 30
  
  // Zebra striping
  if (index % 2 === 0) {
    doc.fillColor('#f8fafc')
       .rect(30, y, 841.89 - 60, rowHeight)
       .fill()
  }
  
  let x = 30
  
  // 1. Index
  doc.fillColor('#64748b')
     .font('Courier')
     .fontSize(8)
     .text(String(index), x, y + 10, { width: 20, align: 'center' })
  x += 20
  
  // 2. Serial / ID
  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text(sanitizePdfText(v.serial_no || v.unique_id), x + 5, y + 10, { width: 75, align: 'left' })
  x += 85
  
  // 3. Name & Email
  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text(truncateText(sanitizePdfText(v.name), 35), x + 5, y + 4, { width: 170, align: 'left' })
  doc.fillColor('#64748b')
     .font('Helvetica')
     .fontSize(7.5)
     .text(truncateText(sanitizePdfText(v.email), 38), x + 5, y + 16, { width: 170, align: 'left' })
  x += 180
  
  // 4. Mobile
  doc.fillColor('#0f172a')
     .font('Helvetica')
     .fontSize(8)
     .text(sanitizePdfText(v.number), x + 5, y + 10, { width: 75, align: 'left' })
  x += 85
  
  // 5. Dept & Year
  const deptStr = sanitizePdfText(v.department || 'General')
  const yearStr = v.year ? `(${sanitizePdfText(v.year)})` : ''
  doc.fillColor('#0f172a')
     .font('Helvetica')
     .fontSize(8)
     .text(truncateText(`${deptStr} ${yearStr}`.trim(), 28), x + 5, y + 10, { width: 130, align: 'left' })
  x += 140
  
  // 6. Segment
  doc.fillColor('#4338ca')
     .font('Helvetica-Bold')
     .fontSize(8)
     .text(truncateText(sanitizePdfText(v.segment || 'Unassigned'), 18), x + 5, y + 10, { width: 80, align: 'left' })
  x += 90
  
  // 7. Size
  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text(sanitizePdfText(v.t_shirt_size || 'N/A'), x, y + 10, { width: 30, align: 'center' })
  x += 30
  
  // 8. Present
  const presText = v.is_present ? 'PRESENT' : 'ABSENT'
  const presColor = v.is_present ? '#137333' : '#c5221f'
  doc.fillColor(presColor)
     .font('Helvetica-Bold')
     .fontSize(7.5)
     .text(presText, x, y + 10, { width: 50, align: 'center' })
  x += 50
  
  // 9. Gift
  const giftText = v.is_gift_collected ? 'COLLECTED' : 'PENDING'
  const giftColor = v.is_gift_collected ? '#1a73e8' : '#5f6368'
  doc.fillColor(giftColor)
     .font('Helvetica-Bold')
     .fontSize(7.5)
     .text(giftText, x, y + 10, { width: 40, align: 'center' })
  x += 40
  
  // 10. Lunch
  const lunchText = v.is_lunch_collected ? 'SERVED' : 'PENDING'
  const lunchColor = v.is_lunch_collected ? '#b06000' : '#5f6368'
  doc.fillColor(lunchColor)
     .font('Helvetica-Bold')
     .fontSize(7.5)
     .text(lunchText, x, y + 10, { width: 40, align: 'center' })
  
  // Bottom border line
  doc.strokeColor('#cbd5e1')
     .lineWidth(0.5)
     .moveTo(30, y + rowHeight)
     .lineTo(841.89 - 30, y + rowHeight)
     .stroke()
}

/**
 * GET /api/admin/volunteers/summary-pdf
 * Renders & downloads full Volunteer Management Summary PDF report.
 * Authorized for super_admin, admin, and authorized volunteer managers.
 * Supports Authorization: Bearer <token> (mobile apps) & Cookie auth (web).
 */
export async function GET(request: Request) {
  const guard = await requireVolunteerAccess()
  if ('response' in guard) return guard.response

  try {
    const supabase = guard.supabase

    const { data: volunteers, error } = await supabase
      .from('volunteers')
      .select('*')
      .order('serial_no', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = volunteers || []
    const totalCount = list.length
    const presentCount = list.filter(v => v.is_present).length
    const absentCount = totalCount - presentCount
    const giftCount = list.filter(v => v.is_gift_collected).length
    const lunchCount = list.filter(v => v.is_lunch_collected).length

    const presentPercent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0'
    const giftPercent = totalCount > 0 ? ((giftCount / totalCount) * 100).toFixed(1) : '0'
    const lunchPercent = totalCount > 0 ? ((lunchCount / totalCount) * 100).toFixed(1) : '0'

    const bySegment: Record<string, number> = {}
    const byDepartment: Record<string, number> = {}
    for (const v of list) {
      const seg = v.segment || 'Unassigned'
      bySegment[seg] = (bySegment[seg] || 0) + 1
      const dept = v.department || 'General'
      byDepartment[dept] = (byDepartment[dept] || 0) + 1
    }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' })
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err) => reject(err))

      // Header bar
      doc.fillColor('#6366f1')
         .rect(30, 30, 841.89 - 60, 4)
         .fill()

      doc.fillColor('#0f172a')
         .font('Helvetica-Bold')
         .fontSize(18)
         .text('National Mathematics Carnival 2026', 30, 40)

      doc.fillColor('#64748b')
         .font('Helvetica')
         .fontSize(9)
         .text(`Volunteer Management Summary Report · Generated on ${new Date().toLocaleString()}`, 30, 60)

      doc.fillColor('#6366f1')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(`TOTAL VOLUNTEERS: ${totalCount}`, 30, 72)

      // Stats boxes at y = 90
      const boxWidth = 184
      const spacing = 15
      const statsY = 90
      const statsHeight = 50

      drawStatsBox(doc, 30, statsY, boxWidth, statsHeight, 'Total Volunteers', String(totalCount), 'Active Duty Records', '#0f172a')
      drawStatsBox(doc, 30 + boxWidth + spacing, statsY, boxWidth, statsHeight, 'Attendance Rate', `${presentPercent}%`, `Present: ${presentCount} | Absent: ${absentCount}`, '#10b981')
      drawStatsBox(doc, 30 + (boxWidth + spacing) * 2, statsY, boxWidth, statsHeight, 'Gift Collection', `${giftPercent}%`, `Collected: ${giftCount} | Pending: ${totalCount - giftCount}`, '#3b82f6')
      drawStatsBox(doc, 30 + (boxWidth + spacing) * 3, statsY, boxWidth, statsHeight, 'Lunch Service', `${lunchPercent}%`, `Served: ${lunchCount} | Pending: ${totalCount - lunchCount}`, '#f59e0b')

      // Breakdown side-by-side tables at y = 155
      const tableWidth = 375
      const breakdownY = 155
      const segmentRows = Object.entries(bySegment)
      const deptRows = Object.entries(byDepartment)

      drawBreakdownTable(doc, 30, breakdownY, tableWidth, 'Breakdown by Sub-Committee / Segment', ['Segment', 'Volunteers'], segmentRows)
      drawBreakdownTable(doc, 436.89, breakdownY, tableWidth, 'Breakdown by Department', ['Department', 'Volunteers'], deptRows)

      // Roster section title
      doc.fillColor('#334155')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(`COMPLETE VOLUNTEER ROSTER (${totalCount} RECORDS)`, 30, 265)

      let currentY = 280
      drawVolunteerHeaders(doc, currentY)
      currentY += 20

      list.forEach((v, idx) => {
        if (currentY + 30 > 535) {
          doc.addPage()
          currentY = 30
          drawVolunteerHeaders(doc, currentY)
          currentY += 20
        }
        drawVolunteerRow(doc, currentY, v, idx + 1)
        currentY += 30
      })

      doc.end()
    })

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Volunteer_Summary_Report_2026.pdf"',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

