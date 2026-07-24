package com.nmc.admin.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "cached_volunteers")
data class CachedVolunteer(
    @PrimaryKey val uniqueId: String,
    val serialNo: String?,
    val name: String?,
    val email: String?,
    val number: String?,
    val imageUrl: String?,
    val segment: String?,
    val department: String?,
    val studentId: String?,
    val year: String?,
    val tShirtSize: String?,
    val isPresent: Boolean,
    val isGiftCollected: Boolean,
    val isLunchCollected: Boolean,
    val createdAt: String?,
    val updatedAt: String?,
    val updatedBy: String?
)
