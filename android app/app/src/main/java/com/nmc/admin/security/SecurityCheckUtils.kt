package com.nmc.admin.security

import android.os.Build
import java.io.File

object SecurityCheckUtils {

    fun isDeviceRooted(): Boolean {
        return checkRootMethod1() || checkRootMethod2() || checkRootMethod3()
    }

    private fun checkRootMethod1(): Boolean {
        val buildTags = Build.TAGS
        return buildTags != null && buildTags.contains("test-keys")
    }

    private fun checkRootMethod2(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su",
            "/su/bin/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }

    private fun checkRootMethod3(): Boolean {
        var process: Process? = null
        return try {
            process = Runtime.getRuntime().exec(arrayOf("/system/xbin/which", "su"))
            val reader = process.inputStream.bufferedReader()
            reader.readLine() != null
        } catch (t: Throwable) {
            false
        } finally {
            process?.destroy()
        }
    }

    fun isEmulator(): Boolean {
        return (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                || Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for x86")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.PRODUCT.indexOf("sdk_google") >= 0
                || Build.PRODUCT.indexOf("google_sdk") >= 0
                || Build.PRODUCT.indexOf("sdk") >= 0
                || Build.PRODUCT.indexOf("sdk_x86") >= 0
                || Build.PRODUCT.indexOf("vbox86p") >= 0
                || Build.BOARD.lowercase().contains("nox")
                || Build.BOOTLOADER.lowercase().contains("nox")
                || Build.HARDWARE.lowercase().contains("nox")
                || Build.PRODUCT.lowercase().contains("nox")
    }
}
