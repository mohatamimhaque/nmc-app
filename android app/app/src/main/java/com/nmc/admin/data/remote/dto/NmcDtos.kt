package com.nmc.admin.data.remote.dto

import com.google.gson.annotations.SerializedName

// Endpoint 0: Login
data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class LoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("session") val session: Session?,
    @SerializedName("user") val user: User?,
    @SerializedName("error") val error: String?
)

data class Session(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("refresh_token") val refreshToken: String,
    @SerializedName("expires_at") val expiresAt: Long,
    @SerializedName("expires_in") val expiresIn: Long
)

data class User(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("display_name") val displayName: String,
    @SerializedName("role") val role: String
)

// Registration DTO
data class RegistrationDto(
    @SerializedName("serial") val serial: String,
    @SerializedName("full_name") val fullName: String?,
    @SerializedName("email_address") val emailAddress: String?,
    @SerializedName("phone_number") val phoneNumber: String?,
    @SerializedName("gender") val gender: String?,
    @SerializedName("t_shirt_size") val tShirtSize: String?,
    @SerializedName("level") val level: String?,
    @SerializedName("institution") val institution: String?,
    @SerializedName("class_year_student_of") val classYearStudentOf: String?,
    @SerializedName("event") val event: String?,
    @SerializedName("payment_method") val paymentMethod: String?,
    @SerializedName("payment_number") val paymentNumber: String?,
    @SerializedName("transaction_id") val transactionId: String?,
    @SerializedName("is_kit_coollect") val isKitCollected: Boolean,
    @SerializedName("is_present") val isPresent: Boolean,
    @SerializedName("is_collect_launch") val isCollectLaunch: Boolean,
    @SerializedName("is_collect_breakfast") val isBreakfastCollected: Boolean = false,
    @SerializedName("allocated_room") val allocatedRoom: String?,
    @SerializedName("updated_by") val updatedBy: String?,
    @SerializedName("updated_at") val updatedAt: String?,
    @SerializedName("created_at") val createdAt: String?,
    @SerializedName("admit_card_url") val admitCardUrl: String?
)

// Status Update Requests
data class KitUpdateRequest(
    @SerializedName("serial") val serial: String,
    @SerializedName("is_kit_coollect") val isKitCollected: Boolean
)

data class AttendanceUpdateRequest(
    @SerializedName("serial") val serial: String,
    @SerializedName("is_present") val isPresent: Boolean
)

data class LaunchUpdateRequest(
    @SerializedName("serial") val serial: String,
    @SerializedName("is_collect_launch") val isCollectLaunch: Boolean
)

data class UpdateStatusResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("updated") val updated: Boolean,
    @SerializedName("serial") val serial: String,
    @SerializedName("updatedBy") val updatedBy: String?,
    @SerializedName("updatedAt") val updatedAt: String?,
    @SerializedName("error") val error: String?
)

// Endpoint 5: Summary
data class SummaryResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("total") val total: Int,
    @SerializedName("kit_collection") val kitCollection: StatCollectedPending,
    @SerializedName("attendance") val attendance: StatPresentAbsent,
    @SerializedName("launch_status") val launchStatus: StatServedPending,
    @SerializedName("by_level") val byLevel: Map<String, Int>,
    @SerializedName("by_event") val byEvent: Map<String, Int>
)

data class StatCollectedPending(
    @SerializedName("collected") val collected: Int,
    @SerializedName("pending") val pending: Int
)

data class StatPresentAbsent(
    @SerializedName("present") val present: Int,
    @SerializedName("absent") val absent: Int
)

data class StatServedPending(
    @SerializedName("served") val served: Int,
    @SerializedName("pending") val pending: Int
)

// Endpoint 6: Single
data class SingleRegistrationResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("registration") val registration: RegistrationDto?,
    @SerializedName("error") val error: String?
)

// ================= VOLUNTEER DTOS =================

data class VolunteerDto(
    @SerializedName("unique_id") val uniqueId: String,
    @SerializedName("serial_no") val serialNo: String?,
    @SerializedName("name") val name: String?,
    @SerializedName("email") val email: String?,
    @SerializedName("role") val role: String? = null,
    @SerializedName("can_manage_volunteers") val canManageVolunteers: Boolean = false,
    @SerializedName("can_manage_registrations") val canManageRegistrations: Boolean = false,
    @SerializedName("can_manage_kit") val canManageKit: Boolean = false,
    @SerializedName("can_manage_presents") val canManagePresents: Boolean = false,
    @SerializedName("can_manage_lunch") val canManageLunch: Boolean = false,
    @SerializedName("number") val number: String?,
    @SerializedName("image_url") val imageUrl: String?,
    @SerializedName("segment") val segment: String?,
    @SerializedName("department") val department: String?,
    @SerializedName("student_id") val studentId: String?,
    @SerializedName("year") val year: String?,
    @SerializedName("t_shirt_size") val tShirtSize: String?,
    @SerializedName("is_present") val isPresent: Boolean,
    @SerializedName("is_gift_collected") val isGiftCollected: Boolean,
    @SerializedName("is_lunch_collected") val isLunchCollected: Boolean,
    @SerializedName("created_at") val createdAt: String?,
    @SerializedName("updated_at") val updatedAt: String?,
    @SerializedName("updated_by") val updatedBy: String?
)

