import { NextResponse } from 'next/server'
import { requireRegistrationAccess } from '@/lib/admin-auth'
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

function drawParticipantHeaders(doc: any, y: number) {
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
  
  doc.text('Serial', x + 5, y + 6, { width: 75, align: 'left' })
  x += 85
  
  doc.text('Participant Name & Institution', x + 5, y + 6, { width: 105, align: 'left' })
  x += 115
  
  doc.text('Contact Details', x + 5, y + 6, { width: 110, align: 'left' })
  x += 120
  
  doc.text('Category', x + 5, y + 6, { width: 110, align: 'left' })
  x += 120
  
  doc.text('Allocated Room', x + 5, y + 6, { width: 70, align: 'left' })
  x += 80
  
  doc.text('Kit', x, y + 6, { width: 30, align: 'center' })
  x += 30
  
  doc.text('Present', x, y + 6, { width: 40, align: 'center' })
  x += 40
  
  doc.text('Breakfast', x, y + 6, { width: 45, align: 'center' })
  x += 45
  
  doc.text('Lunch', x, y + 6, { width: 45, align: 'center' })
  
  // Bottom border line
  doc.strokeColor('#cbd5e1')
     .lineWidth(1)
     .moveTo(30, y + rowHeight)
     .lineTo(841.89 - 30, y + rowHeight)
     .stroke()
}

function drawParticipantRow(
  doc: any,
  y: number,
  r: any,
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
  
  // 2. Serial
  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(8.5)
     .text(sanitizePdfText(r.serial), x + 5, y + 10, { width: 75, align: 'left' })
  x += 85
  
  // 3. Name & Institution
  doc.fillColor('#0f172a')
     .font('Helvetica-Bold')
     .fontSize(8)
     .text(truncateText(sanitizePdfText(r.full_name), 26), x + 5, y + 4, { width: 105, align: 'left' })
  doc.fillColor('#64748b')
     .font('Helvetica')
     .fontSize(7.5)
     .text(truncateText(sanitizePdfText(r.institution), 36), x + 5, y + 16, { width: 105, align: 'left' })
  x += 115
  
  // 4. Contact
  doc.fillColor('#0f172a')
     .font('Helvetica')
     .fontSize(8)
     .text(truncateText(sanitizePdfText(r.email_address), 24), x + 5, y + 4, { width: 110, align: 'left' })
  doc.fillColor('#64748b')
     .font('Helvetica')
     .fontSize(7.5)
     .text(sanitizePdfText(r.phone_number), x + 5, y + 16, { width: 110, align: 'left' })
  x += 120
  
  // 5. Category
  doc.fillColor('#0f172a')
     .font('Helvetica')
     .fontSize(8)
     .text(truncateText(sanitizePdfText(r.level), 22), x + 5, y + 4, { width: 110, align: 'left' })
  doc.fillColor('#64748b')
     .font('Helvetica')
     .fontSize(7.5)
     .text(truncateText(sanitizePdfText(r.event), 22), x + 5, y + 16, { width: 110, align: 'left' })
  x += 120
  
  // 6. Room
  doc.fillColor('#4338ca')
     .font('Helvetica-Bold')
     .fontSize(8)
     .text(truncateText(sanitizePdfText(r.allocated_room || 'Not Allocated'), 18), x + 5, y + 10, { width: 70, align: 'left' })
  x += 80
  
  // 7. Kit
  const kitText = r.is_kit_coollect ? 'YES' : 'NO'
  const kitColor = r.is_kit_coollect ? '#1a73e8' : '#5f6368'
  doc.fillColor(kitColor)
     .font('Helvetica-Bold')
     .fontSize(8)
     .text(kitText, x, y + 10, { width: 30, align: 'center' })
  x += 30
  
  // 8. Present
  const presText = r.is_present ? 'YES' : 'NO'
  const presColor = r.is_present ? '#137333' : '#c5221f'
  doc.fillColor(presColor)
     .font('Helvetica-Bold')
     .fontSize(8)
     .text(presText, x, y + 10, { width: 40, align: 'center' })
  x += 40
  
  // 9. Breakfast
  const bfastText = r.is_collect_breakfast ? 'SERVED' : 'PENDING'
  const bfastColor = r.is_collect_breakfast ? '#137333' : '#5f6368'
  doc.fillColor(bfastColor)
     .font('Helvetica-Bold')
     .fontSize(7)
     .text(bfastText, x, y + 10, { width: 45, align: 'center' })
  x += 45
  
  // 10. Lunch
  const lunchText = r.is_collect_launch ? 'SERVED' : 'PENDING'
  const lunchColor = r.is_collect_launch ? '#b06000' : '#5f6368'
  doc.fillColor(lunchColor)
     .font('Helvetica-Bold')
     .fontSize(7)
     .text(lunchText, x, y + 10, { width: 45, align: 'center' })
  
  // Bottom border line
  doc.strokeColor('#cbd5e1')
     .lineWidth(0.5)
     .moveTo(30, y + rowHeight)
     .lineTo(841.89 - 30, y + rowHeight)
     .stroke()
}

