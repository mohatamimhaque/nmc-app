# Obfuscation and Shrinking rules for NMC 2026 Admin Application

# ----------------------------------------------------
# 1. Gson / JSON Serialization Rules
# Keep serialized names and class properties
# ----------------------------------------------------
-keepattributes Signature, *Annotation*, EnclosingMethod, InnerClasses
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class com.nmc.admin.data.remote.dto.** { *; }

# ----------------------------------------------------
# 2. Local Database & Room Rules
# Keep Room Dao and Entities from being renamed
# ----------------------------------------------------
-keep class com.nmc.admin.data.local.entities.** { *; }
-keep class com.nmc.admin.data.local.dao.** { *; }
-keep class androidx.room.RoomDatabase { *; }
-dontwarn androidx.room.**

# ----------------------------------------------------
# 3. SQLCipher Database Security
# ----------------------------------------------------
-keep class net.sqlcipher.** { *; }
-dontwarn net.sqlcipher.**
-keep class net.zetetic.database.sqlcipher.** { *; }
-dontwarn net.zetetic.database.sqlcipher.**

# ----------------------------------------------------
# 4. Retrofit & OkHttp Rules
# ----------------------------------------------------
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers class * {
    @retrofit2.http.* <methods>;
}

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# ----------------------------------------------------
# 5. Dagger Hilt & Dependency Injection Rules
# ----------------------------------------------------
-keep class * extends androidx.lifecycle.ViewModel
-keep class * extends android.app.Application
-keep class * extends android.app.Activity
-keep class * extends android.app.Service
-keep class * extends android.content.BroadcastReceiver
-keep class * extends android.content.ContentProvider

# ----------------------------------------------------
# 6. ML Kit & CameraX Rules
# ----------------------------------------------------
-dontwarn com.google.mlkit.**
-dontwarn androidx.camera.**
-keep class com.google.mlkit.** { *; }
-keep class androidx.camera.** { *; }

# ----------------------------------------------------
# 7. Kotlin Coroutines & Flow
# ----------------------------------------------------
-dontwarn kotlinx.coroutines.**
-keep class kotlinx.coroutines.** { *; }
