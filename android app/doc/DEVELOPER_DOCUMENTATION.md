# NMC 2026 Admin Application - Developer Documentation

This document describes the technical architecture, database schemas, networking, security policies, and build configurations of the NMC 2026 Android Admin Application.

---

## 1. Project Architecture

The application is built using modern Android development (MAD) guidelines:
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose (Declarative UI)
- **Architecture Pattern**: MVVM (Model-View-ViewModel)
- **Dependency Injection**: Dagger Hilt
- **Local Persistence**: Room Database encrypted via SQLCipher
- **Networking**: Retrofit 2 + OkHttp 3 (with Gson serialization converters)

### Package Structure
- `com.nmc.admin.data.local`: Room entities, DAOs, encrypted shared preferences, and encrypted database helpers.
- `com.nmc.admin.data.remote`: Retrofit API services, DTO data models, and HTTP interceptors.
- `com.nmc.admin.data.repository`: Repositories bridging remote network requests and local Room databases.
- `com.nmc.admin.di`: Hilt dependency inject modules (Network, Database modules).
- `com.nmc.admin.ui.navigation`: Composable NavHost configurations and Screen route definitions.
- `com.nmc.admin.ui.screens`: Feature screens (Splash, Login, Choose target, Dashboard, Search, Scanner, Detail, Settings, Profile, User Management).

---

## 2. Local Database Schema & Security

The local SQLite database is encrypted on-disk using **SQLCipher** for database security.
- **DAO Interfaces**:
  - `RegistrationDao`: Manages participant registration check-in caching and statistics counts.
  - `VolunteerDao`: Manages volunteer check-in caching, segment counts, and presence tracking.
- **Entities**:
  - `CachedRegistration`: Maps local participant registration entries.
  - `CachedVolunteer`: Maps local volunteer details.

---

## 3. Authentication & API Client Configuration

### Network Interceptors (`NetworkModule.kt`)
1. **AuthInterceptor**: Automatically appends the Supabase JWT bearer token to the `Authorization` header on all outbound requests, excluding `admin/login`.
   ```kotlin
   requestBuilder.header("Authorization", "Bearer $token")
   ```
2. **ErrorInterceptor (reverts & session checks)**:
   - **401 Unauthorized**: Intercepts token expiry responses, automatically clears local cached preferences (tokens/roles), and routes the navigation back to the login screen.
   - **403 Forbidden**: Intercepts authorization failures. Prevents local database check-in caching from committing permanently when the server rejects a status update, reverting changes and notifying the user.

---

## 4. Role & Permissions System

Permissions are updated dynamically from the profile API (`GET admin/profile`) and stored locally in encrypted preferences.
- **Available Roles**: `super_admin`, `admin`, `registration_editor`, `volunteer`.
- **Permission Fields**:
  - `can_manage_volunteers` (Boolean)
  - `can_manage_registrations` (Boolean)
  - `can_manage_kit` (Boolean)
  - `can_manage_presents` (Boolean)
  - `can_manage_lunch` (Boolean)
  - `can_manage_breakfast` (Boolean)

### Security Enforcement Checks:
1. **Scanner Authorization (`ScannerScreen.kt`)**: 
   Validates active scanner mode check-ins inside `processScannedSerial`:
   - Mode `kit` requires `can_manage_kit || isSuperOrAdmin || isEditor`.
   - Mode `present` requires `can_manage_presents || isSuperOrAdmin || isEditor`.
   - Mode `lunch` requires `can_manage_lunch || isSuperOrAdmin || isEditor`.
   - Mode `breakfast` requires `can_manage_breakfast || isSuperOrAdmin || isEditor`.
2. **Details Page Manual Overrides (`DetailScreen.kt`)**:
   Manual status check-in toggle switches on the participant/volunteer details screen are restricted strictly to **Admins and Superadmins** (`isSuperOrAdmin`). Volunteers/editors are blocked from manually modifying check-in states here.
3. **Unique ID Visibility Masking**:
   - Volunteers and editors in search listings can only view the public `serial_no` of other volunteers.
   - Only `super_admin`, `admin`, or `superadmin` roles are allowed to view both `unique_id` and `serial_no` fields in volunteer listings.

---

## 5. Super Admin User Management Integration

The permissions management view (`UserManagementScreen.kt`) allows editing user attributes:
- **GET Endpoint Wrapper**: Handles `{ "data": [ ... ] }` structure via `AdminUsersResponse` parsing wrapper class.
- **PATCH Endpoint Payload (`UpdateAdminUserRequest`)**:
  Updates permissions on the registry table by mapping the Supabase Auth user ID (UUID `id`) rather than the volunteer serial code:
  ```kotlin
  data class UpdateAdminUserRequest(
      @SerializedName("id") val id: String,
      @SerializedName("role") val role: String,
      @SerializedName("display_name") val displayName: String?,
      @SerializedName("can_manage_volunteers") val canManageVolunteers: Boolean,
      @SerializedName("can_manage_registrations") val canManageRegistrations: Boolean,
      @SerializedName("can_manage_kit") val canManageKit: Boolean,
      @SerializedName("can_manage_presents") val canManagePresents: Boolean,
      @SerializedName("can_manage_lunch") val canManageLunch: Boolean,
      @SerializedName("can_manage_breakfast") val canManageBreakfast: Boolean
  )
  ```

---

## 6. Back Button Stack Management

To prevent empty compose navigation stack releases which show blank views:
- **Dashboard Screen & Chooser Screen**: Added `BackHandler` interceptors. If a back press occurs, it checks if the side menu drawer is open to close it; otherwise, it closes the activity cleanly using `(context as? Activity)?.finish()` to exit the app.

---

## 7. Build and ProGuard Configurations

For publishing the app on Google Play Store, ProGuard is configured to obfuscate code safely without breaking serializations:
- **Minification Enabled**: `isMinifyEnabled = true` in `app/build.gradle.kts` release build type.
- **Obfuscation Rules (`proguard-rules.pro`)**:
  - `-keep class com.nmc.admin.data.remote.dto.** { *; }`: Prevents Gson JSON parsing conversion failures.
  - `-keep class net.sqlcipher.** { *; }`: Prevents DB encryption crashes in production.
  - `-keep class androidx.room.RoomDatabase { *; }`: Protects Room caching classes.
  - `-keep class retrofit2.** { *; }`: Maintains network annotation hooks.
  - `-keep class com.google.mlkit.** { *; }`: Protects barcode extraction logic.


<p align="center">
  Developed by <b>Mohatamim Haque</b> <br/>
  <a href="https://wa.me/8801518749114" target="_blank"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp"/></a>
  <a href="mailto:mohatamimhaque7@gmail.com" target="_blank"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="mailto:mohatamimhaque@outlook.com" target="_blank"><img src="https://img.shields.io/badge/Outlook-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white" alt="Outlook"/></a>
  <a href="https://facebook.com/mohatamim44" target="_blank"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook"/></a>
  <a href="https://linkedin.com/in/mohatamim" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mohatamimhaque" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
</p>
