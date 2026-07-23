# Master Product Requirement Document & Technical Specification
## NMC 2026 Admin Android Application

This master specification details the complete architecture, requirements, API contracts, security mechanisms, user workflows, and Kotlin integration guidelines for the **National Mathematics Carnival 2026 Android Application**. It merges the general application specification with the detailed PDF summary rendering requirements.

---

## 1. Project Overview & Objectives

The **NMC 2026 Admin Android Application** is a high-performance, secure mobile utility built for on-ground event volunteers, registration editors, and administrators to track and manage participant and volunteer check-ins, kit distributions, lunch services, and room allocations in real time.

### Core Objectives:
1. **Speed & Throughput**: High-speed camera scanning of participant/volunteer QR codes containing unique registration serials (e.g. `NMC26-S-MO-086` or `NMC26-V-001`).
2. **No-Click Auto-Update**: Auto-triggers server status updates on QR code detection without requiring manual confirm clicks, reducing queue times on-site.
3. **Phone Number & Email Login**: Flexible mobile authentication supporting both phone numbers (e.g. `01727183143`) and email addresses with Bearer JWT tokens.
4. **Granular Role Enforcement**: Permissions dynamically control active scan modes and toggle actions based on user roles (`super_admin`, `admin`, `registration_editor`, `volunteer`).
5. **Offline Resiliency**: Room SQLite caching with SQLCipher encryption and background WorkManager synchronization when network connectivity fluctuates.
6. **Summary PDF Exports**: In-app rendering and downloading of high-resolution summary PDF reports for volunteer and participant management.

---

## 2. Core Application Workflow

```mermaid
graph TD
    A[1. Auth: Login with Phone Number or Email] --> B[2. Landing: Dashboard Stats Page]
    B --> C[3. Configure Active Mode in Settings]
    C --> D[4. Tap Scan: Open QR Code Scanner Viewport]
    D --> E[5. Scan QR: Retrieve Registration Serial]
    E --> F{Active Scan Mode Check}
    F -->|Show Info Read-Only| G[6a. GET /registrations/single: Query Details]
    F -->|Kit / Presents / Lunch| H[6b. PATCH: Auto-Update Status Behind Scenes]
    G --> I[7. Details Page: Profile, Live Badges & PDF Admit Card]
    H --> J[8. Details Page: Success Banner & Live Profile]
    I --> K[9. Tap Rescan: Return to Camera Scan Viewport]
    J --> K
    K --> D
```

### Operational Steps:
1. **Authentication**: User logs in with a mobile phone number (e.g. `01727183143`) or email address and password.
2. **Dashboard Landing**: Displays live registration summary metrics (Total, Attendance %, Kits Distributed, Lunch Served, Level & Event breakdowns).
3. **Configure Active Mode**: The user selects the active scan target in Settings:
   - **Kit Collections**: Triggers `PATCH /api/admin/registrations/kit` on scan.
   - **Presents / Attendance**: Triggers `PATCH /api/admin/registrations/present` on scan.
   - **Lunch Collect**: Triggers `PATCH /api/admin/registrations/launch` on scan.
   - **Show Info (Read-Only)**: Executes `GET /api/admin/registrations/single` without executing database status updates.
4. **Live Scan**: Camera scanning captures participant QR codes. If an update mode is active, the app automatically executes the update request and presents the result sheet with a green "Successfully Updated" banner.

---

## 3. Technology Stack & Dependencies

The application **must** be built using **Kotlin** with native Android Jetpack Compose paradigms.

* **Language**: Kotlin 1.9+ (mandatory).
* **UI & Architecture**: Jetpack Compose, Material 3 Design, `ViewModel`, `StateFlow` with MVVM pattern.
* **Networking**: `Retrofit 2` & `OkHttp 4` with custom Interceptors for JWT Bearer Tokens and timeout management.
* **Local Storage & Caching**: Android `Room ORM` with **SQLCipher** for database encryption, and `EncryptedSharedPreferences` for token caching.
* **Barcode & QR Scanning**: `CameraX` combined with `Google ML Kit Barcode Scanning`.
* **PDF Engine**: Android `PdfRenderer` for native admit card viewing and PDF summary rendering.
* **UI Fonts & Assets**: `Outfit` (bold metrics/headers), `Inter` & `Noto Sans Bengali` (body text & Bengali room names).

---

## 4. Environment Configurations

