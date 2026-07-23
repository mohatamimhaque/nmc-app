"use client"

import React, { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        background: 'var(--admin-bg)',
      }}
    >
      {/* Mobile Drawer Sidebar */}
      <div
        className={`admin-sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 99,
          transform: 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Desktop Inline Sidebar */}
      <div className="admin-sidebar-desktop" style={{ display: 'block' }}>
        <AdminSidebar />
      </div>

      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 98,
          }}
        />
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile Header top bar */}
        <header
          className="admin-mobile-header"
          style={{
            display: 'none',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--admin-border)',
            background: 'var(--admin-sidebar-bg)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--admin-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
            }}
          >
            {/* Hamburger Icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          </button>
          <span
            style={{
              marginLeft: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.04em',
              color: 'var(--admin-fg)',
            }}
          >
            NMC 2026 Admin
          </span>
        </header>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: '1.5rem',
            color: 'var(--admin-fg)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {children}
        </main>
      </div>

      {/* Global CSS for CSS-based responsive toggles */}
      <style jsx global>{`
        /* Sidebar layout responsive rules */
        .admin-sidebar-wrapper {
          display: block;
        }
        .admin-sidebar-desktop {
          display: block;
        }
        .admin-mobile-header {
          display: none !important;
        }

        @media (max-width: 768px) {
          .admin-sidebar-desktop {
            display: none !important;
          }
          .admin-sidebar-wrapper.open {
            transform: translateX(0) !important;
          }
          .admin-mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
