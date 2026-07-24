package com.nmc.admin.data.remote

import com.nmc.admin.data.remote.dto.*
import retrofit2.http.*

interface NmcApiService {

    @POST("admin/login")
    suspend fun login(
        @Body request: LoginRequest
    ): LoginResponse

    @GET("admin/registrations")
    suspend fun getRegistrations(): List<RegistrationDto>

    @PATCH("admin/registrations/kit")
    suspend fun updateKit(
        @Body request: KitUpdateRequest
    ): UpdateStatusResponse

    @PATCH("admin/registrations/present")
    suspend fun updateAttendance(
        @Body request: AttendanceUpdateRequest
    ): UpdateStatusResponse

    @PATCH("admin/registrations/launch")
    suspend fun updateLaunch(
        @Body request: LaunchUpdateRequest
    ): UpdateStatusResponse

    @PATCH("admin/registrations/breakfast")
    suspend fun updateBreakfast(
        @Body request: BreakfastStatusRequest
    ): UpdateStatusResponse

    @GET("admin/registrations/summary")
    suspend fun getSummary(): SummaryResponse

    @GET("admin/registrations/single")
    suspend fun getSingleRegistration(
        @Query("serial") serial: String
    ): SingleRegistrationResponse

    @GET("admin/profile")
    suspend fun getProfile(): ProfileResponse

    @GET("admin/volunteers")
    suspend fun getVolunteers(): List<VolunteerDto>

    @GET("admin/volunteers/single")
    suspend fun getSingleVolunteer(
        @Query("unique_id") uniqueId: String
    ): SingleVolunteerResponse

    @POST("admin/volunteers/present")
    suspend fun updateVolunteerAttendance(
        @Body request: VolunteerPresentRequest
    ): VolunteerUpdateResponse

    @POST("admin/volunteers/gift")
    suspend fun updateVolunteerGift(
        @Body request: VolunteerGiftRequest
    ): VolunteerUpdateResponse

    @POST("admin/volunteers/lunch")
    suspend fun updateVolunteerLunch(
        @Body request: VolunteerLunchRequest
    ): VolunteerUpdateResponse

    @POST("admin/registrations/single")
    suspend fun updateParticipantStatusSingle(
        @Body request: ParticipantSingleUpdateRequest
    ): UpdateStatusResponse

    @GET("registrations/find-room")
    suspend fun findRoom(
        @Query("query") query: String
    ): FindRoomResponse

    @GET("admin/volunteers/summary")
    suspend fun getVolunteerSummary(): VolunteerSummaryResponse

    @GET("admin/admin-users")
    suspend fun getAdminUsers(): AdminUsersResponse

    @PATCH("admin/admin-users")
    suspend fun updateAdminUser(
        @Body request: UpdateAdminUserRequest
    ): UpdateAdminUserResponse
}
