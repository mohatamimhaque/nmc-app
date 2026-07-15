# Product Requirement Document (PRD) - NMC 2026 Admin Android App

This document outlines the requirements, architecture, user flows, and technical specifications for the National Mathematics Carnival 2026 Android Admin Application.

---

## 1. Project Overview & Objective

The **NMC 2026 Admin Android Application** is a secure, high-performance mobile utility designed for on-ground event volunteers and coordinators to manage participant status tracking in real time. 

### Core Goals:
1.  **Speed**: Quick scanning of participant QR codes (containing their unique registration Serial).
2.  **No-Click Auto-Update**: Instantly triggers database patch updates on scan without requiring coordinator confirmation clicks, optimizing queue processing times.
3.  **Auditability**: Instant recording of which administrator performed each update.
4.  **Security**: Hardened Bearer Token request verification using HTTPS.

---

## 2. Core Application Workflow

Coordinators scanning tickets on-ground operate in a high-throughput environment. The app is optimized for rapid operations:

```mermaid
graph TD
    A[1. Auth: Login with Email/Password] --> B[2. Landing: Dashboard Stats Page]
    B --> C[3. Configure Active Mode in Settings]
    C --> D[4. Tap Scan: Open QR Code Scanner]
    D --> E[5. Scan QR: Retrieve Participant Serial]
    E --> F{Active Scan Mode Check}
    F -->|Show Info Read-Only| G[6a. GET /registrations/single: Query Details]
    F -->|Kit / Presents / Launch| H[6b. PATCH: Auto-Update Status]
    G --> I[7. Details Page: Display Profile, Live Badges & PDF Download]
    H --> J[8. Details Page: Display Success Banner & Profile]
    I --> K[9. Tap Rescan: Return to Camera Scan]
    J --> K
    K --> D
```

1.  **Authentication**: The coordinator logs in via email and password (provided by the superadmin through the web admin panel).
2.  **Landing Page**: Defaults to the Metrics/Info page. Displays live registrations summary statistics fetched from the statistics API.
3.  **Configure Mode in Settings**: The coordinator selects the active mode from the Settings page:
    *   **Kit Collections** (triggers status update PATCH to `/registrations/kit` on scan).
    *   **Presents** (triggers status update PATCH to `/registrations/present` on scan).
    *   **Launch Collect** (triggers status update PATCH to `/registrations/launch` on scan).
    *   **Show Info (Read-Only Lookup)**: Fetches and displays details via `/registrations/single` without executing database status updates.
4.  **Open Scanner & Scan Ticket**: The coordinator taps the central scan FAB to open the camera scanner viewport and scans the ticket's QR code.
5.  **Status Check / Auto-Action**:
    -   If an update mode is active: The app performs a secure `PATCH` API call instantly behind the scenes.
    -   If "Show Info" read-only is active: The app performs a secure `GET` single query call behind the scenes.
6.  **Details View & Rescan**: The coordinator is presented with the participant's profile details sheet (along with status badges and PDF admit card links). In update modes, a green "Successfully Updated" success banner is overlayed. Tapping the primary **Rescan** button immediately re-enables the camera scanner viewport for the next participant.

---

## 3. Technology Stack & Dependencies

The application **must** be built using **Kotlin** to leverage native Android performance, Jetpack Compose design paradigms, and robust native APIs.

### Mandatory Dependencies & Stack:
*   **Language**: Kotlin 1.9+ (mandatory).
*   **UI & State Management**: Jetpack Compose with `ViewModel` and `StateFlow` using MVVM architecture.
*   **Networking**: `Retrofit` & `OkHttp` for HTTP requests, cookies/header management, and connection timeout handling.
*   **Local Storage**: `EncryptedSharedPreferences` (Jetpack Security) for token encryption, and SQLite encrypted using **SQLCipher** for offline caching.
*   **Barcode/QR Scanning**: `CameraX` combined with `ML Kit Barcode Scanning` for rapid scan captures.
*   **PDF Viewer**: Android `PdfRenderer` (native APIs) for displaying admit cards natively without webview wrappers.
*   **UI Components**: Material 3 Design System, Outfit (headers) and Inter (standard body details) fonts, and custom animations via `Lottie-Android`.

---

## 4. Environment Configurations

Define the API base URL and Supabase configurations in the build configuration (e.g., via `gradle.properties`, `local.properties`, or standard environment variables):

