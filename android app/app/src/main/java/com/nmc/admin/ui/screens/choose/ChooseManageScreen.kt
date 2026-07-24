package com.nmc.admin.ui.screens.choose

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.VolunteerActivism
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalContext
import androidx.activity.compose.BackHandler
import android.app.Activity
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.data.repository.VolunteerRepository
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChooseManageViewModel @Inject constructor(
    private val settingsDataStore: SettingsDataStore,
    private val registrationRepository: RegistrationRepository,
    private val volunteerRepository: VolunteerRepository,
    private val encryptedPrefs: EncryptedPrefs
) : ViewModel() {

    fun getAdminRole(): String = encryptedPrefs.getAdminRole() ?: ""
    fun getCanManageVolunteers(): Boolean = encryptedPrefs.getCanManageVolunteers()

    fun selectMode(mode: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            settingsDataStore.saveManagementMode(mode)
            // Trigger pre-sync of corresponding list in background
            if (mode == "participant") {
                registrationRepository.syncRegistrations()
            } else {
                volunteerRepository.syncVolunteers()
            }
            onSuccess()
        }
    }
}

@Composable
fun ChooseManageScreen(
    navController: NavController,
    viewModel: ChooseManageViewModel = hiltViewModel()
) {
    val userRole = viewModel.getAdminRole()
    val canManageVolunteers = viewModel.getCanManageVolunteers()
    val context = LocalContext.current

    BackHandler(enabled = true) {
        (context as? Activity)?.finish()
    }

    if (userRole == "volunteer" && !canManageVolunteers) {
        LaunchedEffect(Unit) {
            navController.navigate(Screen.Dashboard.route) {
                popUpTo(0) { inclusive = true }
            }
        }
        Box(modifier = Modifier.fillMaxSize().background(ObsidianBg))
        return
    }

    ObsidianGradientBg {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "SELECT MANAGEMENT TARGET",
                    color = AlertCyan,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Choose which category of records you want to manage today.",
                    color = LightText,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )

                Spacer(modifier = Modifier.height(40.dp))



                // Manage Participant Card
                ChooseCard(
                    title = "Manage Participants",
                    description = "Manage student registrations, kit distribution, and presence verification.",
                    icon = Icons.Default.Groups,
                    color = NeonBlue,
                    onClick = {
                        viewModel.selectMode("participant") {
                            navController.navigate(Screen.Dashboard.route) {
                                popUpTo(Screen.ChooseManage.route) { inclusive = true }
                            }
                        }
                    }
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Manage Volunteer Card
                ChooseCard(
                    title = "Manage Volunteers",
                    description = "Track volunteer check-in status, shirt distributions, and lunch served.",
                    icon = Icons.Default.VolunteerActivism,
                    color = NeonViolet,
                    onClick = {
                        viewModel.selectMode("volunteer") {
                            navController.navigate(Screen.Dashboard.route) {
                                popUpTo(Screen.ChooseManage.route) { inclusive = true }
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun ChooseCard(
    title: String,
    description: String,
    icon: ImageVector,
    color: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = GlassSurface),
        border = BorderStroke(1.dp, GlassBorder),
        shape = RoundedCornerShape(20.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(54.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(color.copy(alpha = 0.15f))
                    .border(1.dp, color.copy(alpha = 0.3f), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    tint = color,
                    modifier = Modifier.size(28.dp)
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(
                    text = title,
                    color = LightText,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = description,
                    color = GrayText,
                    fontSize = 11.sp,
                    lineHeight = 15.sp
                )
            }
        }
    }
}