```ini
# Core API Base URL
NMC_API_BASE_URL=https://www.nmcbd.app/api

# Supabase Auth Configuration
SUPABASE_URL=https://toyocrdimcvkmiidposk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRveW9jcmRpbWN2a21paWRwb3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzMwNDAsImV4cCI6MjA5Mzc0OTA0MH0.tcrMtLApEH13VotkJTsNqg2c0FbTwFhoUSIwzxfNF3U
```

---

## 5. Security & Authentication Flow

### Mobile Authentication Schema
```mermaid
sequenceDiagram
    participant App as Native Android Client (Kotlin)
    participant Server as NMC API Server (nmcbd.app)
    participant Auth as Supabase Auth Server
    participant DB as Postgres Database

    App->>Server: POST /login (Phone/Email & Password)
    Server->>Auth: signInWithPassword(phoneOrEmail, password)
    Auth-->>Server: Return JWT Session Tokens
    Server->>DB: Query admin_users role & permission flags
    DB-->>Server: User record with role & permissions
    Server-->>App: 200 OK (JWT Access Token + Profile Permissions)
    Note over App: Token saved in EncryptedSharedPreferences
    App->>Server: Request API with Header (Authorization: Bearer <token>)
    Server-->>App: 200 OK Response
```

#### Authorization Header Format
For all protected API endpoints, attach the JWT token in HTTP request headers:
```http
Authorization: Bearer <access_token>
```

---

## 6. UI/UX Design System

* **Primary Background**: Obsidian / Coal (`#0c0f17`).
* **Surfaces & Cards**: Dark glassmorphism (`rgba(255, 255, 255, 0.03)` with border `rgba(255, 255, 255, 0.08)`).
* **Accents**: Neon Indigo (`#6366f1`), Cyan (`#0dcaf0`), Emerald (`#10b981`), Amber (`#f59e0b`).
* **Courtesy Footnote**: Footer text `courtesy: mohatamim` in subtle low-contrast typography on login and about screens.

---

## 7. Required Application Views & Screens

### A. Authentication View (Login Page)
- **Inputs**: Phone Number or Email input field, Password field (default password `12345678` for imported accounts).
- **Features**: Password toggle, loading state overlay, error banner, and `courtesy: mohatamim` footer.

### B. Dashboard View (Landing Page)
- **Metrics Grid**: Total Registrations, Kit Collected (`Collected/Pending`), Attendance (`Present/Absent`), Lunch Served (`Served/Pending`).
- **Breakdown Cards**: Level Breakdown (School, Intermediate, University) and Event Breakdown (Math Olympiad, Math Game, Article Writing, Poster Presentation).
- **FAB**: Floating action button launching camera scanner viewport.

### C. Settings View (Mode & Permission Configuration)
- **Active Scan Mode Options**:
  1. *Kit Collections* (disabled if `profile.can_manage_kit == false`)
  2. *Presents / Attendance* (disabled if `profile.can_manage_presents == false`)
  3. *Lunch Collect* (disabled if `profile.can_manage_lunch == false`)
  4. *Show Info (Read-Only Lookup)* (always available)

### D. Live QR Scanner View
- Camera viewport with neon boundary target box, torch/flashlight toggle, and manual serial entry fallback (`NMC26-X-XX-XXX`).
- Haptic vibration feedback on successful QR detection.

### E. Participant Detail & Result Sheet
- Status Header: Green "Successfully Updated" banner (update modes) or Blue "Lookup Info" banner (read-only mode).
- Profile Info: Name, Serial, Institution, Event, Allocated Room (e.g. `Textile Workshop Building (টেক্সটাইল ওয়ার্কশপ ভবন)`).
- Status Badges: Kit Status, Attendance Status, Lunch Status.
- Actions: Primary **Rescan** button, **View Admit Card (PDF)** button with direct download to `/Download` directory.

### F. Summary PDF Download & View Screen
- In-app rendering and downloading of **Volunteer Management Summary PDF** and **Participant Management Summary PDF**.

### G. Volunteer Check-in & Management View
- Volunteer search, attendance check-in (`POST /api/admin/volunteers/present`), gift distribution (`POST /api/admin/volunteers/gift`), and lunch service (`POST /api/admin/volunteers/lunch`).

### H. Super Admin User Management View
- For `super_admin` accounts: Manage roles (`admin`, `registration_editor`, `volunteer`) and permissions (`can_manage_volunteers`, `can_manage_registrations`, `can_manage_kit`, `can_manage_presents`, `can_manage_lunch`).

---

## 8. API Integration Specifications