```ini
# Core Configuration
# API Base URL for all Admin endpoints
NMC_API_BASE_URL=https://www.nmcbd.app/api

# Supabase Auth Configuration (for direct client initialization if needed)
SUPABASE_URL=https://toyocrdimcvkmiidposk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveW9jcmRpbWN2a21paWRwb3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzMwNDAsImV4cCI6MjA5Mzc0OTA0MH0.tcrMtLApEH13VotkJTsNqg2c0FbTwFhoUSIwzxfNF3U
```

---

## 5. Security & Authentication Flow

### Hardened Authorization Schema:
```mermaid
sequenceDiagram
    participant App as Native Android Client (Kotlin)
    participant Server as NMC API Server (nmcbd.app)
    participant Auth as Supabase Auth Server
    participant DB as Postgres Database

    App->>Server: POST /login (Email & Password)
    Server->>Auth: signInWithPassword(email, password)
    Auth-->>Server: Return JWT Session Tokens
    Server->>DB: Query admin_users role
    DB-->>Server: User has role "registration_editor"
    Server-->>App: 200 OK (Send JWT Access Token + Profile Details)
    Note over App: Token saved securely in EncryptedSharedPreferences
    App->>Server: GET /registrations with Auth Header (Bearer Token)
    Server-->>App: 200 OK (Send JSON Payload)
```

1.  **Login**: User inputs email and password. App makes a request to `POST https://www.nmcbd.app/api/admin/login` with `{ "email": "admin@example.com", "password": "securepassword" }`.
2.  **Persistence**: The returned `session.access_token` JWT is encrypted and stored locally using `EncryptedSharedPreferences`.
3.  **API Requests**: For all subsequent NMC REST API calls, include the access token in the headers:
    `Authorization: Bearer <access_token>`
4.  **Token Expiration**: On receiving a `401 Unauthorized` or `403 Forbidden` response, the app should wipe local secure storage and redirect the user back to the Login Page.

---

## 6. UI/UX Design System & Theme

To match the premium dashboard aesthetics, implement a unified dark-mode-first styling hierarchy:

*   **Primary Background**: Sleek deep obsidian/coal color (`#0c0f17`).
*   **Surfaces/Cards**: Dark glassmorphic translucency (`rgba(255, 255, 255, 0.03)` with thin borders `#ffffff10`).
*   **Accents**: Vibrant Neon Violet/Blue (`#6366f1` / `#4f46e5`) and Amber Alert Cyan (`#0dcaf0`).
*   **Typography**: Clean sans-serif font pairing (e.g. `Outfit` for large numbers/headers and `Inter` for standard details).
*   **Animations**: Smooth scale transitions on button hover/taps, and slide transitions when navigating panels.

---

## 7. Required Application Pages & Views

### A. Authentication View (Login Page)
*   **Layout**: Beautiful logo header card, centered credentials form.
*   **Controls**: Input fields for Admin Email and Password (provided by superadmin), and a login button.
*   **Features**:
    - Validation flags, password hide/show toggle, loading spinner overlays.
    - **Courtesy Credit**: A small, subtle footnote at the bottom of the screen reading `courtesy: mohatamim` in lowercase, utilizing low-contrast typography (not present on the web portals).

### B. Dashboard / Metrics Landing View (Default Page)
*   **Layout**: Grid of Material 3 glassmorphism cards showing registration summary statistics fetched from the `/api/admin/registrations/summary` API:
    *   **Kit Collected**: `Collected / Pending`
    *   **Attendance**: `Present / Absent`
    *   **Launch Served**: `Served / Pending`
    *   **Category Breakdowns**: Interactive breakdown lists showing totals by **Level** (School level, Intermediate level, University level) and **Event** (Math Olympiad, Math Game, Article Writing, Poster Presentation).
*   **Controls**: Floating Action Button (FAB) at the center-bottom to launch the Live Camera Scanner view. A **Settings** button in the app bar allows administrators to configure the active scan mode.

### Settings View
*   **Layout**: Clean options form page.
*   **Controls**:
    *   **Active Scan Mode Selector**: Radio buttons or list to select the active mode:
        1. **Kit Collections** (triggers kit status PATCH on scan)
        2. **Presents** (triggers attendance presence PATCH on scan)
        3. **Launch Collect** (triggers launch status PATCH on scan)
    *   **Show Info Toggle**:
        - Enable/disable read-only lookup (when enabled as standalone, scan only shows info without patching).
        - Parallel details (when enabled in update modes, profile details are displayed after updating).

