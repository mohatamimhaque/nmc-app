# National Mathematics Carnival 2026 — Documentation Ecosystem

Welcome to the official developer and operator documentation for the **National Mathematics Carnival 2026 (NMC 2026)** ecosystem, organized by **Math Club, DUET**. 

This documentation is designed to guide future developers, system administrators, and event organizers in maintaining, updating, and repurposing the platform for future events.

---

## 1. System Overview & Architecture

The NMC 2026 platform consists of three main components:
1. **Next.js Web Application & Admin Panel**: The public-facing site where participants view events, announcements, and schedules. It includes a math-themed CMS (Content Management System) where admins manage site settings, adviser listings, committee members, and registrations.
2. **FastAPI Admit Card Generator ("Autocrat")**: A local Python microservice that uses COM automation to fill participant information into a PowerPoint (`.pptx`) template, renders a dynamic QR code based on their serial number, exports the result to PDF, and uploads it to Cloudflare R2.
3. **Admin Android Mobile App**: A native Kotlin application used on-site by event volunteers and admins for quick QR code check-ins (attendance, kit collections, lunch distribution) with offline-first support.

### System Integration Flow

```mermaid
graph TD
    subgraph Cloud Infrastructure
        Vercel[Vercel: Next.js Frontend & API]
        Supabase[Supabase: Postgres Database & Auth]
        R2[Cloudflare R2: Media & PDF Storage]
    end

    subgraph Local Infrastructure
        FastAPI[Local Python API: Admit Card Generator]
        MSPowerPoint[MS PowerPoint: COM Engine]
    end

    subgraph Clients
        User[Public Users / Web Browsers]
        Android[Android App: Scanner Client]
    end

    %% Web App connections
    User -->|Browse / Register| Vercel
    Vercel -->|Query/Auth/Realtime| Supabase
    Vercel -->|Upload/Serve Images| R2

    %% Admit Card Generation Flow
    Vercel -->|Trigger PDF Generation| FastAPI
    FastAPI -->|Write values & QR| MSPowerPoint
    MSPowerPoint -->|Export PDF| FastAPI
    FastAPI -->|Upload PDF| R2
    Vercel -->|Fetch PDF Link| R2

    %% Android App connections
    Android -->|JWT Login & Scans| Vercel
    Android -->|Download PDFs| R2
```

---

## 2. Documentation Map

Please refer to the following documents for deep-dive instructions:

| Document | Focus Area | Key Contents |
| :--- | :--- | :--- |
| **[Setup & Deployment](docs/setup_and_deployment.md)** | Getting Started | Local development setup, environment variables, Vercel deployments, and setting up the Python PDF generator. |
| **[Architecture & APIs](docs/architecture_and_apis.md)** | Technical Specifications | Supabase DB tables, role-based permission flags, custom management scripts, and REST API contract details. |
| **[Database Schema & ER](docs/database_schema.md)** | Relational Structure | Complete entity-relationship model diagrams, foreign key constraint tables, delete cascade paths, and stored SQL procedure flows. |
| **[Admin Panel CMS](docs/admin_panel.md)** | CMS Operations | Complete guide to the admin panel dashboard, site personalization, content sliders, event forms builder, Excel/ZIP imports, and schedule manager. |
| **[Public Site Pages](docs/public_website.md)** | Site Structure | Interactive features, query configurations, map hooks, notice streams, category filters, and layout behaviors for all public views. |
| **[Event Repurposing Guide](docs/event_repurposing.md)** | Event Operations | Checklist for configuring a new event, editing PowerPoint templates, changing branding/colors, seeding new users, and clearing data. |
| **[Android App Specifications](docs/android_app_specification.md)** | Mobile App | Kotlin stack details, offline Room+SQLCipher caching structure, QR scanning viewports, and native PDF rendering logic. |
| **[Legacy PRD Requirements](docs/nmc_prd.md)** | Requirements | Historical Product Requirement Document outlining the initial system architecture design scopes. |

---

## 3. Core Tech Stack Recap

*   **Web Frontend & Backend API**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, shadcn/ui.
*   **Database & Auth**: Supabase (PostgreSQL), Row Level Security (RLS) policies, Realtime.
*   **Storage**: Cloudflare R2 bucket (S3-compatible) with `Sharp` WebP compression.
*   **PDF Microservice**: FastAPI, Python, pythoncom/win32com, python-pptx, qrcode.
*   **Mobile Application**: Kotlin, Jetpack Compose, Material 3, CameraX, Google ML Kit Barcode Scanning, Room SQLite + SQLCipher, Retrofit 2.

---

## 4. Operational Flowcharts & Page Architectures

The following diagrams illustrate the detailed page routing flows, user interaction steps, and permissions enforcement checklist.

