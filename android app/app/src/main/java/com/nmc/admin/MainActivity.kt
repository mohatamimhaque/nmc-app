package com.nmc.admin

import android.os.Bundle
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.navigation.compose.rememberNavController
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.security.BiometricHelper
import com.nmc.admin.security.SecurityCheckUtils
import com.nmc.admin.ui.navigation.AppNavigation
import com.nmc.admin.ui.theme.LightText
import com.nmc.admin.ui.theme.NmcAdminTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : FragmentActivity() {

    @Inject
    lateinit var settingsDataStore: SettingsDataStore

    private val isUnlocked = mutableStateOf(true)
    private var lastPausedTime: Long = 0
    private var isAuthPrompting = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val isBiometricEnabled = runBlocking { settingsDataStore.biometricEnabledFlow.first() }
        if (isBiometricEnabled) {
            isUnlocked.value = false
            triggerBiometricUnlock()
        }

        setContent {
            NmcAdminTheme {
                val showSecurityWarning = remember { mutableStateOf(false) }
                val securityMessage = remember { mutableStateOf("") }

                LaunchedEffect(Unit) {
                    if (SecurityCheckUtils.isDeviceRooted()) {
                        securityMessage.value = "Warning: Root access detected. Offline sync has been limited to prevent data compromise."
                        showSecurityWarning.value = true
                    } else if (SecurityCheckUtils.isEmulator()) {
                        securityMessage.value = "Notice: Running in emulator environment. Certain biometric controls may behave differently."
                        showSecurityWarning.value = true
                    }
                }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (showSecurityWarning.value) {
                        AlertDialog(
                            onDismissRequest = { showSecurityWarning.value = false },
                            title = { Text("Security Notice", color = LightText) },
                            text = { Text(securityMessage.value, color = LightText) },
                            confirmButton = {
                                TextButton(onClick = { showSecurityWarning.value = false }) {
                                    Text("PROCEED")
                                }
                            }
                        )
                    }

                    if (isUnlocked.value) {
                        val navController = rememberNavController()
                        AppNavigation(navController = navController)
                    } else {
                        Surface(
                            modifier = Modifier.fillMaxSize(),
                            color = MaterialTheme.colorScheme.background
                        ) {}
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        val isBiometricEnabled = runBlocking { settingsDataStore.biometricEnabledFlow.first() }
        if (isBiometricEnabled && lastPausedTime > 0) {
            val diff = System.currentTimeMillis() - lastPausedTime
            if (diff > 60000 && isUnlocked.value) {
                isUnlocked.value = false
                triggerBiometricUnlock()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        lastPausedTime = System.currentTimeMillis()
    }

    private fun triggerBiometricUnlock() {
        if (isAuthPrompting) return
        isAuthPrompting = true
        
        if (BiometricHelper.isBiometricAvailable(this)) {
            BiometricHelper.showBiometricPrompt(
                activity = this,
                title = "Security Verification",
                subtitle = "Confirm biometric credentials to unlock application",
                onSuccess = {
                    isUnlocked.value = true
                    isAuthPrompting = false
                },
                onFailure = { err ->
                    isAuthPrompting = false
                    Toast.makeText(this, "Verification failed: $err", Toast.LENGTH_SHORT).show()
                }
            )
        } else {
            isUnlocked.value = true
            isAuthPrompting = false
        }
    }
}
