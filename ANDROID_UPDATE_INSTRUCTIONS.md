# Android App Update Instructions for Custom Role Permissions

The backend and database have been updated to support custom, granular role permissions for administrators and volunteers. Follow these instructions to integrate the new permissions into the **NMC 2026 Admin Android Application** (Kotlin / Jetpack Compose).

---

## 1. Updated API Response Schema

The endpoints `POST /api/admin/login` and `GET /api/admin/profile` now return the new permission columns in the user profile payload:

- `can_manage_kit` (Boolean): Authorizes participant kit status updates.
- `can_manage_presents` (Boolean): Authorizes participant/volunteer presence & gift status updates.
- `can_manage_lunch` (Boolean): Authorizes participant/volunteer lunch status updates.

### Updated Profile Data Model Example:
```json
{
  "success": true,
  "profile": {
    "id": "u-uuid-5678",
    "email": "volunteer@example.com",
    "display_name": "Asif Iqbal",
    "role": "volunteer",
    "can_manage_volunteers": false,
    "can_manage_registrations": false,
    "can_manage_kit": true,
    "can_manage_presents": false,
    "can_manage_lunch": true,
    "created_at": "2026-07-16T15:00:00.000Z"
  }
}
```

---

## 2. Updates Required in Kotlin Codebase

### A. Update Data Models
Modify your profile details Kotlin data class (typically in your `network/models` directory) to parse the three new permission columns from the API responses:

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
    @SerializedName("can_manage_lunch") val canManageLunch: Boolean,
    @SerializedName("created_at") val createdAt: String
)
```

Ensure these flags are saved inside the encrypted session caching mechanism (`EncryptedSharedPreferences`) upon login or profile refresh.

---

### B. Settings View (Active Scan Mode Selector)
Update the configuration logic on the **Settings View** to respect the granular permission flags:

1.  **Kit Collections Option**:
    -   Disable/grey out the "Kit Collections" radio button if `profile.canManageKit == false`.
    -   Show a lock icon next to the option if disabled.
2.  **Presents Option**:
    -   Disable/grey out the "Presents" radio button if `profile.canManagePresents == false`.
    -   Show a lock icon next to the option if disabled.
3.  **Launch Collect Option**:
    -   Disable/grey out the "Launch Collect" radio button if `profile.canManageLunch == false`.
    -   Show a lock icon next to the option if disabled.

> [!TIP]
> If the active selection is forced to a disabled option during app startup (e.g. from previously saved preferences), reset the local app scan mode to **Show Info (Read-Only Lookup)** to prevent unintended forbidden requests.

---

### C. Handle Scanner Authorization Errors (403 Forbidden)
When scanning barcode/QR tickets:
1.  If the app executes status updates (e.g., `PATCH /api/admin/registrations/kit`, `/present`, or `/launch`) and receives a `403 Forbidden` response:
    -   Intercept the error.
    -   Display a clear warning overlay or Toast: **"Access Denied: You do not have permissions to perform this update."**
    -   Prevent any visual status changes on the details sheet.
2.  If the app receives a `401 Unauthorized` response, wipe all local session credentials and route back to the Login screen.

---

### D. Volunteer Detail Lookup & Updates View
If the logged-in user wants to view or update volunteer details on-ground:
1.  **Reading Volunteer Data**:
    -   Accessing volunteer lists or scanning a volunteer QR code (`GET /api/admin/volunteers`) is permitted if the logged-in user has **any** of the following flags: `canManageVolunteers`, `canManageKit`, `canManagePresents`, or `canManageLunch`.
2.  **Updating Volunteer Details**:
    -   To check-in a volunteer (marking presence) or collect their gifts (`PATCH /api/admin/volunteers/present`, `PATCH /api/admin/volunteers/gift`):
        -   The backend requires **both** `can_manage_volunteers` **and** `can_manage_presents` permissions.
        -   Disable the update checkbox/button on the UI unless **both** flags are true.
    -   To serve a volunteer lunch (`PATCH /api/admin/volunteers/lunch`):
        -   The backend requires **both** `can_manage_volunteers` **and** `can_manage_lunch` permissions.
        -   Disable the update checkbox/button on the UI unless **both** flags are true.

---

### E. Super Admin User Management View
Users with `role == "super_admin"` can manage and assign these permissions directly from the Android app using the Admin Management APIs:

1.  **Retrieve Admin Users List**:
    -   Fetch the list using: `GET /api/admin/admin-users`.
    -   Display the users with their display names, emails, roles, and status indicators.
2.  **Modify Role & Permissions**:
    -   Provide checkbox/toggle switches in the UI for the following options:
        -   *Can Manage Volunteers* (`can_manage_volunteers`)
        -   *Can Manage Kit Collection* (`can_manage_kit`)
        -   *Can Manage Presents/Attendance* (`can_manage_presents`)
        -   *Can Manage Lunch/Launch* (`can_manage_lunch`)
    -   **Important Layout Rule**:
        -   For accounts with the `registration_editor` role, the **Kit Collection**, **Presents**, and **Lunch** toggle switches must be shown as Checked and Disabled (read-only), since they have these permissions implicitly.
    -   Save edits by making a network request to: `PATCH /api/admin/admin-users` with the body containing the updated permission states:
        ```json
        {
          "id": "target-user-uuid",
          "role": "volunteer",
          "can_manage_volunteers": true,
          "can_manage_kit": false,
          "can_manage_presents": true,
          "can_manage_lunch": false
        }
        ```