### C. Live Scanner View (QR Scanner Page)
*   **Layout**: Full-screen camera scanner viewport with a neon scanner boundary box overlay.
*   **Controls**: Flashlight toggle button, manual serial entry input fallback.
*   **Features**: On detecting a registration QR code (e.g. text containing `260001` serial ID), the scanner stops, triggers a subtle haptic vibrate feedback.
    - If **Show Info** (read-only) mode is active: The app directly queries the registrations API to fetch details and navigates to the Participant Detail view.
    - If in an update mode (Kit Collections, Presents, or Launch Collect): The app **automatically** calls the matching status update API route (e.g. `PATCH /registrations/kit` with `is_kit_coollect: true`) without requiring coordinator validation clicks. Once the PATCH completes, the app displays the success banner and (if Show Info parallel is active) navigates to the Participant Detail view.

### D. Participant Detail & Update View (Result View)
*   **Layout**: Scrollable, card-grouped details section showing the participant's full profile:
    1.  **Status Banners**:
        - In update modes (Kit/Presents/Launch): Shows a green alert card reading "Successfully Updated" (or amber if already processed).
        - In standalone **Show Info** lookup mode: Shows a blue info banner reading "Participant Info Lookup (Read-Only)".
    2.  **Profile Info**: Scanned participant Name, Serial, Institution, Class/Level, Event, and T-shirt size.
    3.  **Audit Trail**: Last updated timestamp and the name/email of the admin user who performed the action.
    4.  **Live Status Badges**:
        - **Kit Status**: Green (Collected) / Gray (Pending)
        - **Attendance**: Green (Present) / Red (Absent)
        - **Launch Served**: Green (Served) / Gray (Pending)
    5.  **Inline Manual Toggles**: Fallback switches for all three status variables, allowing authorized editors to fix typos or perform manual override updates.
*   **Controls**: 
    - Large, primary neon **Rescan** button (returns coordinator to the scanner viewport).
    - **Show Admit Card** button: 
      - Opens the admit card PDF natively inside the app using a dedicated **Native PDF Viewer** screen.
      - Avoids webview compatibility/rendering errors by loading via Android's `PdfRenderer` or lightweight native wrappers.
      - Features a prominent **Download Admit Card** action button in the action bar which saves the PDF directly to the device's local `/Download` directory.
      - Displays a download progress bar and triggers a haptic vibration upon completion.
    - **Local Offline Cache**: Supports offline retrieval of lookup details by caching registration items locally in a SQL database when network signals are weak.


### E. Participant Search View
*   **Layout**: Clean search dashboard with input filters at the top and a list table at the bottom.
*   **Filters**:
    1.  `Level Select Dropdown`: School, Intermediate, University level, or All.
    2.  `Event Select Dropdown`: Math Olympiad, Math Game, Article Writing, Poster Presentation, or All.
    3.  `Name or Phone Input`: Text box matching part of participant's name or phone.
*   **Results Table**:
    - Displays matched results (Serial, Name, Event, and Level).
    - Clicking a matched participant row navigates the coordinator directly to their **Participant Detail & Update View** page.
*   **Action Floating Button**:
    - Floating Action Button (FAB) at the bottom-right corner to open the scanner view quickly.

### F. About View (About Page)
*   **Layout**: Clean, native informational view (accessible from Settings or navigation menu, exclusive to the Android App and not present on the website).
*   **Content**: Details the app version (`v1.0.0`), developer attributes, and the purpose of the National Mathematics Carnival 2026 Admin Application.
*   **Courtesy Credit**: Features a footnote at the bottom reading `courtesy: mohatamim` in lowercase, styled in subtle, low-contrast typography.

---

## 8. API Integration Specifications

