package com.nmc.admin.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.nmc.admin.data.local.dao.OfflinePatchDao
import com.nmc.admin.data.local.dao.RegistrationDao
import com.nmc.admin.data.local.dao.VolunteerDao
import com.nmc.admin.data.local.entities.CachedRegistration
import com.nmc.admin.data.local.entities.CachedVolunteer
import com.nmc.admin.data.local.entities.OfflinePatch

@Database(entities = [CachedRegistration::class, OfflinePatch::class, CachedVolunteer::class], version = 5, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun registrationDao(): RegistrationDao
    abstract fun offlinePatchDao(): OfflinePatchDao
    abstract fun volunteerDao(): VolunteerDao
}