### A. Public Web Flow & Registration Lifecycle
```mermaid
flowchart TD
    Start([User visits /]) --> HomeGrid{Home Page Settings}
    HomeGrid -->|Visible| RenderSection[Render Hero, Countdown, Sponsors...]
    HomeGrid -->|Hidden| SkipSection[Omit Section]
    
    RenderSection --> NavEvents[Go to /events]
    NavEvents --> LevelFilter[Filter: School / College / Uni]
    LevelFilter --> ClickCard[Click Event Card]
    ClickCard --> EventSlug[Go to /events/slug]
    
    EventSlug --> CheckStatus{Event Status?}
    CheckStatus -->|Hidden| 404[404 Page Not Found]
    CheckStatus -->|Disabled| ClosedCTA[Show Registration Closed Badge]
    CheckStatus -->|Published| ActiveCTA[Show Register Button]
    
    ActiveCTA --> FormType{Reg Type?}
    FormType -->|google_form| GoogleRedirect[Redirect to Google Form URL]
    FormType -->|internal| InternalModal[Render Custom Form Fields]
    InternalModal --> SubmitForm[Submit Form Validation]
    SubmitForm --> SupabaseSave[Write to Supabase db]
```

---

### B. CMS Admin Gatekeeper & Control Flows
```mermaid
flowchart TD
    LoginStart([Access /admin]) --> POSTAuth[POST /api/admin/login]
    POSTAuth --> SupabaseVerify{Verify Supabase JWT?}
    SupabaseVerify -->|Invalid| LoginFail[Display Invalid Credentials]
    SupabaseVerify -->|Valid| RoleCheck{Match admin_users Table?}
    
    RoleCheck -->|No Record / Volunteer| AccessDenied[403 Access Denied Screen]
    RoleCheck -->|Match Found| AccessGranted[Redirect to /admin/dashboard]
    
    AccessGranted --> ManageModules[Access Dashboard Modules]
    ManageModules --> AdvisersPanel[Advisers Panel]
    ManageModules --> CommitteePanel[Committee Panel]
    ManageModules --> EventsPanel[Events Panel]
    ManageModules --> NoticesPanel[Notices Panel]
    
    AdvisersPanel --> DragReorder[Drag-and-Drop Reorder]
    AdvisersPanel --> BulkExcelZIP[Upload Excel + ZIP members]
    
    EventsPanel --> DynamicFormBuilder[Build Internal Form Inputs]
    EventsPanel --> SetRedirect[Set Google Form redirect URL]
    
    NoticesPanel --> RealtimeNotice[Publish with Realtime Webhooks]
```

---

### C. Native Android Volunteer Flow & Sync Engine
```mermaid
flowchart TD
    Launch([App Launch]) --> CheckToken{Check Cached JWT?}
    CheckToken -->|Not Found| MobileLogin[Render Login Screen]
    CheckToken -->|Found| Dashboard[Dashboard Screen]
    
    MobileLogin --> AuthAPI[POST /api/admin/login]
    AuthAPI --> SaveSecureToken[Save token in EncryptedSharedPreferences]
    SaveSecureToken --> Dashboard
    
    Dashboard --> ClickFAB[Tap Scan FAB Button]
    ClickFAB --> Camera[CameraX + Google ML Kit Barcode Scan]
    
    Camera --> DetectQR[Detect QR code containing Serial]
    DetectQR --> ReadSettings{Read Active Scan Mode}
    
    ReadSettings --> KitMode[Kit Collection]
    ReadSettings --> PresentMode[Presence Attendance]
    ReadSettings --> LunchMode[Lunch Collect]
    ReadSettings --> InfoMode[Info Lookup]
    
    KitMode & PresentMode & LunchMode --> CheckPermissions{Check Profile Flags?}
    CheckPermissions -->|Unauthorized| ShowDenied[Show Permission Error Alert]
    CheckPermissions -->|Authorized| ConnectionCheck{Connection Status?}
    
    ConnectionCheck -->|Online| APICall[Execute PATCH Route to Vercel API]
    ConnectionCheck -->|Offline| SQLCipherCache[Cache in Encrypted Room DB]
    
    SQLCipherCache --> WorkManager[WorkManager detects Network and pushes updates]
    APICall & WorkManager --> SuccessVib[Trigger Success Haptic Vibration & Render details]
```

---

### D. API Endpoint Security & Permissions Authorization
```mermaid
flowchart TD
    APIRequest([Request Hits Endpoint]) --> ExtractHeader[Extract Authorization Header]
    ExtractHeader --> JWTVerify{Verify Bearer Token?}
    
    JWTVerify -->|Failed / Expired| 401[Return 401 Unauthorized]
    JWTVerify -->|Passed| GetUID[Get Authenticated auth.uid]
    
    GetUID --> AdminQuery[Query admin_users table]
    AdminQuery --> CheckActiveRole{Check User Role}
    
    CheckActiveRole -->|super_admin / admin| AllowAction[Execute Database Transaction]
    CheckActiveRole -->|registration_editor / volunteer| MatchPermissionFlags{Check Action Flag?}
    
    MatchPermissionFlags -->|can_manage_toggle == false| 403[Return 403 Forbidden]
    MatchPermissionFlags -->|can_manage_toggle == true| AllowAction
```


---
<p align="center">
  Developed by <b>Mohatamim Haque</b> <br/>
  <a href="https://wa.me/8801518749114" target="_blank"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp"/></a>
  <a href="mailto:mohatamimhaque7@gmail.com" target="_blank"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="mailto:mohatamimhaque@outlook.com" target="_blank"><img src="https://img.shields.io/badge/Outlook-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white" alt="Outlook"/></a>
  <a href="https://facebook.com/mohatamim44" target="_blank"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook"/></a>
  <a href="https://linkedin.com/in/mohatamim" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mohatamimhaque" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
</p>
