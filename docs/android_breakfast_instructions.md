# Android App Integration Guide — Breakfast Support

This document details the modifications required in the **NMC 2026 Admin Android Application** (written in Kotlin with Jetpack Compose) to support the new breakfast tracking feature.

---

## 1. Update Data Models

### A. Admin / Volunteer Permissions (`UserProfile.kt`)
Add the `can_manage_breakfast` permission flag to your user profile / session models.

```kotlin
data class UserProfile(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("display_name") val displayName: String?,
    @SerializedName("role") val role: String,
    @SerializedName("can_manage_volunteers") val canManageVolunteers: Boolean,
    @SerializedName("can_manage_registrations") val canManageRegistrations: Boolean,
    @SerializedName("can_manage_kit") val canManageKit: Boolean,
    @SerializedName("can_manage_presents") val canManagePresents: Boolean,
    @SerializedName("can_manage_lunch") val canManageLunch: Boolean,
    @SerializedName("can_manage_breakfast") val canManageBreakfast: Boolean // Add this line
)
```

### B. Participant Registration Record (`Participant.kt`)
Add the `is_collect_breakfast` collection state field to the participant data model.

```kotlin
data class Participant(
    @SerializedName("serial") val serial: String,
    @SerializedName("full_name") val fullName: String?,
    @SerializedName("institution") val institution: String?,
    @SerializedName("is_kit_coollect") val isKitCollected: Boolean,
    @SerializedName("is_present") val isPresent: Boolean,
    @SerializedName("is_collect_launch") val isLunchCollected: Boolean,
    @SerializedName("is_collect_breakfast") val isBreakfastCollected: Boolean, // Add this line
    @SerializedName("allocated_room") val allocatedRoom: String?
)
```

---

## 2. Update API Services (`ApiService.kt`)

Declare the breakfast check-in endpoint: `PATCH /api/admin/registrations/breakfast`.

```kotlin
interface ApiService {
    // Participant Breakfast Check-In
    @PATCH("/api/admin/registrations/breakfast")
    suspend fun updateBreakfastStatus(
        @Body request: BreakfastStatusRequest
    ): Response<StatusUpdateResponse>
}

data class BreakfastStatusRequest(
    @SerializedName("serial") val serial: String,
    @SerializedName("is_collect_breakfast") val isCollectBreakfast: Boolean
)
```

---

## 3. UI & Mode Enforcements

### A. Dashboard Metrics View
Include a stats row or donut indicator for Breakfast distribution in the Home dashboard.

```kotlin
// E.g., inside Dashboard screen Compose file
Row(modifier = Modifier.fillMaxWidth()) {
    StatWidget(
        label = "Lunch", 
        value = "${summary.lunchServed}/${summary.total}", 
        color = Color(0xFFFFC107)
    )
    Spacer(modifier = Modifier.width(8.dp))
    StatWidget(
        label = "Breakfast", 
        value = "${summary.breakfastServed}/${summary.total}", 
        color = Color(0xFF17A2B8) // New Teal Stat Widget
    )
}
```

### B. Settings View (Permission Enforcement)
Update settings checks so that volunteers can only select **Breakfast Mode** if they have the proper permissions.

```kotlin
// E.g., Mode Toggle list in Compose Screen
val isBreakfastEnabled = profile.role in listOf("super_admin", "admin", "registration_editor") || profile.canManageBreakfast

ModeToggleButton(
    label = "Breakfast Collection Mode",
    isEnabled = isBreakfastEnabled,
    isSelected = activeMode == ScanMode.BREAKFAST,
    onClick = { activeMode = ScanMode.BREAKFAST }
)
```

### C. Details View (Status Badges)
Add a visual status badge to show whether breakfast was served to a scanned user.

```kotlin
// Status panel inside ParticipantDetailScreen.kt
StatusBadge(
    label = "Breakfast Status",
    isCollected = participant.isBreakfastCollected,
    activeColor = Color(0xFF17A2B8), // Teal
    inactiveColor = Color(0xFF6C757D) // Grey
)
```
