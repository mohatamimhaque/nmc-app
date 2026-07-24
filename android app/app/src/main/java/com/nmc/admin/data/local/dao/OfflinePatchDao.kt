package com.nmc.admin.data.local.dao

import androidx.room.*
import com.nmc.admin.data.local.entities.OfflinePatch

@Dao
interface OfflinePatchDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(patch: OfflinePatch)

    @Query("SELECT * FROM offline_patches_queue ORDER BY id ASC")
    suspend fun getAllQueued(): List<OfflinePatch>

    @Query("DELETE FROM offline_patches_queue WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM offline_patches_queue")
    suspend fun clearAll()
}
