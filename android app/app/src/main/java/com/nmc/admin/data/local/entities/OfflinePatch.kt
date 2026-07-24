package com.nmc.admin.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "offline_patches_queue")
data class OfflinePatch(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val serial: String,
    val actionType: String, // "kit" | "present" | "launch"
    val value: Boolean,
    val timestamp: String // ISO-8601 string representation of date-time
)
