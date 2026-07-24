package com.nmc.admin.ui.screens.profile

import android.content.Context
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.ui.theme.*
import androidx.compose.ui.graphics.asImageBitmap
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.Flow
import com.nmc.admin.data.repository.VolunteerRepository
import com.nmc.admin.data.local.entities.CachedVolunteer
import coil.compose.SubcomposeAsyncImage
import androidx.compose.ui.layout.ContentScale
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val encryptedPrefs: EncryptedPrefs,
    private val settingsDataStore: SettingsDataStore,
    private val volunteerRepository: VolunteerRepository
) : ViewModel() {

    fun getAdminName(): String = encryptedPrefs.getAdminName() ?: "Unknown User"
    fun getAdminEmail(): String = encryptedPrefs.getAdminEmail() ?: "No Email"
    fun getAdminRole(): String = encryptedPrefs.getAdminRole() ?: "registration_editor"
    fun getAdminUserId(): String = encryptedPrefs.getUserId() ?: "N/A"

    fun observeSelfVolunteer(): Flow<CachedVolunteer?> {
        val email = getAdminEmail()
        return volunteerRepository.observeVolunteerByEmail(email)
    }

    val canManageVolunteers = settingsDataStore.canManageVolunteersFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    navController: NavController,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val adminName = viewModel.getAdminName()
    val adminEmail = viewModel.getAdminEmail()
    val adminRole = viewModel.getAdminRole()
    val canManageVolunteers by viewModel.canManageVolunteers.collectAsState()
    
    val selfVolunteer by viewModel.observeSelfVolunteer().collectAsState(initial = null)

    // Format display role name
    val displayRole = when (adminRole) {
        "superadmin", "super_admin" -> "Super Administrator"
        "admin" -> "Administrator"
        "volunteer" -> "Volunteer"
        "registration_editor" -> "Registration Editor"
        else -> adminRole.replace("_", " ").replaceFirstChar { it.uppercase() }
    }

    ObsidianGradientBg {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("My Profile", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = LightText)
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.Transparent)
                )
            },
            containerColor = Color.Transparent
        ) { innerPadding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Profile Avatar Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = GlassSurface),
                    border = BorderStroke(1.dp, GlassBorder),
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(90.dp)
                                .clip(RoundedCornerShape(45.dp))
                                .background(Brush.linearGradient(listOf(NeonViolet, NeonBlue))),
                            contentAlignment = Alignment.Center
                        ) {
                            val imageUrl = selfVolunteer?.imageUrl
                            val initial = (selfVolunteer?.name ?: adminName).take(1).uppercase()
                            if (!imageUrl.isNullOrBlank()) {
                                SubcomposeAsyncImage(
                                    model = imageUrl,
                                    contentDescription = "Profile Picture",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop,
                                    loading = {
                                        CircularProgressIndicator(color = NeonViolet, modifier = Modifier.size(24.dp))
                                    },
                                    error = {
                                        Box(
                                            modifier = Modifier.fillMaxSize(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(text = initial, color = LightText, fontSize = 36.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                )
                            } else {
                                Text(text = initial, color = LightText, fontSize = 36.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = selfVolunteer?.name ?: adminName,
                            color = LightText,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = displayRole,
                            color = AlertCyan,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Center
                        )
                    }
                }

                // Profile Fields Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = GlassSurface),
                    border = BorderStroke(1.dp, GlassBorder),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("ACCOUNT DETAILS", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        ProfileFieldItem(label = "Email Address", value = adminEmail)
                        ProfileFieldItem(label = "System Role Identifier", value = displayRole)
                        
                        if (adminRole == "volunteer" || adminRole == "registration_editor") {
                            val displaySerialNo = selfVolunteer?.serialNo ?: "N/A"
                            val displayUniqueId = selfVolunteer?.uniqueId ?: viewModel.getAdminUserId()
                            ProfileFieldItem(label = "My Public Serial No", value = displaySerialNo, isMonospace = true)
                            ProfileFieldItem(label = "My System Unique ID", value = displayUniqueId, isMonospace = true)
                        }
                    }
                }

                // Privileges & Permissions Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = GlassSurface),
                    border = BorderStroke(1.dp, GlassBorder),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("PRIVILEGES & PERMISSIONS", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        
                        val isSuperOrAdmin = adminRole == "superadmin" || adminRole == "super_admin" || adminRole == "admin"
                        
                        PermissionRow(label = "Database Override Access", granted = isSuperOrAdmin)
                        PermissionRow(label = "Volunteer Management Access", granted = canManageVolunteers)
                        PermissionRow(label = "CSV & Excel Report Export", granted = true)
                    }
                }

                // Super Admin Permissions Management Button Card
                val isSuperAdmin = adminRole == "superadmin" || adminRole == "super_admin"
                if (isSuperAdmin) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GlassSurface),
                        border = BorderStroke(1.dp, GlassBorder),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { navController.navigate("user_management") }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Settings,
                                    contentDescription = "Permissions Settings Icon",
                                    tint = AlertCyan,
                                    modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Text(
                                        text = "MANAGE USER PERMISSIONS",
                                        color = LightText,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = "Edit roles and custom permissions",
                                        color = GrayText,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                            Icon(
                                imageVector = Icons.Default.ChevronRight,
                                contentDescription = "Navigate Icon",
                                tint = GrayText,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }

                // Own QR Code Section (only for volunteer / registration_editor)
                val displayUniqueId = selfVolunteer?.uniqueId ?: viewModel.getAdminUserId()
                val displaySerialNo = selfVolunteer?.serialNo ?: "N/A"
                if (displayUniqueId != "N/A" && (adminRole == "volunteer" || adminRole == "registration_editor")) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = GlassSurface),
                        border = BorderStroke(1.dp, GlassBorder),
                        shape = RoundedCornerShape(24.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(
                                text = "MY SECURITY BADGE (QR)",
                                color = AlertCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            val qrBitmap = remember(displayUniqueId) { generateQrCodeBitmap(displayUniqueId, 200) }
                            androidx.compose.foundation.Image(
                                bitmap = qrBitmap.asImageBitmap(),
                                contentDescription = "My QR Code Badge",
                                modifier = Modifier
                                    .size(200.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                                    .background(Color.White)
                                    .padding(12.dp)
                            )
                            
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "Unique ID: $displayUniqueId",
                                color = LightText,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Serial No: $displaySerialNo",
                                color = GrayText,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Present this QR code to Admins to verify presence or collect items.",
                                color = GrayText,
                                fontSize = 11.sp,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Footnote
                Text(
                    text = "courtesy: mohatamim",
                    color = GrayText,
                    fontSize = 11.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
                )
            }
        }
    }
}

