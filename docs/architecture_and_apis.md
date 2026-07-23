# Architecture & API Specifications

This document outlines the database schema, Row-Level Security policies, helper scripts, and API contracts for the NMC 2026 platform.

---

## 1. Database Schema (Supabase / PostgreSQL)

## 1. Database Schema & Data Dictionary (Supabase / PostgreSQL)

Below is the structured data dictionary mapping exact datatypes, constraints, and operational descriptions for the key database tables.

### A. Global Settings (`public.site_settings`)
Holds layout options, styling tokens, and branding components.
*   **Unique Index**: Primary Key on `id` (`uuid`).
*   **Singleton Constraint**: Restricts records to a single config row (`id = '00000000-0000-0000-0000-000000000001'`).

| Column Name | PostgreSQL Type | Nullable | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | `gen_random_uuid()` (PK) | Singleton record identifier. |
| `site_title` | `text` | NO | `'National Mathematics Carnival 2026'` | Appended to browser title tag. |
| `logo_url` | `text` | YES | `NULL` | Public Cloudflare R2 path. |
| `favicon_url` | `text` | YES | `NULL` | Browser shortcut icon path on R2. |
| `default_theme` | `text` | NO | `'light'` (CHECK: `'light'`, `'dark'`) | Initial color theme for public pages. |
| `color_primary` | `text` | NO | `'#4f46e5'` | Tailwind CSS primary base variable. |
| `color_secondary` | `text` | NO | `'#7c3aed'` | Tailwind CSS secondary variable. |
| `color_accent` | `text` | NO | `'#06b6d4'` | Interface accent highlights color. |
| `hero_mode` | `text` | NO | `'text'` (CHECK: `'image'`, `'text'`) | Layout toggle for home banner. |
| `hero_title` | `text` | NO | `'National Mathematics Carnival 2026'` | Core headline rendered on banner. |
| `hero_subtitle` | `text` | YES | `NULL` | Tagline text under hero title. |
| `hero_image_url`| `text` | YES | `NULL` | Banner cover image path on R2. |
| `event_date` | `timestamptz` | YES | `NULL` | Global event date setting. |
| `updated_at` | `timestamptz` | NO | `now()` | Date/time settings were modified. |

### B. Participants (`public.processed_registrations`)
Main target database storing attendee credentials and scan progress checks.
*   **Index**: Primary Key on `serial` (`text`).
*   **Policies**: Row-Level Security enables authenticated admin edits.

| Column Name | PostgreSQL Type | Nullable | Constraints / Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `serial` | `text` | NO | Primary Key (e.g. `NMC26-S-MO-086`) | Unique participant identification string. |
| `full_name` | `text` | YES | `NULL` | Participant's printed full name. |
| `email_address` | `text` | YES | `NULL` | Registered communication email. |
| `phone_number` | `text` | YES | `NULL` | Standard contact number. |
| `gender` | `text` | YES | `NULL` | Demographics identifier. |
| `t_shirt_size` | `text` | YES | `NULL` | T-shirt size option. |
| `level` | `text` | YES | `NULL` | Categorization level. |
| `institution` | `text` | YES | `NULL` | Educational institution name. |
| `event` | `text` | YES | `NULL` | Active target competition slug. |
| `allocated_room`| `text` | YES | `NULL` | Room assignment string. |
| `is_kit_coollect`| `boolean` | NO | `false` | Kit box delivery status. |
| `is_present` | `boolean` | NO | `false` | Main attendance register check. |
| `is_collect_launch`| `boolean`| NO | `false` | Lunch ticket token collection state. |
| `admit_card_url`| `text` | YES | `NULL` | Rendered admit card PDF path on R2. |
| `updated_by` | `text` | YES | `NULL` | Email identifier of editor. |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp. |

### C. Volunteers (`public.volunteers`)
Stores event volunteer records.
*   **Unique Index**: Primary Key on `unique_id` (`text`), Unique Constraint on `email` (`text`).

| Column Name | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `unique_id` | `text` | NO | Primary Key | Generated unique reference code. |
| `name` | `text` | NO | (None) | Full name of volunteer. |
| `email` | `text` | NO | (None) | Unique login email. |
| `number` | `text` | YES | `NULL` | Mobile phone contact. |
| `image_url` | `text` | YES | `NULL` | R2 upload link. |
| `segment` | `text` | YES | `NULL` | Target operational team name. |
| `is_present` | `boolean` | NO | `false` | Volunteer check-in status. |
| `is_gift_collected`|`boolean` | NO | `false` | Volunteer gift checklist state. |
| `is_lunch_collected`|`boolean`| NO | `false` | Volunteer lunch verification status. |

