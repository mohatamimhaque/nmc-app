package com.nmc.admin.data.repository

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.local.dao.OfflinePatchDao
import com.nmc.admin.data.local.dao.RegistrationDao
import com.nmc.admin.data.local.entities.CachedRegistration
import com.nmc.admin.data.local.entities.OfflinePatch
import com.nmc.admin.data.remote.NmcApiService
import com.nmc.admin.data.remote.dto.*
import com.nmc.admin.logging.AuditLogger
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RegistrationRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: NmcApiService,
    private val registrationDao: RegistrationDao,
    private val offlinePatchDao: OfflinePatchDao,
    private val encryptedPrefs: EncryptedPrefs,
    private val auditLogger: AuditLogger,
    private val settingsDataStore: com.nmc.admin.data.local.SettingsDataStore
) {
    private val _isAuthorized = MutableStateFlow(true)
    val isAuthorized: StateFlow<Boolean> = _isAuthorized

    init {
        _isAuthorized.value = encryptedPrefs.getToken() != null
    }

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

    suspend fun login(request: LoginRequest): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(request)
            if (response.success && response.session != null && response.user != null) {
                encryptedPrefs.saveToken(response.session.accessToken)
                encryptedPrefs.saveAdminInfo(response.user.email, response.user.displayName, response.user.role)
                encryptedPrefs.saveUserId(response.user.id)
                _isAuthorized.value = true
                auditLogger.log("AUTH_LOGIN", "Login success: ${request.email}")
                fetchProfileAndSavePermissions()
                Result.success(response)
            } else {
                auditLogger.log("AUTH_LOGIN", "Login failed: ${response.error ?: "Unknown error"}")
                Result.failure(Exception(response.error ?: "Invalid credentials."))
            }
        } catch (e: Exception) {
            auditLogger.log("AUTH_LOGIN", "Login exception: ${e.message}")
            Result.failure(e)
        }
    }

    fun logout() {
        encryptedPrefs.clearAuth()
        _isAuthorized.value = false
        auditLogger.log("AUTH_LOGIN", "Admin logged out manually")
    }

    fun isSuperOrAdmin(): Boolean {
        val role = encryptedPrefs.getAdminRole() ?: ""
        return role == "super_admin" || role == "superadmin" || role == "admin"
    }

    suspend fun fetchProfileAndSavePermissions(): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getProfile()
            if (response.success && response.profile != null) {
                val p = response.profile
                val role = p.role
                val isSuperOrAdmin = role == "super_admin" || role == "superadmin" || role == "admin"
                val isRegEditor = role == "registration_editor"
                
                val canManageVolunteers = isSuperOrAdmin || p.canManageVolunteers
                val canManageRegistrations = isSuperOrAdmin || isRegEditor || p.canManageRegistrations
                val canManageKit = isSuperOrAdmin || isRegEditor || p.canManageKit
                val canManagePresents = isSuperOrAdmin || isRegEditor || p.canManagePresents
                val canManageLunch = isSuperOrAdmin || isRegEditor || p.canManageLunch
                val canManageBreakfast = isSuperOrAdmin || isRegEditor || p.canManageBreakfast

                settingsDataStore.saveCanManageVolunteers(canManageVolunteers)
                settingsDataStore.saveCanManageRegistrations(canManageRegistrations)
                settingsDataStore.saveCanManageKit(canManageKit)
                settingsDataStore.saveCanManagePresents(canManagePresents)
                settingsDataStore.saveCanManageLunch(canManageLunch)
                settingsDataStore.saveCanManageBreakfast(canManageBreakfast)

                encryptedPrefs.saveAdminInfo(p.email, p.displayName ?: "", role)
                encryptedPrefs.saveUserId(p.id)
                encryptedPrefs.savePermissions(
                    canManageVolunteers = canManageVolunteers,
                    canManageRegistrations = canManageRegistrations,
                    canManageKit = canManageKit,
                    canManagePresents = canManagePresents,
                    canManageLunch = canManageLunch,
                    canManageBreakfast = canManageBreakfast
                )
                true
            } else {
                logout()
                false
            }
        } catch (e: Exception) {
            if (e is retrofit2.HttpException) {
                val code = e.code()
                if (code == 401 || code == 403 || code == 404) {
                    logout()
                }
            }
            val localRole = encryptedPrefs.getAdminRole() ?: ""
            val isLocalSuperOrAdmin = localRole == "super_admin" || localRole == "superadmin" || localRole == "admin"
            val isLocalRegEditor = localRole == "registration_editor"
            
            val localCanManageVolunteers = isLocalSuperOrAdmin || encryptedPrefs.getCanManageVolunteers()
            val localCanManageRegistrations = isLocalSuperOrAdmin || isLocalRegEditor || encryptedPrefs.getCanManageRegistrations()
            val localCanManageKit = isLocalSuperOrAdmin || isLocalRegEditor || encryptedPrefs.getCanManageKit()
            val localCanManagePresents = isLocalSuperOrAdmin || isLocalRegEditor || encryptedPrefs.getCanManagePresents()
            val localCanManageLunch = isLocalSuperOrAdmin || isLocalRegEditor || encryptedPrefs.getCanManageLunch()
            val localCanManageBreakfast = isLocalSuperOrAdmin || isLocalRegEditor || encryptedPrefs.getCanManageBreakfast()
            
            settingsDataStore.saveCanManageVolunteers(localCanManageVolunteers)
            settingsDataStore.saveCanManageRegistrations(localCanManageRegistrations)
            settingsDataStore.saveCanManageKit(localCanManageKit)
            settingsDataStore.saveCanManagePresents(localCanManagePresents)
            settingsDataStore.saveCanManageLunch(localCanManageLunch)
            settingsDataStore.saveCanManageBreakfast(localCanManageBreakfast)
            false
        }
    }

    suspend fun syncRegistrations(): Result<Unit> = withContext(Dispatchers.IO) {
        if (!isNetworkAvailable()) {
            return@withContext Result.failure(IOException("No network connectivity. Caching offline."))
        }
        try {
            val registrations = apiService.getRegistrations()
            val entities = registrations.map { it.toEntity() }
            registrationDao.clearAndInsertAll(entities)
            auditLogger.log("SYNC_QUEUE", "Synced ${entities.size} registrations from server.")
            Result.success(Unit)
        } catch (e: Exception) {
            handleHttpException(e)
            auditLogger.log("SYNC_QUEUE", "Sync failure: ${e.message}")
            Result.failure(e)
        }
    }

    suspend fun getSummary(): Result<SummaryResponse> = withContext(Dispatchers.IO) {
        if (isNetworkAvailable()) {
            try {
                val summary = apiService.getSummary()
                Result.success(summary)
            } catch (e: Exception) {
                handleHttpException(e)
                getOfflineSummary()
            }
        } else {
            getOfflineSummary()
        }
    }

    private suspend fun getOfflineSummary(): Result<SummaryResponse> {
        return try {
            val all = registrationDao.getAll()
            val total = all.size
            val kitCollected = all.count { it.isKitCollected }
            val kitPending = total - kitCollected
            val attendancePresent = all.count { it.isPresent }
            val attendanceAbsent = total - attendancePresent
            val launchServed = all.count { it.isCollectLaunch }
            val launchPending = total - launchServed

            val byLevel = all.groupBy { it.level ?: "Unknown" }.mapValues { it.value.size }
            val byEvent = all.groupBy { it.event ?: "Unknown" }.mapValues { it.value.size }

            val summary = SummaryResponse(
                success = true,
                total = total,
                kitCollection = StatCollectedPending(kitCollected, kitPending),
                attendance = StatPresentAbsent(attendancePresent, attendanceAbsent),
                launchStatus = StatServedPending(launchServed, launchPending),
                byLevel = byLevel,
                byEvent = byEvent
            )
            Result.success(summary)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSingleRegistration(serial: String): Result<RegistrationDto> = withContext(Dispatchers.IO) {
        if (isNetworkAvailable()) {
            try {
                val response = apiService.getSingleRegistration(serial)
                if (response.success && response.registration != null) {
                    // Update cache with fresh record
                    registrationDao.insertOrReplace(response.registration.toEntity())
                    Result.success(response.registration)
                } else {
                    Result.failure(Exception(response.error ?: "Registration not found."))
                }
            } catch (e: Exception) {
                handleHttpException(e)
                getCachedRegistration(serial)
            }
        } else {
            getCachedRegistration(serial)
        }
    }

    private suspend fun getCachedRegistration(serial: String): Result<RegistrationDto> {
        val cached = registrationDao.getBySerial(serial)
        return if (cached != null) {
            Result.success(cached.toDto())
        } else {
            Result.failure(Exception("Registration $serial not found in local cache (Offline)."))
        }
    }

    suspend fun updateStatus(serial: String, actionType: String, value: Boolean): Result<UpdateStatusResponse> = withContext(Dispatchers.IO) {
        val adminEmail = encryptedPrefs.getAdminEmail() ?: "unknown"
        val timestamp = getIsoTimestamp()

        // Update local database first so local stats reflect the change instantly
        when (actionType) {
            "kit" -> registrationDao.updateKitStatus(serial, value, adminEmail, timestamp)
            "present" -> registrationDao.updateAttendanceStatus(serial, value, adminEmail, timestamp)
            "launch" -> registrationDao.updateLaunchStatus(serial, value, adminEmail, timestamp)
            "breakfast" -> registrationDao.updateBreakfastStatus(serial, value, adminEmail, timestamp)
        }

        auditLogger.log("MANUAL_OVERRIDE", "Override action: $actionType, serial: $serial, value: $value, admin: $adminEmail")

        if (isNetworkAvailable()) {
            try {
                val response = when (actionType) {
                    "kit" -> apiService.updateKit(KitUpdateRequest(serial, value))
                    "present" -> apiService.updateAttendance(AttendanceUpdateRequest(serial, value))
                    "launch" -> apiService.updateLaunch(LaunchUpdateRequest(serial, value))
                    "breakfast" -> apiService.updateBreakfast(BreakfastStatusRequest(serial, value))
                    else -> throw Exception("Invalid update action type.")
                }
                if (response.success) {
                    Result.success(response)
                } else {
                    val patch = OfflinePatch(serial = serial, actionType = actionType, value = value, timestamp = timestamp)
                    offlinePatchDao.insert(patch)
                    Result.success(UpdateStatusResponse(success = true, updated = false, serial = serial, updatedBy = adminEmail, updatedAt = timestamp, error = response.error))
                }
            } catch (e: Exception) {
                if (e is retrofit2.HttpException && e.code() == 403) {
                    when (actionType) {
                        "kit" -> registrationDao.updateKitStatus(serial, !value, adminEmail, timestamp)
                        "present" -> registrationDao.updateAttendanceStatus(serial, !value, adminEmail, timestamp)
                        "launch" -> registrationDao.updateLaunchStatus(serial, !value, adminEmail, timestamp)
                        "breakfast" -> registrationDao.updateBreakfastStatus(serial, !value, adminEmail, timestamp)
                    }
                    Result.failure(e)
                } else if (e is retrofit2.HttpException && e.code() == 401) {
                    when (actionType) {
                        "kit" -> registrationDao.updateKitStatus(serial, !value, adminEmail, timestamp)
                        "present" -> registrationDao.updateAttendanceStatus(serial, !value, adminEmail, timestamp)
                        "launch" -> registrationDao.updateLaunchStatus(serial, !value, adminEmail, timestamp)
                        "breakfast" -> registrationDao.updateBreakfastStatus(serial, !value, adminEmail, timestamp)
                    }
                    handleHttpException(e)
                    Result.failure(e)
                } else {
                    val patch = OfflinePatch(serial = serial, actionType = actionType, value = value, timestamp = timestamp)
                    offlinePatchDao.insert(patch)
                    Result.success(UpdateStatusResponse(success = true, updated = false, serial = serial, updatedBy = adminEmail, updatedAt = timestamp, error = "Offline - Update queued locally"))
                }
            }
        } else {
            // Queue for sync
            val patch = OfflinePatch(serial = serial, actionType = actionType, value = value, timestamp = timestamp)
            offlinePatchDao.insert(patch)
            Result.success(UpdateStatusResponse(success = true, updated = false, serial = serial, updatedBy = adminEmail, updatedAt = timestamp, error = "Offline - Update queued locally"))
        }
    }

    suspend fun getQueuedPatches(): List<OfflinePatch> {
        return offlinePatchDao.getAllQueued()
    }

    suspend fun deleteQueuedPatch(id: Long) {
        offlinePatchDao.deleteById(id)
    }

    suspend fun searchRegistrations(level: String, event: String, query: String): List<CachedRegistration> = withContext(Dispatchers.IO) {
        registrationDao.search(level, event, query)
    }

    suspend fun searchRegistrationsPaged(
        level: String,
        event: String,
        query: String,
        limit: Int,
        offset: Int
    ): List<CachedRegistration> = withContext(Dispatchers.IO) {
        registrationDao.searchPaged(level, event, query, limit, offset)
    }

    suspend fun getSearchCount(
        level: String,
        event: String,
        query: String
    ): Int = withContext(Dispatchers.IO) {
        registrationDao.searchCount(level, event, query)
    }

    fun observeParticipant(serial: String): Flow<CachedRegistration?> {
        return registrationDao.getBySerialFlow(serial)
    }

    // Flows to observe dashboard counts in real time
    fun observeTotalCount(): Flow<Int> = registrationDao.getTotalCountFlow()
    fun observeKitCollectedCount(): Flow<Int> = registrationDao.getKitCollectedCountFlow()
    fun observePresentCount(): Flow<Int> = registrationDao.getPresentCountFlow()
    fun observeLaunchServedCount(): Flow<Int> = registrationDao.getLaunchServedCountFlow()
    fun observeBreakfastServedCount(): Flow<Int> = registrationDao.getBreakfastCollectedCountFlow()
    fun observeLevelCount(level: String): Flow<Int> = registrationDao.getLevelCountFlow(level)
    fun observeEventCount(event: String): Flow<Int> {
        return registrationDao.getEventCountFlow(event)
    }

    fun observeAllRegistrations(): Flow<List<CachedRegistration>> {
        return registrationDao.getAllFlow()
    }

    private fun handleHttpException(e: Exception) {
        if (e is HttpException) {
            if (e.code() == 401) {
                encryptedPrefs.clearAuth()
                _isAuthorized.value = false
                auditLogger.log("AUTH_LOGIN", "Session expired due to HTTP 401")
            }
        }
    }

    // Mapping Helpers
    private fun RegistrationDto.toEntity() = CachedRegistration(
        serial = serial,
        fullName = fullName,
        emailAddress = emailAddress,
        phoneNumber = phoneNumber,
        gender = gender,
        tShirtSize = tShirtSize,
        level = level,
        institution = institution,
        classYearStudentOf = classYearStudentOf,
        event = event,
        paymentMethod = paymentMethod,
        paymentNumber = paymentNumber,
        transactionId = transactionId,
        isKitCollected = isKitCollected,
        isPresent = isPresent,
        isCollectLaunch = isCollectLaunch,
        isBreakfastCollected = isBreakfastCollected,
        allocatedRoom = allocatedRoom,
        updatedBy = updatedBy,
        updatedAt = updatedAt,
        createdAt = createdAt,
        admitCardUrl = admitCardUrl
    )

    private fun CachedRegistration.toDto() = RegistrationDto(
        serial = serial,
        fullName = fullName,
        emailAddress = emailAddress,
        phoneNumber = phoneNumber,
        gender = gender,
        tShirtSize = tShirtSize,
        level = level,
        institution = institution,
        classYearStudentOf = classYearStudentOf,
        event = event,
        paymentMethod = paymentMethod,
        paymentNumber = paymentNumber,
        transactionId = transactionId,
        isKitCollected = isKitCollected,
        isPresent = isPresent,
        isCollectLaunch = isCollectLaunch,
        isBreakfastCollected = isBreakfastCollected,
        allocatedRoom = allocatedRoom,
        updatedBy = updatedBy,
        updatedAt = updatedAt,
        createdAt = createdAt,
        admitCardUrl = admitCardUrl
    )

    suspend fun getFilteredPaged(filterType: String, filterValue: String, limit: Int, offset: Int): List<CachedRegistration> = withContext(Dispatchers.IO) {
        registrationDao.getFilteredPaged(filterType, filterValue, limit, offset)
    }

    suspend fun getFilteredCount(filterType: String, filterValue: String): Int = withContext(Dispatchers.IO) {
        registrationDao.getFilteredCount(filterType, filterValue)
    }

    suspend fun getFilteredAll(filterType: String, filterValue: String): List<CachedRegistration> = withContext(Dispatchers.IO) {
        registrationDao.getFilteredAll(filterType, filterValue)
    }
}