### 1. Admin Login
- **Endpoint**: `POST /api/admin/login`
- **Request Body**:
  ```json
  {
    "email": "01727183143",
    "password": "your_password"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "u-uuid-1234",
      "email": "mdsayedulislam@example.com",
      "phone": "01727183143",
      "name": "Md Sayedul Islam",
      "role": "registration_editor",
      "can_manage_volunteers": false,
      "can_manage_registrations": true,
      "can_manage_kit": true,
      "can_manage_presents": true,
      "can_manage_lunch": true
    },
    "session": {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer",
      "expires_in": 3600
    }
  }
  ```

---

### 2. Fetch Single Registration Details
- **Endpoint**: `GET /api/admin/registrations/single?serial=NMC26-S-MO-086`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "registration": {
      "serial": "NMC26-S-MO-086",
      "full_name": "Md. Kawsar Ahmed",
      "email_address": "kawsar@example.com",
      "phone_number": "01712345678",
      "level": "School level",
      "institution": "Dhaka College",
      "event": "Math Olympiad",
      "is_kit_coollect": true,
      "is_present": true,
      "is_collect_launch": false,
      "allocated_room": "twb",
      "updated_by": "system",
      "updated_at": "2026-07-22T10:00:00.000Z"
    }
  }
  ```

---

### 3. Update Participant Kit Status
- **Endpoint**: `PATCH /api/admin/registrations/kit`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**: `{ "serial": "NMC26-S-MO-086", "is_kit_coollect": true }`

---

### 4. Update Participant Presence / Attendance
- **Endpoint**: `PATCH /api/admin/registrations/present`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**: `{ "serial": "NMC26-S-MO-086", "is_present": true }`

---

### 5. Update Participant Lunch Status
- **Endpoint**: `PATCH /api/admin/registrations/launch`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**: `{ "serial": "NMC26-S-MO-086", "is_collect_launch": true }`

---

### 6. Single Check-in Endpoint (Full Update)
- **Endpoint**: `POST /api/admin/registrations/single`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "serial": "NMC26-S-MO-086",
    "is_present": true,
    "is_kit_coollect": true,
    "is_collect_launch": true
  }
  ```

---

### 7. Fetch Registrations Summary Statistics
- **Endpoint**: `GET /api/admin/registrations/summary`
- **Headers**: `Authorization: Bearer <access_token>`

---

### 8. Volunteer Check-in & Management APIs
- **Fetch Volunteers**: `GET /api/admin/volunteers`
- **Toggle Volunteer Attendance**: `POST /api/admin/volunteers/present` (`{ "unique_id": "...", "is_present": true }`)
- **Toggle Volunteer Gift**: `POST /api/admin/volunteers/gift` (`{ "unique_id": "...", "is_gift_collected": true }`)
- **Toggle Volunteer Lunch**: `POST /api/admin/volunteers/lunch` (`{ "unique_id": "...", "is_lunch_collected": true }`)

---

### 9. Public Room Finder API
- **Endpoint**: `GET /api/registrations/find-room?query=NMC26-X-XX-XXX`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "serial": "NMC26-U-MO-233",
      "name": "Md Sayedul Islam",
      "category": "University level (Math Olympiad)",
      "institution": "DUET",
      "allocated_room": "twb",
      "is_allocated": true,
      "location": {
        "lat": 24.01685993912403,
        "lng": 90.41899431404634,
        "location_name": "Textile Workshop Building (টেক্সটাইল ওয়ার্কশপ ভবন)",
        "venue": "Textile Workshop Building, DUET"
      }
    }
  }
  ```

---

## 9. PDF Summary Viewer Integration

The backend generates and returns a **standard binary PDF stream** instead of HTML. Below are the endpoints, interface setups, and rendering guidelines.

### A. Summary PDF Endpoints
Both endpoints require authorization and return a raw binary PDF buffer (`Content-Type: application/pdf`).

1.  **Participant Summary PDF**
    *   **Method / Route**: `GET /api/admin/registrations/summary-pdf`
    *   **Headers**: `Authorization: Bearer <access_token>`
    *   **Response Content-Type**: `application/pdf`
    *   **Content-Disposition**: `inline; filename="Participant_Summary_Report_2026.pdf"`

2.  **Volunteer Summary PDF**
    *   **Method / Route**: `GET /api/admin/volunteers/summary-pdf`
    *   **Headers**: `Authorization: Bearer <access_token>`
    *   **Response Content-Type**: `application/pdf`
    *   **Content-Disposition**: `inline; filename="Volunteer_Summary_Report_2026.pdf"`

---

### B. Retrofit Client Interface (Kotlin)
Mark the download methods with `@Streaming` to prevent Retrofit from buffering the entire file into memory at once, avoiding `OutOfMemoryError` issues with large files.

```kotlin
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Streaming