### D. System Administrators (`public.admin_users`)
Grants granular database action scopes.
*   **References**: Foreign Key `id` references `auth.users(id)` in Supabase Auth schema.

| Column Name | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `uuid` | NO | Primary Key | Maps to Supabase auth user reference. |
| `email` | `text` | NO | (None) | Unique user identification email. |
| `role` | `text` | NO | `'volunteer'` | Action role check scope. |
| `can_manage_kit` | `boolean` | NO | `false` | Grants update kit capabilities. |
| `can_manage_presents`| `boolean` | NO | `false` | Grants update attendance capabilities. |
| `can_manage_lunch`| `boolean` | NO | `false` | Grants update lunch capabilities. |
| `can_manage_volunteers`| `boolean`| NO | `false` | Grants permission to manage other volunteers. |

---


## 2. API Contract Reference

The following APIs are located under the `/api` namespace of the Next.js app. All non-public endpoints require an `Authorization: Bearer <supabase_access_token>` header.

### A. Authentication Gateway
*   **Route**: `POST /api/admin/login`
*   **Payload**:
    ```json
    {
      "email": "01727183143",
      "password": "your_password"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "user": {
        "id": "user-uuid",
        "email": "admin@example.com",
        "role": "registration_editor",
        "can_manage_kit": true,
        "can_manage_presents": true,
        "can_manage_lunch": true
      },
      "session": {
        "access_token": "eyJhbGci...",
        "expires_in": 3600
      }
    }
    ```

### B. Fetch Participant Details
*   **Route**: `GET /api/admin/registrations/single?serial=NMC26-S-MO-086`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "registration": {
        "serial": "NMC26-S-MO-086",
        "full_name": "Md. Kawsar Ahmed",
        "level": "School level",
        "event": "Math Olympiad",
        "is_kit_coollect": true,
        "is_present": true,
        "is_collect_launch": false,
        "allocated_room": "TWB-402"
      }
    }
    ```

### C. Update Participant Kit Status
*   **Route**: `PATCH /api/admin/registrations/kit`
*   **Payload**:
    ```json
    {
      "serial": "NMC26-S-MO-086",
      "is_kit_coollect": true
    }
    ```

### D. Update Participant Attendance (Presence)
*   **Route**: `PATCH /api/admin/registrations/present`
*   **Payload**:
    ```json
    {
      "serial": "NMC26-S-MO-086",
      "is_present": true
    }
    ```

### E. Update Participant Lunch Status
*   **Route**: `PATCH /api/admin/registrations/launch`
*   **Payload**:
    ```json
    {
      "serial": "NMC26-S-MO-086",
      "is_collect_launch": true
    }
    ```

### F. Summary PDF Reports (Binary Stream output)
Used by the Android client to download raw PDFs for rendering or printing.
*   **Participant Summary**: `GET /api/admin/registrations/summary-pdf`
*   **Volunteer Summary**: `GET /api/admin/volunteers/summary-pdf`
*   **Header Required**: `Authorization: Bearer <token>`
*   **Content-Type**: `application/pdf`

---

## 3. Custom Node & PowerShell Scripts

The `scripts/` directory contains helper CLI utilities:

*   **[scripts/create-admin.ts](file:///d:/nmc/nmc26/scripts/create-admin.ts)**: Provision an admin user.
    ```bash
    npx tsx scripts/create-admin.ts <email> <password>
    ```
*   **[scripts/assign_volunteer_permissions.ts](file:///d:/nmc/nmc26/scripts/assign_volunteer_permissions.ts)**: Assign permission flags to volunteers dynamically in the DB.
*   **[scripts/migrate-registrations.ts](file:///d:/nmc/nmc26/scripts/migrate-registrations.ts)**: Parses registration records and handles database schema insertions/migrations.
*   **[scripts/db-push.ts](file:///d:/nmc/nmc26/scripts/db-push.ts)**: Utility script to push current Prisma/SQL schemas up to Supabase.


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
