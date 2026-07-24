package com.nmc.admin.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "nmc_settings")

@Singleton
class SettingsDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        val KEY_SCAN_MODE = stringPreferencesKey("scan_mode")
        val KEY_SHOW_INFO = booleanPreferencesKey("show_info_enabled")
        val KEY_BIOMETRIC_ENABLED = booleanPreferencesKey("biometric_enabled")
        val KEY_MANAGEMENT_MODE = stringPreferencesKey("management_mode")
        val KEY_CAN_MANAGE_VOLUNTEERS = booleanPreferencesKey("can_manage_volunteers")
        val KEY_CAN_MANAGE_REGISTRATIONS = booleanPreferencesKey("can_manage_registrations")
        val KEY_CAN_MANAGE_KIT = booleanPreferencesKey("can_manage_kit")
        val KEY_CAN_MANAGE_PRESENTS = booleanPreferencesKey("can_manage_presents")
        val KEY_CAN_MANAGE_LUNCH = booleanPreferencesKey("can_manage_lunch")
        val KEY_CAN_MANAGE_BREAKFAST = booleanPreferencesKey("can_manage_breakfast")
    }

    val scanModeFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_SCAN_MODE] ?: "kit"
    }

    val showInfoFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_SHOW_INFO] ?: true
    }

    val biometricEnabledFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_BIOMETRIC_ENABLED] ?: false
    }

    val managementModeFlow: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[KEY_MANAGEMENT_MODE] ?: "participant"
    }

    val canManageVolunteersFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_CAN_MANAGE_VOLUNTEERS] ?: false
    }

    val canManageRegistrationsFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_CAN_MANAGE_REGISTRATIONS] ?: false
    }

    val canManageKitFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_CAN_MANAGE_KIT] ?: false
    }

    val canManagePresentsFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_CAN_MANAGE_PRESENTS] ?: false
    }

    val canManageLunchFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_CAN_MANAGE_LUNCH] ?: false
    }

    val canManageBreakfastFlow: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[KEY_CAN_MANAGE_BREAKFAST] ?: false
    }

    suspend fun saveScanMode(mode: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_SCAN_MODE] = mode
        }
    }

    suspend fun saveShowInfo(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_SHOW_INFO] = enabled
        }
    }

    suspend fun saveBiometricEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_BIOMETRIC_ENABLED] = enabled
        }
    }

    suspend fun saveManagementMode(mode: String) {
        context.dataStore.edit { preferences ->
            preferences[KEY_MANAGEMENT_MODE] = mode
        }
    }

    suspend fun saveCanManageVolunteers(canManage: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CAN_MANAGE_VOLUNTEERS] = canManage
        }
    }

    suspend fun saveCanManageRegistrations(canManage: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CAN_MANAGE_REGISTRATIONS] = canManage
        }
    }

    suspend fun saveCanManageKit(canManage: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CAN_MANAGE_KIT] = canManage
        }
    }

    suspend fun saveCanManagePresents(canManage: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CAN_MANAGE_PRESENTS] = canManage
        }
    }

    suspend fun saveCanManageLunch(canManage: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CAN_MANAGE_LUNCH] = canManage
        }
    }

    suspend fun saveCanManageBreakfast(canManage: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[KEY_CAN_MANAGE_BREAKFAST] = canManage
        }
    }
}
