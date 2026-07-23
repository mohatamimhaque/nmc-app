# Event Repurposing & Customization Guide

This document acts as a step-by-step checklist for system administrators and event operators who want to clean up, customize, and ready this site for another event (e.g., a physics carnival, math contest, or a future NMC event).

---

## Step 1: Resetting Database Check-in States

Before a new event, you must clean out the previous event's database data without breaking structural settings or administrative user accounts.

### A. Resetting Registration Check-ins (Keep Participants, Reset Scans)
If you want to keep the same participant list but reset all on-ground check-in statuses (for a multi-day event or re-test):
```sql
UPDATE public.processed_registrations 
SET 
  is_present = false, 
  is_kit_coollect = false, 
  is_collect_launch = false, 
  allocated_room = null,
  admit_card_url = null;
```

### B. Full Database Purge (Fresh Event)
To remove all participant and volunteer data for a new event list:
```sql
-- Truncate participant records
TRUNCATE TABLE public.processed_registrations CASCADE;

-- Truncate volunteer records
TRUNCATE TABLE public.volunteers CASCADE;
```
*(Do **NOT** truncate `public.admin_users` or `public.site_settings` as they keep your system configurations and admin login permissions).*

---

## Step 2: Dynamic Branding & Identity Configurations

You do not need to rewrite code to update titles, colors, fonts, or registration countdowns. Use the Next.js Admin Panel:

1.  **Login** to the Admin portal `/admin` using your admin credentials.
2.  **Navigate** to the **Site Settings / Global settings** panel.
3.  **Adjust Layout & Themes**:
    *   Change the **Primary/Secondary Color** hex codes (these control Tailwind CSS classes globally on the public pages).
    *   Select your preferred Google Fonts for headings and body texts.
    *   Toggle animations on/off.
    *   Change the **Hero Mode** (toggle between a solid text header or a customizable background image slider).
4.  **Registration Timers**: Add the timestamp of the new registration deadline. The client-side countdown clocks will automatically sync to this deadline.

---

## Step 3: Modifying the Admit Card PowerPoint Template

The local generator dynamically reads `admit card/template.pptx`, updates text variables, inserts a QR code, and converts it to PDF.

### Template Specifications
*   **File Path**: [admit card/template.pptx](file:///d:/nmc/nmc26/admit%20card/template.pptx)
*   **Design Rules**:
    *   You can change the background graphics, colors, shapes, logos, and layout structure of the slide in PowerPoint.
    *   You **must** keep the exact text tokens in text boxes where participant info goes:
        *   `{{ full_name }}` — Displays participant's full name.
        *   `{{ institution }}` — Displays school/college/university name.
        *   `{{ level }}` — Participant's class or category level.
        *   `{{ event }}` — Name of the registered event.
        *   `{{ serial }}` — Unique identification code (e.g. `NMC26-S-MO-086`).
    *   To place the QR code, draw a shape (like a rectangle or square) in PowerPoint, and write `{{qr}}` as its text content. The generator script searches for this specific shape, reads its coordinates, removes it, and overlays the generated QR code image in its exact place.
    *   Keep the font as **Poppins Medium** (or edit the font declaration in `autocrat.py` on line 10 if you want to use a different font).

---

## Step 4: Seeding & Importing New Data

Once your template and databases are ready, import your registrations:
1.  **Format Excel Sheet**: Create an `.xlsx` workbook containing column headers matching your Supabase fields (`serial`, `full_name`, `email_address`, `phone_number`, `level`, `institution`, `event`).
2.  **Execute Import**: Use the admin panel's Excel bulk import endpoint or utilize the provided node scripts:
    *   Run `npx tsx scripts/migrate-registrations.ts` to bulk load and validate incoming participant records.
3.  **Deploy Rooms**: Create a room configuration mapping and push it via `npx tsx scripts/push-room-finder-schema.ts`.


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