interface SummaryApiService {
    @Streaming
    @GET("admin/registrations/summary-pdf")
    suspend fun downloadParticipantSummary(
        @Header("Authorization") token: String
    ): Response<ResponseBody>

    @Streaming
    @GET("admin/volunteers/summary-pdf")
    suspend fun downloadVolunteerSummary(
        @Header("Authorization") token: String
    ): Response<ResponseBody>
}
```

---

### C. Native In-App Rendering inside Jetpack Compose (Recommended)
This approach reads the downloaded PDF file from the device cache/filesystem and draws it onto a Compose `Image` using `PdfRenderer`.

```kotlin
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

@Composable
fun PdfSummaryViewer(pdfFile: File, modifier: Modifier = Modifier) {
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(pdfFile) {
        withContext(Dispatchers.IO) {
            try {
                val fileDescriptor = ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val renderer = PdfRenderer(fileDescriptor)
                
                if (renderer.pageCount > 0) {
                    // Open the first page of the summary document
                    val page = renderer.openPage(0)
                    
                    // Create a high-quality bitmap matching the page dimensions
                    val bmp = Bitmap.createBitmap(page.width, page.height, Bitmap.Config.ARGB_8888)
                    page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    
                    bitmap = bmp
                    page.close()
                }
                renderer.close()
                fileDescriptor.close()
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }

    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        if (isLoading) {
            CircularProgressIndicator()
        } else {
            bitmap?.let { bmp ->
                Image(
                    bitmap = bmp.asImageBitmap(),
                    contentDescription = "PDF Summary Report Page",
                    modifier = Modifier.fillMaxSize()
                )
            } ?: androidx.compose.material3.Text("Failed to render PDF summary.")
        }
    }
}
```

---

### D. Open via External PDF Intent (Alternative)
Retreive the content URI via `FileProvider` and start an external viewing intent:

```kotlin
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

fun openPdfSummaryExternally(context: Context, pdfFile: File) {
    val authority = "${context.packageName}.fileprovider"
    val uri = FileProvider.getUriForFile(context, authority, pdfFile)
    
    val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/pdf")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    
    try {
        context.startActivity(intent)
    } catch (e: ActivityNotFoundException) {
        Toast.makeText(context, "No PDF Viewer installed on this device.", Toast.LENGTH_LONG).show()
    }
}
```

---

## 10. Granular Role Permissions & Kotlin UI Enforcement

### Role Permission Matrix:
- `super_admin` & `admin`: Full access to all operations, user management, and exports.
- `registration_editor`: Implicitly possesses `can_manage_registrations`, `can_manage_kit`, `can_manage_presents`, `can_manage_lunch`.
- `volunteer`: Rights controlled by granular boolean flags:
  - `can_manage_kit`: Enables Kit Collection scan mode & updates.
  - `can_manage_presents`: Enables Attendance presence scan mode & updates.
  - `can_manage_lunch`: Enables Lunch Collection scan mode & updates.
  - `can_manage_volunteers`: Enables Volunteer check-in operations.

### Kotlin Data Model Example:
```kotlin
data class AdminProfile(
    val id: String,
    val email: String,
    val role: String,
    @SerializedName("display_name") val displayName: String?,
    @SerializedName("can_manage_volunteers") val canManageVolunteers: Boolean,
    @SerializedName("can_manage_registrations") val canManageRegistrations: Boolean,
    @SerializedName("can_manage_kit") val canManageKit: Boolean,
    @SerializedName("can_manage_presents") val canManagePresents: Boolean,
    @SerializedName("can_manage_lunch") val canManageLunch: Boolean
)
```

---

## 11. Offline Data Resiliency & Room Cache

- **Room SQLite Schema**: Mirrors `processed_registrations` and `volunteers` tables. Encrypted via **SQLCipher**.
- **Offline Queue**: `offline_patches_queue` table stores pending PATCH payloads when network connection is lost.
- **WorkManager**: Background synchronization job triggers when connectivity returns (`NetworkType.CONNECTED`).

---

## 12. Security Hardening & Biometrics

1. **Biometric Authorization**: `BiometricPrompt` required on cold start and background resume when enabled.
2. **Local Encryption**: All session JWT tokens stored in `EncryptedSharedPreferences`.
3. **SSL Pinning**: OkHttp CertificatePinner pins `nmcbd.app` TLS certificates.

---

## 13. Android Manifest Permissions & Requirements

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```

- **Minimum SDK**: Android 8.0 (API Level 26 - Oreo).
- **Target SDK**: Android 14 (API Level 34).


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