### Endpoint 0: Admin Authentication (Secure Login)
*   **Path**: `POST /api/admin/login`
*   **Headers**: 
    - `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "email": "admin@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response (200 OK - Successful Authentication)**:
    ```json
    {
      "success": true,
      "session": {
        "access_token": "eyJhbGciOi...",
        "refresh_token": "rf...",
        "expires_at": 1784048865,
        "expires_in": 3600
      },
      "user": {
        "id": "u-uuid-1234",
        "email": "admin@example.com",
        "display_name": "Mohatamim Haque",
        "role": "registration_editor"
      }
    }
    ```
*   **Response (400 Bad Request - Missing Parameters)**:
    ```json
    {
      "error": "Email and password are required."
    }
    ```
*   **Response (401 Unauthorized - Invalid Credentials)**:
    ```json
    {
      "error": "Invalid login credentials."
    }
    ```
*   **Response (403 Forbidden - Not an Authorized Admin)**:
    ```json
    {
      "error": "Access denied: User is not an authorized administrator."
    }
    ```

---

### Endpoint 1: Get Registrations JSON
*   **Path**: `GET /api/admin/registrations`
*   **Headers**:
    - `Authorization: Bearer <access_token>`
*   **Action**: Use to sync local database/cache or search offline when on-site connectivity fluctuates.
*   **Request Format**: No query or body parameters.
*   **Response (200 OK - Array of registrations)**:
    ```json
    [
      {
        "serial": "260001",
        "full_name": "MD. SIFATULLAH",
        "email_address": "sifat@example.com",
        "phone_number": "01712345678",
        "gender": "Male",
        "t_shirt_size": "L",
        "level": "School level",
        "institution": "Dhaka College",
        "class_year_student_of": "HSC 2nd Year",
        "event": "Math Game",
        "payment_method": "Bkash",
        "payment_number": "01712345678",
        "transaction_id": "TxN82B19A",
        "is_kit_coollect": true,
        "is_present": true,
        "is_collect_launch": false,
        "allocated_room": "Room 302B",
        "updated_by": "mohatamimhaque@outlook.com",
        "updated_at": "2026-07-14T16:00:00.000Z",
        "created_at": "2026-07-14T12:00:00Z",
        "admit_card_url": "https://pub-99e7fad4ec9f4d2dafa1e77c8558eee0.r2.dev/NMC26-S-MG-001.pdf"
      }
    ]
    ```
*   **Response (401 Unauthorized - Missing/Expired Token)**:
    ```json
    {
      "error": "Unauthorized"
    }
    ```
*   **Response (403 Forbidden - Role Check Failed)**:
    ```json
    {
      "error": "Forbidden"
    }
    ```

---

### Endpoint 2: Update Kit Collection
*   **Path**: `PATCH /api/admin/registrations/kit`
*   **Headers**:
    - `Content-Type: application/json`
    - `Authorization: Bearer <access_token>`
*   **Request Body**:
    ```json
    {
      "serial": "260001",
      "is_kit_coollect": true
    }
    ```
*   **Response (200 OK - Updated status)**:
    ```json
    {
      "success": true,
      "updated": true,
      "serial": "260001",
      "updatedBy": "Mohatamim Haque",
      "updatedAt": "2026-07-14T16:00:00.000Z"
    }
    ```
*   **Response (400 Bad Request - Missing/Invalid Parameters)**:
    ```json
    {
      "error": "Missing or invalid serial or is_kit_coollect parameters."
    }
    ```
*   **Response (401 Unauthorized)**:
    ```json
    {
      "error": "Unauthorized"
    }
    ```

---

### Endpoint 3: Update Launch Status
*   **Path**: `PATCH /api/admin/registrations/launch`
*   **Headers**:
    - `Content-Type: application/json`
    - `Authorization: Bearer <access_token>`
*   **Request Body**:
    ```json
    {
      "serial": "260001",
      "is_collect_launch": true
    }
    ```
*   **Response (200 OK - Updated status)**:
    ```json
    {
      "success": true,
      "updated": true,
      "serial": "260001",
      "updatedBy": "Mohatamim Haque",
      "updatedAt": "2026-07-14T16:00:00.000Z"
    }
    ```
*   **Response (400 Bad Request)**:
    ```json
    {
      "error": "Missing or invalid serial or is_collect_launch parameters."
    }
    ```

---

### Endpoint 4: Update Attendance / Presence
*   **Path**: `PATCH /api/admin/registrations/present`
*   **Headers**:
    - `Content-Type: application/json`
    - `Authorization: Bearer <access_token>`
*   **Request Body**:
    ```json
    {
      "serial": "260001",
      "is_present": true
    }
    ```
*   **Response (200 OK - Updated status)**:
    ```json
    {
      "success": true,
      "updated": true,
      "serial": "260001",
      "updatedBy": "Mohatamim Haque",
      "updatedAt": "2026-07-14T16:00:00.000Z"
    }
    ```
*   **Response (400 Bad Request)**:
    ```json
    {
      "error": "Missing or invalid serial or is_present parameters."
    }
    ```

---

### Endpoint 5: Get Registrations Summary & Statistics
*   **Path**: `GET /api/admin/registrations/summary`
*   **Headers**:
    - `Authorization: Bearer <access_token>`
*   **Request Format**: No query or body parameters.
*   **Response (200 OK - Live statistics)**:
    ```json
    {
      "success": true,
      "total": 773,
      "kit_collection": {
        "collected": 60,
        "pending": 713
      },
      "attendance": {
        "present": 80,
        "absent": 693
      },
      "launch_status": {
        "served": 50,
        "pending": 723
      },
      "by_level": {
        "School level": 365,
        "Intermediate level": 144,
        "University level": 264
      },
      "by_event": {
        "Math Olympiad": 662,
        "Math Game": 72,
        "Article Writing": 16,
        "Poster Presentation": 23
      }
    }
    ```

---

### Endpoint 6: Get Single Registration Details
*   **Path**: `GET /api/admin/registrations/single`
*   **Headers**:
    - `Authorization: Bearer <access_token>`
*   **Query Parameters**:
    - `serial`: `string` (required, e.g. `"260001"`)
*   **Response (200 OK - Participant record details)**:
    ```json
    {
      "success": true,
      "registration": {
        "serial": "260001",
        "full_name": "MD. SIFATULLAH",
        "email_address": "sifat@example.com",
        "phone_number": "01712345678",
        "gender": "Male",
        "t_shirt_size": "L",
        "photos": "https://...",
        "level": "School level",
        "institution": "Dhaka College",
        "class_year_student_of": "HSC 2nd Year",
        "event": "Math Game",
        "payment_method": "Bkash",
        "payment_number": "01712345678",
        "transaction_id": "TxN82B19A",
        "is_kit_coollect": true,
        "is_present": true,
        "is_collect_launch": false,
        "allocated_room": "Room 302B",
        "updated_by": "mohatamimhaque@outlook.com",
        "updated_at": "2026-07-14T16:00:00.000Z",
        "created_at": "2026-07-14T12:00:00Z",
        "admit_card_url": "https://pub-99e7fad4ec9f4d2dafa1e77c8558eee0.r2.dev/NMC26-S-MG-001.pdf"
      }
    }
    ```
*   **Response (400 Bad Request - Missing Parameter)**:
    ```json
    {
      "error": "Missing or empty serial parameter."
    }
    ```
*   **Response (404 Not Found - Record Not Found)**:
    ```json
    {
      "error": "Registration with serial \"260001\" not found."
    }
    ```

---

## 9. Offline Data Resiliency & Sync Schema

On-ground locations (like exhibition halls and campus sites) frequently suffer from unstable cellular data and Wi-Fi coverage. The app must implement local data caching and an offline queue to guarantee uninterrupted operations.

### A. Local SQLite / Room Database Cache
*   **Database Engine**: Android SQLite accessed via **Room ORM** library.
*   **Tables**:
    1.  `cached_registrations`: Mirrors the `processed_registrations` table structure. Used for offline searches, single lookup displays, and local validation.
    2.  `offline_patches_queue`: Stores status change actions (PATCH payloads) triggered by scans while offline.
        -   Fields: `id` (autoincrement PK), `serial` (text), `action_type` (text: `"kit" | "present" | "launch"`), `value` (boolean), `timestamp` (text/ISO).

### B. Sync Strategy
*   **Offline Mode Trigger**: OkHttp interceptor detects network timeouts (`ConnectException`, `SocketTimeoutException`) or no network status.
*   **Behavior while Offline**:
    -   QR scanner matches the scanned serial against the local `cached_registrations` table.
    -   Shows participant profile immediately (Show Info details).
    -   Saves the pending PATCH action in the `offline_patches_queue`.
    -   Updates the local `cached_registrations` record so local stats adjust instantly.
    -   Displays a visible warning banner: `"Offline Mode - Updates queued locally"`.
*   **Synchronization Job**:
    -   A background task (using Android **WorkManager** scheduled with constraints: `NetworkType.CONNECTED`) runs automatically when internet connectivity returns.
    -   Iterates through the `offline_patches_queue` items sequentially.
    -   Executes the PATCH requests to the server with the original authorization token.
    -   On successful response, deletes the corresponding queue row.
    -   If conflict arises (e.g. server has newer status updates), the server status takes precedence ("Server Wins" resolution strategy).

---

## 10. Local Security Hardening & Device Biometrics

Because the application provides full control to update kit collections and check in attendees, unauthorized device access on-site must be prevented.

1.  **Biometric Lock Screen Protection**:
    -   The app should check for Android **BiometricPrompt** support (fingerprint / face unlock).
    -   If enabled in Settings, the app requires biometric authorization when launching from a cold start, resuming from a backgrounded state (longer than 1 minute), or executing manual status overrides.
2.  **Encrypted Local Database**:
    -   Encrypt the Room SQLite database using **SQLCipher** with a key securely derived and stored in the Android **Keystore System**.
3.  **Root & Emulator Detection**:
    -   App must run security checks to detect rooted environments (e.g., searching for `su` binaries or test keys) or emulator executions, alerting the user and optionally disabling offline data sync if a root compromise is discovered.

---

## 11. Android Permissions & Hardware Specifications

### A. Manifest Permissions Required
*   `android.permission.CAMERA`: Essential to run the QR code scanner camera viewport.
*   `android.permission.INTERNET`: Needed to make auth, lookup, and PATCH API calls.
*   `android.permission.ACCESS_NETWORK_STATE`: Needed to detect offline triggers and sync schedules.
*   `android.permission.VIBRATE`: Triggers haptic physical feedback on successful QR matches.
*   `android.permission.USE_BIOMETRIC` / `android.permission.USE_FINGERPRINT`: Used to lock administrative workflows.

### B. Hardware Configuration
*   **Minimum OS Version**: Android 8.0 (API Level 26 - Oreo) to support modern security structures and standard native PDF rendering.
*   **Camera Minimums**: Back-facing camera with auto-focus and flash/torch capabilities (controlled by UI toggle).

---

## 12. Local Logging & Diagnostic Audits

To resolve discrepancies (e.g., a student claiming they did not receive their launch coupon but the database says yes), the app keeps a local diagnostic trace log.

*   **Audit File**: Stored in internal app storage (using `EncryptedFile`).
*   **Logged Events**:
    -   `[AUTH_LOGIN]` Admin email login success or fail error codes.
    -   `[SCAN_MATCH]` Serial number retrieved, mode used, network status.
    -   `[SYNC_QUEUE]` Items queued, sync tasks triggered, success rates.
    -   `[MANUAL_OVERRIDE]` Manual toggle of status by admin, including serial and values changed.
*   **Log Management**: Retained for the duration of the carnival (7 days maximum) and automatically purged. Features a button to share/export logs securely as a encrypted zip via standard Android Sharesheet.

---

## 13. Screen Layouts & Wireframes (ASCII Viewports)

### Viewport A: Authentication Screen
```text
+------------------------------------------+
|                  NMC 2026                |
|             [ Logo / Emblem ]            |
|                                          |
|  Email                                   |
|  [ admin@example.com                   ] |
|                                          |
|  Password                                |
|  [ **********                       [x] ] |
|                                          |
|  [             LOG IN                 ]  |
|                                          |
|  courtesy: mohatamim                     |
+------------------------------------------+
```

### Viewport B: Dashboard & Landing Page
```text
+------------------------------------------+
|  NMC Admin Dashboard          [Settings] |
|  +------------------------------------+  |
|  |           SCAN TARGET:             |  |
|  |     [Kit]   *Attendance*   [Launch]  |  |
|  +------------------------------------+  |
|                                          |
|  [ Live Stats ]                          |
|  * Kit Distributed  * Servings Served    |
|    Collected: 350     Served: 280        |
|    Pending:   423     Pending: 493       |
|                                          |
|  * Verified Presence                     |
|    Present:   520     Absent:  253       |
|                                          |
|                                          |
|               [ CAMERA SCAN ]            |
|                                          |
+------------------------------------------+
```

### Viewport C: Participant Details & Result Sheet
```text
+------------------------------------------+
|  < Back (Dashboard)                      |
|  +------------------------------------+  |
|  |      SUCCESSFULLY UPDATED          |  |
|  +------------------------------------+  |
|  Name: Saddman Faruque Walid             |
|  Serial: NMC26-I-AW-001                  |
|  Institution: Daffodil Polytechnic       |
|  Event: Article Writing                  |
|                                          |
|  STATUS OVERRIDES                        |
|  [o] Kit Collected     [o] Present       |
|  [o] Launch served                       |
|                                          |
|  [ VIEW ADMIT CARD (PDF) ]               |
|                                          |
|                 [ RESCAN ]               |
+------------------------------------------+
```