/**
 * GET /api/admin/registrations/summary-pdf
 * Renders & downloads full Participant Management Summary PDF report.
 * Authorized for super_admin, admin, moderators, registration_editors, and volunteers.
 * Supports Authorization: Bearer <token> (mobile apps) & Cookie auth (web).
 */
export async function GET(request: Request) {
  const guard = await requireRegistrationAccess()
  if ('response' in guard) return guard.response

  try {
    const supabase = guard.supabase

    const { data: registrations, error } = await supabase
      .from('processed_registrations')
      .select('*')
      .order('serial', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const list = registrations || []
    const totalCount = list.length
    const presentCount = list.filter(r => r.is_present).length
    const absentCount = totalCount - presentCount
    const kitCount = list.filter(r => r.is_kit_coollect).length
    const launchCount = list.filter(r => r.is_collect_launch).length
    const breakfastCount = list.filter(r => r.is_collect_breakfast).length

    const presentPercent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0'
    const kitPercent = totalCount > 0 ? ((kitCount / totalCount) * 100).toFixed(1) : '0'
    const launchPercent = totalCount > 0 ? ((launchCount / totalCount) * 100).toFixed(1) : '0'
    const breakfastPercent = totalCount > 0 ? ((breakfastCount / totalCount) * 100).toFixed(1) : '0'

    const byLevel: Record<string, number> = {}
    const byEvent: Record<string, number> = {}
    for (const r of list) {
      const lvl = r.level || 'General'
      byLevel[lvl] = (byLevel[lvl] || 0) + 1
      const ev = r.event || 'Olympiad'
      byEvent[ev] = (byEvent[ev] || 0) + 1
    }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const PDFDoc = (PDFDocument as any).default || PDFDocument
      const doc = new PDFDoc({ margin: 30, size: 'A4', layout: 'landscape' })
      const chunks: Buffer[] = []
      doc.on('data', (chunk: any) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err: any) => reject(err))

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
         .text(`Participant Management Summary Report · Generated on ${new Date().toLocaleString()}`, 30, 60)

      doc.fillColor('#6366f1')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(`TOTAL PARTICIPANTS: ${totalCount}`, 30, 72)

      // Stats boxes at y = 90
      const boxWidth = 144
      const spacing = 15
      const statsY = 90
      const statsHeight = 50

      drawStatsBox(doc, 30, statsY, boxWidth, statsHeight, 'Total Registrations', String(totalCount), 'Processed Registrations', '#0f172a')
      drawStatsBox(doc, 30 + boxWidth + spacing, statsY, boxWidth, statsHeight, 'Attendance Rate', `${presentPercent}%`, `Present: ${presentCount} | Absent: ${absentCount}`, '#10b981')
      drawStatsBox(doc, 30 + (boxWidth + spacing) * 2, statsY, boxWidth, statsHeight, 'Kit Collection', `${kitPercent}%`, `Collected: ${kitCount} | Pending: ${totalCount - kitCount}`, '#3b82f6')
      drawStatsBox(doc, 30 + (boxWidth + spacing) * 3, statsY, boxWidth, statsHeight, 'Breakfast Service', `${breakfastPercent}%`, `Served: ${breakfastCount} | Pending: ${totalCount - breakfastCount}`, '#14b8a6')
      drawStatsBox(doc, 30 + (boxWidth + spacing) * 4, statsY, boxWidth, statsHeight, 'Lunch Service', `${launchPercent}%`, `Served: ${launchCount} | Pending: ${totalCount - launchCount}`, '#f59e0b')

      // Breakdown side-by-side tables at y = 155
      const tableWidth = 375
      const breakdownY = 155
      const levelRows = Object.entries(byLevel)
      const eventRows = Object.entries(byEvent)

      drawBreakdownTable(doc, 30, breakdownY, tableWidth, 'Breakdown by Level', ['Level', 'Participants'], levelRows)
      drawBreakdownTable(doc, 436.89, breakdownY, tableWidth, 'Breakdown by Event', ['Event', 'Participants'], eventRows)

      // Roster section title
      doc.fillColor('#334155')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(`COMPLETE PARTICIPANT ROSTER (${totalCount} RECORDS)`, 30, 265)

      let currentY = 280
      drawParticipantHeaders(doc, currentY)
      currentY += 20

      list.forEach((r, idx) => {
        if (currentY + 30 > 535) {
          doc.addPage()
          currentY = 30
          drawParticipantHeaders(doc, currentY)
          currentY += 20
        }
        drawParticipantRow(doc, currentY, r, idx + 1)
        currentY += 30
      })

      doc.end()
    })

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Participant_Summary_Report_2026.pdf"',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

