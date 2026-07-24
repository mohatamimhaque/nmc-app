package com.nmc.admin.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object DatabaseKeyManager {
    private const val KEY_ALIAS = "nmc_db_key_alias"
    private const val ANDROID_KEY_STORE = "AndroidKeyStore"
    private const val PREFS_NAME = "nmc_db_secure_prefs"
    private const val ENCRYPTED_KEY_PROP = "encrypted_db_key"
    private const val IV_PROP = "iv_db_key"

    fun getDatabasePassphrase(context: Context): ByteArray {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val encryptedKeyBase64 = prefs.getString(ENCRYPTED_KEY_PROP, null)
        val ivBase64 = prefs.getString(IV_PROP, null)

        if (encryptedKeyBase64 != null && ivBase64 != null) {
            try {
                val encryptedKey = Base64.decode(encryptedKeyBase64, Base64.DEFAULT)
                val iv = Base64.decode(ivBase64, Base64.DEFAULT)
                return decryptKey(encryptedKey, iv)
            } catch (e: Exception) {
                // If decryption fails, regenerate
            }
        }

        // Generate a new 32-byte key
        val key = ByteArray(32)
        SecureRandom().nextBytes(key)

        val encryptionResult = encryptKey(key)
        prefs.edit()
            .putString(ENCRYPTED_KEY_PROP, Base64.encodeToString(encryptionResult.encrypted, Base64.DEFAULT))
            .putString(IV_PROP, Base64.encodeToString(encryptionResult.iv, Base64.DEFAULT))
            .apply()

        return key
    }

    private fun getSecretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }
        
        if (!keyStore.containsAlias(KEY_ALIAS)) {
            val keyGenerator = KeyGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_AES,
                ANDROID_KEY_STORE
            )
            keyGenerator.init(
                KeyGenParameterSpec.Builder(
                    KEY_ALIAS,
                    KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
                )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build()
            )
            return keyGenerator.generateKey()
        }
        
        return (keyStore.getEntry(KEY_ALIAS, null) as KeyStore.SecretKeyEntry).secretKey
    }

    private class EncryptionResult(val encrypted: ByteArray, val iv: ByteArray)

    private fun encryptKey(key: ByteArray): EncryptionResult {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey())
        val encrypted = cipher.doFinal(key)
        return EncryptionResult(encrypted, cipher.iv)
    }

    private fun decryptKey(encrypted: ByteArray, iv: ByteArray): ByteArray {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), spec)
        return cipher.doFinal(encrypted)
    }
}
