package com.nmc.admin.data.local.dao

import androidx.room.*
import com.nmc.admin.data.local.entities.CachedVolunteer
import kotlinx.coroutines.flow.Flow

@Dao
interface VolunteerDao {

    @Query("SELECT * FROM cached_volunteers WHERE uniqueId = :id OR serialNo = :id LIMIT 1")
    suspend fun getById(id: String): CachedVolunteer?

    @Query("SELECT * FROM cached_volunteers WHERE uniqueId = :id OR serialNo = :id LIMIT 1")
    fun getByIdFlow(id: String): Flow<CachedVolunteer?>

    @Query("SELECT * FROM cached_volunteers WHERE email = :email LIMIT 1")
    fun getByEmailFlow(email: String): Flow<CachedVolunteer?>

    @Query("""
        SELECT * FROM cached_volunteers 
        WHERE email = :email 
           OR (:phoneClean <> '' AND (number LIKE '%' || :phoneClean))
        LIMIT 1
    """)
    fun getByEmailOrPhoneFlow(email: String, phoneClean: String): Flow<CachedVolunteer?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrReplaceAll(volunteers: List<CachedVolunteer>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrReplace(volunteer: CachedVolunteer)

    @Query("SELECT * FROM cached_volunteers")
    suspend fun getAll(): List<CachedVolunteer>

    @Query("""
        SELECT * FROM cached_volunteers 
        WHERE (:segment = 'All' OR segment = :segment)
          AND (:department = 'All' OR department = :department)
          AND (:searchQuery = '' OR name LIKE '%' || :searchQuery || '%' OR number LIKE '%' || :searchQuery || '%' OR uniqueId LIKE '%' || :searchQuery || '%' OR serialNo LIKE '%' || :searchQuery || '%')
        LIMIT :limit OFFSET :offset
    """)
    suspend fun searchPaged(segment: String, department: String, searchQuery: String, limit: Int, offset: Int): List<CachedVolunteer>

    @Query("""
        SELECT COUNT(*) FROM cached_volunteers 
        WHERE (:segment = 'All' OR segment = :segment)
          AND (:department = 'All' OR department = :department)
          AND (:searchQuery = '' OR name LIKE '%' || :searchQuery || '%' OR number LIKE '%' || :searchQuery || '%' OR uniqueId LIKE '%' || :searchQuery || '%' OR serialNo LIKE '%' || :searchQuery || '%')
    """)
    suspend fun searchCount(segment: String, department: String, searchQuery: String): Int

    @Query("UPDATE cached_volunteers SET isGiftCollected = :isGiftCollected, updatedBy = :updatedBy, updatedAt = :updatedAt WHERE uniqueId = :uniqueId")
    suspend fun updateGiftStatus(uniqueId: String, isGiftCollected: Boolean, updatedBy: String, updatedAt: String)

    @Query("UPDATE cached_volunteers SET isPresent = :isPresent, updatedBy = :updatedBy, updatedAt = :updatedAt WHERE uniqueId = :uniqueId")
    suspend fun updateAttendanceStatus(uniqueId: String, isPresent: Boolean, updatedBy: String, updatedAt: String)

    @Query("UPDATE cached_volunteers SET isLunchCollected = :isLunchCollected, updatedBy = :updatedBy, updatedAt = :updatedAt WHERE uniqueId = :uniqueId")
    suspend fun updateLunchStatus(uniqueId: String, isLunchCollected: Boolean, updatedBy: String, updatedAt: String)

    @Query("SELECT COUNT(*) FROM cached_volunteers")
    fun getTotalCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_volunteers WHERE isPresent = 1")
    fun getPresentCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_volunteers WHERE isGiftCollected = 1")
    fun getGiftCollectedCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_volunteers WHERE isLunchCollected = 1")
    fun getLunchServedCountFlow(): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_volunteers WHERE segment = :segment")
    fun getSegmentCountFlow(segment: String): Flow<Int>

    @Query("SELECT COUNT(*) FROM cached_volunteers WHERE department = :department")
    fun getDepartmentCountFlow(department: String): Flow<Int>

    @Query("""
        SELECT * FROM cached_volunteers 
        WHERE (:filterType = 'gift' AND (:filterValue = 'collected' AND isGiftCollected = 1 OR :filterValue = 'pending' AND isGiftCollected = 0))
           OR (:filterType = 'present' AND (:filterValue = 'present' AND isPresent = 1 OR :filterValue = 'absent' AND isPresent = 0))
           OR (:filterType = 'lunch' AND (:filterValue = 'served' AND isLunchCollected = 1 OR :filterValue = 'pending' AND isLunchCollected = 0))
           OR (:filterType = 'segment' AND segment = :filterValue)
           OR (:filterType = 'department' AND department = :filterValue)
        LIMIT :limit OFFSET :offset
    """)
    suspend fun getFilteredPaged(filterType: String, filterValue: String, limit: Int, offset: Int): List<CachedVolunteer>

    @Query("""
        SELECT COUNT(*) FROM cached_volunteers 
        WHERE (:filterType = 'gift' AND (:filterValue = 'collected' AND isGiftCollected = 1 OR :filterValue = 'pending' AND isGiftCollected = 0))
           OR (:filterType = 'present' AND (:filterValue = 'present' AND isPresent = 1 OR :filterValue = 'absent' AND isPresent = 0))
           OR (:filterType = 'lunch' AND (:filterValue = 'served' AND isLunchCollected = 1 OR :filterValue = 'pending' AND isLunchCollected = 0))
           OR (:filterType = 'segment' AND segment = :filterValue)
           OR (:filterType = 'department' AND department = :filterValue)
    """)
    suspend fun getFilteredCount(filterType: String, filterValue: String): Int

    @Query("""
        SELECT * FROM cached_volunteers 
        WHERE (:filterType = 'gift' AND (:filterValue = 'collected' AND isGiftCollected = 1 OR :filterValue = 'pending' AND isGiftCollected = 0))
           OR (:filterType = 'present' AND (:filterValue = 'present' AND isPresent = 1 OR :filterValue = 'absent' AND isPresent = 0))
           OR (:filterType = 'lunch' AND (:filterValue = 'served' AND isLunchCollected = 1 OR :filterValue = 'pending' AND isLunchCollected = 0))
           OR (:filterType = 'segment' AND segment = :filterValue)
           OR (:filterType = 'department' AND department = :filterValue)
    """)
    suspend fun getFilteredAll(filterType: String, filterValue: String): List<CachedVolunteer>

    @Query("DELETE FROM cached_volunteers")
    suspend fun deleteAll()

    @Transaction
    suspend fun clearAndInsertAll(volunteers: List<CachedVolunteer>) {
        deleteAll()
        insertOrReplaceAll(volunteers)
    }

    @Query("SELECT * FROM cached_volunteers")
    fun getAllFlow(): Flow<List<CachedVolunteer>>
}
