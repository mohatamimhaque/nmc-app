# Public Website Routing & Layout Guide

This guide details the routing structures, interactive features, user controls, and page-by-page specifications of the public-facing NMC 2026 website.

---

## 1. Global Page Routing Table

| URL Route | Focus / Feature | Target Audience / Action |
| :--- | :--- | :--- |
| **`/`** | Homepage | Hub with hero banners, live countdowns, previews of notices, highlights, and partner grids. |
| **`/events`** | Event Listing | Filters events by participant category (School / College / University) or registration state. |
| **`/events/[slug]`** | Event Details | Complete event instructions, rulebooks, prize grids, custom registration form checkout, or redirects. |
| **`/gallery`** | Lightbox Photo Board | Lazy-loaded grid of past carnival milestones filterable by activity folders. |
| **`/contact`** | Helpdesk Form | Secure messaging form mapped directly to database records and admin notification systems. |
| **`/about`** | DUET Math Club Background | Overview, milestones timeline, links to advisers and committees. |
| **`/committee`** | Organizing Committee | Tabbed view of executive divisions and member role files. |
| **`/advisers`** | Advisers Registry | Vetted grid of university faculty members and professional advisors. |
| **`/sponsors`** | Partners & Sponsors | Tiered grids of sponsoring entities with redirect links. |
| **`/schedule`** | Event Timeline | Time slot listings of math tests, panel sessions, and room assignments. |
| **`/notices`** | Announcement Feeds | Notice board syncing changes instantly via real-time listeners. |

---

## 2. Interactive Features & Page Specifications

### A. Homepage (`/`)
The homepage loads all layout configurations dynamically from the `site_settings` database.
*   **Mathematical Visual Elements**: Accentuated by grid patterns, formula backgrounds, and vector shapes that reflect the Math Club, DUET branding.
*   **Live Countdown**: An interactive JS component calculating real-time difference against the target datetime.
*   **Announcement Strip**: Highlights priority notices in a marquee or floating banner.
*   **Media Grids**: Previews the latest 3 Notices, 6 Lightbox Images, and featured committee heads.

### B. Events Listing (`/events`) & Details (`/events/[slug]`)
*   **Category Filters**: Users can toggle between *School*, *Intermediate (College)*, and *University* levels.
*   **State Filters**: Filters events by *Open* (active checkouts), *Closed* (passed deadline), or *Upcoming* (registration not started).
*   **Live Detail Countdown**: Features a deadline clock on `/events/[slug]`. If the remaining time is less than 24 hours, the clock turns red.
*   **Dynamic Registration Flow**:
    *   **External Form**: Clicking "Register Now" opens the external URL (e.g., Google Form) in a new tab.
    *   **Internal Form**: Opens a clean form modal. The inputs are built dynamically based on the event's form builder setup. When submitted, the client performs validation and transmits payloads to `/api/events/register`.

### C. Notices Board (`/notices`)
*   **Supabase Realtime Sync**: When an administrator publishes or updates an announcement, a database webhook pushes the new entry to the client. The notice list updates instantly without requiring a page refresh.
*   **Pinned Items**: Notices marked as "Pinned" are highlighted and locked at the top of the timeline.

### D. Image Gallery (`/gallery`)
*   **Lazy Loading**: Utilizes standard browser Intersection Observer mechanisms to lazy-load media files.
*   **Interactive Lightbox**: Clicking a photo opens a full-screen overlay displaying the caption, upload date, and keyboard/touch navigation controls (Previous / Next).

### E. Schedule Page (`/schedule`)
*   **Timeline Tabbing**: Allows toggling between Event Day 1 and Day 2 schedules.
*   **Download Schedule**: Provides a prominent button linking to the admin-uploaded schedule PDF document stored in Cloudflare R2.

### F. Contact Form (`/contact`)
*   **Validations**:
    *   *Email*: Matches string against standardized standard email regex pattern.
    *   *Phone*: Validates Bangladeshi phone numbers (must start with `01` and contain 11 digits).
*   **Payload Logging**: Data is submitted to `/api/contact` and logged in the database for admin review.

---

## 3. Component Visibility & Access Matrix

Administrators can toggle element states via the CMS to control public exposure. The following states are enforced on the public pages:

| Page / Component | Target Element | Action States & Behaviors |
| :--- | :--- | :--- |
| **Homepage (`/`)** | Hero, Countdown, Highlights, Notices, Gallery, Committee, Sponsors, Partners, Stats, CTA Strip | **Visible**: Component renders normally.<br>**Hidden**: Renders nothing (removed from DOM layout). |
| **Events (`/events`)** | Competition cards, details slug page | **Published**: Normal listing; registration is open.<br>**Disabled**: Card remains visible but greyed out with a "Registration Closed" badge; detail page CTA is disabled.<br>**Hidden**: Completely hidden from lists; hitting `/events/[slug]` direct URL returns `404 Not Found`. |
| **Advisers (`/advisers`)** | Adviser profile cards | **Visible**: Displays full profile card details.<br>**Disabled**: Card remains visible but is greyed out with a "Currently Unavailable" badge.<br>**Hidden**: Card is completely excluded from grid output. |
| **Committee (`/committee`)** | Sub-committee tabs, member cards | **Tab States**: Visible tabs display normally; **Hidden** tabs are removed from selector panel.<br>**Member States**: Visible members render under their active tab; **Disabled** members show as greyed cards; **Hidden** members are omitted. |
| **Sponsors (`/sponsors`)** | Sponsor logo grids, categories | **Visible**: Displays logo/name grid elements.<br>**Hidden**: Sponsor is excluded. If all sponsors in a category are hidden, the entire category section is auto-hidden. |
| **Notices (`/notices`)** | Announcement cards | **Visible**: Renders normally on feeds and homepage preview.<br>**Hidden**: Un-published notice disappears from DOM.<br>**Scheduled**: Stays hidden until system clock matches *Publish Date*.<br>**Expired**: Auto-hides once current time exceeds *Expiry Date*. |
| **Schedule (`/schedule`)** | Session slots, program page | **Session Slot**: **Visible** slots display on timelines; **Hidden** slots are excluded.<br>**Schedule Page Toggle**: Global settings flag can toggle the entire `/schedule` route on or off. |



---

## Developer Credit & Contact Details

This platform was developed and is maintained by:
*   **Name**: Mohatamim Haque
*   **Phone (WhatsApp)**: +8801518749114 (01518749114)
*   **Primary Email**: mohatamimhaque7@gmail.com
*   **Alternative Email**: mohatamimhaque@outlook.com
*   **Facebook**: [mohatamim44](https://facebook.com/mohatamim44)
*   **LinkedIn**: [mohatamim](https://linkedin.com/in/mohatamim)
*   **GitHub**: [mohatamimhaque](https://github.com/mohatamimhaque)
