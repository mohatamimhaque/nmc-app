package com.nmc.admin.data.local.entities

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

@Entity(tableName = "cached_registrations")
data class CachedRegistration(
    @PrimaryKey
    @ColumnInfo(name = "serial")
    @SerializedName("serial")
    val serial: String,
    
    @ColumnInfo(name = "full_name")
    @SerializedName("full_name")
    val fullName: String?,
    
    @ColumnInfo(name = "email_address")
    @SerializedName("email_address")
    val emailAddress: String?,
    
    @ColumnInfo(name = "phone_number")
    @SerializedName("phone_number")
    val phoneNumber: String?,
    
    @ColumnInfo(name = "gender")
    @SerializedName("gender")
    val gender: String?,
    
    @ColumnInfo(name = "t_shirt_size")
    @SerializedName("t_shirt_size")
    val tShirtSize: String?,
    
    @ColumnInfo(name = "level")
    @SerializedName("level")
    val level: String?,
    
    @ColumnInfo(name = "institution")
    @SerializedName("institution")
    val institution: String?,
    
    @ColumnInfo(name = "class_year_student_of")
    @SerializedName("class_year_student_of")
    val classYearStudentOf: String?,
    
    @ColumnInfo(name = "event")
    @SerializedName("event")
    val event: String?,
    
    @ColumnInfo(name = "payment_method")
    @SerializedName("payment_method")
    val paymentMethod: String?,
    
    @ColumnInfo(name = "payment_number")
    @SerializedName("payment_number")
    val paymentNumber: String?,
    
    @ColumnInfo(name = "transaction_id")
    @SerializedName("transaction_id")
    val transactionId: String?,
    
    @ColumnInfo(name = "is_kit_coollect")
    @SerializedName("is_kit_coollect")
    val isKitCollected: Boolean,
    
    @ColumnInfo(name = "is_present")
    @SerializedName("is_present")
    val isPresent: Boolean,
    
    @ColumnInfo(name = "is_collect_launch")
    @SerializedName("is_collect_launch")
    val isCollectLaunch: Boolean,

    @ColumnInfo(name = "is_collect_breakfast")
    @SerializedName("is_collect_breakfast")
    val isBreakfastCollected: Boolean,
    
    @ColumnInfo(name = "allocated_room")
    @SerializedName("allocated_room")
    val allocatedRoom: String?,
    
    @ColumnInfo(name = "updated_by")
    @SerializedName("updated_by")
    val updatedBy: String?,
    
    @ColumnInfo(name = "updated_at")
    @SerializedName("updated_at")
    val updatedAt: String?,
    
    @ColumnInfo(name = "created_at")
    @SerializedName("created_at")
    val createdAt: String?,
    
    @ColumnInfo(name = "admit_card_url")
    @SerializedName("admit_card_url")
    val admitCardUrl: String?
)
