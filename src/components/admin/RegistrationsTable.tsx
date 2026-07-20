'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { GlassCard } from './GlassCard'
import { MathDivider } from './MathDivider'
import * as XLSX from 'xlsx'
import { HexagonIcon, TriangleIcon, GridIcon } from './GeoIcons'
import type { ProcessedRegistration } from '@/types/database'

interface RegistrationsTableProps {
  initialRegistrations: ProcessedRegistration[]
}

type ToastTone = 'success' | 'error'

interface ToastState {
  message: string
  tone: ToastTone
}

export function RegistrationsTable({ initialRegistrations }: RegistrationsTableProps) {
  const [registrations, setRegistrations] = useState<ProcessedRegistration[]>(initialRegistrations)
  const [libLoaded, setLibLoaded] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  // Event filtering states
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all')

  // Collect unique events dynamically
  const uniqueEvents = useMemo(() => {
    const events = registrations.map(r => r.event).filter((e): e is string => !!e)
    return Array.from(new Set(events)).sort()
  }, [registrations])

  // Filter registrations based on selected event
  const displayedRegistrations = useMemo(() => {
    if (selectedEventFilter === 'all') return registrations
    return registrations.filter(r => r.event === selectedEventFilter)
  }, [registrations, selectedEventFilter])
  
  // Selection state
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set())
  
  // Bulk update states
  const [bulkKit, setBulkKit] = useState<boolean | 'no-change'>('no-change')
  const [bulkPresent, setBulkPresent] = useState<boolean | 'no-change'>('no-change')
  const [bulkLaunch, setBulkLaunch] = useState<boolean | 'no-change'>('no-change')
  const [bulkRoom, setBulkRoom] = useState<string>('')
  const [applyBulkRoom, setApplyBulkRoom] = useState<boolean>(false) // checkbox to determine if room should be updated
  
  // Modals state
  const [editingReg, setEditingReg] = useState<ProcessedRegistration | null>(null)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [excelPreview, setExcelPreview] = useState<{ serial: string; allocated_room: string }[]>([])
  const [showAdmitExcelModal, setShowAdmitExcelModal] = useState(false)
  const [admitExcelPreview, setAdmitExcelPreview] = useState<{ serial: string; admit_card_url: string }[]>([])
  const [adminPreviewUrl, setAdminPreviewUrl] = useState<string | null>(null)
  const [adminPreviewName, setAdminPreviewName] = useState('')
  
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

  // Escape key handler to close modal
  useEffect(() => {
    if (!editingReg) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingReg(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [editingReg])

  // Load jQuery and DataTables CDN dynamically
  useEffect(() => {
    let isMounted = true

    const loadScripts = async () => {
      // 1. Load jQuery
      if (!(window as any).$) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://code.jquery.com/jquery-3.7.1.min.js'
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load jQuery'))
          document.head.appendChild(script)
        })
      }

      // 2. Load CSS
      if (!document.getElementById('datatables-css')) {
        const link = document.createElement('link')
        link.id = 'datatables-css'
        link.rel = 'stylesheet'
        link.href = 'https://cdn.datatables.net/1.13.7/css/jquery.dataTables.min.css'
        document.head.appendChild(link)
      }

      // 3. Load DataTables JS
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
      showToast('Error loading table library. Please check your internet connection.', 'error')
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize/re-initialize DataTable whenever data or library status changes
  useEffect(() => {
    if (!libLoaded || !tableRef.current) return

    const $ = (window as any).$
    
    // Destroy previous instance
    if (dataTableInstance.current) {
      dataTableInstance.current.destroy()
      dataTableInstance.current = null
    }

    // Initialize with state preservation so pagination/searches aren't lost on data reload
    const dt = $(tableRef.current).DataTable({
      stateSave: true,
      destroy: true,
      columnDefs: [
        { orderable: false, targets: [0, 8, 9, 10, 11, 14, 15] },
        { searchable: false, targets: [0, 9, 10, 11, 14, 15] }
      ],
      pageLength: 25,
      lengthMenu: [10, 25, 50, 100, 250],
      language: {
        search: "Search Registrations:",
        lengthMenu: "Show _MENU_ entries"
      }
    })

    dataTableInstance.current = dt

    // Bind row click event using delegation on the table
    $(tableRef.current).off('click', 'tbody tr').on('click', 'tbody tr', (e: any) => {
      // Ignore click if it originated from interactive elements (checkboxes, toggle buttons, edit button)
      if ($(e.target).closest('input, button, select, a').length) {
        return
      }
      
      // Get the serial from the 2nd cell of the clicked row
      const serial = $(e.currentTarget).find('td:nth-child(2)').text().trim()
      
      // Find the corresponding record in state
      const reg = registrations.find(r => r.serial === serial)
      if (reg) {
        setEditingReg(reg)
      }
    })

    return () => {
      if (dataTableInstance.current) {
        dataTableInstance.current.destroy()
        dataTableInstance.current = null
      }
    }
  }, [displayedRegistrations, libLoaded])

  // Selection handlers
  const handleSelectRow = (serial: string) => {
    setSelectedSerials(prev => {
      const next = new Set(prev)
      if (next.has(serial)) {
        next.delete(serial)
      } else {
        next.add(serial)
      }
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSerials(new Set(registrations.map(r => r.serial)))
    } else {
      setSelectedSerials(new Set())
    }
  }

  const isAllSelected = registrations.length > 0 && selectedSerials.size === registrations.length

  // Parse Excel room allocations on client
  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' })

        const updates: { serial: string; allocated_room: string }[] = []

        rawJson.forEach((row: any) => {
          // Fuzzy key matching for robust column handling
          const keys = Object.keys(row)
          const serialKey = keys.find(k => k.toLowerCase().trim() === 'serial')
          const roomKey = keys.find(k => k.toLowerCase().trim() === 'allocated_room' || k.toLowerCase().trim() === 'allocated room' || k.toLowerCase().trim() === 'room')

          if (serialKey && row[serialKey]) {
            const serial = String(row[serialKey]).trim()
            const room = roomKey ? String(row[roomKey]).trim() : ''
            updates.push({ serial, allocated_room: room })
          }
        })

        if (updates.length === 0) {
          showToast('No rows found containing "serial" and "allocated_room" column headers.', 'error')
          return
        }

        setExcelPreview(updates)
        setShowExcelModal(true)
        // Reset file input so same file can be uploaded again
        e.target.value = ''
      } catch (err: any) {
        showToast(`Failed to read Excel file: ${err.message}`, 'error')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Execute Room updates from Excel modal
  const confirmExcelImport = () => {
    startUpdateTransition(async () => {
      try {
        const res = await fetch('/api/admin/registrations/import-rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: excelPreview })
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to import rooms.')

        // Update local state
        const roomMap = new Map(excelPreview.map(item => [item.serial, item.allocated_room]))
        setRegistrations(prev =>
          prev.map(r => {
            if (roomMap.has(r.serial)) {
              return { ...r, allocated_room: roomMap.get(r.serial) || null }
            }
            return r
          })
        )

        showToast(`Successfully updated rooms for ${result.count} registrations!`)
        setShowExcelModal(false)
        setExcelPreview([])
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Parse Excel admit card URL allocations on client
  const handleAdmitExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const rawJson = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' })

        const updates: { serial: string; admit_card_url: string }[] = []

        rawJson.forEach((row: any) => {
          // Fuzzy key matching for robust column handling
          const keys = Object.keys(row)
          const serialKey = keys.find(k => k.toLowerCase().trim() === 'serial')
          const urlKey = keys.find(k => k.toLowerCase().trim() === 'admit_card_url' || k.toLowerCase().trim() === 'admit card url' || k.toLowerCase().trim() === 'admit_card' || k.toLowerCase().trim() === 'url')

          if (serialKey && row[serialKey]) {
            const serial = String(row[serialKey]).trim()
            const url = urlKey ? String(row[urlKey]).trim() : ''
            updates.push({ serial, admit_card_url: url })
          }
        })

        if (updates.length === 0) {
          showToast('No rows found containing "serial" and "admit_card_url" column headers.', 'error')
          return
        }

        setAdmitExcelPreview(updates)
        setShowAdmitExcelModal(true)
        e.target.value = ''
      } catch (err: any) {
        showToast(`Failed to read Excel file: ${err.message}`, 'error')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Execute Admit Card updates from Excel modal
  const confirmAdmitExcelImport = () => {
    startUpdateTransition(async () => {
      try {
        const res = await fetch('/api/admin/registrations/import-admit-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: admitExcelPreview })
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to import admit cards.')

        // Update local state
        const urlMap = new Map(admitExcelPreview.map(item => [item.serial, item.admit_card_url]))
        setRegistrations(prev =>
          prev.map(r => {
            if (urlMap.has(r.serial)) {
              return { ...r, admit_card_url: urlMap.get(r.serial) || null }
            }
            return r
          })
        )

        showToast(`Successfully updated admit card URLs for ${result.count} registrations!`)
        setShowAdmitExcelModal(false)
        setAdmitExcelPreview([])
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Trigger individual toggles
  const handleToggleField = (serial: string, field: 'is_kit_coollect' | 'is_present' | 'is_collect_launch', currentValue: boolean) => {
    startUpdateTransition(async () => {
      try {
        const updatedValue = !currentValue
        const res = await fetch('/api/admin/registrations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serials: serial,
            data: { [field]: updatedValue }
          })
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to update field.')

        // Update local state
        setRegistrations(prev =>
          prev.map(r => (r.serial === serial ? { ...r, [field]: updatedValue } : r))
        )
        showToast('Status updated!')
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Save changes from individual edit modal
  const handleSaveIndividualEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingReg) return

    const formData = new FormData(e.currentTarget)
    const is_kit_coollect = formData.get('is_kit_coollect') === 'true'
    const is_present = formData.get('is_present') === 'true'
    const is_collect_launch = formData.get('is_collect_launch') === 'true'
    const allocated_room = formData.get('allocated_room') as string
    const admit_card_url = formData.get('admit_card_url') as string
    
    const full_name = formData.get('full_name') as string
    const email_address = formData.get('email_address') as string
    const phone_number = formData.get('phone_number') as string
    const gender = formData.get('gender') as string
    const t_shirt_size = formData.get('t_shirt_size') as string
    const institution = formData.get('institution') as string
    const class_year_student_of = formData.get('class_year_student_of') as string
    const event = formData.get('event') as string
    const payment_method = formData.get('payment_method') as string
    const payment_number = formData.get('payment_number') as string
    const transaction_id = formData.get('transaction_id') as string

    startUpdateTransition(async () => {
      try {
        const res = await fetch('/api/admin/registrations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serials: editingReg.serial,
            data: {
              is_kit_coollect,
              is_present,
              is_collect_launch,
              allocated_room: allocated_room.trim() || null,
              admit_card_url: admit_card_url.trim() || null,
              full_name: full_name.trim() || null,
              email_address: email_address.trim() || null,
              phone_number: phone_number.trim() || null,
              gender: gender.trim() || null,
              t_shirt_size: t_shirt_size.trim() || null,
              institution: institution.trim() || null,
              class_year_student_of: class_year_student_of.trim() || null,
              event: event.trim() || null,
              payment_method: payment_method.trim() || null,
              payment_number: payment_number.trim() || null,
              transaction_id: transaction_id.trim() || null
            }
          })
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to save changes.')

        setRegistrations(prev =>
          prev.map(r =>
            r.serial === editingReg.serial
              ? {
                  ...r,
                  is_kit_coollect,
                  is_present,
                  is_collect_launch,
                  allocated_room: allocated_room.trim() || null,
                  admit_card_url: admit_card_url.trim() || null,
                  full_name: full_name.trim() || null,
                  email_address: email_address.trim() || null,
                  phone_number: phone_number.trim() || null,
                  gender: gender.trim() || null,
                  t_shirt_size: t_shirt_size.trim() || null,
                  institution: institution.trim() || null,
                  class_year_student_of: class_year_student_of.trim() || null,
                  event: event.trim() || null,
                  payment_method: payment_method.trim() || null,
                  payment_number: payment_number.trim() || null,
                  transaction_id: transaction_id.trim() || null,
                  updated_by: result.updatedBy || r.updated_by
                }
              : r
          )
        )

        showToast('Registration details updated successfully!')
        setEditingReg(null)
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Bulk Apply options (updates selected or all)
  const handleBulkApply = (target: 'selected' | 'all') => {
    const targetsCount = target === 'selected' ? selectedSerials.size : registrations.length

    if (targetsCount === 0) {
      showToast('No registrations selected to update.', 'error')
      return
    }

    // Build update object
    const updateObj: Record<string, any> = {}
    if (bulkKit !== 'no-change') updateObj.is_kit_coollect = bulkKit
    if (bulkPresent !== 'no-change') updateObj.is_present = bulkPresent
    if (bulkLaunch !== 'no-change') updateObj.is_collect_launch = bulkLaunch
    if (applyBulkRoom) {
      updateObj.allocated_room = bulkRoom.trim() || null
    }

    if (Object.keys(updateObj).length === 0) {
      showToast('Select at least one setting to apply in bulk.', 'error')
      return
    }

    const confirmMsg = target === 'selected'
      ? `Apply these updates to the ${selectedSerials.size} selected rows?`
      : `Are you absolutely sure you want to update ALL ${registrations.length} registrations in the database?`

    if (!confirm(confirmMsg)) return

    startUpdateTransition(async () => {
      try {
        const serialsParam = target === 'selected' ? Array.from(selectedSerials) : 'all'

        const res = await fetch('/api/admin/registrations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serials: serialsParam,
            data: updateObj
          })
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to apply bulk updates.')

        // Update local state
        setRegistrations(prev =>
          prev.map(r => {
            const isTarget = target === 'all' || selectedSerials.has(r.serial)
            if (isTarget) {
              return { ...r, ...updateObj }
            }
            return r
          })
        )

        showToast(`Successfully updated ${targetsCount} registrations!`)
        
        // Reset inputs
        if (target === 'selected') {
          setSelectedSerials(new Set())
        }
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Helper to extract currently filtered/visible registrations in the DataTable
  const getFilteredRegistrations = () => {
    const $ = (window as any).$
    if (!dataTableInstance.current || !$) return displayedRegistrations

    const filteredSerials: string[] = []
    dataTableInstance.current.rows({ filter: 'applied' }).every(function (this: any) {
      const rowNode = this.node()
      if (rowNode) {
        const serial = $(rowNode).find('td:nth-child(2)').text().trim()
        if (serial) {
          filteredSerials.push(serial)
        }
      }
    })

    const serialSet = new Set(filteredSerials)
    return displayedRegistrations.filter(r => serialSet.has(r.serial))
  }

  // Export registrations data to Excel spreadsheet
  const handleExportExcel = () => {
    const targetData = getFilteredRegistrations()
    if (targetData.length === 0) {
      showToast('No registrations found to export.', 'error')
      return
    }

    const dataToExport = targetData.map(r => ({
      'Serial': r.serial,
      'Full Name': r.full_name || '',
      'Email Address': r.email_address || '',
      'Phone Number': r.phone_number || '',
      'Institution': r.institution || '',
      'Class/Year': r.class_year_student_of || '',
      'Level': r.level || '',
      'Event': r.event || '',
      'T-shirt Size': r.t_shirt_size || '',
      'Payment Method': r.payment_method || '',
      'Payment Number': r.payment_number || '',
      'Transaction ID': r.transaction_id || '',
      'Kit Collected': r.is_kit_coollect ? 'Yes' : 'No',
      'Present': r.is_present ? 'Yes' : 'No',
      'Launch Collected': r.is_collect_launch ? 'Yes' : 'No',
      'Allocated Room': r.allocated_room || '',
      'Updated By': r.updated_by || '',
      'Updated At': r.updated_at ? new Date(r.updated_at).toLocaleString() : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations')
    XLSX.writeFile(workbook, 'National_Mathematics_Carnival_2026_Registrations.xlsx')
    showToast('Excel spreadsheet downloaded!')
  }

  // Export registrations data to PDF report with proper Unicode/Bangla support using native print shaper
  const handleExportPDF = () => {
    const targetData = getFilteredRegistrations()
    if (targetData.length === 0) {
      showToast('No registrations found to export.', 'error')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('Pop-up blocked! Please allow popups to export PDF.', 'error')
      return
    }

    const title = 'National Mathematics Carnival 2026 - Processed Registrations'
    
    // Compute summary metrics for the targetData
    const totalCount = targetData.length
    const presentCount = targetData.filter(r => r.is_present).length
    const kitCount = targetData.filter(r => r.is_kit_coollect).length
    const launchCount = targetData.filter(r => r.is_collect_launch).length

    const presentPercent = totalCount > 0 ? (presentCount / totalCount) * 100 : 0
    const kitPercent = totalCount > 0 ? (kitCount / totalCount) * 100 : 0
    const launchPercent = totalCount > 0 ? (launchCount / totalCount) * 100 : 0

    // Build table rows HTML
    const rowsHtml = targetData.map((r, index) => `
      <tr>
        <td style="font-family: monospace;">${index + 1}</td>
        <td>${r.serial || ''}</td>
        <td>
          <div style="font-weight: bold;">${r.full_name || ''}</div>
          <div style="font-size: 10px; color: #555;">${r.institution || ''}</div>
        </td>
        <td>${r.email_address || ''}</td>
        <td>${r.phone_number || ''}</td>
        <td>${r.level || ''} (${r.class_year_student_of || ''})</td>
        <td>${r.event || ''}</td>
        <td>${r.allocated_room || 'Not Allocated'}</td>
        <td style="text-align: center;">${r.is_kit_coollect ? 'Yes' : 'No'}</td>
        <td style="text-align: center;">${r.is_present ? 'Present' : 'Absent'}</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>\${title}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Kalpurush&family=Noto+Sans+Bengali:wght@400;700&display=swap');
            body {
              font-family: 'Inter', 'Noto Sans Bengali', 'Kalpurush', sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              font-size: 20px;
              margin-bottom: 5px;
            }
            .meta {
              font-size: 11px;
              color: #666;
              margin-bottom: 20px;
              font-family: monospace;
            }
            .summary-card {
              display: flex; 
              gap: 40px; 
              margin-bottom: 30px; 
              align-items: center; 
              border: 1px solid #e5e7eb; 
              padding: 20px; 
              border-radius: 8px; 
              background-color: #f9fafb;
            }
            .stats-text {
              flex: 1;
            }
            .stats-text h3 {
              margin-top: 0; 
              margin-bottom: 12px; 
              font-size: 13px; 
              text-transform: uppercase; 
              color: #4f46e5; 
              letter-spacing: 0.05em;
            }
            .stats-grid {
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 8px; 
              font-size: 12px;
            }
            .chart-container {
              display: flex; 
              gap: 20px;
            }
            .chart-box {
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              vertical-align: middle;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 700;
            }
            tr:nth-child(even) {
              background-color: #fafafa;
            }
            @media print {
              body { padding: 0; }
              @page { size: landscape; margin: 1cm; }
              .summary-card { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>National Mathematics Carnival 2026</h1>
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">Processed Registrations Report</div>
          <div class="meta">Generated on: \${new Date().toLocaleString()}</div>
          
          <!-- Summary Metrics and Charts Dashboard -->
          <div class="summary-card">
            <div class="stats-text">
              <h3>Exported Data Summary</h3>
              <div class="stats-grid">
                <div><strong>Total Registrations:</strong> \${totalCount}</div>
                <div><strong>Present Attendance:</strong> \${presentCount} / \dots \${totalCount} (\${presentPercent.toFixed(1)}%)</div>
                <div><strong>Kits Collected:</strong> \${kitCount} / \${totalCount} (\${kitPercent.toFixed(1)}%)</div>
                <div><strong>Launch Served:</strong> \${launchCount} / \${totalCount} (\${launchPercent.toFixed(1)}%)</div>
              </div>
            </div>
            <div class="chart-container">
              <!-- SVG Donut Chart for Attendance -->
              <div class="chart-box">
                <svg width="80" height="80" viewBox="0 0 36 36" style="transform: rotate(-90deg);">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" stroke-width="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" stroke-width="3" 
                          stroke-dasharray="\${presentPercent} \${100 - presentPercent}" />
                  <text x="18" y="18" dominant-baseline="central" text-anchor="middle" font-size="6" font-family="sans-serif" font-weight="bold" fill="#333" style="transform: rotate(90deg); transform-origin: 18px 18px;">\${presentPercent.toFixed(0)}%</text>
                </svg>
                <div style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #4b5563;">Attendance</div>
              </div>
              <!-- SVG Donut Chart for Kit -->
              <div class="chart-box">
                <svg width="80" height="80" viewBox="0 0 36 36" style="transform: rotate(-90deg);">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" stroke-width="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06b6d4" stroke-width="3" 
                          stroke-dasharray="\${kitPercent} \${100 - kitPercent}" />
                  <text x="18" y="18" dominant-baseline="central" text-anchor="middle" font-size="6" font-family="sans-serif" font-weight="bold" fill="#333" style="transform: rotate(90deg); transform-origin: 18px 18px;">\${kitPercent.toFixed(0)}%</text>
                </svg>
                <div style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #4b5563;">Kits Distributed</div>
              </div>
              <!-- SVG Donut Chart for Launch -->
              <div class="chart-box">
                <svg width="80" height="80" viewBox="0 0 36 36" style="transform: rotate(-90deg);">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" stroke-width="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" stroke-width="3" 
                          stroke-dasharray="\${launchPercent} \dots \${100 - launchPercent}" />
                  <text x="18" y="18" dominant-baseline="central" text-anchor="middle" font-size="6" font-family="sans-serif" font-weight="bold" fill="#333" style="transform: rotate(90deg); transform-origin: 18px 18px;">\${launchPercent.toFixed(0)}%</text>
                </svg>
                <div style="font-size: 10px; font-weight: bold; margin-top: 5px; color: #4b5563;">Launch Served</div>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Serial</th>
                <th>Name / Institution</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Level & Year</th>
                <th>Event</th>
                <th>Room</th>
                <th>Kit</th>
                <th>Present</th>
              </tr>
            </thead>
            <tbody>
              \${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
    showToast('PDF print preview opened!')
  }

  // Handle individual deletion of a registration
  const handleDeleteIndividual = async (serial: string, name: string) => {
    if (!confirm(`Are you sure you want to delete registration for "${name}" (Serial: ${serial})? This action cannot be undone.`)) {
      return
    }

    startUpdateTransition(async () => {
      try {
        const res = await fetch('/api/admin/registrations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serials: serial })
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Failed to delete registration.')

        // Update local state
        setRegistrations(prev => prev.filter(r => r.serial !== serial))
        setSelectedSerials(prev => {
          const next = new Set(prev)
          next.delete(serial)
          return next
        })

        showToast(`Successfully deleted registration for ${name}!`)
        setEditingReg(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        showToast(err.message, 'error')
      }
    })
  }

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: displayedRegistrations.length,
      kits: displayedRegistrations.filter(r => r.is_kit_coollect).length,
      present: displayedRegistrations.filter(r => r.is_present).length,
      launch: displayedRegistrations.filter(r => r.is_collect_launch).length,
      rooms: displayedRegistrations.filter(r => r.allocated_room !== null && r.allocated_room !== '').length
    }
  }, [displayedRegistrations])

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto', position: 'relative' }}>
      
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--admin-accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.3rem', opacity: 0.7 }}>
            NMC 2026 · Registrations Database
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--admin-fg)', margin: 0 }}>
            Processed Registrations
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--admin-fg-muted)', margin: '0.4rem 0 0' }}>
            Search, verify attendance, check kit distribution, and manage room allocations.
          </p>
        </div>

        {/* Action Buttons Group */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Event Filter dropdown */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', textTransform: 'uppercase' }}>Filter Event:</span>
            <select
              value={selectedEventFilter}
              onChange={e => setSelectedEventFilter(e.target.value)}
              style={{
                background: 'var(--admin-surface)',
                color: 'var(--admin-fg)',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                padding: '0.55rem 1rem',
                fontSize: '0.75rem',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'var(--font-body)'
              }}
            >
              <option value="all">All Events</option>
              {uniqueEvents.map(evt => (
                <option key={evt} value={evt}>{evt}</option>
              ))}
            </select>
          </div>

          {/* Excel Export button */}
          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '0.6rem 1.2rem',
              borderRadius: 8,
              border: '1px solid #107c41',
              background: 'rgba(16, 124, 65, 0.05)',
              color: '#107c41',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              fontWeight: 600
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(16, 124, 65, 0.15)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(16, 124, 65, 0.05)'
            }}
          >
            📊 Export Excel
          </button>

          {/* PDF Export button */}
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={pdfLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '0.6rem 1.2rem',
              borderRadius: 8,
              border: '1px solid #ef4444',
              background: 'rgba(239, 68, 68, 0.05)',
              color: '#ef4444',
              cursor: pdfLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              fontWeight: 600,
              opacity: pdfLoading ? 0.7 : 1
            }}
            onMouseEnter={e => {
              if (!pdfLoading) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
            }}
            onMouseLeave={e => {
              if (!pdfLoading) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'
            }}
          >
            📄 {pdfLoading ? 'Exporting PDF...' : 'Export PDF'}
          </button>

          {/* Excel Import button */}
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '0.6rem 1.2rem',
              borderRadius: 8,
              border: '1px dashed var(--admin-accent)',
              background: 'rgba(99, 102, 241, 0.05)',
              color: 'var(--admin-accent)',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              fontWeight: 600
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)'
              e.currentTarget.style.borderColor = 'var(--admin-fg)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'
              e.currentTarget.style.borderColor = 'var(--admin-accent)'
            }}
          >
            <span>📥</span> Import Rooms (.xlsx)
            <input
              type="file"
              accept=".xlsx"
              onChange={handleExcelFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      {/* ── Stats Overview cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Total registrations</div>
          <div style={statValStyle}>{stats.total}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Present attendees</div>
          <div style={statValStyle}><span style={{ color: '#20c997' }}>{stats.present}</span> / {stats.total}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Kits Distributed</div>
          <div style={statValStyle}><span style={{ color: '#0dcaf0' }}>{stats.kits}</span> / {stats.total}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Launch Distributed</div>
          <div style={statValStyle}><span style={{ color: '#ffc107' }}>{stats.launch}</span> / {stats.total}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Rooms Allocated</div>
          <div style={statValStyle}>{stats.rooms} / {stats.total}</div>
        </div>
      </div>

      <MathDivider formula="\sum_{i=1}^{n} X_i \rightarrow Attendance" />

      {/* ── Bulk Actions Panel ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <GlassCard padding="1.25rem" style={{ border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-accent)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 1rem' }}>
            Bulk Action Toolset
          </h2>
          
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            
            {/* Kit Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={bulkLabelStyle}>Kit Status</label>
              <select
                value={bulkKit === 'no-change' ? 'no-change' : String(bulkKit)}
                onChange={e => setBulkKit(e.target.value === 'no-change' ? 'no-change' : e.target.value === 'true')}
                style={bulkSelectStyle}
              >
                <option value="no-change">- No change -</option>
                <option value="true">Collected</option>
                <option value="false">Not Collected</option>
              </select>
            </div>

            {/* Present Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={bulkLabelStyle}>Present Status</label>
              <select
                value={bulkPresent === 'no-change' ? 'no-change' : String(bulkPresent)}
                onChange={e => setBulkPresent(e.target.value === 'no-change' ? 'no-change' : e.target.value === 'true')}
                style={bulkSelectStyle}
              >
                <option value="no-change">- No change -</option>
                <option value="true">Present</option>
                <option value="false">Absent</option>
              </select>
            </div>

            {/* Launch Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={bulkLabelStyle}>Launch Status</label>
              <select
                value={bulkLaunch === 'no-change' ? 'no-change' : String(bulkLaunch)}
                onChange={e => setBulkLaunch(e.target.value === 'no-change' ? 'no-change' : e.target.value === 'true')}
                style={bulkSelectStyle}
              >
                <option value="no-change">- No change -</option>
                <option value="true">Collected</option>
                <option value="false">Not Collected</option>
              </select>
            </div>

            {/* Room update option */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 200 }}>
              <label style={{ ...bulkLabelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={applyBulkRoom}
                  onChange={e => setApplyBulkRoom(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                Update Allocated Room
              </label>
              <input
                type="text"
                disabled={!applyBulkRoom}
                value={bulkRoom}
                onChange={e => setBulkRoom(e.target.value)}
                placeholder="E.g. Room 402, Gallery"
                style={{
                  ...bulkInputStyle,
                  opacity: applyBulkRoom ? 1 : 0.4,
                  cursor: applyBulkRoom ? 'text' : 'not-allowed'
                }}
              />
            </div>

            {/* Trigger buttons */}
            <div style={{ display: 'flex', gap: '0.6rem', marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => handleBulkApply('selected')}
                style={{
                  ...bulkBtnStyle,
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid var(--admin-accent)',
                  color: 'var(--admin-accent)'
                }}
              >
                Apply to Selected ({selectedSerials.size})
              </button>

              <button
                type="button"
                onClick={() => handleBulkApply('all')}
                style={{
                  ...bulkBtnStyle,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444'
                }}
              >
                Apply to All ({registrations.length})
              </button>
            </div>

          </div>
        </GlassCard>
      </div>

      {/* ── Table Container ── */}
      <GlassCard padding="1.5rem" style={{ border: '1px solid rgba(255, 255, 255, 0.05)', overflowX: 'auto' }}>
        
        {/* Dynamic DataTables Overrides CSS */}
        <style dangerouslySetInnerHTML={{ __html: `
          .dataTables_wrapper {
            font-family: var(--font-body);
            color: var(--admin-fg);
          }
          .dataTables_wrapper .dataTables_length,
          .dataTables_wrapper .dataTables_filter,
          .dataTables_wrapper .dataTables_info,
          .dataTables_wrapper .dataTables_paginate {
            color: var(--admin-fg-muted) !important;
            font-size: 0.8rem;
            margin-bottom: 1rem;
          }
          .dataTables_wrapper .dataTables_length select {
            background-color: var(--admin-surface);
            color: var(--admin-fg);
            border: 1px solid var(--admin-border);
            border-radius: 6px;
            padding: 4px 8px;
            margin: 0 4px;
            outline: none;
          }
          .dataTables_wrapper .dataTables_filter input {
            background-color: var(--admin-surface);
            color: var(--admin-fg);
            border: 1px solid var(--admin-border);
            border-radius: 6px;
            padding: 6px 12px;
            margin-left: 8px;
            outline: none;
            width: 250px;
            transition: border-color 0.15s;
          }
          .dataTables_wrapper .dataTables_filter input:focus {
            border-color: var(--admin-accent);
          }
          .dataTables_wrapper .dataTables_paginate .paginate_button {
            color: var(--admin-fg-muted) !important;
            border: 1px solid var(--admin-border) !important;
            background: var(--admin-surface) !important;
            border-radius: 6px !important;
            padding: 4px 10px !important;
            margin: 0 2px !important;
            transition: all 0.15s !important;
          }
          .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
            color: #fff !important;
            background: var(--admin-accent) !important;
            border-color: var(--admin-accent) !important;
          }
          .dataTables_wrapper .dataTables_paginate .paginate_button.current {
            color: #fff !important;
            background: var(--admin-accent) !important;
            border-color: var(--admin-accent) !important;
            font-weight: 600;
          }
          .dataTables_wrapper .dataTables_paginate .paginate_button.disabled {
            opacity: 0.4 !important;
            cursor: not-allowed !important;
            background: rgba(255,255,255,0.02) !important;
            border-color: var(--admin-border) !important;
          }
          table.dataTable {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-bottom: 1.5rem !important;
          }
          table.dataTable thead th {
            border-bottom: 2px solid var(--admin-border) !important;
            color: var(--admin-fg-muted);
            font-family: var(--font-mono);
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 10px 8px !important;
            background: rgba(255, 255, 255, 0.01);
          }
          table.dataTable tbody tr {
            background-color: transparent !important;
            border-bottom: 1px solid var(--admin-border);
            transition: background 0.15s;
            cursor: pointer;
          }
          table.dataTable tbody tr:hover {
            background-color: rgba(255, 255, 255, 0.03) !important;
          }
          table.dataTable tbody td {
            padding: 10px 8px !important;
            font-size: 0.85rem;
            vertical-align: middle;
          }
        ` }} />

        {libLoaded ? (
          <table ref={tableRef} className="display">
            <thead>
              <tr>
                <th style={{ width: '30px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Serial</th>
                <th>Name / Institution</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Level & Year</th>
                <th>Event</th>
                <th>T-Shirt</th>
                <th>Payment Info</th>
                <th style={{ textAlign: 'center' }}>Kit</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Launch</th>
                <th>Room</th>
                <th>Updated By</th>
                <th style={{ textAlign: 'center' }}>Admit Card</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedRegistrations.map(reg => (
                <tr key={reg.serial}>
                  {/* Select Checkbox */}
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedSerials.has(reg.serial)}
                      onChange={() => handleSelectRow(reg.serial)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>

                  {/* Serial */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {reg.serial}
                  </td>

                  {/* Name & School */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--admin-fg)' }}>{reg.full_name || '-'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', marginTop: '2px' }}>{reg.institution || '-'}</div>
                  </td>

                  {/* Email */}
                  <td>
                    {reg.email_address ? (
                      <a href={`mailto:${reg.email_address}`} style={{ color: 'var(--admin-accent)', textDecoration: 'none' }}>
                        {reg.email_address}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--admin-fg-muted)', fontStyle: 'italic' }}>-</span>
                    )}
                  </td>

                  {/* Phone */}
                  <td>
                    {reg.phone_number ? (
                      <a href={`tel:${reg.phone_number}`} style={{ color: 'var(--admin-fg)', textDecoration: 'none' }}>
                        {reg.phone_number}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--admin-fg-muted)', fontStyle: 'italic' }}>-</span>
                    )}
                  </td>

                  {/* Class / level */}
                  <td>
                    <span style={levelBadgeStyle(reg.level)}>{reg.level || 'Unknown'}</span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-fg-muted)', marginTop: '4px' }}>{reg.class_year_student_of || '-'}</div>
                  </td>

                  {/* Event */}
                  <td style={{ fontWeight: 500, color: 'var(--admin-accent)' }}>
                    {reg.event || '-'}
                  </td>

                  {/* T-Shirt Size */}
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {reg.t_shirt_size || '-'}
                  </td>

                  {/* Payment Details */}
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600 }}>{reg.payment_method || '-'}</span>: {reg.payment_number || '-'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--admin-fg-muted)', marginTop: '2px' }}>
                      TxID: {reg.transaction_id || '-'}
                    </div>
                  </td>

                  {/* Kit Collected Toggle Button */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleField(reg.serial, 'is_kit_coollect', reg.is_kit_coollect)}
                      style={toggleBadgeStyle(reg.is_kit_coollect, '#0dcaf0')}
                    >
                      {reg.is_kit_coollect ? 'Yes' : 'No'}
                    </button>
                  </td>

                  {/* Present Toggle Button */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleField(reg.serial, 'is_present', reg.is_present)}
                      style={toggleBadgeStyle(reg.is_present, '#20c997')}
                    >
                      {reg.is_present ? 'Present' : 'Absent'}
                    </button>
                  </td>

                  {/* Launch Collected Toggle Button */}
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleField(reg.serial, 'is_collect_launch', reg.is_collect_launch)}
                      style={toggleBadgeStyle(reg.is_collect_launch, '#ffc107')}
                    >
                      {reg.is_collect_launch ? 'Yes' : 'No'}
                    </button>
                  </td>

                  {/* Room Allocation */}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {reg.allocated_room ? (
                      <span style={roomBadgeStyle}>{reg.allocated_room}</span>
                    ) : (
                      <span style={{ color: 'var(--admin-fg-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>Not Allocated</span>
                    )}
                  </td>

                  {/* Updated By Admin */}
                  <td style={{ whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                    {reg.updated_by ? (
                      <span style={{ color: 'var(--admin-accent)' }}>{reg.updated_by}</span>
                    ) : (
                      <span style={{ color: 'var(--admin-fg-muted)', fontStyle: 'italic' }}>Never</span>
                    )}
                  </td>

                  {/* Admit Card preview/link */}
                  <td style={{ textAlign: 'center' }}>
                    {reg.admit_card_url ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAdminPreviewUrl(reg.admit_card_url)
                          setAdminPreviewName(reg.full_name || reg.serial)
                        }}
                        style={{
                          borderRadius: 6,
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          background: 'rgba(99, 102, 241, 0.15)',
                          color: 'var(--admin-accent)',
                          padding: '0.35rem 0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'
                        }}
                      >
                        View
                      </button>
                    ) : (
                      <span style={{ color: 'var(--admin-fg-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>None</span>
                    )}
                  </td>

                  {/* Action buttons */}
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setEditingReg(reg)}
                        style={actionBtnStyle}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteIndividual(reg.serial, reg.full_name || '')}
                        style={{
                          ...actionBtnStyle,
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid #ef4444',
                          color: '#ef4444'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
            <div style={{ border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--admin-accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--admin-fg-muted)', letterSpacing: '0.05em' }}>
              Loading DataTables core library...
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}} />
          </div>
        )}

      </GlassCard>

      {/* ── Toast Notifications ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: toast.tone === 'success' ? '#20c997' : '#ef4444',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '0.85rem',
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          {toast.message}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}} />
        </div>
      )}

      {/* ── Individual Edit Modal ── */}
      {editingReg && (
        <div
          style={modalOverlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingReg(null)
            }
          }}
        >
          <form
            onSubmit={handleSaveIndividualEdit}
            style={modalContainerStyle}
          >
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Edit Registration</h3>
                <button
                  type="button"
                  onClick={() => handleDeleteIndividual(editingReg.serial, editingReg.full_name || '')}
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
                  Delete Record
                </button>
              </div>
              <button type="button" onClick={() => setEditingReg(null)} style={closeBtnStyle}>✕</button>
            </div>
            <div style={modalBodyStyle}>
              
              {/* Row 1: Serial & Full Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Serial (Read-Only)</label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--admin-fg-muted)', padding: '0.6rem 0' }}>{editingReg.serial}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    defaultValue={editingReg.full_name || ''}
                    placeholder="E.g. MD. SIFATULLAH"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 2: Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Email Address</label>
                  <input
                    type="email"
                    name="email_address"
                    defaultValue={editingReg.email_address || ''}
                    placeholder="E.g. saiful@example.com"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Phone / WhatsApp</label>
                  <input
                    type="text"
                    name="phone_number"
                    defaultValue={editingReg.phone_number || ''}
                    placeholder="E.g. 017xxxxxxxx"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 3: Institution & Class/Year */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Institution</label>
                  <input
                    type="text"
                    name="institution"
                    defaultValue={editingReg.institution || ''}
                    placeholder="E.g. Dhaka University"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Class / Year / Student Of</label>
                  <input
                    type="text"
                    name="class_year_student_of"
                    defaultValue={editingReg.class_year_student_of || ''}
                    placeholder="E.g. Class 8, HSC 1st Year"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 4: Gender & T-Shirt Size */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Gender</label>
                  <select
                    name="gender"
                    defaultValue={editingReg.gender || ''}
                    style={inputStyle}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>T-Shirt Size</label>
                  <input
                    type="text"
                    name="t_shirt_size"
                    defaultValue={editingReg.t_shirt_size || ''}
                    placeholder="E.g. S, M, L, XL"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 5: Event & Allocated Room */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Event Enrolled</label>
                  <input
                    type="text"
                    name="event"
                    defaultValue={editingReg.event || ''}
                    placeholder="E.g. Math Game, Math Olympiad"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Allocated Room</label>
                  <input
                    type="text"
                    name="allocated_room"
                    defaultValue={editingReg.allocated_room || ''}
                    placeholder="E.g. Room 402, Gallery"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 6: Payment Method & Payment Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Payment Method</label>
                  <input
                    type="text"
                    name="payment_method"
                    defaultValue={editingReg.payment_method || ''}
                    placeholder="E.g. Bkash, Nagad"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Payment Number</label>
                  <input
                    type="text"
                    name="payment_number"
                    defaultValue={editingReg.payment_number || ''}
                    placeholder="E.g. 017xxxxxxxx"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Row 7: Transaction ID & Last Updated By */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Transaction ID</label>
                  <input
                    type="text"
                    name="transaction_id"
                    defaultValue={editingReg.transaction_id || ''}
                    placeholder="E.g. Done, DGA09BAX"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Last Updated By (Read-Only)</label>
                  <div style={{ fontSize: '0.8rem', color: 'var(--admin-fg-muted)', fontFamily: 'var(--font-mono)', padding: '0.6rem 0' }}>
                    {editingReg.updated_by ? (
                      <span style={{ color: 'var(--admin-accent)', fontWeight: 600 }}>{editingReg.updated_by}</span>
                    ) : (
                      'System Seed (Never updated by admin)'
                    )}
                  </div>
                </div>
              </div>

              {/* Row 7.5: Admit Card URL */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.25rem' }}>
                <label style={fieldLabelStyle}>Admit Card URL</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    name="admit_card_url"
                    defaultValue={editingReg.admit_card_url || ''}
                    placeholder="E.g. https://.../admit-card.pdf"
                    style={inputStyle}
                  />
                  {editingReg.admit_card_url && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminPreviewUrl(editingReg.admit_card_url || null)
                        setAdminPreviewName(editingReg.full_name || editingReg.serial)
                      }}
                      style={{
                        ...actionBtnStyle,
                        whiteSpace: 'nowrap',
                        padding: '0.6rem 1rem'
                      }}
                    >
                      Preview Admit
                    </button>
                  )}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--admin-border)', margin: '1.25rem 0' }} />

              {/* Row 8: Status Flags (Kit, Present, Launch) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Kit Collected?</label>
                  <select name="is_kit_coollect" defaultValue={String(editingReg.is_kit_coollect)} style={inputStyle}>
                    <option value="true">Collected (Yes)</option>
                    <option value="false">Not Collected (No)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Attendance</label>
                  <select name="is_present" defaultValue={String(editingReg.is_present)} style={inputStyle}>
                    <option value="true">Present</option>
                    <option value="false">Absent</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={fieldLabelStyle}>Launch Collected?</label>
                  <select name="is_collect_launch" defaultValue={String(editingReg.is_collect_launch)} style={inputStyle}>
                    <option value="true">Collected (Yes)</option>
                    <option value="false">Not Collected (No)</option>
                  </select>
                </div>
              </div>

            </div>
            <div style={modalFooterStyle}>
              <button type="button" onClick={() => setEditingReg(null)} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" disabled={isUpdating} style={submitBtnStyle}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Excel Upload Verification Modal ── */}
      {showExcelModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Verify Room Allocation Import</h3>
              <button type="button" onClick={() => { setShowExcelModal(false); setExcelPreview([]); }} style={closeBtnStyle}>✕</button>
            </div>
            <div style={modalBodyStyle}>
              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--admin-fg-muted)' }}>
                We parsed the Excel file and found <strong style={{ color: 'var(--admin-accent)' }}>{excelPreview.length}</strong> room assignment row(s).
                Please inspect a sample preview of the updates below.
              </p>

              {/* Preview table */}
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'rgba(0,0,0,0.2)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--admin-surface)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--admin-border)' }}>Serial</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--admin-border)' }}>Proposed Allocated Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelPreview.slice(0, 10).map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{row.serial}</td>
                        <td style={{ padding: '8px' }}>
                          {row.allocated_room ? (
                            <span style={roomBadgeStyle}>{row.allocated_room}</span>
                          ) : (
                            <span style={{ color: 'var(--admin-fg-muted)', fontStyle: 'italic' }}>Remove Allocation (Set Null)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {excelPreview.length > 10 && (
                      <tr>
                        <td colSpan={2} style={{ padding: '8px', textAlign: 'center', color: 'var(--admin-fg-muted)', fontStyle: 'italic' }}>
                          ... and {excelPreview.length - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 6, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', marginTop: '-2px' }}>💡</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', lineHeight: '1.3' }}>
                  Clicking "Confirm Import" will update room assignments in the database matching these serials. Rows that don't match any registered serials in the DB will be ignored.
                </span>
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button type="button" onClick={() => { setShowExcelModal(false); setExcelPreview([]); }} style={cancelBtnStyle}>Cancel</button>
              <button type="button" onClick={confirmExcelImport} disabled={isUpdating} style={submitBtnStyle}>
                {isUpdating ? 'Importing...' : `Confirm Import (${excelPreview.length} rows)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Excel Upload Verification Modal for Admit Cards ── */}
      {showAdmitExcelModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Verify Admit Card Import</h3>
              <button type="button" onClick={() => { setShowAdmitExcelModal(false); setAdmitExcelPreview([]); }} style={closeBtnStyle}>✕</button>
            </div>
            <div style={modalBodyStyle}>
              <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--admin-fg-muted)' }}>
                We parsed the Excel file and found <strong style={{ color: 'var(--admin-accent)' }}>{admitExcelPreview.length}</strong> admit card row(s).
                Please inspect a sample preview of the updates below.
              </p>

              {/* Preview table */}
              <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 6, background: 'rgba(0,0,0,0.2)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--admin-surface)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--admin-border)' }}>Serial</th>
                      <th style={{ padding: '8px', borderBottom: '1px solid var(--admin-border)' }}>Proposed Admit Card URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admitExcelPreview.slice(0, 10).map((row, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>{row.serial}</td>
                        <td style={{ padding: '8px', wordBreak: 'break-all' }}>
                          {row.admit_card_url ? (
                            <span style={{ color: 'var(--admin-accent)' }}>{row.admit_card_url}</span>
                          ) : (
                            <span style={{ color: 'var(--admin-fg-muted)', fontStyle: 'italic' }}>Remove Url (Set Null)</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {admitExcelPreview.length > 10 && (
                      <tr>
                        <td colSpan={2} style={{ padding: '8px', textAlign: 'center', color: 'var(--admin-fg-muted)', fontStyle: 'italic' }}>
                          ... and {admitExcelPreview.length - 10} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 6, display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.1rem', marginTop: '-2px' }}>💡</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-fg-muted)', lineHeight: '1.3' }}>
                  Clicking "Confirm Import" will update admit card URLs in the database matching these serials. Rows that don't match any registered serials in the DB will be ignored.
                </span>
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button type="button" onClick={() => { setShowAdmitExcelModal(false); setAdmitExcelPreview([]); }} style={cancelBtnStyle}>Cancel</button>
              <button type="button" onClick={confirmAdmitExcelImport} disabled={isUpdating} style={submitBtnStyle}>
                {isUpdating ? 'Importing...' : `Confirm Import (${admitExcelPreview.length} rows)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin PDF Preview Modal ── */}
      {adminPreviewUrl && (
        <div
          style={modalOverlayStyle}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAdminPreviewUrl(null)
            }
          }}
        >
          <div
            style={{
              ...modalContainerStyle,
              maxWidth: '850px',
              height: '85vh',
            }}
          >
            {/* Modal Header */}
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
                  Admit Card Viewer
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--admin-fg-muted)' }}>
                  Participant: {adminPreviewName}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setAdminPreviewUrl(null)} 
                style={closeBtnStyle}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: PDF Container */}
            <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', position: 'relative' }}>
              <object
                data={`${adminPreviewUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                type="application/pdf"
                style={{ width: '100%', height: '100%', border: 'none' }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--admin-sidebar-bg)',
                    color: 'var(--admin-fg)'
                  }}
                >
                  <span style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</span>
                  <h4 style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                    PDF Preview Not Supported
                  </h4>
                  <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--admin-fg-muted)', maxWidth: '320px', lineHeight: '1.4' }}>
                    Your device or browser doesn't support rendering PDF files inline. Please use the button below to view it directly.
                  </p>
                  <a
                    href={adminPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 8,
                      background: 'var(--admin-accent)',
                      color: '#fff',
                      padding: '0.6rem 1.5rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      boxShadow: '0 4px 12px var(--admin-accent-glow)'
                    }}
                  >
                    Open PDF directly
                  </a>
                </div>
              </object>
            </div>

            {/* Modal Footer */}
            <div style={modalFooterStyle}>
              <button
                type="button"
                onClick={() => setAdminPreviewUrl(null)}
                style={cancelBtnStyle}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const iframe = document.querySelector('iframe[title="Admit Card Preview"]') as HTMLIFrameElement;
                  if (iframe && iframe.contentWindow) {
                    try {
                      iframe.contentWindow.focus();
                      iframe.contentWindow.print();
                    } catch {
                      const w = window.open(adminPreviewUrl, '_blank');
                      if (w) {
                        w.focus();
                        w.print();
                      }
                    }
                  } else {
                    const w = window.open(adminPreviewUrl, '_blank');
                    if (w) {
                      w.focus();
                      w.print();
                    }
                  }
                }}
                style={{
                  ...submitBtnStyle,
                  background: 'transparent',
                  border: '1px solid var(--admin-accent)',
                  color: 'var(--admin-accent)'
                }}
              >
                Print Admit
              </button>
              <a
                href={adminPreviewUrl}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderRadius: 8,
                  background: 'var(--admin-accent)',
                  color: '#fff',
                  padding: '0.6rem 1.4rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Stylings ──────────────────────────────────────────────────────────────────

const statCardStyle: React.CSSProperties = {
  background: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  borderRadius: 12,
  padding: '1.25rem',
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

const bulkLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--admin-fg-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const bulkSelectStyle: React.CSSProperties = {
  background: 'var(--admin-surface)',
  color: 'var(--admin-fg)',
  border: '1px solid var(--admin-border)',
  borderRadius: 8,
  padding: '0.5rem 0.75rem',
  fontSize: '0.8rem',
  outline: 'none',
  width: '140px',
  cursor: 'pointer',
}

const bulkInputStyle: React.CSSProperties = {
  background: 'var(--admin-surface)',
  color: 'var(--admin-fg)',
  border: '1px solid var(--admin-border)',
  borderRadius: 8,
  padding: '0.5rem 0.75rem',
  fontSize: '0.8rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box'
}

const bulkBtnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.68rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: '0.55rem 1rem',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
  display: 'inline-flex',
  alignItems: 'center',
}

const actionBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--admin-border)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: '0.35rem 0.75rem',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'all 0.15s',
}

// Badge color definitions based on registration levels
const levelBadgeStyle = (level: string | null): React.CSSProperties => {
  const text = String(level).toLowerCase()
  let bg = 'rgba(255,255,255,0.05)'
  let color = 'var(--admin-fg-muted)'

  if (text.includes('school')) {
    bg = 'rgba(13, 202, 240, 0.1)'
    color = '#0dcaf0'
  } else if (text.includes('college') || text.includes('hsc')) {
    bg = 'rgba(111, 66, 193, 0.1)'
    color = '#6f42c1'
  } else if (text.includes('university') || text.includes('graduate')) {
    bg = 'rgba(253, 126, 20, 0.1)'
    color = '#fd7e14'
  }

  return {
    display: 'inline-block',
    fontSize: '0.68rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    padding: '2px 6px',
    borderRadius: 4,
    background: bg,
    color: color,
    whiteSpace: 'nowrap'
  }
}

// Toggle badge button style
const toggleBadgeStyle = (active: boolean, themeColor: string): React.CSSProperties => {
  return {
    display: 'inline-block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    border: `1px solid ${active ? themeColor : 'var(--admin-border)'}`,
    background: active ? `rgba(${activeColorRgb(themeColor)}, 0.1)` : 'rgba(0,0,0,0.1)',
    color: active ? themeColor : 'var(--admin-fg-muted)',
    transition: 'all 0.15s',
    minWidth: '55px',
    textAlign: 'center'
  }
}

// Helper to convert hex to rgb for opacity backgrounds
function activeColorRgb(color: string) {
  if (color === '#20c997') return '32, 201, 151' // green
  if (color === '#0dcaf0') return '13, 202, 240' // teal
  if (color === '#ffc107') return '255, 193, 7'   // amber
  return '255, 255, 255'
}

const roomBadgeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 6,
  background: 'rgba(99, 102, 241, 0.1)',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  color: 'var(--admin-accent)',
}

// Modal styles
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 9990,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
}

const modalContainerStyle: React.CSSProperties = {
  background: 'var(--admin-sidebar-bg)',
  border: '1px solid var(--admin-border)',
  borderRadius: 16,
  width: '100%',
  maxWidth: '640px',
  maxHeight: '90vh',
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: 'scaleIn 0.15s ease-out'
}

const modalHeaderStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--admin-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--admin-fg-muted)',
  cursor: 'pointer',
  fontSize: '1rem',
}

const modalBodyStyle: React.CSSProperties = {
  padding: '1.5rem',
  overflowY: 'auto',
  flex: 1,
}

const modalFooterStyle: React.CSSProperties = {
  padding: '1.25rem 1.5rem',
  borderTop: '1px solid var(--admin-border)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  background: 'rgba(0,0,0,0.08)'
}

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.62rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--admin-fg-muted)',
}

const inputStyle: React.CSSProperties = {
  background: 'var(--admin-surface)',
  color: 'var(--admin-fg)',
  border: '1px solid var(--admin-border)',
  borderRadius: 8,
  padding: '0.6rem 0.8rem',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const cancelBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--admin-border)',
  color: 'var(--admin-fg)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: '0.6rem 1.2rem',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'background 0.15s',
}

const submitBtnStyle: React.CSSProperties = {
  background: 'var(--admin-accent)',
  border: '1px solid var(--admin-accent)',
  color: '#fff',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  padding: '0.6rem 1.2rem',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}
