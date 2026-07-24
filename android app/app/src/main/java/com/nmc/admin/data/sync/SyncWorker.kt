package com.nmc.admin.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.nmc.admin.data.remote.NmcApiService
import com.nmc.admin.data.remote.dto.*
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.data.repository.VolunteerRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val apiService: NmcApiService,
    private val repository: RegistrationRepository,
    private val volunteerRepository: VolunteerRepository
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val patches = repository.getQueuedPatches()
        if (patches.isEmpty()) {
            return@withContext Result.success()
        }

        var hasFailures = false

        for (patch in patches) {
            val isVolunteer = patch.actionType.startsWith("v_")
            val networkResult = runCatching {
                if (isVolunteer) {
                    val volunteerAction = patch.actionType.substring(2) // "present" | "gift" | "lunch"
                    when (volunteerAction) {
                        "present" -> apiService.updateVolunteerAttendance(VolunteerPresentRequest(patch.serial, patch.value))
                        "gift" -> apiService.updateVolunteerGift(VolunteerGiftRequest(patch.serial, patch.value))
                        "lunch" -> apiService.updateVolunteerLunch(VolunteerLunchRequest(patch.serial, patch.value))
                        else -> throw Exception("Invalid volunteer action type")
                    }
                } else {
                    when (patch.actionType) {
                        "kit" -> apiService.updateKit(KitUpdateRequest(patch.serial, patch.value))
                        "present" -> apiService.updateAttendance(AttendanceUpdateRequest(patch.serial, patch.value))
                        "launch" -> apiService.updateLaunch(LaunchUpdateRequest(patch.serial, patch.value))
                        else -> throw Exception("Invalid action type")
                    }
                }
            }

            if (networkResult.isSuccess) {
                val success = when (val response = networkResult.getOrThrow()) {
                    is UpdateStatusResponse -> response.success
                    is VolunteerUpdateResponse -> response.success
                    else -> false
                }
                if (success) {
                    if (isVolunteer) {
                        volunteerRepository.getSingleVolunteer(patch.serial)
                    } else {
                        repository.getSingleRegistration(patch.serial)
                    }
                    repository.deleteQueuedPatch(patch.id)
                } else {
                    repository.deleteQueuedPatch(patch.id)
                }
            } else {
                val error = networkResult.exceptionOrNull()
                if (error is HttpException) {
                    val code = error.code()
                    if (code in 400..499 && code != 408 && code != 429) {
                        repository.deleteQueuedPatch(patch.id)
                    } else {
                        hasFailures = true
                    }
                } else {
                    hasFailures = true
                }
            }
        }

        if (hasFailures) {
            Result.retry()
        } else {
            Result.success()
        }
    }
}