@Composable
fun ProfileFieldItem(label: String, value: String, isMonospace: Boolean = false) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = label, color = GrayText, fontSize = 11.sp)
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = value,
            color = LightText,
            fontSize = if (isMonospace) 12.sp else 14.sp,
            fontFamily = if (isMonospace) androidx.compose.ui.text.font.FontFamily.Monospace else androidx.compose.ui.text.font.FontFamily.Default
        )
    }
}

@Composable
fun PermissionRow(label: String, granted: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, color = LightText, fontSize = 13.sp)
        Text(
            text = if (granted) "Granted" else "Restricted",
            color = if (granted) SuccessGreen else ErrorRed,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

private fun generateQrCodeBitmap(text: String, size: Int): android.graphics.Bitmap {
    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    val writer = com.google.zxing.qrcode.QRCodeWriter()
    try {
        val bitMatrix = writer.encode(text, com.google.zxing.BarcodeFormat.QR_CODE, size, size)
        val paint = android.graphics.Paint()
        val bitSize = size / bitMatrix.width
        for (x in 0 until bitMatrix.width) {
            for (y in 0 until bitMatrix.height) {
                paint.color = if (bitMatrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE
                canvas.drawRect(
                    (x * bitSize).toFloat(),
                    (y * bitSize).toFloat(),
                    ((x + 1) * bitSize).toFloat(),
                    ((y + 1) * bitSize).toFloat(),
                    paint
                )
            }
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
    return bitmap
}
