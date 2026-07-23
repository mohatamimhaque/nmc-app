# National Mathematics Carnival 2026 — Official Event Website
## Product Requirements Document (PRD) & Technical Architecture — v3.0

| Attribute | Detail |
|---|---|
| Document Version | 3.0 |
| Status | Approved |
| Prepared For | Math Club, DUET |
| Deployment | Vercel + Supabase |
| Storage | Cloudflare R2 |
| Author | Product Team |
| Organisation | Dhaka University of Engineering & Technology |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Tech Stack & Deployment Architecture](#3-tech-stack--deployment-architecture)
4. [Public Website — Page Specifications](#4-public-website--page-specifications)
   - 4.1 Home Page
   - 4.2 Events Page & Per-Event Detail Pages
   - 4.3 Image Gallery
   - 4.4 Contact Page
   - 4.5 About Page
   - 4.6 Sponsors & Partners Page
   - 4.7 Schedule / Program Page
   - 4.8 Notices & Announcements Page
   - 4.9 Organizing Committee Page
   - 4.10 Footer (Global)
5. [Admin Panel — Feature Specifications](#5-admin-panel--feature-specifications)
   - 5.1 Secure Authentication
   - 5.2 Theme & Branding Control (Mathematics-Themed Admin UI)
   - 5.3 Adviser Panel
   - 5.4 Organizing Committee Panel
   - 5.5 Events Management Panel
   - 5.6 Sponsors Management Panel
   - 5.7 Notices & Announcements Panel
   - 5.8 Registration Management Panel
   - 5.9 Home Page Panel
   - 5.10 Gallery Panel
   - 5.11 Contact & About Panel
   - 5.12 Schedule Panel
   - 5.13 Footer Management Panel
   - 5.14 Rich Text Editor (Global)
6. [Admin Panel — Analytics Dashboard](#6-admin-panel--analytics-dashboard)
7. [Admin Panel — Help & Documentation Page](#7-admin-panel--help--documentation-page)
8. [Database Schema (Supabase / PostgreSQL)](#8-database-schema-supabase--postgresql)
9. [Image Handling & Cloudflare R2 Storage](#9-image-handling--cloudflare-r2-storage)
10. [Security Requirements](#10-security-requirements)
11. [Performance & SEO Requirements](#11-performance--seo-requirements)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Future Enhancements](#13-future-enhancements)
14. [Admin Android Mobile Application](#14-admin-android-mobile-application)
15. [FastAPI PowerPoint PDF Microservice](#15-fastapi-powerpoint-pdf-microservice)
16. [Certificate Verification & Generation System](#16-certificate-verification--generation-system)
17. [Participant Room Finder & Live Location Maps](#17-participant-room-finder--live-location-maps)

---

## 1. Executive Summary

This document defines the complete Product Requirements, Technical Architecture, Database Schema, and Admin Panel specifications for the official event website of **National Mathematics Carnival 2026**, organised by Math Club, DUET.

The website will serve as the primary digital presence for the event — providing information to thousands of prospective participants across Bangladesh while equipping administrators with a powerful, no-code control panel to manage every aspect of the site in real time.

> **Core Objective:** Deliver a fast, modern, fully admin-controlled event website with deep customisation (theme, colours, content, visibility), rich analytics, secure authentication, optimised media handling, real-time registration countdown clocks, a multi-tier committee structure, adviser profiles, per-event registration with internal or Google Form routing, categorised sponsor display, notices board, and a mathematics-themed admin UI — all deployable on Vercel with Supabase as the backend and Cloudflare R2 for asset storage.

| Attribute | Detail |
|---|---|
| Project Name | NMC 2026 Official Website |
| Organisation | Math Club, DUET |
| Deployment Platform | Vercel (Edge Network) |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Media Storage | Cloudflare R2 (S3-compatible) |
| Image Constraint | Auto-compressed to < 1 MB on upload |
| Admin UI Theme | Mathematics-themed (equations, grids, fractal motifs) |
| Supported Themes | Light / Dark (admin-configurable public default) |
| Registration Types | Internal form OR external Google Form (per event, admin-selected) |

---

## 2. Project Overview

### 2.1 Goals & Success Criteria

**Public Website**
- Present event information with individual detail pages per event, including a real-time registration deadline countdown clock
- Route participants to the correct registration form (internal or Google Form) based on admin configuration per event
- Display advisers and organizing committee members elegantly, grouped by sub-committee in tabbed cards
- Broadcast notices and announcements in real time with category badges
- Showcase sponsors in tiered, category-labelled logo grids
- Render an attractive, information-rich footer on every page
- Deliver a fully responsive layout from 320px to 4K

**Admin Panel**
- Mathematics-themed admin UI with subtle equation wallpapers, grid backgrounds, and fractal/geometric accent motifs
- Allow management of advisers and each sub-committee independently
- Support both single-member manual entry and bulk import via Excel + ZIP (images inside ZIP, paths in Excel)
- Allow rich-text editing for all descriptions and about sections
- Provide full control over registration type, link, and deadline per event
- Enable real-time notice publishing with priority, category, and expiry
- Control sponsor display categories and logo/name visibility per sponsor

**Technical**
- Page load speed < 2 seconds on 4G mobile (Lighthouse score ≥ 90)
- All images auto-compressed to < 1 MB without visible quality loss
- Zero-downtime deployments via Vercel CI/CD
- Row-Level Security on all Supabase tables
- Real-time countdown clocks using client-side JS with server-synced deadline timestamps

### 2.2 Constraints & Assumptions

- Deployment on Vercel free/pro tier
- All user-uploaded images compressed to < 1 MB via Sharp server-side
- Bulk import: Excel parsed with SheetJS; ZIP extracted with JSZip; images matched by filename path from Excel column
- Database and auth exclusively via Supabase
- File/media storage exclusively via Cloudflare R2
- Admin panel restricted to authorised emails only
- No e-commerce or payment gateway in v1 scope
- Internal registration forms store submissions in Supabase; Google Form registrations redirect to the provided URL

---

## 3. Tech Stack & Deployment Architecture

### 3.1 Stack Overview

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | Next.js 14 (App Router) | SSR/SSG, routing, API routes |
| Styling | Tailwind CSS + CSS Variables | Utility-first; dynamic theming; math-themed admin via custom Tailwind layer |
| Animation | Framer Motion | Page transitions, hero animations, countdown pulse effects |
| UI Components | shadcn/ui + Radix UI | Accessible headless component primitives |
| Rich Text Editor | Tiptap (ProseMirror-based) | Admin descriptions, about sections, event details, notices |
| Icons | Lucide React | Consistent icon system |
| Excel Parsing | SheetJS (xlsx) | Bulk import from .xlsx committee data |
| ZIP Extraction | JSZip | Extract member images from uploaded .zip file |
| Real-Time Countdown | Custom React hook + `date-fns` | Per-event registration deadline clocks |
| Database | Supabase (PostgreSQL) | All content, settings, analytics metadata |
| Authentication | Supabase Auth | Admin JWT-based sessions, RLS enforcement |
| File Storage | Cloudflare R2 | Images, logos, favicons — CDN-delivered |
| Image Processing | Sharp (Vercel Function) | Auto-compress to < 1 MB (WebP output) |
| Analytics | Custom (Supabase) + optional Plausible | Privacy-first event and page tracking |
| Deployment | Vercel | Edge deployment, preview URLs, CI/CD |
| Email | Resend or Nodemailer + SMTP | Contact form + registration confirmation emails |
| State Management | Zustand | Admin panel state, unsaved changes tracking |
| Real-Time | Supabase Realtime | Live notice board updates, live visitor count in admin |
| Mobile Stack | Kotlin + Jetpack Compose | Native Android dashboard and scanning viewport |
| Mobile Storage | Room SQLite + SQLCipher | Offline check-in caching and 256-bit encryption |
| Mobile Camera | CameraX + Google ML Kit | Scanning barcodes and participant QR codes |
| PDF Automation | FastAPI + python-pptx | Local microservice driving PowerPoint COM engine |

### 3.2 Infrastructure Overview

**Request Flow:**
```
User Browser
  → Vercel Edge Network (CDN cache)
    → Next.js App (SSR / ISR / API Routes)
      → Supabase PostgreSQL (content data)
      → Supabase Auth (session validation)
      ↔ Cloudflare R2 (media assets via CDN)
      ↔ Supabase Realtime (notices, live admin data)
```

| Component | Role |
|---|---|
| Vercel Edge | Hosts Next.js app; serves CDN-cached pages; auto-scales; zero-config SSL |
| Next.js API Routes | Image upload handler, Excel+ZIP bulk import, contact form, analytics ingestion, registration form submissions |
| Supabase DB | Stores all CMS content, settings, analytics events, registrations, notices |
| Supabase Auth | Admin login, JWT validation, session management |
| Supabase Realtime | Pushes notice updates to connected public clients; live count in admin |
| Cloudflare R2 | Stores all images, logos, favicons; public CDN bucket |
| Sharp | Resizes + compresses every uploaded image to < 1 MB; WebP output |
| SheetJS + JSZip | Server-side parsing of Excel + ZIP bulk import for committee members |

---

## 4. Public Website — Page Specifications

### 4.1 Home Page  `/`

Every section is independently toggleable and reorderable by the admin.

| Section | Content | Admin Controls |
|---|---|---|
| **Hero** | Full-width banner or bold text headline + subheading + CTA button | Switch between image-banner and text-only mode; edit headline, subtext, CTA label & link; upload/replace banner; set overlay colour & opacity |
| **Event Countdown** | Live countdown timer to event date/time | Set target date & time; show/hide section; custom label text |
| **Registration Deadline Strip** | Highlighted banner showing nearest open registration deadline with real-time clock | Auto-picks earliest open deadline from events table; toggle show/hide |
| **Event Highlights Cards** | Grid of event cards (title, short description, icon/image, link to event page) | Reorder; toggle visibility per card; edit content; add/delete cards |
| **Notices Preview** | Latest 3 notices from the Notices board with "View All" CTA | Auto-pulled from notices table; toggle section visibility |
| **Image Gallery Preview** | Curated 6–9 photo strip with "View All" CTA | Select which gallery images appear; toggle section visibility |
| **Organizing Committee Preview** | Photo strip of committee leads with "Meet the Team" CTA | Admin selects which members are featured; toggle section |
| **Proud Sponsors** | Sponsor logos in category/tier rows | Show logo only / name only / both; reorder; toggle per sponsor; add/delete |
| **Media Partners** | Partner logos in a horizontal strip | Same controls as sponsors; independent section toggle |
| **Statistics Bar** | Animated counters (universities, participants, prizes) | Edit numbers and labels; show/hide section |
| **Call To Action Strip** | Full-width coloured band with registration CTA | Edit text, button label, link; set background colour; toggle visibility |

---

### 4.2 Events Page & Per-Event Detail Pages

#### 4.2.1 Events Listing  `/events`

- Masonry or grid card layout: event thumbnail, title, category badge (University / College / School), registration deadline with live real-time countdown
- Filter bar: filter by level and status (Open / Closed / Upcoming)
- Search bar: find events by name
- Disabled events show a greyed "Registration Closed" badge, no CTA button
- Hidden events completely invisible to public
- Clicking any card navigates to `/events/[slug]`

#### 4.2.2 Event Detail Page  `/events/[slug]`

Each event has its own dedicated full-featured page containing:

- **Hero Section:** Full-width event cover image or colour banner with event title overlay
- **Event Meta Bar:** Category badge, tier badge (University / College / School), and event date
- **Registration Deadline Block:** Prominent real-time countdown clock (days : hours : minutes : seconds) with deadline date below; turns red when < 24 hours remain; shows "Registration Closed" when deadline is past
- **Registration CTA Button:**
  - If type = `internal` → Opens a modal form hosted on the site; submissions stored in Supabase
  - If type = `google_form` → Opens the provided Google Form URL in a new tab
  - Button label, colour, and visibility controlled per event by admin
  - Button is hidden or replaced with "Registration Closed" when disabled/deadline passed
- **Event Description:** Full rich-text content (headings, bold, lists, images) rendered from Tiptap HTML output
- **Eligibility & Rules Section:** Rich-text block; admin-editable
- **Prize Details Section:** Prize structure table or rich-text; admin-editable
- **Organiser Contact Block:** Contact person name, role, and email for this specific event
- **FAQ Accordion:** Per-event frequently asked questions; admin can add/delete/reorder Q&A pairs
- **Related Events Carousel:** Other events from the same category

---

### 4.3 Image Gallery  `/gallery`

- Masonry grid with lazy-loading (Intersection Observer) and skeleton placeholders
- Click to open lightbox: full-size image, caption, prev/next navigation
- Category filter tabs (e.g., Competition, Ceremony, Activities, Media) — tabs are admin-configurable
- All images served via Cloudflare R2 CDN
- Admin controls: upload single or bulk images (auto-compressed), add caption, assign category, toggle visibility, delete, drag-and-drop reorder, manage categories

---

### 4.4 Contact Page  `/contact`

- Contact form: Name, Email, Subject (dropdown), Message — client and server validation
- On submit: sends email to admin-configured address; stores submission in Supabase
- Contact persons grid: name, role, phone, email, photo
- Google Maps embed or location description block
- Social media quick-links row
- Admin controls: add/edit/delete/toggle contact persons, field visibility per person, view/read/archive/delete form submissions, configure recipient email

---

### 4.5 About Page  `/about`

- Organisation overview (DUET background, Math Club history) — rich-text editable
- Mission & Vision block — rich-text editable
- Team / Committee overview strip with "See Full Committee" CTA → links to `/committee`
- Milestones / achievements timeline
- Faculty advisors preview strip → links to `/advisers`
- Past events highlights strip
- All sections independently toggleable and reorderable by admin; all text blocks use rich-text editor

---

### 4.6 Sponsors & Partners Page  `/sponsors`

**Sponsor Display with Categories:**
- Sponsors are displayed in named category/tier sections: Platinum / Gold / Silver / Supporter / Media Partners
- Section headings are admin-configurable (name and display order)
- Each sponsor card shows: logo, name, optional website link — each element individually toggleable
- Animated entrance effects on scroll
- Sponsors within a category are drag-and-drop reorderable by admin
- Empty categories are automatically hidden from the public page if they contain no visible sponsors
- Admin controls: add sponsor (name, logo, website URL, category assignment, display mode), edit, delete, toggle visibility, reorder within category, manage category names and order

---

### 4.7 Schedule / Program Page  `/schedule`

- Day-by-day tabbed timeline of the event program
- Each slot: time, title, venue/room, speaker/host name, colour-coded category badge
- Downloadable PDF schedule button
- Countdown to next upcoming session
- Admin controls: add/edit/delete sessions, set category colour, toggle visibility, toggle page, upload downloadable PDF

---

### 4.8 Notices & Announcements Page  `/notices`

**Public Features:**
- Chronological list of announcements with newest first
- Each notice card shows: title, category badge (e.g., Important, General, Results, Deadline), publication date, short excerpt, and "Read More" expansion
- Category filter tabs at the top
- Priority notices pinned to the top with a highlighted "⚠ Important" badge
- Real-time updates: new notices appear instantly via Supabase Realtime without page refresh
- Expired notices (past admin-set expiry date) automatically disappear from public view
- Notice preview strip on the Home page (latest 3 notices)

**Admin Controls:**
- Add notice: title, body (rich-text editor), category, priority (normal / pinned), publish date, expiry date (optional)
- Edit any notice
- Delete notice with confirmation
- Toggle visibility (publish / unpublish) independently of expiry
- Reorder pinned notices
- View total read count per notice (tracked via analytics events)
- Bulk delete expired notices

---

### 4.9 Organizing Committee Page  `/committee`

**Public Features:**
- Page is divided into sub-committee tabs: e.g., Core Committee, Technical, Logistics, Design, Media, Registration — each tab is a separate filterable view
- Each sub-committee tab displays its members as responsive card grids
- Each member card shows:
  - Profile photo (or a placeholder avatar if no photo is provided)
  - Full name
  - Role / Position within the sub-committee
  - Designation (e.g., B.Sc. Student, Faculty, Alumni)
  - Department (optional)
  - Email (optional, toggleable)
  - Phone (optional, toggleable)
  - Social links (optional): LinkedIn, Facebook
- Cards have a subtle hover lift animation
- Accessible keyboard navigation between tabs
- Sub-committee tabs are ordered and labelled entirely by admin
- A separate **Advisers** section (or page at `/advisers`) shows faculty and professional advisers in a distinct layout with their institution, designation, and expertise tags

**Admin Controls:** → See Section 5.3 (Adviser Panel) and Section 5.4 (Organizing Committee Panel)

---

### 4.10 Footer (Global)

The footer appears on every page and is fully admin-configurable. It is attractive, information-rich, and responsive.

**Footer Structure:**

| Column | Content |
|---|---|
| **Column 1 — Branding** | Event logo, event name, short tagline, event year, organiser (Math Club, DUET) |
| **Column 2 — Quick Links** | Navigation links (Home, Events, Gallery, Schedule, Committee, Notices, Sponsors, Contact) — admin can add/remove/reorder |
| **Column 3 — Contact Info** | Phone, email, address — admin-editable; each field individually toggleable |
| **Column 4 — Social Media** | Icon links: Facebook, YouTube, Instagram, LinkedIn, Twitter/X — admin-editable URLs; toggle visibility per platform |
| **Bottom Bar** | Copyright text, academic year, "Developed by" credit — admin-editable; optional Privacy Policy and Terms links |

**Design Features:**
- Subtle background: dark gradient or mathematics-pattern texture (matching admin theme aesthetic) with reduced opacity so text remains readable
- Sponsor logo strip just above the footer (admin toggle)
- Smooth fade-in animation on scroll
- All links keyboard accessible with visible focus rings
- Fully responsive: single-column stack on mobile, 4-column grid on desktop

**Admin Controls:**
- Edit branding text, tagline, copyright text
- Add/remove/reorder quick links
- Edit contact info fields and toggle per-field visibility
- Edit social media URLs and toggle per-platform visibility
- Toggle sponsor strip above footer
- Set footer background colour or choose mathematics-pattern texture
- Toggle bottom bar elements (terms link, privacy link, developer credit)

---

## 5. Admin Panel — Feature Specifications

> **Admin Panel URL:** `/admin` — Protected behind Supabase Auth. All admin routes are server-side protected; unauthenticated requests redirect to `/admin/login`. Sessions expire after 24 hours of inactivity.

### 5.1 Secure Authentication

- Email + password login via Supabase Auth (bcrypt hashed passwords)
- JWT session tokens stored in HTTP-only secure cookies (not localStorage)
- Middleware-level route protection on all `/admin/*` routes
- Failed login attempt logging with IP and timestamp
- Rate limiting: max 5 failed attempts per 15 minutes per IP
- Password reset via Supabase email flow
- Optional: Two-Factor Authentication (TOTP) via Supabase MFA (future)
- Admin user management: super-admin can add/remove admin accounts
- Last login timestamp and device info displayed on admin dashboard

---

### 5.2 Theme & Branding Control — Mathematics-Themed Admin UI

#### Admin Panel Visual Theme

The admin panel has a **mathematics-themed UI** distinct from the public site. Design characteristics:

- **Background Wallpaper:** Subtle, low-opacity pattern featuring mathematical motifs — handwritten equations (∑, ∫, π, e, √2, Euler's Identity), ruled notebook lines, coordinate grids, Fibonacci spirals, or fractal outlines (Sierpiński triangle, Mandelbrot boundary)
- **Sidebar:** Dark navy or deep graphite with white/light text; sidebar icons are geometric shapes (hexagon, circle, triangle) matching mathematical aesthetics
- **Accent Colours:** Admin-selectable from a curated maths-themed palette: Euler Blue, Theorem Green, Prime Purple, Calculus Orange
- **Typography:** Monospace or slab-serif for headings (e.g., JetBrains Mono or Playfair Display), clean sans-serif for body
- **Card Backgrounds:** Semi-transparent frosted glass (backdrop-blur) over the math pattern
- **Decorative Elements:** Small LaTeX-style rendered math snippets as section dividers (e.g., `f(x) = ax² + bx + c` in a muted colour)
- **Dark/Light Admin Toggle:** Independent of public site theme

#### Public Site Branding Controls (stored in `site_settings`)

| Control | Description |
|---|---|
| Site Title | Browser tab and hero text |
| Favicon | Upload .ico / .png |
| Logo | Upload site logo; auto-compressed |
| Default Theme | Light or Dark as public default |
| Primary / Secondary / Accent Colour | Colour pickers → CSS variables |
| Button BG / Text Colour | All CTA buttons |
| Navbar / Footer BG Colour | |
| Hero Overlay Colour | Tinted overlay on hero banner |
| Link Colour | Inline hyperlinks across all pages |
| Heading / Body Font | Select from Google Fonts list |
| Animations On/Off | Global toggle |
| Event Year / Date | Auto-populates countdown and metadata |

---

### 5.3 Adviser Panel  `/admin/advisers`

Manages faculty advisers, honorary advisers, and professional mentors displayed on the `/advisers` page.

**Manual Entry (Single Member):**

Admins fill a form with the following fields — **no field is mandatory; any field can be skipped or left empty:**

| Field | Type | Notes |
|---|---|---|
| Full Name | Text | |
| Designation | Text | e.g., Professor, Associate Professor |
| Department | Text | e.g., Dept. of Mathematics, DUET |
| Institution | Text | |
| Expertise Tags | Tags input | e.g., Number Theory, Applied Mathematics |
| Profile Photo | Image upload | Auto-compressed to < 1 MB; optional |
| Email | Text | Optional; toggleable on public page |
| Phone | Text | Optional; toggleable on public page |
| LinkedIn URL | Text | Optional |
| Short Bio | Rich-text editor | Optional |
| Display Order | Integer | Drag-and-drop overrides this |

**Per-Member Controls:**
- **Visible / Hidden:** Toggle whether the adviser appears on the public page
- **Disable:** Card remains visible but greyed out with a "Currently Unavailable" badge
- **Edit:** Opens pre-filled form; all fields editable; no field mandatory
- **Delete:** Soft delete with confirmation; removes from public page; photo removed from R2 after confirmation
- **Drag-and-Drop Reorder:** Reorder advisers within the list

**Bulk Import via Excel + ZIP:**
- Admin uploads one `.xlsx` file and one `.zip` file simultaneously
- **Excel columns (all optional):** `name`, `designation`, `department`, `institution`, `expertise`, `email`, `phone`, `linkedin`, `bio`, `photo_filename`, `is_visible`
- **ZIP file:** Contains photo images named exactly as specified in the `photo_filename` column
- On upload: server parses Excel row by row, extracts each image from ZIP by filename match, compresses each image via Sharp to < 1 MB, uploads to R2, creates a Supabase row per member
- Rows with no `photo_filename` or unmatched filenames create a member record with no photo (avatar placeholder shown)
- Admin sees a live import progress bar and a post-import summary: `X members added, Y photos matched, Z skipped (reason)`
- After bulk import, each imported member can be individually edited or deleted

---

### 5.4 Organizing Committee Panel  `/admin/committee`

Manages sub-committees and their members, displayed on the `/committee` page in tabbed sub-committee views.

#### Sub-Committee Management

- Admin can **add a new sub-committee tab:** name, display label, sort order
- Admin can **rename** any sub-committee
- Admin can **delete** a sub-committee (with confirmation; optionally moves members to another sub-committee before deletion)
- Admin can **reorder** sub-committee tabs via drag and drop
- Each sub-committee tab is independently **toggleable as visible / hidden** on the public page

#### Member Management (per Sub-Committee)

**Manual Entry (Single Member):**

Admins select the target sub-committee, then fill a form. **No field is mandatory; all fields can be skipped or removed:**

| Field | Type | Notes |
|---|---|---|
| Full Name | Text | |
| Role in Sub-Committee | Text | e.g., Coordinator, Joint Secretary |
| Designation | Text | e.g., B.Sc. 3rd Year, Faculty Member |
| Department | Text | |
| Profile Photo | Image upload | Auto-compressed; optional |
| Email | Text | Optional; public visibility toggleable |
| Phone | Text | Optional; public visibility toggleable |
| Facebook URL | Text | Optional |
| LinkedIn URL | Text | Optional |
| Display Order | Integer | Drag-and-drop overrides |

**Per-Member Controls:**
- **Visible / Hidden:** Toggle public visibility
- **Disable:** Card greyed out on public page with no interaction
- **Edit:** Pre-filled form; all fields editable; nothing mandatory
- **Delete:** Confirmation required; removes photo from R2
- **Move to Another Sub-Committee:** Dropdown to reassign member
- **Drag-and-Drop Reorder** within the sub-committee

**Bulk Import via Excel + ZIP (per Sub-Committee):**

Admin selects target sub-committee, then uploads one `.xlsx` and one `.zip`:

- **Excel columns (all optional):** `name`, `role`, `designation`, `department`, `email`, `phone`, `facebook`, `linkedin`, `photo_filename`, `is_visible`
- **ZIP file:** Contains member photos named as per `photo_filename` column values
- Server-side processing: parse Excel → extract images from ZIP by filename → compress via Sharp → upload to R2 → insert Supabase rows
- Live progress bar + import summary displayed in admin panel
- Unmatched or missing photos silently create a record with no photo
- All imported members are individually editable after import

---

### 5.5 Events Management Panel  `/admin/events`

#### Event Fields

| Field | Type | Notes |
|---|---|---|
| Title | Text | Required |
| Slug | Text | Auto-generated from title; editable |
| Category | Select | University / College / School |
| Cover Image | Image upload | Auto-compressed; optional |
| Short Description | Text | Shown on listing cards |
| Full Description | **Rich-text editor (Tiptap)** | Supports headings, bold, lists, images, tables |
| Eligibility & Rules | **Rich-text editor** | |
| Prize Details | **Rich-text editor** | |
| Registration Deadline | Datetime picker | Powers real-time countdown clock |
| Registration Type | Radio: `internal` or `google_form` | Per-event selection |
| Registration Link (if `google_form`) | URL input | Google Form URL |
| Internal Form Fields (if `internal`) | Field builder | Admin adds custom fields: text, number, select, file |
| Organiser Contact | Name + Email text fields | |
| FAQ | Repeatable Q&A pairs | Add, delete, reorder |
| Status | Select | Published / Hidden / Disabled |
| Sort Order | Integer | Drag-and-drop on listing |

#### Registration Type Behaviour

| Type | Public Behaviour | Admin Collects |
|---|---|---|
| `google_form` | CTA button opens Google Form URL in new tab | Nothing (form managed by Google) |
| `internal` | CTA button opens modal with the custom form built in admin | Submissions stored in Supabase `event_registrations` table; admin can view/export CSV |

#### Event Controls

- Add, edit, delete events
- Publish / Hide / Disable per event
- Drag-and-drop reorder on listing page
- Bulk actions: publish all, hide all, disable selected
- Preview event page before publishing
- Clone event (duplicate to speed up creation of similar events)

---

### 5.6 Sponsors Management Panel  `/admin/sponsors`

#### Sponsor Categories

- Admin defines named categories: e.g., Title Sponsor, Co-Sponsor, Gold, Silver, Supporter, Media Partner
- Each category has a display name, sort order, and visibility toggle
- Admin can add, rename, delete, and reorder categories
- Empty categories are automatically hidden from the public page

#### Per-Sponsor Controls

| Field | Type | Notes |
|---|---|---|
| Name | Text | |
| Logo | Image upload | Auto-compressed |
| Website URL | Text | Optional |
| Category | Select | From admin-defined categories |
| Display Mode | Radio | Logo only / Name only / Both |
| Visibility | Toggle | Show / Hide on public page |
| Sort Order | Integer | Drag-and-drop within category |

- Add, edit, delete sponsors
- Drag-and-drop reorder within categories
- Toggle logo size: Small / Medium / Large per category

---

### 5.7 Notices & Announcements Panel  `/admin/notices`

| Field | Type | Notes |
|---|---|---|
| Title | Text | Required |
| Body | **Rich-text editor (Tiptap)** | Full formatting support |
| Category | Select | Admin-defined: Important, General, Results, Deadline, etc. |
| Priority | Toggle | Normal or Pinned (appears at top with highlight) |
| Publish Date | Datetime | Defaults to now; can schedule future notices |
| Expiry Date | Datetime | Optional; notice auto-hides after this date |
| Visibility | Toggle | Publish / Unpublish |

- Add, edit, delete notices
- Bulk delete expired notices
- Reorder pinned notices
- View read count per notice

---

### 5.8 Registration Management Panel  `/admin/registrations`

For events using `internal` registration type only.

- View all submissions per event in a table
- Columns: Name, Email, custom fields, submission timestamp, status (Pending / Confirmed / Rejected)
- Per-submission actions: view details modal, change status, delete
- Bulk actions: confirm selected, export all as CSV, delete selected
- Search and filter by event, status, submission date
- Export registrations for a selected event as `.csv`

---

### 5.9 Home Page Panel  `/admin/home`

- Edit all Home page sections (hero, countdown, event highlights, gallery preview, committee preview, sponsors strip, stats bar, CTA strip, notices preview)
- Toggle section visibility
- Drag-and-drop reorder sections
- All text fields use inline editors; image fields use the standard upload widget

---

### 5.10 Gallery Panel  `/admin/gallery`

- Upload single or bulk images (auto-compressed to < 1 MB)
- Add caption, alt text (required for SEO/accessibility), and assign category per image
- Toggle image visibility
- Delete image (removes from R2 and Supabase)
- Drag-and-drop reorder
- Manage categories: add, rename, delete

---

### 5.11 Contact & About Panel  `/admin/contact-about`

**Contact:** Add/edit/delete contact persons, toggle field visibility per person, configure form recipient email, view/manage form submissions

**About:** Edit all text blocks via rich-text editor, manage team members, manage milestone timeline, toggle section visibility

---

### 5.12 Schedule Panel  `/admin/schedule`

- Add/edit/delete schedule sessions
- Set category colour per session
- Toggle visibility of individual sessions
- Toggle entire page visible/hidden
- Upload downloadable PDF schedule

---

### 5.13 Footer Management Panel  `/admin/footer`

- Edit branding column: logo, event name, tagline, organiser text, copyright line
- Manage quick links: add, edit, delete, reorder
- Edit contact info: phone, email, address; toggle each field
- Edit social media URLs; toggle each platform's visibility
- Toggle sponsor strip above footer
- Set footer background: solid colour or mathematics-pattern texture (choose from preset patterns)
- Toggle bottom bar elements: privacy policy link, terms link, developer credit

---

### 5.14 Rich Text Editor (Global — Tiptap)

All admin description, about, notice body, event detail, rules, and prize fields use a consistent **Tiptap**-powered rich text editor.

**Toolbar Features:**
- Headings (H1–H4)
- Bold, Italic, Underline, Strikethrough
- Ordered list, Unordered list
- Blockquote
- Code block (monospace)
- Horizontal rule divider
- Inline image insert (via upload or URL)
- Hyperlink insert and remove
- Text alignment (left, center, right, justify)
- Text colour picker
- Undo / Redo
- Character / word count display
- Full-screen editing mode
- Preview mode: renders the HTML output as it will appear on the public page

**Output:** Sanitised HTML stored in Supabase `text` columns; rendered on public pages via `DOMPurify`-sanitised `dangerouslySetInnerHTML`

---

### 5.15 Admin Visibility Control System  `/admin/visibility`

> **Purpose:** A single, unified control panel where the admin can toggle the visibility of any **page**, **tab**, **section**, **card**, or **individual database field** across the entire public site — without touching code.

---

#### 5.15.1 Page-Level Visibility

Admin can show or hide any top-level public route entirely. A hidden page returns HTTP 404 or redirects to the home page.

| Page | Route | Toggle | Behaviour When Hidden |
|---|---|---|---|
| Events | `/events` | ✅ | Nav link hidden; route returns 404 |
| Gallery | `/gallery` | ✅ | Nav link hidden; route returns 404 |
| Schedule | `/schedule` | ✅ | Nav link hidden; route returns 404 |
| Notices | `/notices` | ✅ | Nav link hidden; route returns 404 |
| Committee | `/committee` | ✅ | Nav link hidden; route returns 404 |
| Advisers | `/advisers` | ✅ | Nav link hidden; route returns 404 |
| Sponsors | `/sponsors` | ✅ | Nav link hidden; route returns 404 |
| About | `/about` | ✅ | Nav link hidden; route returns 404 |
| Contact | `/contact` | ✅ | Nav link hidden; route returns 404 |

**DB backing:** `page_visibility` table (one row per page key).

**Admin UI:** A card grid — one card per page — each with a large labelled toggle switch and a status badge (🟢 Live / 🔴 Hidden).

---

#### 5.15.2 Tab-Level Visibility

Tabs inside pages (e.g. sub-committee tabs on `/committee`, category filter tabs on `/gallery`, day tabs on `/schedule`) can be individually shown or hidden.

| Context | Tab Type | Admin Action |
|---|---|---|
| `/committee` | Sub-committee tabs | Toggle each tab; hidden tabs are excluded from the tab bar |
| `/gallery` | Category filter tabs | Toggle each category tab |
| `/schedule` | Day tabs | Toggle each day tab |
| `/notices` | Category filter tabs | Toggle each notice category tab |
| `/events` | Level filter tabs (University / College / School) | Toggle each level tab |

**Admin UI:** Inside each relevant panel (Committee, Gallery, Schedule, etc.) a **Tab Visibility** sub-section lists all tabs with individual toggle switches and drag-and-drop reordering.

---

#### 5.15.3 Section / Card-Level Visibility

Every discrete content block on every page has its own visibility toggle.

**Home Page Sections:**

| Section Key | Label | Toggle |
|---|---|---|
| `home_hero` | Hero Banner | ✅ |
| `home_countdown` | Event Countdown | ✅ |
| `home_deadline_strip` | Registration Deadline Strip | ✅ |
| `home_event_highlights` | Event Highlights Cards | ✅ |
| `home_notices_preview` | Notices Preview | ✅ |
| `home_gallery_preview` | Gallery Preview Strip | ✅ |
| `home_committee_preview` | Committee Preview Strip | ✅ |
| `home_sponsors` | Proud Sponsors | ✅ |
| `home_media_partners` | Media Partners | ✅ |
| `home_stats` | Statistics Bar | ✅ |
| `home_cta` | Call-To-Action Strip | ✅ |

**About Page Sections:**

| Section Key | Label | Toggle |
|---|---|---|
| `about_overview` | Organisation Overview | ✅ |
| `about_mission` | Mission & Vision | ✅ |
| `about_team_strip` | Team Strip | ✅ |
| `about_milestones` | Milestones Timeline | ✅ |
| `about_advisers_strip` | Advisers Preview Strip | ✅ |
| `about_past_events` | Past Events Highlights | ✅ |

**Event Detail Page Sections (per event):**

| Section Key | Label | Toggle |
|---|---|---|
| `event_hero` | Cover Image / Hero | ✅ |
| `event_meta` | Meta Bar (category, tier, date) | ✅ |
| `event_deadline` | Registration Deadline Block | ✅ |
| `event_cta` | Registration CTA Button | ✅ |
| `event_description` | Full Description | ✅ |
| `event_eligibility` | Eligibility & Rules | ✅ |
| `event_prizes` | Prize Details | ✅ |
| `event_contact` | Organiser Contact Block | ✅ |
| `event_faq` | FAQ Accordion | ✅ |
| `event_related` | Related Events Carousel | ✅ |

**DB backing:** `page_sections` table (existing) + `event_section_visibility` table for per-event overrides.

**Admin UI:** Within each panel (Home, About, Events), a **Sections** sub-panel lists all section cards with:
- Toggle switch (Visible / Hidden)
- Drag handle for reorder (where applicable)
- Preview badge showing current public status

---

#### 5.15.4 Individual Card Visibility

Within any card grid (advisers, committee members, sponsors, gallery images, contact persons), each card can be individually shown or hidden without deletion.

| Entity | Visibility Field | Disable (greyed card) |
|---|---|---|
| Adviser | `is_visible` | `is_disabled` |
| Committee Member | `is_visible` | `is_disabled` |
| Sponsor | `is_visible` | — |
| Gallery Image | `is_visible` | — |
| Contact Person | `is_visible` | — |
| Notice | `is_visible` | — |
| Schedule Session | `is_visible` | — |
| Footer Quick Link | `is_visible` | — |
| About Team Member | `is_visible` | — |

**Admin UI:** Every card in the admin list/grid shows an inline **eye icon toggle** — click to show/hide. Hidden cards show a grey overlay in the admin view with a "Hidden" badge.

---

#### 5.15.5 Database Field-Level Visibility

For individual record fields that are sensitive or optional (phone, email, social links), the admin controls per-field visibility without removing the stored value.

| Table | Field | Visibility Control Field |
|---|---|---|
| `advisers` | `email` | `show_email` (boolean) |
| `advisers` | `phone` | `show_phone` (boolean) |
| `committee_members` | `email` | `show_email` (boolean) |
| `committee_members` | `phone` | `show_phone` (boolean) |
| `contact_persons` | `phone` | `show_phone` (boolean) |
| `contact_persons` | `email` | `show_email` (boolean) |
| `sponsors` | logo | `display_mode`: `'logo'`\|`'name'`\|`'both'` |
| `footer_settings` | `contact_phone` | `show_phone` (boolean) |
| `footer_settings` | `contact_email` | `show_email` (boolean) |
| `footer_settings` | `contact_address` | `show_address` (boolean) |
| `footer_settings` | Facebook link | `show_facebook` (boolean) |
| `footer_settings` | YouTube link | `show_youtube` (boolean) |
| `footer_settings` | Instagram link | `show_instagram` (boolean) |
| `footer_settings` | LinkedIn link | `show_linkedin` (boolean) |
| `footer_settings` | Twitter/X link | `show_twitter` (boolean) |
| `footer_settings` | Developer credit | `show_developer_credit` (boolean) |
| `footer_settings` | Privacy policy link | `show_privacy_link` (boolean) |
| `footer_settings` | Terms link | `show_terms_link` (boolean) |
| `footer_settings` | Sponsor strip | `show_sponsor_strip` (boolean) |

**Admin UI:** Inside each record's edit form, each optional field row has an eye-icon toggle button next to it. The value is retained in the DB; only the `show_*` flag changes.

---

#### 5.15.6 Global Visibility Control Panel  `/admin/visibility`

A dedicated top-level admin route that aggregates **all visibility controls** in one place.

**Layout:** Three-column tabbed panel:

| Tab | Content |
|---|---|
| **Pages** | Toggle switches for all public routes; live URL status badge |
| **Sections** | Accordion grouped by page; toggle + reorder for each section |
| **Tabs & Filters** | Sub-committee tabs, gallery category tabs, schedule day tabs, event filter tabs |

**Features:**
- **Search bar** — filter any control by name
- **Bulk actions** — "Hide All", "Show All" per page or per section group
- **Live preview link** — each row has a "Preview" icon that opens the public page in a new tab
- **Change log** — last modified timestamp + admin email for every visibility change (stored in `visibility_audit_log`)
- **Reset to defaults** button per page

---

#### 5.15.7 Navbar Visibility Control

Admin controls which navigation links appear in the public navbar independently of page visibility.

| Control | Description |
|---|---|
| Toggle nav link per page | Show/hide each page link in the navbar |
| Reorder nav links | Drag-and-drop reorder |
| Custom nav label | Override the display text for any link |
| Add external link | Add a custom URL with label to the navbar |
| Show/hide CTA button in navbar | e.g., "Register Now" button |
| Mobile hamburger menu | Toggle mobile menu visibility |

**DB backing:** `nav_links` table.

---

## 6. Admin Panel — Analytics Dashboard

A privacy-first analytics system built with Supabase as the event store. No third-party cookies. No PII stored.

| Panel | Metrics & Visualisation |
|---|---|
| **Overview KPIs** | Total page views, unique visitors, avg. session duration, bounce rate — stat cards with trend arrows vs. previous 7 days |
| **Traffic Over Time** | Line chart: daily/weekly/monthly views; toggle between page views and unique sessions |
| **Top Pages** | Bar chart: ranked list of most visited pages with view count and avg. time on page |
| **Traffic Sources** | Doughnut chart: Direct / Organic Search / Social / Referral breakdown |
| **Device & Browser** | Pie charts: Mobile vs Desktop vs Tablet; top browsers |
| **Geography** | World map heatmap (country-level); top 10 countries table |
| **Event Page Analytics** | Per-event: card views, detail page visits, CTA button clicks, registration funnel drop-off |
| **Notice Read Counts** | Per-notice view counts; category engagement |
| **Registration Analytics** | Per-event submission count over time; status distribution (internal events only) |
| **Contact Form** | Total submissions per day; subject category breakdown |
| **Real-Time** | Live visitor count (Supabase Realtime); active page distribution |
| **Date Range Filter** | Custom date picker; preset ranges: Today, 7d, 30d, 90d, All Time |
| **Export** | Download any chart/table as CSV or PNG |

---

## 7. Admin Panel — Help & Documentation Page

Built-in documentation at `/admin/docs` with a full-text search bar.

| Section | Content |
|---|---|
| Getting Started | Log in, change password, navigate dashboard |
| Managing the Home Page | Update hero, set countdown date, reorder sections |
| Managing Events | Add event, set registration type (internal / Google Form), set deadline, publish/disable/hide |
| Understanding Real-Time Countdown | How deadline clocks work; how to update a deadline |
| Adviser Panel | Manual entry, bulk Excel+ZIP import, editing, deleting advisers |
| Organizing Committee Panel | Adding sub-committees, manual member entry, bulk Excel+ZIP import, reordering |
| Gallery Management | Bulk upload, category assignment, reordering images |
| Notices Board | Publishing, pinning, scheduling, expiring notices |
| Sponsors Management | Adding categories, assigning sponsors, display mode controls |
| Registration Management | Viewing internal form submissions, exporting CSV |
| Footer Management | Editing columns, social links, patterns |
| Theme & Branding | Changing colours, fonts, logo, favicon |
| Using the Rich Text Editor | Toolbar guide, inserting images, formatting tips |
| Understanding Analytics | Reading dashboard panels, exporting data |
| FAQ & Troubleshooting | Image upload errors, countdown not updating, bulk import mismatches |
| Keyboard Shortcuts | Quick-access shortcuts for admin power users |

---

## 8. Database Schema (Supabase / PostgreSQL)

> All tables use UUID primary keys. Timestamps use `timestamptz` with default `now()`. Row Level Security (RLS) is enabled on every table. Public `SELECT` policies applied to read-safe tables; all writes require valid admin JWT.

---

### `site_settings`
Single-row global configuration.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | Fixed singleton UUID |
| site_title | `text` | |
| logo_url | `text` | R2 URL |
| favicon_url | `text` | R2 URL |
| event_date | `timestamptz` | Main event start datetime |
| default_theme | `text` | `'light'` or `'dark'` |
| color_primary | `text` | Hex |
| color_secondary | `text` | Hex |
| color_accent | `text` | Hex |
| color_button_bg | `text` | Hex |
| color_button_text | `text` | Hex |
| color_navbar_bg | `text` | Hex |
| color_footer_bg | `text` | Hex |
| footer_pattern | `text` | Pattern key or `'solid'` |
| font_heading | `text` | Google Font name |
| font_body | `text` | Google Font name |
| animations_enabled | `boolean` | |
| hero_mode | `text` | `'image'` or `'text'` |
| hero_title | `text` | |
| hero_subtitle | `text` | |
| hero_cta_label | `text` | |
| hero_cta_url | `text` | |
| hero_image_url | `text` | R2 URL |
| hero_overlay_color | `text` | Hex + alpha |
| updated_at | `timestamptz` | |

---

### `advisers`
Faculty and professional advisers.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text` | |
| designation | `text` | |
| department | `text` | |
| institution | `text` | |
| expertise_tags | `text[]` | Array of tag strings |
| photo_url | `text` | R2 URL; nullable |
| email | `text` | |
| phone | `text` | |
| linkedin_url | `text` | |
| bio | `text` | Rich HTML from Tiptap |
| show_email | `boolean DEFAULT false` | |
| show_phone | `boolean DEFAULT false` | |
| is_visible | `boolean DEFAULT true` | |
| is_disabled | `boolean DEFAULT false` | |
| sort_order | `integer` | |
| created_at | `timestamptz` | |
| updated_at | `timestamptz` | |

---

### `sub_committees`
Sub-committee tab definitions.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text NOT NULL` | e.g., Core Committee, Technical |
| display_label | `text` | Tab label override |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `committee_members`
Organizing committee members.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| sub_committee_id | `uuid FK` | → `sub_committees.id` |
| name | `text` | |
| role | `text` | Role within sub-committee |
| designation | `text` | |
| department | `text` | |
| photo_url | `text` | R2 URL; nullable |
| email | `text` | |
| phone | `text` | |
| facebook_url | `text` | |
| linkedin_url | `text` | |
| show_email | `boolean DEFAULT false` | |
| show_phone | `boolean DEFAULT false` | |
| is_visible | `boolean DEFAULT true` | |
| is_disabled | `boolean DEFAULT false` | |
| sort_order | `integer` | |
| created_at | `timestamptz` | |
| updated_at | `timestamptz` | |

---

### `events`
One row per event.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| slug | `text UNIQUE` | URL-safe identifier |
| title | `text NOT NULL` | |
| category | `text` | `'university'` \| `'college'` \| `'school'` |
| cover_image_url | `text` | R2 URL |
| short_description | `text` | For listing cards |
| description | `text` | Rich HTML (Tiptap) |
| eligibility | `text` | Rich HTML |
| prize_details | `text` | Rich HTML |
| registration_type | `text` | `'internal'` \| `'google_form'` |
| registration_url | `text` | Google Form URL (if `google_form`) |
| registration_button_label | `text` | Default: "Register Now" |
| registration_deadline | `timestamptz` | Powers real-time countdown |
| organiser_name | `text` | |
| organiser_email | `text` | |
| status | `text` | `'published'` \| `'hidden'` \| `'disabled'` |
| sort_order | `integer` | |
| created_at | `timestamptz` | |
| updated_at | `timestamptz` | |

---

### `event_faqs`
FAQ pairs per event.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| event_id | `uuid FK` | → `events.id` |
| question | `text NOT NULL` | |
| answer | `text` | |
| sort_order | `integer` | |

---

### `internal_form_fields`
Custom field definitions for internal registration forms.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| event_id | `uuid FK` | → `events.id` |
| label | `text NOT NULL` | |
| field_type | `text` | `'short'` \| `'paragraph'` \| `'mcq'` \| `'checkbox'` \| `'dropdown'` \| `'date'` \| `'time'` \| `'number'` \| `'email'` \| `'phone'` \| `'file'` \| `'grid_radio'` \| `'grid_checkbox'` |
| options | `text[]` | dropdown or checklist config options |
| is_required | `boolean DEFAULT false` | |
| sort_order | `integer` | |
| section_id | `uuid FK` | → `internal_form_sections.id` |
| helper_text | `text` | Input guides |
| config | `jsonb` | Additional field configuration options |
| validation | `jsonb` | Regex or pattern checks |
| logic | `jsonb` | Visibility condition checks |
| is_visible | `boolean DEFAULT true` | |

---

### `event_registrations`
Submissions from internal registration forms.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| event_id | `uuid FK` | → `events.id` |
| form_data | `jsonb` | Key-value map of field label → submitted value |
| status | `text` | `'pending'` \| `'confirmed'` \| `'rejected'` |
| submitted_at | `timestamptz DEFAULT now()` | |
| public_id | `text UNIQUE` | Public sharing ticket code |
| registrant_email | `text` | Indexed email |
| registrant_phone | `text` | Indexed phone |

---

### `sponsor_categories`
Admin-defined sponsor tier/category definitions.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text NOT NULL` | e.g., Title Sponsor, Gold |
| sort_order | `integer` | |
| is_visible | `boolean DEFAULT true` | Hidden if no visible sponsors |

---

### `sponsors`
Sponsors and media partners.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text NOT NULL` | |
| logo_url | `text` | R2 URL |
| website_url | `text` | |
| category_id | `uuid FK` | → `sponsor_categories.id` |
| display_mode | `text` | `'logo'` \| `'name'` \| `'both'` |
| logo_size | `text` | `'small'` \| `'medium'` \| `'large'` |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `notices`
Announcements and notices.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| title | `text NOT NULL` | |
| body | `text` | Rich HTML (Tiptap) |
| category | `text` | e.g., Important, General, Results |
| is_pinned | `boolean DEFAULT false` | Pinned notices appear first |
| is_visible | `boolean DEFAULT true` | |
| publish_at | `timestamptz DEFAULT now()` | Scheduled publish time |
| expires_at | `timestamptz` | Nullable; auto-hides after this |
| view_count | `integer DEFAULT 0` | |
| created_at | `timestamptz` | |
| updated_at | `timestamptz` | |

---

### `gallery_images`

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| url | `text NOT NULL` | R2 CDN URL |
| caption | `text` | |
| alt_text | `text` | Required for SEO/accessibility |
| category_id | `uuid FK` | → `gallery_categories.id` |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |
| created_at | `timestamptz` | |

---

### `gallery_categories`

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text NOT NULL` | |
| sort_order | `integer` | |

---

### `contact_persons`

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text NOT NULL` | |
| designation | `text` | |
| phone | `text` | |
| email | `text` | |
| photo_url | `text` | R2 URL |
| show_phone | `boolean DEFAULT true` | |
| show_email | `boolean DEFAULT true` | |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `contact_submissions`

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text NOT NULL` | |
| email | `text NOT NULL` | |
| subject | `text` | |
| message | `text NOT NULL` | |
| status | `text` | `'unread'` \| `'read'` \| `'archived'` |
| submitted_at | `timestamptz DEFAULT now()` | |

---

### `page_sections`
Controls visibility and order of configurable page sections.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| page | `text` | e.g., `'home'`, `'about'`, `'schedule'` |
| section_key | `text UNIQUE` | e.g., `'home_hero'`, `'home_notices'` |
| label | `text` | Human-readable name |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `footer_settings`
Footer content configuration.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | Fixed singleton UUID |
| tagline | `text` | |
| organiser_text | `text` | |
| copyright_text | `text` | |
| show_developer_credit | `boolean DEFAULT true` | |
| show_privacy_link | `boolean DEFAULT false` | |
| privacy_url | `text` | |
| show_terms_link | `boolean DEFAULT false` | |
| terms_url | `text` | |
| contact_phone | `text` | |
| contact_email | `text` | |
| contact_address | `text` | |
| show_phone | `boolean DEFAULT true` | |
| show_email | `boolean DEFAULT true` | |
| show_address | `boolean DEFAULT true` | |
| show_sponsor_strip | `boolean DEFAULT true` | |
| facebook_url | `text` | |
| youtube_url | `text` | |
| instagram_url | `text` | |
| linkedin_url | `text` | |
| twitter_url | `text` | |
| show_facebook | `boolean DEFAULT true` | |
| show_youtube | `boolean DEFAULT true` | |
| show_instagram | `boolean DEFAULT true` | |
| show_linkedin | `boolean DEFAULT true` | |
| show_twitter | `boolean DEFAULT true` | |
| updated_at | `timestamptz` | |

---

### `footer_quick_links`
Quick navigation links in footer.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| label | `text NOT NULL` | |
| url | `text NOT NULL` | |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `about_team_members`
Team cards on About page.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text NOT NULL` | |
| role | `text` | |
| photo_url | `text` | R2 URL |
| bio | `text` | Rich HTML |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `schedule_sessions`
Event day program entries.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| day_number | `integer` | 1-indexed event day |
| start_time | `time` | |
| end_time | `time` | |
| title | `text NOT NULL` | |
| venue | `text` | |
| host | `text` | |
| category | `text` | |
| color_tag | `text` | Hex colour |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `analytics_events`
Privacy-first raw analytics event store.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| event_type | `text` | `'pageview'` \| `'cta_click'` \| `'notice_view'` \| `'form_submit'` |
| page_path | `text` | |
| referrer | `text` | |
| user_agent_hash | `text` | SHA-256 of UA string |
| screen_width | `integer` | |
| country_code | `text` | |
| session_id | `text` | Random per browser session |
| created_at | `timestamptz DEFAULT now()` | |

---

### `admin_users`

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | Matches `auth.users.id` |
| email | `text UNIQUE` | |
| display_name | `text` | |
| role | `text` | `'super_admin'` \| `'admin'` \| `'moderator'` \| `'registration_editor'` \| `'volunteer'` |
| last_login_at | `timestamptz` | |
| created_at | `timestamptz` | |
| can_manage_volunteers | `boolean` | Allows volunteer profiles access |
| can_manage_registrations | `boolean` | Allows participant checks access |
| can_manage_kit | `boolean` | Allows kit check-ins access |
| can_manage_presents | `boolean` | Allows attendance updates access |
| can_manage_lunch | `boolean` | Allows lunch distributions access |

---

### `processed_registrations`
Checked-in participants list derived from registration inputs.

| Column | Type | Description |
|---|---|---|
| serial | `text PK` | Unique serial NMC26-X-XX-XXX |
| full_name | `text` | |
| email_address | `text` | |
| phone_number | `text` | |
| gender | `text` | |
| t_shirt_size | `text` | |
| photos | `text` | Uploaded headshot photo |
| level | `text` | school / college / university |
| institution | `text` | |
| class_year_student_of | `text` | |
| event | `text` | Event title slug |
| payment_method | `text` | |
| payment_number | `text` | |
| transaction_id | `text` | |
| is_kit_coollect | `boolean DEFAULT false` | Kit check-in flag |
| is_present | `boolean DEFAULT false` | Attendance check-in flag |
| is_collect_launch | `boolean DEFAULT false` | Lunch check-in flag |
| allocated_room | `text` | Classroom room assignment |
| updated_by | `text` | Admin editor user identity |
| updated_at | `timestamptz` | |
| admit_card_url | `text` | Cloudflare R2 PDF card link |

---

### `volunteers`
Organizing team volunteers list.

| Column | Type | Description |
|---|---|---|
| unique_id | `text PK` | Volunteer scan serial |
| name | `text NOT NULL` | |
| email | `text UNIQUE` | |
| number | `text` | |
| image_url | `text` | |
| segment | `text` | Sub-committee segment |
| department | `text` | DUET department |
| student_id | `text` | DUET student id |
| year | `text` | |
| t_shirt_size | `text` | |
| is_present | `boolean DEFAULT false` | |
| is_gift_collected | `boolean DEFAULT false` | |
| is_lunch_collected | `boolean DEFAULT false` | |
| created_at | `timestamptz` | |
| updated_at | `timestamptz` | |
| updated_by | `text` | |

---

### `location_config`
Global Supabase endpoint coordinates configuration.

| Column | Type | Description |
|---|---|---|
| id | `integer PK` | Check id = 1 (singleton) |
| supabase_url | `text` | |
| supabase_anon_key | `text` | |
| live_map_enabled | `boolean` | |
| updated_by | `uuid FK` | → `auth.users.id` |
| updated_at | `timestamptz` | |

---

### `users_registry`
Registry for volunteer location tracking users.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| name | `text` | |
| role | `text` | |
| initialized_at | `timestamptz` | |

---

### `user_locations`
Live coordinate maps registry.

| Column | Type | Description |
|---|---|---|
| user_id | `uuid PK_FK` | → `users_registry.id` on delete cascade |
| latitude | `double precision` | |
| longitude | `double precision` | |
| is_online | `boolean DEFAULT true` | |
| updated_at | `timestamptz` | |

---

### `secure_messages`
Encrypted/secure multicast messenger logging.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| sender_id | `uuid FK` | → `users_registry.id` |
| target_type | `text` | `'unicast'` \| `'multicast'` \| `'broadcast'` |
| target_value | `text` | target identification |
| message_text | `text` | |
| created_at | `timestamptz` | |
| is_read | `boolean DEFAULT false` | |

---

### `contact_page`
Singleton contact details copy control.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| hero_title | `text` | |
| hero_subtitle | `text` | |
| form_title | `text` | |
| form_subtitle | `text` | |
| recipient_email | `text` | |
| location_title | `text` | |
| location_body | `text` | |
| map_embed_url | `text` | |
| social_title | `text` | |
| updated_at | `timestamptz` | |

---

### `internal_form_sections`
Form steps for custom builders.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| event_id | `uuid FK` | → `events.id` on delete cascade |
| title | `text NOT NULL` | |
| description | `text` | |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

### `schedule_day_settings`
Visibility configs for program day tabs.

| Column | Type | Description |
|---|---|---|
| id | `uuid PK` | |
| day_number | `integer UNIQUE` | |
| is_visible | `boolean DEFAULT true` | |
| sort_order | `integer` | |

---

## 9. Image Handling & Cloudflare R2 Storage

### 9.1 Single Upload Flow

1. Admin selects file in upload widget
2. Client sends to `POST /api/upload`
3. API pipes through Sharp: max 1920px wide, WebP quality 80; iteratively reduces quality if still > 1 MB
4. Uploads to Cloudflare R2 via S3-compatible `PutObject`
5. R2 returns public CDN URL
6. URL saved to Supabase; thumbnail shown immediately in admin panel

### 9.2 Bulk Import via Excel + ZIP

1. Admin uploads `.xlsx` + `.zip` simultaneously to `POST /api/import/members`
2. API extracts ZIP in memory using JSZip
3. SheetJS parses Excel: each row becomes a member record
4. Per row: if `photo_filename` column is present, locate matching file in ZIP by filename
5. Matched image piped through Sharp (compress to < 1 MB, WebP)
6. Uploaded to R2; URL written back to the row's record before Supabase insert
7. Rows with no match get `photo_url = null` (placeholder avatar shown on public page)
8. Server returns JSON summary: `{ added, photosMatched, skipped, errors[] }`
9. Admin sees live progress bar and final summary table

### 9.3 Cloudflare R2 Bucket Structure

| Path | Contents |
|---|---|
| `/logos/` | Site logo, favicon |
| `/hero/` | Hero banner images |
| `/gallery/` | Gallery photos |
| `/events/` | Event cover images |
| `/sponsors/` | Sponsor logos |
| `/advisers/` | Adviser profile photos |
| `/committee/` | Committee member photos |
| `/contact/` | Contact person photos |
| `/team/` | About page team member photos |
| `/docs/` | Downloadable files (PDF schedule etc.) |
| `/admit-cards/` | Generated attendee PDF admit cards |

### 9.4 Deletion Policy

- Admin deletes image → API calls R2 `DeleteObject` → removes DB row
- Daily Supabase scheduled function: checks for R2 objects with no corresponding DB row → deletes orphans
- Soft-delete option: mark hidden without removing from storage for audit trail

---

## 10. Security Requirements

| Area | Requirement |
|---|---|
| Authentication | Supabase Auth; HTTP-only cookie sessions; no JWT in localStorage |
| Route Protection | Next.js middleware validates session on every `/admin/*` request server-side |
| Database RLS | RLS on every Supabase table; service-role key used only in server-side API routes |
| CORS | Strict CORS: only site origin on all API routes |
| File Upload | MIME type validation; max raw upload 10 MB; Sharp output guaranteed < 1 MB; SVG uploads blocked |
| ZIP Import | ZIP bomb protection: max extracted size 50 MB; max 500 files per import |
| Rate Limiting | Login: 5 attempts/15 min/IP; Contact form: 3/hour/IP; Import: 1 concurrent per admin session |
| Environment Secrets | All keys in Vercel env vars; never committed to git |
| HTTPS | Enforced by Vercel on all custom domains via automatic TLS |
| XSS | All rich-text sanitised with DOMPurify before rendering |
| CSRF | `SameSite=Strict` cookie + origin header check on all API routes |
| Dependency Audit | `npm audit` in CI; Dependabot alerts on GitHub |

---

## 11. Performance & SEO Requirements

### 11.1 Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 90 on mobile |
| Largest Contentful Paint (LCP) | < 2.5 seconds |
| Cumulative Layout Shift (CLS) | < 0.1 |
| First Input Delay (FID) | < 100 ms |
| Time to First Byte (TTFB) | < 600 ms |
| Image Size | All < 1 MB; served as WebP |
| JS Bundle | Code-split per route; no route bundle > 150 KB gzipped |
| Real-Time Countdown | Client-side; synced to server deadline timestamp; updates every second |

### 11.2 SEO Requirements

- Next.js Metadata API: unique title, description, and Open Graph tags per page and per event
- Dynamic OG images for event detail pages via `@vercel/og`
- `sitemap.xml` dynamically generated from Supabase event slugs and notice IDs
- `robots.txt` blocking `/admin/*`
- JSON-LD Event schema for each event detail page
- Canonical URLs on all pages
- Alt text required for all gallery images (enforced in admin upload form)
- Mobile-responsive from 320px to 1920px

---

## 12. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Availability | 99.9% uptime via Vercel; auto-failover on function errors |
| Scalability | Stateless Next.js functions; handles traffic spikes on result/announcement day |
| Real-Time | Supabase Realtime for live notices on public page; live visitor count in admin dashboard |
| Accessibility | WCAG 2.1 AA; keyboard navigation; ARIA labels; visible focus rings |
| Browser Support | Latest 2 versions of Chrome, Firefox, Safari, Edge; iOS Safari 15+; Android Chrome |
| Responsive Design | Fully responsive from 320px (mobile) to 1920px (4K desktop) |
| Dark Mode | Full dark mode with Tailwind `dark:` classes; public default set by admin |
| Animations | Framer Motion; `prefers-reduced-motion` respected everywhere |
| Internationalisation | UTF-8 throughout; Bengali character support in all fields |
| Backup | Supabase daily automated backups; R2 versioning enabled |
| Monitoring | Vercel Analytics; optional Sentry error tracking; uptime monitoring via UptimeRobot |
| Code Quality | ESLint + Prettier in CI; TypeScript strict mode; Husky pre-commit hooks |
| Excel+ZIP Import | Max 500 rows per import; max 50 MB extracted ZIP; server-side processing only |

---

## 13. Future Enhancements (Post-Launch Roadmap)

### v1.1 — Participant Portal
- Participant registration directly on the website via internal forms
- Admit card and confirmation email generation
- Participant dashboard to view registration status and seat information

### v1.2 — Bilingual Support (Bengali / English)
- Language toggle on public site
- All admin-entered content supports dual-language fields
- Automatic Bengali font switch (Hind Siliguri / Kalpurush)

### v1.3 — Live Results
- Real-time result publishing by admin during the event
- Leaderboard page with live rank updates via Supabase Realtime
- Push notification to registered participants on result publish

### v1.4 — Blog / News Section
- Admin-authored news posts with Tiptap editor
- Category tagging and search
- RSS feed

### v2.0 — Multi-Event Platform
- Reuse codebase for future Math Club events
- Multi-tenant admin with per-event isolation
- Unified analytics across events
- Organisation-level dashboard

---


---

## 14. Admin Android Mobile Application

### 14.1 Objectives & Offline-First Sync
The **NMC 2026 Admin Android Application** enables volunteers and editors to perform quick check-ins at event gates. It utilizes `WorkManager` background tasks and a local `Room` database encrypted with `SQLCipher` (AES-256) to cache records during network outages. When connection resumes, pending scans are synchronized automatically.

### 14.2 Scanning Configurations
Admins select the active operation mode in the app Settings:
*   **Kit Collections**: Updates participant kit receipt flags (`PATCH /api/admin/registrations/kit`).
*   **Presence Attendance**: Updates participant arrival checklists (`PATCH /api/admin/registrations/present`).
*   **Lunch Collect**: Updates lunch token distributions (`PATCH /api/admin/registrations/launch`).
*   **Info Mode (Read-only)**: Pulls details card layout without modification writes.

---

## 15. FastAPI PowerPoint PDF Microservice ("Autocrat")

### 15.1 PowerPoint slide generation
The microservice is a local Python **FastAPI** webserver. When invoked by Vercel callbacks, it triggers Windows **COM automation** using `win32com` to modify PowerPoint slides (`.pptx` templates):
1. Replaces placeholders such as `{{ full_name }}` or `{{ serial }}`.
2. Generates a custom QR code matching the participant's URL and overrides the placeholder boundaries.
3. Exports slides to PDF format and uploads them to the Cloudflare R2 bucket.

### 15.2 Thread Security
To avoid access violations in multi-threaded COM environments, calls are wrapped inside explicit threading tokens:
*   Initialize thread context: `pythoncom.CoInitialize()`
*   Uninitialize thread context: `pythoncom.CoUninitialize()`

---

## 16. Certificate Verification & Generation System

### 16.1 Verification Flow
Participants query their eligibility via `/certificate` by entering their serial number (e.g. `NMC26-S-MO-086`). The request is routed to `/api/certificates/verify` which checks if a record exists in `processed_registrations`. If visible, the app reveals the verified attendee profile card.

### 16.2 Dynamic In-Memory Generation
To avoid heavy PowerPoint COM automation overhead on serverless Vercel runtimes, certificates are generated dynamically inside the Next.js process:
1.  **Templates Directory**: PPTX templates (essentially ZIP containers) are loaded from `/Certificate Template/` based on participant level and event mappings (e.g., `School Level Math Game.pptx`).
2.  **Asset Extraction**: The background JPEG is extracted on-the-fly (`ppt/media/image1.jpg`) using `JSZip`.
3.  **SVG overlay composition**: An SVG overlay containing the participant's name (styled with handwriting script `Silentha OT.ttf` embedded as a base64 font-face) and unique serial number is composited over the image buffer using `sharp`.
4.  **Raw PDF Assembly**: The resulting image is compressed to JPEG and wrapped into a standalone single-page A4 Landscape PDF buffer in-memory using direct PDF stream syntax, avoiding any external PDF library dependencies.
5.  **Output Stream**: Served inline or as an attachment via `/api/certificates/download` depending on whether preview or download is active.

---

## 17. Participant Room Finder & Live Location Maps

### 17.1 Room Finder Search Engine
When page visibility controls allow public access to `room_finder`, users query their exam room assignment via the search interface. The API endpoint `GET /api/registrations/find-room?query=...` queries both `processed_registrations` (participant serials) and `volunteers` (volunteer IDs) to return profile and room information.

### 17.2 Coordinate Location Mapping
Room assignments map to campus coordinates in the Next.js route:
*   **TWB (Textile Workshop)**: Coordinates `(24.01685993912403, 90.41899431404634)` pointing to the Textile Workshop Building.
*   **School**: Coordinates `(24.019016943046, 90.4180040764991)` pointing to the DUET Engineering School.
*   **Fallback**: Coordinates `(24.01741790711585, 90.41896685216089)` pointing to the New Academic Building.

### 17.3 Realtime Map Coordinates
The platform includes location tracking schema `user_locations` and multicast `secure_messages` mapped to Supabase realtime replication channels for visual trackings during carnival operations.

---

## 18. Execution & Deployment Setup

For detailed guidelines on local database setups, microservice installation requirements, and Next.js commands, see the master [README.md](../README.md).

*End of Document — National Mathematics Carnival 2026 Website PRD v3.0*

*Prepared by Math Club, DUET*


---
<p align="center">
  Developed by <b>Mohatamim Haque</b> <br/>
  <a href="https://wa.me/8801518749114" target="_blank"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp"/></a>
  <a href="mailto:mohatamimhaque7@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="mailto:mohatamimhaque@outlook.com"><img src="https://img.shields.io/badge/Outlook-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white" alt="Outlook"/></a>
  <a href="https://facebook.com/mohatamim44" target="_blank"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook"/></a>
  <a href="https://linkedin.com/in/mohatamim" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mohatamimhaque" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
</p>
