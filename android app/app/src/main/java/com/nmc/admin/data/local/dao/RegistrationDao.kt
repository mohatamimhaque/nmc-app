package com.nmc.admin.data.local.dao

import androidx.room.*
import com.nmc.admin.data.local.entities.CachedRegistration
import kotlinx.coroutines.flow.Flow

@Dao
interface RegistrationDao {

    @Query("SELECT * FROM cached_registrations WHERE serial = :serial LIMIT 1")
    suspend fun getBySerial(serial: String): CachedRegistration?

    @Query("SELECT * FROM cached_registrations WHERE serial = :serial LIMIT 1")
    fun getBySerialFlow(serial: String): Flow<CachedRegistration?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrReplaceAll(registrations: List<CachedRegistration>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrReplace(registration: CachedRegistration)

    @Query("SELECT * FROM cached_registrations")
    suspend fun getAll(): List<CachedRegistration>

    @Query("""
        SELECT * FROM cached_registrations 
        WHERE (:level = 'All' OR level = :level)
          AND (:event = 'All' OR event = :event)
          AND (:searchQuery = '' OR full_name LIKE '%' || :searchQuery || '%' OR phone_number LIKE '%' || :searchQuery || '%' OR serial LIKE '%' || :searchQuery || '%')
    """)
    suspend fun search(level: String, event: String, searchQuery: String): List<CachedRegistration>

    @Query("""
        SELECT * FROM cached_registrations 
        WHERE (:level = 'All' OR level = :level)
          AND (:event = 'All' OR event = :event)
          AND (:searchQuery = '' OR full_name LIKE '%' || :searchQuery || '%' OR phone_number LIKE '%' || :searchQuery || '%' OR serial LIKE '%' || :searchQuery || '%')
        LIMIT :limit OFFSET :offset
    """)
    suspend fun searchPaged(level: String, event: String, searchQuery: String, limit: Int, offset: Int): List<CachedRegistration>

    @Query("""
        SELECT COUNT(*) FROM cached_registrations 
        WHERE (:level = 'All' OR level = :level)
          AND (:event = 'All' OR event = :event)
          AND (:searchQuery = '' OR full_name LIKE '%' || :searchQuery || '%' OR phone_number LIKE '%' || :searchQuery || '%' OR serial LIKE '%' || :searchQuery || '%')
    """)
    suspend fun searchCount(level: String, event: String, searchQuery: String): Int

    @Query("UPDATE cached_registrations SET is_kit_coollect = :isCollected, updated_by = :updatedBy, updated_at = :updatedAt WHERE serial = :serial")
    suspend fun updateKitStatus(serial: String, isCollected: Boolean, updatedBy: String, updatedAt: String)

    @Query("UPDATE cached_registrations SET is_present = :isPresent, updated_by = :updatedBy, updated_at = :updatedAt WHERE serial = :serial")
    suspend fun updateAttendanceStatus(serial: String, isPresent: Boolean, updatedBy: String, updatedAt: String)

    @Query("UPDATE cached_registrations SET is_collect_launch = :isServed, updated_by = :updatedBy, updated_at = :updatedAt WHERE serial = :serial")
    suspend fun updateLaunchStatus(serial: String, isServed: Boolean, updatedBy: String, updatedAt: String)

    @Query("UPDATE cached_registrations SET is_collect_breakfast = :isServed, updated_by = :updatedBy, updated_at = :updatedAt WHERE serial = :serial")
    suspend fun updateBreakfastStatus(serial: String, isServed: Boolean, updatedBy: String, updatedAt: String)

    @Query("SELECT COUNT(*) FROM cached_registrations")
    fun getTotalCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_registrations WHERE is_kit_coollect = 1")
    fun getKitCollectedCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_registrations WHERE is_present = 1")
    fun getPresentCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_registrations WHERE is_collect_launch = 1")
    fun getLaunchServedCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_registrations WHERE is_collect_breakfast = 1")
    fun getBreakfastCollectedCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_registrations WHERE level = :level")
    fun getLevelCountFlow(level: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_registrations WHERE event = :event")
    fun getEventCountFlow(event: String): Flow<Int>

    @Query("""
        SELECT * FROM cached_registrations 
        WHERE (:filterType = 'kit' AND (:filterValue = 'collected' AND is_kit_coollect = 1 OR :filterValue = 'pending' AND is_kit_coollect = 0))
           OR (:filterType = 'present' AND (:filterValue = 'present' AND is_present = 1 OR :filterValue = 'absent' AND is_present = 0))
           OR (:filterType = 'launch' AND (:filterValue = 'served' AND is_collect_launch = 1 OR :filterValue = 'pending' AND is_collect_launch = 0))
           OR (:filterType = 'breakfast' AND (:filterValue = 'served' AND is_collect_breakfast = 1 OR :filterValue = 'pending' AND is_collect_breakfast = 0))
           OR (:filterType = 'level' AND level = :filterValue)
           OR (:filterType = 'event' AND event = :filterValue)
        LIMIT :limit OFFSET :offset
    """)
    suspend fun getFilteredPaged(filterType: String, filterValue: String, limit: Int, offset: Int): List<CachedRegistration>

    @Query("""
        SELECT COUNT(*) FROM cached_registrations 
        WHERE (:filterType = 'kit' AND (:filterValue = 'collected' AND is_kit_coollect = 1 OR :filterValue = 'pending' AND is_kit_coollect = 0))
           OR (:filterType = 'present' AND (:filterValue = 'present' AND is_present = 1 OR :filterValue = 'absent' AND is_present = 0))
           OR (:filterType = 'launch' AND (:filterValue = 'served' AND is_collect_launch = 1 OR :filterValue = 'pending' AND is_collect_launch = 0))
           OR (:filterType = 'breakfast' AND (:filterValue = 'served' AND is_collect_breakfast = 1 OR :filterValue = 'pending' AND is_collect_breakfast = 0))
           OR (:filterType = 'level' AND level = :filterValue)
           OR (:filterType = 'event' AND event = :filterValue)
    """)
    suspend fun getFilteredCount(filterType: String, filterValue: String): Int

    @Query("""
        SELECT * FROM cached_registrations 
        WHERE (:filterType = 'kit' AND (:filterValue = 'collected' AND is_kit_coollect = 1 OR :filterValue = 'pending' AND is_kit_coollect = 0))
           OR (:filterType = 'present' AND (:filterValue = 'present' AND is_present = 1 OR :filterValue = 'absent' AND is_present = 0))
           OR (:filterType = 'launch' AND (:filterValue = 'served' AND is_collect_launch = 1 OR :filterValue = 'pending' AND is_collect_launch = 0))
           OR (:filterType = 'breakfast' AND (:filterValue = 'served' AND is_collect_breakfast = 1 OR :filterValue = 'pending' AND is_collect_breakfast = 0))
           OR (:filterType = 'level' AND level = :filterValue)
           OR (:filterType = 'event' AND event = :filterValue)
    """)
    suspend fun getFilteredAll(filterType: String, filterValue: String): List<CachedRegistration>

    @Query("DELETE FROM cached_registrations")
    suspend fun deleteAll()

    @Transaction
    suspend fun clearAndInsertAll(registrations: List<CachedRegistration>) {
        deleteAll()
        insertOrReplaceAll(registrations)
    }

    @Query("SELECT * FROM cached_registrations")
    fun getAllFlow(): Flow<List<CachedRegistration>>
}
