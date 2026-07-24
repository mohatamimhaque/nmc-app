package com.nmc.admin.data.repository

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.data.local.dao.OfflinePatchDao
import com.nmc.admin.data.local.dao.VolunteerDao
import com.nmc.admin.data.local.entities.CachedVolunteer
import com.nmc.admin.data.local.entities.OfflinePatch
import com.nmc.admin.data.remote.NmcApiService
import com.nmc.admin.data.remote.dto.*
import com.nmc.admin.logging.AuditLogger
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VolunteerRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: NmcApiService,
    private val volunteerDao: VolunteerDao,
    private val offlinePatchDao: OfflinePatchDao,
    private val encryptedPrefs: EncryptedPrefs,
    private val auditLogger: AuditLogger,
    private val settingsDataStore: SettingsDataStore
) {

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun getIsoTimestamp(): String {
        val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
        df.timeZone = TimeZone.getTimeZone("UTC")
        return df.format(Date())
    }

    suspend fun syncVolunteers(): Result<Unit> = withContext(Dispatchers.IO) {
        if (!isNetworkAvailable()) {
            return@withContext Result.failure(IOException("No network connectivity."))
        }
        try {
            val volunteers = apiService.getVolunteers()
            val entities = volunteers.map { it.toEntity() }
            volunteerDao.clearAndInsertAll(entities)
            auditLogger.log("SYNC_QUEUE", "Synced ${entities.size} volunteers from server.")
            Result.success(Unit)
        } catch (e: Exception) {
            auditLogger.log("SYNC_QUEUE", "Failed syncing volunteers: ${e.message}")
            Result.failure(e)
        }
    }

    suspend fun getVolunteerSummary(): Result<VolunteerSummaryResponse> = withContext(Dispatchers.IO) {
        if (isNetworkAvailable()) {
            try {
                val summary = apiService.getVolunteerSummary()
                Result.success(summary)
            } catch (e: Exception) {
                getOfflineSummary()
            }
        } else {
            getOfflineSummary()
        }
    }

    private suspend fun getOfflineSummary(): Result<VolunteerSummaryResponse> {
        return try {
            val all = volunteerDao.getAll()
            val total = all.size
            val presentCount = all.count { it.isPresent }
            val absentCount = total - presentCount
            val giftCollectedCount = all.count { it.isGiftCollected }
            val giftPendingCount = total - giftCollectedCount
            val lunchCollectedCount = all.count { it.isLunchCollected }
            val lunchPendingCount = total - lunchCollectedCount

            val bySegment = all.groupBy { it.segment ?: "Unknown" }.mapValues { it.value.size }
            val byDepartment = all.groupBy { it.department ?: "Unknown" }.mapValues { it.value.size }

            val summary = VolunteerSummaryResponse(
                success = true,
                total = total,
                giftCollection = StatCollectedPending(giftCollectedCount, giftPendingCount),
                attendance = StatPresentAbsent(presentCount, absentCount),
                lunchStatus = StatServedPending(lunchCollectedCount, lunchPendingCount),
                bySegment = bySegment,
                byDepartment = byDepartment
            )
            Result.success(summary)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSingleVolunteer(uniqueId: String): Result<VolunteerDto> = withContext(Dispatchers.IO) {
        if (isNetworkAvailable()) {
            try {
                val response = apiService.getSingleVolunteer(uniqueId)
                if (response.success && response.volunteer != null) {
                    volunteerDao.insertOrReplace(response.volunteer.toEntity())
                    Result.success(response.volunteer)
                } else {
                    Result.failure(Exception(response.error ?: "Volunteer not found."))
                }
            } catch (e: Exception) {
                getCachedVolunteer(uniqueId)
            }
        } else {
            getCachedVolunteer(uniqueId)
        }
    }

    private suspend fun getCachedVolunteer(uniqueId: String): Result<VolunteerDto> {
        val cached = volunteerDao.getById(uniqueId)
        return if (cached != null) {
            Result.success(cached.toDto())
        } else {
            Result.failure(Exception("Volunteer $uniqueId not found in local cache (Offline)."))
        }
    }

    suspend fun updateStatus(uniqueId: String, actionType: String, value: Boolean): Result<VolunteerUpdateResponse> = withContext(Dispatchers.IO) {
        val adminEmail = encryptedPrefs.getAdminEmail() ?: "unknown"
        val timestamp = getIsoTimestamp()

        // Update local database first
        when (actionType) {
            "present" -> volunteerDao.updateAttendanceStatus(uniqueId, value, adminEmail, timestamp)
            "gift" -> volunteerDao.updateGiftStatus(uniqueId, value, adminEmail, timestamp)
            "lunch" -> volunteerDao.updateLunchStatus(uniqueId, value, adminEmail, timestamp)
        }

        auditLogger.log("MANUAL_OVERRIDE", "Volunteer override action: $actionType, id: $uniqueId, value: $value, admin: $adminEmail")

        if (isNetworkAvailable()) {
            try {
                val response = when (actionType) {
                    "present" -> apiService.updateVolunteerAttendance(VolunteerPresentRequest(uniqueId, value))
                    "gift" -> apiService.updateVolunteerGift(VolunteerGiftRequest(uniqueId, value))
                    "lunch" -> apiService.updateVolunteerLunch(VolunteerLunchRequest(uniqueId, value))
                    else -> throw Exception("Invalid update action type.")
                }
                if (response.success) {
                    Result.success(response)
                } else {
                    val patch = OfflinePatch(serial = uniqueId, actionType = "v_$actionType", value = value, timestamp = timestamp)
                    offlinePatchDao.insert(patch)
                    Result.success(VolunteerUpdateResponse(success = true, updated = false, uniqueId = uniqueId, updatedBy = adminEmail, updatedAt = timestamp, error = response.error))
                }
            } catch (e: Exception) {
                val patch = OfflinePatch(serial = uniqueId, actionType = "v_$actionType", value = value, timestamp = timestamp)
                offlinePatchDao.insert(patch)
                Result.success(VolunteerUpdateResponse(success = true, updated = false, uniqueId = uniqueId, updatedBy = adminEmail, updatedAt = timestamp, error = "Offline - Update queued locally"))
            }
        } else {
            val patch = OfflinePatch(serial = uniqueId, actionType = "v_$actionType", value = value, timestamp = timestamp)
            offlinePatchDao.insert(patch)
            Result.success(VolunteerUpdateResponse(success = true, updated = false, uniqueId = uniqueId, updatedBy = adminEmail, updatedAt = timestamp, error = "Offline - Update queued locally"))
        }
    }

    suspend fun searchVolunteersPaged(
        segment: String,
        department: String,
        query: String,
        limit: Int,
        offset: Int
    ): List<CachedVolunteer> = withContext(Dispatchers.IO) {
        volunteerDao.searchPaged(segment, department, query, limit, offset)
    }

    suspend fun getSearchCount(
        segment: String,
        department: String,
        query: String
    ): Int = withContext(Dispatchers.IO) {
        volunteerDao.searchCount(segment, department, query)
    }

    fun observeVolunteer(uniqueId: String): Flow<CachedVolunteer?> {
        return volunteerDao.getByIdFlow(uniqueId)
    }

    fun observeVolunteerByEmail(email: String): Flow<CachedVolunteer?> {
        val localPart = email.substringBefore("@")
        val cleanPhone = if (localPart.all { it.isDigit() } && localPart.length >= 10) {
            localPart.takeLast(10)
        } else {
            ""
        }
        return volunteerDao.getByEmailOrPhoneFlow(email, cleanPhone)
    }

    fun observeTotalCount(): Flow<Int> = volunteerDao.getTotalCountFlow()

    fun observeAllVolunteers(): Flow<List<CachedVolunteer>> {
        return volunteerDao.getAllFlow()
    }
    fun observePresentCount(): Flow<Int> = volunteerDao.getPresentCountFlow()
    fun observeGiftCollectedCount(): Flow<Int> = volunteerDao.getGiftCollectedCountFlow()
    fun observeLunchServedCount(): Flow<Int> = volunteerDao.getLunchServedCountFlow()
    fun observeSegmentCount(segment: String): Flow<Int> = volunteerDao.getSegmentCountFlow(segment)
    fun observeDepartmentCount(department: String): Flow<Int> = volunteerDao.getDepartmentCountFlow(department)

    private fun VolunteerDto.toEntity() = CachedVolunteer(
        uniqueId = uniqueId,
        serialNo = serialNo,
        name = name,
        email = email,
        number = number,
        imageUrl = imageUrl,
        segment = segment,
        department = department,
        studentId = studentId,
        year = year,
        tShirtSize = tShirtSize,
        isPresent = isPresent,
        isGiftCollected = isGiftCollected,
        isLunchCollected = isLunchCollected,
        createdAt = createdAt,
        updatedAt = updatedAt,
        updatedBy = updatedBy
    )

    private fun CachedVolunteer.toDto() = VolunteerDto(
        uniqueId = uniqueId,
        serialNo = serialNo,
        name = name,
        email = email,
        role = null,
        canManageVolunteers = false,
        canManageRegistrations = false,
        canManageKit = false,
        canManagePresents = false,
        canManageLunch = false,
        number = number,
        imageUrl = imageUrl,
        segment = segment,
        department = department,
        studentId = studentId,
        year = year,
        tShirtSize = tShirtSize,
        isPresent = isPresent,
        isGiftCollected = isGiftCollected,
        isLunchCollected = isLunchCollected,
        createdAt = createdAt,
        updatedAt = updatedAt,
        updatedBy = updatedBy
    )

    suspend fun getFilteredPaged(filterType: String, filterValue: String, limit: Int, offset: Int): List<CachedVolunteer> = withContext(Dispatchers.IO) {
        volunteerDao.getFilteredPaged(filterType, filterValue, limit, offset)
    }

    suspend fun getFilteredCount(filterType: String, filterValue: String): Int = withContext(Dispatchers.IO) {
        volunteerDao.getFilteredCount(filterType, filterValue)
    }

    suspend fun getFilteredAll(filterType: String, filterValue: String): List<CachedVolunteer> = withContext(Dispatchers.IO) {
        volunteerDao.getFilteredAll(filterType, filterValue)
    }
}
