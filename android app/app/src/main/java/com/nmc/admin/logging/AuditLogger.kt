package com.nmc.admin.logging

import android.content.Context
import android.util.Base64
import androidx.security.crypto.EncryptedFile
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuditLogger @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val logFile = File(context.filesDir, "nmc_audit_trail.log")

    @Synchronized
    fun log(tag: String, message: String) {
        try {
            val timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
            val logLine = "[$timestamp] [$tag] $message\n"
            
            val existingText = readLogs()
            val newText = existingText + logLine
            val purgedText = purgeOldLogs(newText)

            writeLogs(purgedText)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @Synchronized
    fun readLogs(): String {
        if (!logFile.exists()) return ""
        return try {
            val encryptedFile = EncryptedFile.Builder(
                context,
                logFile,
                masterKey,
                EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
            ).build()
            
            encryptedFile.openFileInput().use { input ->
                input.bufferedReader().readText()
            }
        } catch (e: Exception) {
            ""
        }
    }

    private fun writeLogs(content: String) {
        if (logFile.exists()) {
            logFile.delete()
        }
        try {
            val encryptedFile = EncryptedFile.Builder(
                context,
                logFile,
                masterKey,
                EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB
            ).build()

            encryptedFile.openFileOutput().use { output ->
                output.write(content.toByteArray())
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun purgeOldLogs(logs: String): String {
        val lines = logs.split("\n")
        val filteredLines = mutableListOf<String>()
        val dateFormat = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US)
        val calendar = Calendar.getInstance()
        calendar.add(Calendar.DAY_OF_YEAR, -7)
        val cutoffDate = calendar.time

        for (line in lines) {
            if (line.isBlank()) continue
            try {
                val endBracketIdx = line.indexOf("]")
                if (endBracketIdx > 1) {
                    val dateStr = line.substring(1, endBracketIdx)
                    val date = dateFormat.parse(dateStr)
                    if (date != null && date.after(cutoffDate)) {
                        filteredLines.add(line)
                    }
                } else {
                    filteredLines.add(line)
                }
            } catch (e: Exception) {
                filteredLines.add(line)
            }
        }
        return filteredLines.joinToString("\n") + "\n"
    }

    fun exportLogsToZip(): File? {
        val tempZipFile = File(context.cacheDir, "nmc_audit_logs.zip")
        if (tempZipFile.exists()) tempZipFile.delete()

        try {
            val logContent = readLogs()
            
            ZipOutputStream(FileOutputStream(tempZipFile)).use { zos ->
                val entry = ZipEntry("nmc_audit_trail.log")
                zos.putNextEntry(entry)
                
                // Obfuscate using Base64 inside the zip file for basic security on share
                val obfuscatedContent = Base64.encodeToString(logContent.toByteArray(), Base64.DEFAULT)
                zos.write(obfuscatedContent.toByteArray())
                zos.closeEntry()
            }
            return tempZipFile
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    @Synchronized
    fun clearLogs() {
        if (logFile.exists()) {
            logFile.delete()
        }
    }
}
