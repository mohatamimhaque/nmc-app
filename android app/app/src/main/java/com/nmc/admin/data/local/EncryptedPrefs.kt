package com.nmc.admin.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EncryptedPrefs @Inject constructor(
    @ApplicationContext context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "nmc_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveToken(token: String) {
        prefs.edit().putString("access_token", token).apply()
    }

    fun getToken(): String? {
        return prefs.getString("access_token", null)
    }

    fun saveAdminInfo(email: String, name: String, role: String) {
        prefs.edit()
            .putString("admin_email", email)
            .putString("admin_name", name)
            .putString("admin_role", role)
            .apply()
    }

    fun getAdminEmail(): String? {
        return prefs.getString("admin_email", null)
    }

    fun getAdminName(): String? {
        return prefs.getString("admin_name", null)
    }

    fun getAdminRole(): String? {
        return prefs.getString("admin_role", null)
    }

    fun saveUserId(userId: String) {
        prefs.edit().putString("auth_user_id", userId).apply()
    }

    fun getUserId(): String? {
        return prefs.getString("auth_user_id", null)
    }

    fun savePermissions(
        canManageVolunteers: Boolean,
        canManageRegistrations: Boolean,
        canManageKit: Boolean,
        canManagePresents: Boolean,
        canManageLunch: Boolean,
        canManageBreakfast: Boolean
    ) {
        prefs.edit()
            .putBoolean("can_manage_volunteers", canManageVolunteers)
            .putBoolean("can_manage_registrations", canManageRegistrations)
            .putBoolean("can_manage_kit", canManageKit)
            .putBoolean("can_manage_presents", canManagePresents)
            .putBoolean("can_manage_lunch", canManageLunch)
            .putBoolean("can_manage_breakfast", canManageBreakfast)
            .apply()
    }

    fun getCanManageVolunteers(): Boolean = prefs.getBoolean("can_manage_volunteers", false)
    fun getCanManageRegistrations(): Boolean = prefs.getBoolean("can_manage_registrations", false)
    fun getCanManageKit(): Boolean = prefs.getBoolean("can_manage_kit", false)
    fun getCanManagePresents(): Boolean = prefs.getBoolean("can_manage_presents", false)
    fun getCanManageLunch(): Boolean = prefs.getBoolean("can_manage_lunch", false)
    fun getCanManageBreakfast(): Boolean = prefs.getBoolean("can_manage_breakfast", false)

    fun clearAuth() {
        prefs.edit()
            .remove("access_token")
            .remove("admin_email")
            .remove("admin_name")
            .remove("admin_role")
            .remove("auth_user_id")
            .remove("can_manage_volunteers")
            .remove("can_manage_registrations")
            .remove("can_manage_kit")
            .remove("can_manage_presents")
            .remove("can_manage_lunch")
            .remove("can_manage_breakfast")
            .apply()
    }

    fun isAppUnlocked(): Boolean {
        return prefs.getBoolean("is_app_unlocked", false)
    }

    fun saveAppUnlocked(unlocked: Boolean) {
        prefs.edit().putBoolean("is_app_unlocked", unlocked).apply()
    }
}
