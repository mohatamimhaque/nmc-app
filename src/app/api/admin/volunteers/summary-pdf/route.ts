import { NextResponse } from 'next/server'
import { requireVolunteerAccess } from '@/lib/admin-auth'

export const runtime = 'nodejs'

/**
 * GET /api/admin/volunteers/summary-pdf
 * Renders & downloads full Volunteer Management Summary PDF/HTML report.
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

    const segmentRowsHtml = Object.entries(bySegment)
      .map(([seg, count]) => `<tr><td style="padding:4px 8px;">${seg}</td><td style="padding:4px 8px;text-align:right;font-weight:bold;">${count}</td></tr>`)
      .join('')

    const deptRowsHtml = Object.entries(byDepartment)
      .map(([dept, count]) => `<tr><td style="padding:4px 8px;">${dept}</td><td style="padding:4px 8px;text-align:right;font-weight:bold;">${count}</td></tr>`)
      .join('')

    const rowsHtml = list.map((v, index) => `
      <tr>
        <td style="font-family: monospace; text-align: center;">${index + 1}</td>
        <td style="font-family: monospace; font-weight: bold;">${v.serial_no || v.unique_id}</td>
        <td>
          <div style="font-weight: bold; color: #1e293b;">${v.name || ''}</div>
          <div style="font-size: 10px; color: #64748b;">${v.email || ''}</div>
        </td>
        <td>${v.number || ''}</td>
        <td>${v.department || ''} ${v.year ? `(${v.year})` : ''}</td>
        <td>${v.segment || ''}</td>
        <td style="text-align: center; font-weight: bold;">${v.t_shirt_size || ''}</td>
        <td style="text-align: center;">
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${v.is_present ? '#e6f4ea' : '#fce8e6'}; color: ${v.is_present ? '#137333' : '#c5221f'};">
            ${v.is_present ? 'PRESENT' : 'ABSENT'}
          </span>
        </td>
        <td style="text-align: center;">
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${v.is_gift_collected ? '#e8f0fe' : '#f1f3f4'}; color: ${v.is_gift_collected ? '#1a73e8' : '#5f6368'};">
            ${v.is_gift_collected ? 'COLLECTED' : 'PENDING'}
          </span>
        </td>
        <td style="text-align: center;">
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${v.is_lunch_collected ? '#fef7e0' : '#f1f3f4'}; color: ${v.is_lunch_collected ? '#b06000' : '#5f6368'};">
            ${v.is_lunch_collected ? 'SERVED' : 'PENDING'}
          </span>
        </td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NMC 2026 - Volunteer Management Summary Report</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Kalpurush&family=Noto+Sans+Bengali:wght@400;700&display=swap');
            body {
              font-family: 'Inter', 'Noto Sans Bengali', 'Kalpurush', sans-serif;
              padding: 20px;
              color: #1e293b;
              background: #ffffff;
              margin: 0;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #6366f1;
              padding-bottom: 12px;
              margin-bottom: 16px;
            }
            .header-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
            }
            .header-sub {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .stat-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
            }
            .stat-label {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            .stat-val {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
            }
            .stat-sub {
              font-size: 10px;
              color: #475569;
              margin-top: 2px;
            }
            .breakdown-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 20px;
            }
            .breakdown-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
            }
            .breakdown-title {
              font-size: 11px;
              font-weight: 700;
              color: #334155;
              margin-bottom: 6px;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 6px 8px;
            }
            th {
              background: #f1f5f9;
              font-weight: 700;
              color: #334155;
              text-align: left;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <div class="header-title">National Mathematics Carnival 2026</div>
              <div class="header-sub">Volunteer Management Summary Report · Generated on ${new Date().toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
              <span style="background: #6366f1; color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 12px;">
                TOTAL VOLUNTEERS: ${totalCount}
              </span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Total Volunteers</div>
              <div class="stat-val">${totalCount}</div>
              <div class="stat-sub">Active Duty Records</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Attendance Rate</div>
              <div class="stat-val" style="color: #10b981;">${presentPercent}%</div>
              <div class="stat-sub">Present: ${presentCount} | Absent: ${absentCount}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Gift Collection</div>
              <div class="stat-val" style="color: #3b82f6;">${giftPercent}%</div>
              <div class="stat-sub">Collected: ${giftCount} | Pending: ${totalCount - giftCount}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Lunch Service</div>
              <div class="stat-val" style="color: #f59e0b;">${lunchPercent}%</div>
              <div class="stat-sub">Served: ${lunchCount} | Pending: ${totalCount - lunchCount}</div>
            </div>
          </div>

          <div class="breakdown-section">
            <div class="breakdown-card">
              <div class="breakdown-title">Breakdown by Sub-Committee / Segment</div>
              <table>
                <thead>
                  <tr><th>Segment</th><th style="text-align:right;">Volunteers</th></tr>
                </thead>
                <tbody>
                  ${segmentRowsHtml}
                </tbody>
              </table>
            </div>

            <div class="breakdown-card">
              <div class="breakdown-title">Breakdown by Department</div>
              <table>
                <thead>
                  <tr><th>Department</th><th style="text-align:right;">Volunteers</th></tr>
                </thead>
                <tbody>
                  ${deptRowsHtml}
                </tbody>
              </table>
            </div>
          </div>

          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase;">
            Complete Volunteer Roster (${totalCount} Records)
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th>Serial / ID</th>
                <th>Volunteer Name & Email</th>
                <th>Mobile</th>
                <th>Department</th>
                <th>Segment</th>
                <th style="text-align: center;">Size</th>
                <th style="text-align: center;">Present</th>
                <th style="text-align: center;">Gift</th>
                <th style="text-align: center;">Lunch</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="Volunteer_Summary_Report_2026.html"',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