data class VolunteerPresentRequest(
    @SerializedName("unique_id") val uniqueId: String,
    @SerializedName("is_present") val isPresent: Boolean
)

data class VolunteerGiftRequest(
    @SerializedName("unique_id") val uniqueId: String,
    @SerializedName("is_gift_collected") val isGiftCollected: Boolean
)

data class VolunteerLunchRequest(
    @SerializedName("unique_id") val uniqueId: String,
    @SerializedName("is_lunch_collected") val isLunchCollected: Boolean
)

data class VolunteerUpdateResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("updated") val updated: Boolean,
    @SerializedName("unique_id") val uniqueId: String,
    @SerializedName("updatedBy") val updatedBy: String?,
    @SerializedName("updatedAt") val updatedAt: String?,
    @SerializedName("error") val error: String?
)

data class SingleVolunteerResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("volunteer") val volunteer: VolunteerDto?,
    @SerializedName("error") val error: String?
)

data class VolunteerSummaryResponse(
    @SerializedName("success") val success: Boolean = true,
    @SerializedName("total") val total: Int,
    @SerializedName("gift_collection") val giftCollection: StatCollectedPending,
    @SerializedName("attendance") val attendance: StatPresentAbsent,
    @SerializedName("lunch_status") val lunchStatus: StatServedPending,
    @SerializedName("by_segment") val bySegment: Map<String, Int>,
    @SerializedName("by_department") val byDepartment: Map<String, Int>
)

data class ProfileResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("profile") val profile: UserProfileDto?
)

data class UserProfileDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("display_name") val displayName: String?,
    @SerializedName("role") val role: String,
    @SerializedName("can_manage_volunteers") val canManageVolunteers: Boolean,
    @SerializedName("can_manage_registrations") val canManageRegistrations: Boolean,
    @SerializedName("can_manage_kit") val canManageKit: Boolean,
    @SerializedName("can_manage_presents") val canManagePresents: Boolean,
    @SerializedName("can_manage_lunch") val canManageLunch: Boolean,
    @SerializedName("can_manage_breakfast") val canManageBreakfast: Boolean = false
)

data class AdminUserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("display_name") val displayName: String?,
    @SerializedName("role") val role: String,
    @SerializedName("can_manage_volunteers") val canManageVolunteers: Boolean,
    @SerializedName("can_manage_registrations") val canManageRegistrations: Boolean,
    @SerializedName("can_manage_kit") val canManageKit: Boolean,
    @SerializedName("can_manage_presents") val canManagePresents: Boolean,
    @SerializedName("can_manage_lunch") val canManageLunch: Boolean,
    @SerializedName("can_manage_breakfast") val canManageBreakfast: Boolean = false,
    @SerializedName("created_at") val createdAt: String?
)

data class AdminUsersResponse(
    @SerializedName("data") val data: List<AdminUserDto>
)

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

data class UpdateAdminUserResponse(
    @SerializedName("data") val data: AdminUserDto?,
    @SerializedName("error") val error: String?
)

data class ParticipantSingleUpdateRequest(
    @SerializedName("serial") val serial: String,
    @SerializedName("is_present") val isPresent: Boolean,
    @SerializedName("is_kit_coollect") val isKitCollected: Boolean,
    @SerializedName("is_collect_launch") val isCollectLaunch: Boolean
)

data class FindRoomResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("data") val data: RoomAllocationDto?
)

data class RoomAllocationDto(
    @SerializedName("serial") val serial: String,
    @SerializedName("name") val name: String,
    @SerializedName("category") val category: String,
    @SerializedName("institution") val institution: String?,
    @SerializedName("allocated_room") val allocatedRoom: String?,
    @SerializedName("is_allocated") val isAllocated: Boolean,
    @SerializedName("location") val location: RoomLocationDto?
)

data class RoomLocationDto(
    @SerializedName("lat") val lat: Double,
    @SerializedName("lng") val lng: Double,
    @SerializedName("location_name") val locationName: String?,
    @SerializedName("venue") val venue: String?
)

data class BreakfastStatusRequest(
    @SerializedName("serial") val serial: String,
    @SerializedName("is_collect_breakfast") val isCollectBreakfast: Boolean
)


