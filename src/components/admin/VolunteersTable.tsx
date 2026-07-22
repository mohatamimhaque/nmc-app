'use client'

import { useEffect, useRef, useState, useTransition, useMemo } from 'react'
import { GlassCard } from './GlassCard'
import { MathDivider } from './MathDivider'
import * as XLSX from 'xlsx'
import type { Volunteer } from '@/types/database'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateRandomId(): string {
  let value = ''
  for (let i = 0; i < 8; i += 1) {
    value += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return value
}

interface VolunteersTableProps {
  initialVolunteers: Volunteer[]
}

type ToastTone = 'success' | 'error'

interface ToastState {
  message: string
  tone: ToastTone
}

export function VolunteersTable({ initialVolunteers }: VolunteersTableProps) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers)
  const [libLoaded, setLibLoaded] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Bulk update states
  const [bulkPresent, setBulkPresent] = useState<boolean | 'no-change'>('no-change')
  const [bulkGift, setBulkGift] = useState<boolean | 'no-change'>('no-change')
  const [bulkLunch, setBulkLunch] = useState<boolean | 'no-change'>('no-change')

  // Filter state
  const [activeFilter, setActiveFilter] = useState<'all' | 'present' | 'absent' | 'gift-collected' | 'gift-pending' | 'lunch-collected' | 'lunch-pending'>('all')

  // Modals state
  const [editingVol, setEditingVol] = useState<Volunteer | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    unique_id: '',
    serial_no: '',
    name: '',
    email: '',
    number: '',
    image_url: '',
    segment: '',
    department: '',
    student_id: '',
    year: '',
    t_shirt_size: 'L',
    is_present: false,
    is_gift_collected: false,
    is_lunch_collected: false,
  })

  const [isUpdating, startUpdateTransition] = useTransition()
  const tableRef = useRef<HTMLTableElement | null>(null)
  const dataTableInstance = useRef<any>(null)

  // Show Toast helper
  const showToast = (message: string, tone: ToastTone = 'success') => {
    setToast({ message, tone })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // Escape key handler to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingVol(null)
        setShowAddModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load jQuery and DataTables CDN dynamically (same as RegistrationsTable)
  useEffect(() => {
    let isMounted = true

    const loadScripts = async () => {
      if (!(window as any).$) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://code.jquery.com/jquery-3.7.1.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load jQuery'))
          document.head.appendChild(script)
        })
      }

      if (!document.getElementById('datatables-css')) {
        const link = document.createElement('link')
        link.id = 'datatables-css'
        link.rel = 'stylesheet'
        link.href = 'https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css'
        document.head.appendChild(link)
      }

      const $ = (window as any).$
      if (!$.fn.dataTable) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.datatables.net/1.13.7/js/jquery.dataTables.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load DataTables'))
          document.head.appendChild(script)
        })
      }

      if (isMounted) {
        setLibLoaded(true)
      }
    }

    loadScripts().catch(err => {
      console.error('Error loading DataTables CDN:', err)
      showToast('Error loading table library. Check connection.', 'error')
    })

    return () => {
      isMounted = false
    }
  }, [])

  const applyDataTableFilter = (dt: any, filter: string) => {
    if (!dt) return
    dt.column(10).search('')
    dt.column(11).search('')
    dt.column(12).search('')

    if (filter === 'present') {
      dt.column(10).search('^PRESENT$', true, false)
    } else if (filter === 'absent') {
      dt.column(10).search('^ABSENT$', true, false)
    } else if (filter === 'gift-collected') {
      dt.column(11).search('^COLLECTED$', true, false)
    } else if (filter === 'gift-pending') {
      dt.column(11).search('^PENDING$', true, false)
    } else if (filter === 'lunch-collected') {
      dt.column(12).search('^SERVED$', true, false)
    } else if (filter === 'lunch-pending') {
      dt.column(12).search('^PENDING$', true, false)
    }
    dt.draw()
  }

  // Initialize/re-initialize DataTable whenever data changes
  useEffect(() => {
    if (!libLoaded || !tableRef.current) return

    const $ = (window as any).$

    if (dataTableInstance.current) {
      dataTableInstance.current.destroy()
      dataTableInstance.current = null
    }

    const dt = $(tableRef.current).DataTable({
      stateSave: true,
      destroy: true,
      columnDefs: [
        { orderable: false, targets: [0, 4, 10, 11, 12, 13, 15] },
        { searchable: false, targets: [0, 15] }
      ],
      pageLength: 25,
      lengthMenu: [10, 25, 50, 100, 250],
      language: {
        search: "Search Volunteers:",
        lengthMenu: "Show _MENU_ entries"
      }
    })

    dataTableInstance.current = dt
    applyDataTableFilter(dt, activeFilter)

    // Bind row click event using delegation on the table
    $(tableRef.current).off('click', 'tbody tr').on('click', 'tbody tr', (e: any) => {
      if ($(e.target).closest('input, button, select, a, span').length) {
        return
      }
      const uniqueId = $(e.currentTarget).find('td:nth-child(2)').text().trim()
      const vol = volunteers.find(v => v.unique_id === uniqueId)
      if (vol) {
        setEditingVol(vol)
      }
    })

    return () => {
      if (dataTableInstance.current) {
        dataTableInstance.current.destroy()
        dataTableInstance.current = null
      }
    }
  }, [volunteers, libLoaded])

  useEffect(() => {
    if (libLoaded && dataTableInstance.current) {
      applyDataTableFilter(dataTableInstance.current, activeFilter)
    }
  }, [activeFilter, libLoaded])

  // Selection handlers
  const handleSelectRow = (uniqueId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(uniqueId)) {
        next.delete(uniqueId)
      } else {
        next.add(uniqueId)
      }
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(volunteers.map(v => v.unique_id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // Quick Inline Status Toggles
  const toggleStatus = async (uniqueId: string, field: 'present' | 'gift' | 'lunch', currentValue: boolean) => {
    startUpdateTransition(async () => {
      try {
        const endpoint = `/api/admin/volunteers/${field}`
        const bodyKey = field === 'present' ? 'is_present' : field === 'gift' ? 'is_gift_collected' : 'is_lunch_collected'
        
        const res = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unique_id: uniqueId, [bodyKey]: !currentValue })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to toggle status')

        setVolunteers(prev =>
          prev.map(v => (v.unique_id === uniqueId ? { ...v, [bodyKey]: !currentValue, updated_by: data.updatedBy, updated_at: data.updatedAt } : v))
        )
        showToast(`Status updated successfully.`)
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Handle Add Volunteer
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.unique_id || !addForm.name || !addForm.email) {
      showToast('Unique ID, Name, and Email are required.', 'error')
      return
    }

    startUpdateTransition(async () => {
      try {
        const res = await fetch('/api/admin/volunteers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(addForm)
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create volunteer')

        setVolunteers(prev => [data.data, ...prev])
        setShowAddModal(false)
        setAddForm({
          unique_id: '',
          serial_no: '',
          name: '',
          email: '',
          number: '',
          image_url: '',
          segment: '',
          department: '',
          student_id: '',
          year: '',
          t_shirt_size: 'L',
          is_present: false,
          is_gift_collected: false,
          is_lunch_collected: false,
        })
        showToast('Volunteer added successfully!')
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Handle Edit/Update Volunteer
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVol) return

    startUpdateTransition(async () => {
      try {
        const res = await fetch('/api/admin/volunteers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unique_ids: editingVol.unique_id,
            data: editingVol
          })
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update volunteer')

        setVolunteers(prev =>
          prev.map(v => (v.unique_id === editingVol.unique_id ? { ...editingVol, updated_by: data.updatedBy, updated_at: data.updatedAt } : v))
        )
        setEditingVol(null)
        showToast('Volunteer updated successfully!')
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Handle Delete Volunteer
  const handleDeleteVolunteer = async (uniqueId: string) => {
    if (!confirm(`Are you sure you want to delete volunteer "${uniqueId}"?`)) return

    startUpdateTransition(async () => {
      try {
        const res = await fetch(`/api/admin/volunteers?unique_id=${encodeURIComponent(uniqueId)}`, {
          method: 'DELETE'
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to delete volunteer')

        setVolunteers(prev => prev.filter(v => v.unique_id !== uniqueId))
        setEditingVol(null)
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(uniqueId)
          return next
        })
        showToast('Volunteer deleted.')
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Bulk status updates
  const handleBulkSubmit = async () => {
    if (selectedIds.size === 0) {
      showToast('No rows selected.', 'error')
      return
    }

    const dataPayload: Record<string, any> = {}
    if (bulkPresent !== 'no-change') dataPayload.is_present = bulkPresent
    if (bulkGift !== 'no-change') dataPayload.is_gift_collected = bulkGift
    if (bulkLunch !== 'no-change') dataPayload.is_lunch_collected = bulkLunch

    if (Object.keys(dataPayload).length === 0) {
      showToast('No bulk updates configured.', 'error')
      return
    }

    startUpdateTransition(async () => {
      try {
        const res = await fetch('/api/admin/volunteers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unique_ids: Array.from(selectedIds),
            data: dataPayload
          })
        })

        const responseData = await res.json()
        if (!res.ok) throw new Error(responseData.error || 'Failed to execute bulk update')

        setVolunteers(prev =>
          prev.map(v => {
            if (selectedIds.has(v.unique_id)) {
              return {
                ...v,
                ...dataPayload,
                updated_by: responseData.updatedBy,
                updated_at: responseData.updatedAt
              }
            }
            return v
          })
        )

        setSelectedIds(new Set())
        setBulkPresent('no-change')
        setBulkGift('no-change')
        setBulkLunch('no-change')
        showToast('Bulk update completed successfully!')
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Export to Excel spreadsheet (Standard format)
  const handleExportExcel = () => {
    const dataToExport = volunteers.map(v => ({
      'Unique ID': v.unique_id,
      'Serial No': v.serial_no || '',
      'Name': v.name,
      'Email': v.email,
      'Phone Number': v.number || '',
      'Student ID': v.student_id || '',
      'Segment': v.segment || '',
      'Department': v.department || '',
      'Year': v.year || '',
      'T-shirt Size': v.t_shirt_size || '',
      'Present': v.is_present ? 'Yes' : 'No',
      'Gift Collected': v.is_gift_collected ? 'Yes' : 'No',
      'Lunch Collected': v.is_lunch_collected ? 'Yes' : 'No',
      'Updated By': v.updated_by || '',
      'Updated At': v.updated_at ? new Date(v.updated_at).toLocaleString() : '',
      'Created At': v.created_at ? new Date(v.created_at).toLocaleString() : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Volunteers')
    XLSX.writeFile(workbook, 'National_Mathematics_Carnival_2026_Volunteers.xlsx')
    showToast('Excel spreadsheet downloaded!')
  }

  // Export volunteers data to Summary PDF report matching Participants PDF format
  const handleExportPDF = () => {
    if (volunteers.length === 0) {
      showToast('No volunteer records found to export.', 'error')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('Pop-up blocked! Please allow popups to export PDF.', 'error')
      return
    }

    const title = 'National Mathematics Carnival 2026 - Volunteer Management Summary Report'
    
    // Compute metrics
    const totalCount = volunteers.length
    const presentCount = volunteers.filter(v => v.is_present).length
    const absentCount = totalCount - presentCount
    const giftCount = volunteers.filter(v => v.is_gift_collected).length
    const lunchCount = volunteers.filter(v => v.is_lunch_collected).length

    const presentPercent = totalCount > 0 ? ((presentCount / totalCount) * 100).toFixed(1) : '0'
    const giftPercent = totalCount > 0 ? ((giftCount / totalCount) * 100).toFixed(1) : '0'
    const lunchPercent = totalCount > 0 ? ((lunchCount / totalCount) * 100).toFixed(1) : '0'

    // Compute segment breakdown
    const bySegment: Record<string, number> = {}
    const byDepartment: Record<string, number> = {}
    for (const v of volunteers) {
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

    // Build table rows HTML
    const rowsHtml = volunteers.map((v, index) => `
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Kalpurush&family=Noto+Sans+Bengali:wght@400;700&display=swap');
            body {
              font-family: 'Inter', 'Noto Sans Bengali', 'Kalpurush', sans-serif;
              padding: 20px;
              color: #1e293b;
              background: #ffffff;
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

          <!-- Statistics Cards Summary View -->
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

          <!-- Breakdown Summary Tables -->
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

          <!-- Full Roster Table -->
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
    `)
    printWindow.document.close()
  }

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: volunteers.length,
      present: volunteers.filter(v => v.is_present).length,
      absent: volunteers.filter(v => !v.is_present).length,
      giftCollected: volunteers.filter(v => v.is_gift_collected).length,
      giftPending: volunteers.filter(v => !v.is_gift_collected).length,
      lunchCollected: volunteers.filter(v => v.is_lunch_collected).length,
      lunchPending: volunteers.filter(v => !v.is_lunch_collected).length,
    }
  }, [volunteers])

  return (
    <div style={{ maxWidth: '100%', padding: '0 0.5rem' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.tone === 'success' ? 'rgba(0,180,90,0.95)' : 'rgba(200,40,40,0.95)',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem', opacity: 0.7 }}>
            Event Operations
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: 'var(--admin-fg)', margin: 0 }}>
            Volunteer Management
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--admin-fg-muted)', margin: '0.3rem 0 0' }}>
            Check attendance, manage profiles, track gift/lunch collections, and view statistics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setAddForm(prev => ({ ...prev, unique_id: generateRandomId() }))
              setShowAddModal(true)
            }}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 10,
              background: 'var(--admin-accent)',
              color: 'white',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            + Add Volunteer
          </button>
          <button
            onClick={handleExportPDF}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: 'pointer',
            }}
          >
            📄 Export Summary PDF
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid var(--admin-border)',
              cursor: 'pointer',
            }}
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* ── Stats Overview cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Total Card */}
        <div
          onClick={() => setActiveFilter('all')}
          style={{
            ...statCardStyle,
            cursor: 'pointer',
            border: activeFilter === 'all' ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
            background: activeFilter === 'all' ? 'rgba(99, 102, 241, 0.1)' : 'var(--admin-surface)',
            transform: activeFilter === 'all' ? 'scale(1.02)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={statLabelStyle}>Total Volunteers</div>
          <div style={statValStyle}>{stats.total}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '0.4rem' }}>
            Click to view all records
          </div>
        </div>

        {/* Presence Card */}
        <div
          style={{
            ...statCardStyle,
            border: (activeFilter === 'present' || activeFilter === 'absent') ? '1px solid #20c997' : '1px solid var(--admin-border)',
            background: (activeFilter === 'present' || activeFilter === 'absent') ? 'rgba(32, 201, 151, 0.08)' : 'var(--admin-surface)',
            transform: (activeFilter === 'present' || activeFilter === 'absent') ? 'scale(1.02)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={statLabelStyle}>Attendance Check-In</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.2rem' }}>
            <div 
              onClick={() => setActiveFilter(activeFilter === 'present' ? 'all' : 'present')}
              style={{ 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 8,
                background: activeFilter === 'present' ? 'rgba(32, 201, 151, 0.2)' : 'transparent',
                border: activeFilter === 'present' ? '1px solid #20c997' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: '#20c997', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>PRESENT</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>{stats.present}</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'var(--admin-border)' }}></div>
            <div 
              onClick={() => setActiveFilter(activeFilter === 'absent' ? 'all' : 'absent')}
              style={{ 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 8,
                background: activeFilter === 'absent' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                border: activeFilter === 'absent' ? '1px solid #ef4444' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>ABSENT</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>{stats.absent}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '0.4rem' }}>
            Click status pill to filter
          </div>
        </div>

        {/* Gift Card */}
        <div
          style={{
            ...statCardStyle,
            border: (activeFilter === 'gift-collected' || activeFilter === 'gift-pending') ? '1px solid #0dcaf0' : '1px solid var(--admin-border)',
            background: (activeFilter === 'gift-collected' || activeFilter === 'gift-pending') ? 'rgba(13, 202, 240, 0.08)' : 'var(--admin-surface)',
            transform: (activeFilter === 'gift-collected' || activeFilter === 'gift-pending') ? 'scale(1.02)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={statLabelStyle}>Gift / T-Shirt Collection</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.2rem' }}>
            <div 
              onClick={() => setActiveFilter(activeFilter === 'gift-collected' ? 'all' : 'gift-collected')}
              style={{ 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 8,
                background: activeFilter === 'gift-collected' ? 'rgba(13, 202, 240, 0.2)' : 'transparent',
                border: activeFilter === 'gift-collected' ? '1px solid #0dcaf0' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: '#0dcaf0', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>COLLECTED</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>{stats.giftCollected}</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'var(--admin-border)' }}></div>
            <div 
              onClick={() => setActiveFilter(activeFilter === 'gift-pending' ? 'all' : 'gift-pending')}
              style={{ 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 8,
                background: activeFilter === 'gift-pending' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: activeFilter === 'gift-pending' ? '1px solid var(--admin-border)' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--admin-fg-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>PENDING</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>{stats.giftPending}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '0.4rem' }}>
            Click status pill to filter
          </div>
        </div>

        {/* Lunch Card */}
        <div
          style={{
            ...statCardStyle,
            border: (activeFilter === 'lunch-collected' || activeFilter === 'lunch-pending') ? '1px solid #ffc107' : '1px solid var(--admin-border)',
            background: (activeFilter === 'lunch-collected' || activeFilter === 'lunch-pending') ? 'rgba(255, 193, 7, 0.08)' : 'var(--admin-surface)',
            transform: (activeFilter === 'lunch-collected' || activeFilter === 'lunch-pending') ? 'scale(1.02)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={statLabelStyle}>Lunch Service</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.2rem' }}>
            <div 
              onClick={() => setActiveFilter(activeFilter === 'lunch-collected' ? 'all' : 'lunch-collected')}
              style={{ 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 8,
                background: activeFilter === 'lunch-collected' ? 'rgba(255, 193, 7, 0.2)' : 'transparent',
                border: activeFilter === 'lunch-collected' ? '1px solid #ffc107' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: '#ffc107', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>SERVED</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>{stats.lunchCollected}</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: 'var(--admin-border)' }}></div>
            <div 
              onClick={() => setActiveFilter(activeFilter === 'lunch-pending' ? 'all' : 'lunch-pending')}
              style={{ 
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 8,
                background: activeFilter === 'lunch-pending' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: activeFilter === 'lunch-pending' ? '1px solid var(--admin-border)' : '1px solid transparent',
              }}
            >
              <div style={{ fontSize: '0.65rem', color: 'var(--admin-fg-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>PENDING</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--admin-fg)' }}>{stats.lunchPending}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--admin-fg-muted)', marginTop: '0.4rem' }}>
            Click status pill to filter
          </div>
        </div>

      </div>

      <MathDivider />

      {/* Bulk Update Controls */}
      <GlassCard padding="1rem" style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.2rem', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', textTransform: 'uppercase', borderRight: '1px solid var(--admin-border)', paddingRight: '1.2rem' }}>
          Bulk Edit ({selectedIds.size} selected)
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', fontFamily: 'var(--font-body)' }}>Present:</span>
            <select
              value={String(bulkPresent)}
              onChange={e => setBulkPresent(e.target.value === 'no-change' ? 'no-change' : e.target.value === 'true')}
              style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.75rem' }}
            >
              <option value="no-change">No Change</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', fontFamily: 'var(--font-body)' }}>Gift:</span>
            <select
              value={String(bulkGift)}
              onChange={e => setBulkGift(e.target.value === 'no-change' ? 'no-change' : e.target.value === 'true')}
              style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.75rem' }}
            >
              <option value="no-change">No Change</option>
              <option value="true">Collected</option>
              <option value="false">Pending</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', fontFamily: 'var(--font-body)' }}>Lunch:</span>
            <select
              value={String(bulkLunch)}
              onChange={e => setBulkLunch(e.target.value === 'no-change' ? 'no-change' : e.target.value === 'true')}
              style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.75rem' }}
            >
              <option value="no-change">No Change</option>
              <option value="true">Collected</option>
              <option value="false">Pending</option>
            </select>
          </div>

          <button
            onClick={handleBulkSubmit}
            disabled={isUpdating || selectedIds.size === 0}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 6,
              background: selectedIds.size === 0 ? 'rgba(255,255,255,0.02)' : 'var(--admin-accent)',
              color: selectedIds.size === 0 ? 'rgba(255,255,255,0.2)' : 'white',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              fontWeight: 600,
              border: selectedIds.size === 0 ? '1px solid var(--admin-border)' : 'none',
              cursor: selectedIds.size === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Apply Changes
          </button>
        </div>
      </GlassCard>

      {/* Main Table Card */}
      <GlassCard padding="1.5rem">
        <div style={{ overflowX: 'auto' }}>
          <table
            ref={tableRef}
            className="display"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              color: 'var(--admin-fg)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
            }}
          >
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--admin-border)' }}>
                <th style={{ padding: '0.75rem 0.5rem', width: 24 }}>
                  <input
                    type="checkbox"
                    checked={volunteers.length > 0 && selectedIds.size === volunteers.length}
                    onChange={e => handleSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Unique ID</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Serial No</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Phone Number</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>ID (Student ID)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Segment</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Department</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Year</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>T-shirt</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Present</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Gift</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Lunch</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Updated By</th>
                <th style={{ padding: '0.75rem 0.5rem', width: 90, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map(vol => (
                <tr
                  key={vol.unique_id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                  }}
                  className="hover-row"
                >
                  <td style={{ padding: '0.75rem 0.5rem' }} onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(vol.unique_id)}
                      onChange={() => handleSelectRow(vol.unique_id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{vol.unique_id}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{vol.serial_no || '-'}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{vol.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem', opacity: 0.85 }}>{vol.email}</td>
                  <td style={{ padding: '0.75rem 0.5rem', opacity: 0.8 }}>{vol.number || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'var(--font-mono)' }}>{vol.student_id || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    {vol.segment ? (
                      <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: '0.7rem' }}>
                        {vol.segment}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{vol.department || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{vol.year || '—'}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>{vol.t_shirt_size || '—'}</td>
                  
                  {/* Status cells: Click to toggle */}
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }} onClick={e => { e.stopPropagation(); toggleStatus(vol.unique_id, 'present', vol.is_present) }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 20,
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      background: vol.is_present ? 'rgba(0,250,100,0.12)' : 'rgba(250,50,50,0.08)',
                      color: vol.is_present ? 'rgb(0,230,100)' : 'rgb(240,80,80)',
                      border: vol.is_present ? '1px solid rgba(0,250,100,0.2)' : '1px solid rgba(250,50,50,0.15)',
                    }}>
                      {vol.is_present ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }} onClick={e => { e.stopPropagation(); toggleStatus(vol.unique_id, 'gift', vol.is_gift_collected) }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 20,
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      background: vol.is_gift_collected ? 'rgba(0,180,255,0.12)' : 'rgba(255,255,255,0.04)',
                      color: vol.is_gift_collected ? 'rgb(0,190,255)' : 'rgba(255,255,255,0.4)',
                      border: vol.is_gift_collected ? '1px solid rgba(0,180,255,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                      {vol.is_gift_collected ? 'COLLECTED' : 'PENDING'}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }} onClick={e => { e.stopPropagation(); toggleStatus(vol.unique_id, 'lunch', vol.is_lunch_collected) }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 20,
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      background: vol.is_lunch_collected ? 'rgba(230,170,0,0.12)' : 'rgba(255,255,255,0.04)',
                      color: vol.is_lunch_collected ? 'rgb(240,180,0)' : 'rgba(255,255,255,0.4)',
                      border: vol.is_lunch_collected ? '1px solid rgba(230,170,0,0.2)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                      {vol.is_lunch_collected ? 'SERVED' : 'PENDING'}
                    </span>
                  </td>

                  <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>
                    {vol.updated_by || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleDeleteVolunteer(vol.unique_id)}
                      style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: 6,
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* ============================================================ */}
      {/* 1. Modal: Add Volunteer                                      */}
      {/* ============================================================ */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--admin-sidebar-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: 16,
            padding: '1.75rem',
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ margin: '0 0 1rem', fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--admin-fg)' }}>
              Add Volunteer
            </h3>

            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Unique ID *</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    value={addForm.unique_id}
                    onChange={e => setAddForm(prev => ({ ...prev, unique_id: e.target.value.toUpperCase() }))}
                    required
                    placeholder="Auto-generated"
                    style={{ flexGrow: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setAddForm(prev => ({ ...prev, unique_id: generateRandomId() }))}
                    style={{
                      padding: '0.5rem 0.8rem',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--admin-fg)',
                      border: '1px solid var(--admin-border)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Serial No (Optional)</label>
                <input
                  value={addForm.serial_no}
                  onChange={e => setAddForm(prev => ({ ...prev, serial_no: e.target.value }))}
                  placeholder="Auto-generated (e.g. V260009)"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Full Name *</label>
                <input
                  value={addForm.name}
                  onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. Sifat Ahmed"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Email *</label>
                <input
                  value={addForm.email}
                  onChange={e => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  type="email"
                  placeholder="e.g. sifat@example.com"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Phone Number</label>
                <input
                  value={addForm.number}
                  onChange={e => setAddForm(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="e.g. 01712345678"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Volunteer Picture (Optional)</label>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: '1px dashed var(--admin-border)',
                  borderRadius: 12,
                  background: 'rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{
                    width: 70,
                    height: 70,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--admin-border)',
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {addForm.image_url ? (
                      <img src={addForm.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>No Image</span>
                    )}
                  </div>
                  <div style={{ flexGrow: 1, display: 'grid', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="add-vol-image-file"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
                            const data = await response.json().catch(() => null)
                            if (response.ok && data?.url) {
                              setAddForm(prev => ({ ...prev, image_url: data.url }))
                              showToast('Image uploaded successfully!')
                            } else {
                              showToast(data?.error ?? 'Upload failed.', 'error')
                            }
                          } catch (err: any) {
                            showToast(err.message, 'error')
                          }
                        }}
                      />
                      <label
                        htmlFor="add-vol-image-file"
                        style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: 6,
                          background: 'var(--admin-accent)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-block'
                        }}
                      >
                        Upload Image
                      </label>
                      {addForm.image_url && (
                        <button
                          type="button"
                          onClick={() => setAddForm(prev => ({ ...prev, image_url: '' }))}
                          style={{
                            padding: '0.35rem 0.8rem',
                            borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      value={addForm.image_url}
                      onChange={e => setAddForm(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="Or paste image URL directly..."
                      style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.3)', color: 'var(--admin-fg)', fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Segment</label>
                <input
                  value={addForm.segment}
                  onChange={e => setAddForm(prev => ({ ...prev, segment: e.target.value }))}
                  placeholder="e.g. Registration / PR"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Department</label>
                <input
                  value={addForm.department}
                  onChange={e => setAddForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="e.g. CSE / EEE"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>ID (Student ID)</label>
                <input
                  value={addForm.student_id}
                  onChange={e => setAddForm(prev => ({ ...prev, student_id: e.target.value }))}
                  placeholder="e.g. 2018331001"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Year</label>
                <input
                  value={addForm.year}
                  onChange={e => setAddForm(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="e.g. 3rd Year"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>T-shirt Size</label>
                <select
                  value={addForm.t_shirt_size}
                  onChange={e => setAddForm(prev => ({ ...prev, t_shirt_size: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addForm.is_present} onChange={e => setAddForm(prev => ({ ...prev, is_present: e.target.checked }))} />
                  Is Present
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addForm.is_gift_collected} onChange={e => setAddForm(prev => ({ ...prev, is_gift_collected: e.target.checked }))} />
                  Gift Collected
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={addForm.is_lunch_collected} onChange={e => setAddForm(prev => ({ ...prev, is_lunch_collected: e.target.checked }))} />
                  Lunch Collected
                </label>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-fg)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--admin-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. Modal: Edit / Details Volunteer                           */}
      {/* ============================================================ */}
      {editingVol && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '1rem',
        }}>
          <div style={{
            background: 'var(--admin-sidebar-bg)',
            border: '1px solid var(--admin-border)',
            borderRadius: 16,
            padding: '1.75rem',
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0', fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--admin-fg)' }}>
                  Edit Volunteer Profile
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--admin-fg-muted)', fontFamily: 'var(--font-mono)' }}>
                  Unique ID: {editingVol.unique_id}
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => handleDeleteVolunteer(editingVol.unique_id)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: 6,
                  background: 'rgba(250,50,50,0.1)',
                  color: 'rgb(250,80,80)',
                  border: '1px solid rgba(250,50,50,0.2)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Delete Volunteer
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Serial No</label>
                <input
                  value={editingVol.serial_no || ''}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, serial_no: e.target.value }) : null)}
                  placeholder="Auto-generated"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Full Name *</label>
                <input
                  value={editingVol.name}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  required
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Email *</label>
                <input
                  value={editingVol.email}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  required
                  type="email"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Phone Number</label>
                <input
                  value={editingVol.number || ''}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, number: e.target.value || null }) : null)}
                  placeholder="e.g. 01712345678"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem', border: '1px solid var(--admin-border)', borderRadius: 12, background: 'rgba(255,255,255,0.02)', marginBottom: '0.2rem' }}>
                <div style={{ background: '#ffffff', padding: '0.25rem', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 106, height: 106, flexShrink: 0 }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(editingVol.unique_id)}`} 
                    alt="Volunteer QR Code" 
                    style={{ width: 100, height: 100 }} 
                  />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem', color: 'var(--admin-fg)' }}>Volunteer QR Code</h4>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.7rem', color: 'var(--admin-fg-muted)' }}>Scan this code with the Android app for quick check-in, lunch service, and gift distribution.</p>
                  <a 
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(editingVol.unique_id)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      display: 'inline-block',
                      padding: '0.35rem 0.8rem',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--admin-fg)',
                      fontSize: '0.7rem',
                      textDecoration: 'none',
                      border: '1px solid var(--admin-border)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Open Full QR Code
                  </a>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Volunteer Picture (Optional)</label>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: '1px dashed var(--admin-border)',
                  borderRadius: 12,
                  background: 'rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{
                    width: 70,
                    height: 70,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1px solid var(--admin-border)',
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {editingVol.image_url ? (
                      <img src={editingVol.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '0.6rem', color: 'var(--admin-fg-muted)' }}>No Image</span>
                    )}
                  </div>
                  <div style={{ flexGrow: 1, display: 'grid', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="image/*"
                        id="edit-vol-image-file"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const formData = new FormData()
                            formData.append('file', file)
                            const response = await fetch('/api/admin/upload', { method: 'POST', body: formData })
                            const data = await response.json().catch(() => null)
                            if (response.ok && data?.url) {
                              setEditingVol(prev => prev ? ({ ...prev, image_url: data.url }) : null)
                              showToast('Image uploaded successfully!')
                            } else {
                              showToast(data?.error ?? 'Upload failed.', 'error')
                            }
                          } catch (err: any) {
                            showToast(err.message, 'error')
                          }
                        }}
                      />
                      <label
                        htmlFor="edit-vol-image-file"
                        style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: 6,
                          background: 'var(--admin-accent)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-block'
                        }}
                      >
                        Upload Image
                      </label>
                      {editingVol.image_url && (
                        <button
                          type="button"
                          onClick={() => setEditingVol(prev => prev ? ({ ...prev, image_url: null }) : null)}
                          style={{
                            padding: '0.35rem 0.8rem',
                            borderRadius: 6,
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <input
                      value={editingVol.image_url || ''}
                      onChange={e => setEditingVol(prev => prev ? ({ ...prev, image_url: e.target.value || null }) : null)}
                      placeholder="Or paste image URL directly..."
                      style={{ width: '100%', padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.3)', color: 'var(--admin-fg)', fontSize: '0.75rem' }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Segment</label>
                <input
                  value={editingVol.segment || ''}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, segment: e.target.value || null }) : null)}
                  placeholder="e.g. Segment"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Department</label>
                <input
                  value={editingVol.department || ''}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, department: e.target.value || null }) : null)}
                  placeholder="e.g. Department"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>ID (Student ID)</label>
                <input
                  value={editingVol.student_id || ''}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, student_id: e.target.value || null }) : null)}
                  placeholder="e.g. Student roll ID"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>Year</label>
                <input
                  value={editingVol.year || ''}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, year: e.target.value || null }) : null)}
                  placeholder="e.g. Year"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginBottom: '0.2rem' }}>T-shirt Size</label>
                <select
                  value={editingVol.t_shirt_size || 'L'}
                  onChange={e => setEditingVol(prev => prev ? ({ ...prev, t_shirt_size: e.target.value || null }) : null)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--admin-fg)', fontSize: '0.8rem' }}
                >
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingVol.is_present} onChange={e => setEditingVol(prev => prev ? ({ ...prev, is_present: e.target.checked }) : null)} />
                  Is Present
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingVol.is_gift_collected} onChange={e => setEditingVol(prev => prev ? ({ ...prev, is_gift_collected: e.target.checked }) : null)} />
                  Gift Collected
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editingVol.is_lunch_collected} onChange={e => setEditingVol(prev => prev ? ({ ...prev, is_lunch_collected: e.target.checked }) : null)} />
                  Lunch Collected
                </label>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1.2rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingVol(null)}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-fg)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--admin-accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const statCardStyle: React.CSSProperties = {
  background: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  borderRadius: 12,
  padding: '1rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}

const statLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--admin-fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '0.4rem',
}

const statValStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-heading)',
}
