# Admin Panel & CMS Control Documentation

This document describes the structure, functionalities, and controls of the NMC 2026 Admin Panel Content Management System (CMS), accessible at `/admin`.

---

## 1. Accessing the Admin Panel

The Admin Panel is protected by Supabase Auth and Custom Role checks:
*   **Endpoint**: Navigate to `https://yourdomain.com/admin` or `http://localhost:3000/admin`.
*   **Authentication**: Login via authorized Email or Mobile Number + Password.
*   **Access Check**: The server queries the `admin_users` table to confirm that the authenticated account has an authorized role (`super_admin`, `admin`, or `registration_editor`). Unauthorized users will receive a `403 Forbidden` screen and cannot access cms endpoints.

---

## 2. Personalization & Branding Customizer

Located under the **Site Settings** section, this panel allows live visual customization of the public website without coding. Changes modify the `site_settings` table and are instantly loaded across the app.

| Customization Target | Control Type | Description |
| :--- | :--- | :--- |
| **Theme Colors** | Color Pickers | Primary, Secondary, Accent, Navbar Background, Footer Background, Button Background, and Button Text colors. Automatically updates global CSS variables. |
| **Typography** | Font Dropdowns | Heading and Body font selections from a pre-vetted Google Fonts library (e.g., *Playfair Display*, *Inter*, *Outfit*). |
| **Hero Section Mode** | Toggle Switch | Choose between **Image Mode** (loads a high-res cover background image) and **Text Mode** (uses solid mathematical grid styles). |
| **Hero Image Overlay** | Color & Opacity Slider | Sets overlay background tint (e.g., `rgba(15,17,23,0.55)`) to ensure high contrast for text. |
| **Countdown Target** | Datetime Picker | Sets the absolute date/time for the main event. Powers the live homepage countdown strip. |

---

## 3. CMS Content Management Modules

The admin panel is organized into dedicated control routes:

### A. Adviser Management (`/admin/advisers`)
Manages faculty advisers and professional mentors displayed on `/advisers`.
*   **Form Controls**: Name, Designation, Department, Institution, Expertise Tags, Email, Phone, LinkedIn, and Bio (Tiptap Rich-Text).
*   **Branding Options**:
    *   **Hide Checkbox**: Hides the card from public display.
    *   **Disable Checkbox**: Keeps card visible but greys it out with a "Currently Unavailable" badge.
*   **Reordering**: Drag-and-drop handles update the `sort_order` column in real-time.
*   **Excel + ZIP Bulk Import**:
    *   **Excel**: Columns parsed are `name`, `designation`, `department`, `institution`, `expertise`, `email`, `phone`, `linkedin`, `bio`, `photo_filename`, and `is_visible`.
    *   **ZIP File**: Must contain images named exactly as specified in the `photo_filename` column.
    *   *Note: Uploaded images are auto-compressed to < 1 MB WebP format before being uploaded to Cloudflare R2.*

### B. Organizing Committee (`/admin/committee`)
Manages sub-committees and member tabs displayed on `/committee`.
*   **Sub-Committee Tabs**: Add new tabs (e.g., *Public Relations*, *Logistics*), rename tabs, reorder them, or toggle visibility.
*   **Member Management**: Add member records under specific sub-committees. Supports profile photos, social media link fields (Facebook, LinkedIn), and public email/phone toggles.
*   **Bulk Import**: Similar to the Adviser panel, select a sub-committee tab and upload an `.xlsx` sheet + `.zip` of photos.

### C. Events Management (`/admin/events`)
The core module controlling events at `/events` and `/events/[slug]`.
*   **Key Fields**: Event Title, Category (University / College / School), Cover Photo, Short Description, Full Description (Rich-Text), Rules (Rich-Text), Prizes (Rich-Text), and Deadline Datetime.
*   **Registration Modes**:
    1.  **Google Form**: Set registration type to `google_form` and paste the URL. The public CTA button redirects users to that external link in a new tab.
    2.  **Internal Form**: Set registration type to `internal`. An interactive **Field Builder** appears, allowing admins to dynamically create custom form inputs (e.g., text inputs, select dropdowns, file uploads). Form submissions are stored directly in the Supabase database.
*   **Reordering & Visibility**: Drag and drop cards on the dashboard to change their order on `/events`. Toggle between *Published*, *Hidden*, or *Disabled* (registration closed).

### D. Notice Board (`/admin/notices`)
Creates live announcements displayed on `/notices` and the homepage notice strip.
*   **Priority Toggles**: Set notice as **Pinned** to display it highlighted at the top of the feed.
*   **Publish & Expiry Scheduler**: Set a future publication date/time or an optional expiry date/time. Expired notices are auto-hidden.
*   **Supabase Realtime**: Publishing a notice pushes it instantly to active visitors' screens.

### E. Sponsors & Partners (`/admin/sponsors`)
Configures logo grids on the homepage and `/sponsors`.
*   **Custom Tiers**: Create categories like *Platinum*, *Gold*, *Silver*, *Media Partner*.
*   **Controls**: Add sponsor name, logo, website URL, and set **Display Mode** (Logo only / Name only / Both). Reorder logos within their respective category boxes.

---

## 4. Submissions & Registrations Board

Specifically for events utilizing the `internal` registration forms.
*   **Submission Tables**: View submissions for selected events. Filter by payment status (Pending, Confirmed, Rejected), search by participant name/phone.
*   **CSV Exports**: Click **Export CSV** to download all registrant details for the event (includes custom fields built in the Form Builder).


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
