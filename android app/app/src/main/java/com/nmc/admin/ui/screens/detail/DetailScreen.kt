package com.nmc.admin.ui.screens.detail

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color as AndroidColor
import android.graphics.Paint as AndroidPaint
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Vibrator
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.layout.ContentScale
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import coil.compose.SubcomposeAsyncImage
import androidx.hilt.navigation.compose.hiltViewModel
import android.os.VibrationEffect
import android.os.VibratorManager
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.data.local.entities.CachedRegistration
import com.nmc.admin.data.local.entities.CachedVolunteer
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.data.repository.VolunteerRepository
import com.nmc.admin.security.BiometricHelper
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import javax.inject.Inject

@HiltViewModel
class DetailViewModel @Inject constructor(
    private val repository: RegistrationRepository,
    private val volunteerRepository: VolunteerRepository,
    private val settingsDataStore: SettingsDataStore,
    private val encryptedPrefs: EncryptedPrefs,
    private val okHttpClient: OkHttpClient
) : ViewModel() {

    var activeMode by mutableStateOf("kit")
    var isBiometricEnabled by mutableStateOf(false)
    var isSaving by mutableStateOf(false)
    var updateError by mutableStateOf<String?>(null)

    val isAuthorized = repository.isAuthorized

    var downloadProgress by mutableStateOf<Float?>(null)
    var downloadMessage by mutableStateOf<String?>(null)

    val managementMode = settingsDataStore.managementModeFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, "participant")

    init {
        viewModelScope.launch {
            settingsDataStore.scanModeFlow.collectLatest {
                activeMode = it
            }
        }
        viewModelScope.launch {
            settingsDataStore.biometricEnabledFlow.collectLatest {
                isBiometricEnabled = it
            }
        }
    }

    fun getAdminRole(): String {
        return encryptedPrefs.getAdminRole() ?: "registration_editor"
    }

    fun getCanManageVolunteers(): Boolean = encryptedPrefs.getCanManageVolunteers()
    fun getCanManageKit(): Boolean = encryptedPrefs.getCanManageKit()
    fun getCanManagePresents(): Boolean = encryptedPrefs.getCanManagePresents()
    fun getCanManageLunch(): Boolean = encryptedPrefs.getCanManageLunch()

    fun observeParticipant(serial: String): Flow<CachedRegistration?> {
        return repository.observeParticipant(serial)
    }

    fun observeVolunteer(uniqueId: String): Flow<CachedVolunteer?> {
        return volunteerRepository.observeVolunteer(uniqueId)
    }

    fun loadDetails(id: String, isVolunteer: Boolean) {
        viewModelScope.launch {
            try {
                if (isVolunteer) {
                    volunteerRepository.getSingleVolunteer(id)
                } else {
                    repository.getSingleRegistration(id)
                }
            } catch (e: Exception) {
                // Ignore background fetch errors, rely on database observation
            }
        }
    }

    fun updateStatus(serial: String, actionType: String, value: Boolean) {
        viewModelScope.launch {
            isSaving = true
            updateError = null
            val result = repository.updateStatus(serial, actionType, value)
            if (result.isFailure) {
                val ex = result.exceptionOrNull()
                if (ex is retrofit2.HttpException && ex.code() == 403) {
                    updateError = "Access Denied: You do not have permissions to perform this update."
                } else {
                    updateError = ex?.message ?: "Update failed."
                }
            }
            isSaving = false
        }
    }

    fun updateVolunteerStatus(uniqueId: String, actionType: String, value: Boolean) {
        viewModelScope.launch {
            isSaving = true
            updateError = null
            val result = volunteerRepository.updateStatus(uniqueId, actionType, value)
            if (result.isFailure) {
                val ex = result.exceptionOrNull()
                if (ex is retrofit2.HttpException && ex.code() == 403) {
                    updateError = "Access Denied: You do not have permissions to perform this update."
                } else {
                    updateError = ex?.message ?: "Update failed."
                }
            }
            isSaving = false
        }
    }

    fun downloadAdmitCard(context: Context, serial: String, url: String) {
        viewModelScope.launch {
            downloadProgress = 0f
            downloadMessage = null
            withContext(Dispatchers.IO) {
                try {
                    val request = Request.Builder().url(url).build()
                    val response = okHttpClient.newCall(request).execute()
                    if (response.isSuccessful) {
                        val body = response.body
                        if (body != null) {
                            val totalBytes = body.contentLength()
                            val fileName = "NMC26_AdmitCard_${serial}.pdf"
                            
                            val outputStream = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                val contentValues = ContentValues().apply {
                                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                                }
                                val resolver = context.contentResolver
                                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                                if (uri != null) resolver.openOutputStream(uri) else null
                            } else {
                                val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                                val file = File(downloadDir, fileName)
                                FileOutputStream(file)
                            }

                            if (outputStream != null) {
                                outputStream.use { os ->
                                    val buffer = ByteArray(8192)
                                    var bytesRead: Int
                                    var totalBytesRead: Long = 0
                                    body.byteStream().use { input ->
                                        while (input.read(buffer).also { bytesRead = it } != -1) {
                                            os.write(buffer, 0, bytesRead)
                                            totalBytesRead += bytesRead
                                            if (totalBytes > 0) {
                                                downloadProgress = totalBytesRead.toFloat() / totalBytes
                                            }
                                        }
                                    }
                                }
                                withContext(Dispatchers.Main) {
                                    downloadMessage = "Saved"
                                    downloadProgress = null
                                    triggerVibration(context)
                                    Toast.makeText(context, "Saved to Downloads directory", Toast.LENGTH_SHORT).show()
                                }
                            } else {
                                withContext(Dispatchers.Main) {
                                    downloadMessage = "Failed"
                                    downloadProgress = null
                                    Toast.makeText(context, "Could not open Output Stream", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    } else {
                        withContext(Dispatchers.Main) {
                            downloadMessage = "Error"
                            downloadProgress = null
                            Toast.makeText(context, "Error: ${response.code}", Toast.LENGTH_SHORT).show()
                        }
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        downloadMessage = "Failed"
                        downloadProgress = null
                        Toast.makeText(context, "Download failed: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailScreen(
    navController: NavController,
    serial: String,
    fromScan: Boolean = false,
    viewModel: DetailViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val managementMode by viewModel.managementMode.collectAsState()
    val adminRole = viewModel.getAdminRole()

    val isAuthorized by viewModel.isAuthorized.collectAsState()
    LaunchedEffect(isAuthorized) {
        if (!isAuthorized) {
            navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    LaunchedEffect(serial, managementMode) {
        viewModel.loadDetails(serial, isVolunteer = (managementMode == "volunteer"))
    }

    ObsidianGradientBg {
        if (managementMode == "volunteer") {
            // ================= VOLUNTEER DETAIL VIEW =================
            val hasVolAccess = viewModel.getCanManageVolunteers() ||
                               viewModel.getCanManageKit() ||
                               viewModel.getCanManagePresents() ||
                               viewModel.getCanManageLunch()
                               
            if (!hasVolAccess) {
                Scaffold(
                    topBar = {
                        CenterAlignedTopAppBar(
                            title = { Text("Volunteer Details", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                            navigationIcon = {
                                IconButton(onClick = { navController.popBackStack() }) {
                                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = LightText)
                                }
                            },
                            colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.Transparent)
                        )
                    },
                    containerColor = Color.Transparent
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Access Denied: You do not have permissions to view volunteer details.",
                            color = ErrorRed,
                            fontWeight = FontWeight.Bold,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            } else {
                val volunteer by viewModel.observeVolunteer(serial).collectAsState(initial = null)

                Scaffold(
                    topBar = {
                        CenterAlignedTopAppBar(
                            title = { Text("Volunteer Details", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                            navigationIcon = {
                                IconButton(onClick = { navController.popBackStack() }) {
                                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = LightText)
                                }
                            },
                            colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.Transparent)
                        )
                    },
                    containerColor = Color.Transparent
                ) { innerPadding ->
            volunteer?.let { v ->
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Update error warning
                    viewModel.updateError?.let { err ->
                        item {
                            val isAccessDenied = err.contains("Access Denied")
                            val bannerColor = if (isAccessDenied) Color.Red else WarningAmber
                            val bannerText = if (isAccessDenied) err else "Offline Mode: Changes will be locally cached & synced on reconnect. ($err)"
                            Card(
                                colors = CardDefaults.cardColors(containerColor = bannerColor.copy(alpha = 0.15f)),
                                border = BorderStroke(1.dp, bannerColor.copy(alpha = 0.3f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Warning, contentDescription = "Warning status", tint = bannerColor)
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        text = bannerText,
                                        color = LightText,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    // Scan update success banner
                    if (fromScan) {
                        item {
                            val mode = viewModel.activeMode
                            val isUpdateMode = mode != "show_info"
                            val bannerText = if (isUpdateMode) "Scan Update Mode Success" else "Volunteer Info Lookup"
                            val bannerColor = if (isUpdateMode) SuccessGreen else NeonBlue

                            Card(
                                colors = CardDefaults.cardColors(containerColor = bannerColor.copy(alpha = 0.15f)),
                                border = BorderStroke(1.dp, bannerColor.copy(alpha = 0.3f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = if (isUpdateMode) Icons.Default.CheckCircle else Icons.Default.Info,
                                        contentDescription = "Status Banner",
                                        tint = bannerColor
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(text = bannerText, color = LightText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // Profile avatar and info
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GlassSurface),
                            border = BorderStroke(1.dp, GlassBorder),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(RoundedCornerShape(30.dp))
                                            .background(Brush.linearGradient(listOf(NeonViolet, NeonBlue))),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        val initial = (v.name ?: "V").take(1).uppercase()
                                        if (!v.imageUrl.isNullOrBlank()) {
                                            SubcomposeAsyncImage(
                                                model = v.imageUrl,
                                                contentDescription = "Profile Picture",
                                                modifier = Modifier.fillMaxSize(),
                                                contentScale = ContentScale.Crop,
                                                loading = {
                                                    CircularProgressIndicator(color = NeonViolet, modifier = Modifier.size(16.dp))
                                                },
                                                error = {
                                                    Box(
                                                        modifier = Modifier.fillMaxSize(),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(text = initial, color = LightText, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                            )
                                        } else {
                                            Text(text = initial, color = LightText, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column {
                                        Text(text = v.name ?: "Unknown Volunteer", color = LightText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                        val isSuperOrAdmin = adminRole == "superadmin" || adminRole == "super_admin" || adminRole == "admin"
                                        val displayId = if (isSuperOrAdmin) v.uniqueId else (v.serialNo ?: "N/A")
                                        Text("ID / Serial: $displayId", color = GrayText, fontSize = 13.sp)
                                    }
                                }

                                Spacer(modifier = Modifier.height(20.dp))
                                Text("VOLUNTEER DETAILS", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Spacer(modifier = Modifier.height(12.dp))

                                ProfileField(
                                    label = "Email Address",
                                    value = v.email ?: "N/A",
                                    onClick = v.email?.let { email ->
                                        {
                                            val intent = Intent(Intent.ACTION_SENDTO).apply { data = Uri.parse("mailto:$email") }
                                            try { context.startActivity(intent) } catch (e: Exception) { }
                                        }
                                    }
                                )
                                ProfileField(
                                    label = "Phone Number",
                                    value = v.number ?: "N/A",
                                    onClick = v.number?.let { num ->
                                        {
                                            val intent = Intent(Intent.ACTION_DIAL).apply { data = Uri.parse("tel:$num") }
                                            try { context.startActivity(intent) } catch (e: Exception) { }
                                        }
                                    }
                                )
                                ProfileField(label = "Segment / Team", value = v.segment ?: "N/A")
                                ProfileField(label = "Department", value = v.department ?: "N/A")
                                ProfileField(label = "Student ID", value = v.studentId ?: "N/A")
                                ProfileField(label = "Year", value = v.year ?: "N/A")
                                ProfileField(label = "T-Shirt Size", value = v.tShirtSize ?: "N/A")
                            }
                        }
                    }

                    // Status Badges
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            StatusBadge(
                                label = "Gift Status",
                                status = v.isGiftCollected,
                                activeText = "Collected",
                                inactiveText = "Pending",
                                modifier = Modifier.weight(1f)
                            )
                            StatusBadge(
                                label = "Attendance",
                                status = v.isPresent,
                                activeText = "Present",
                                inactiveText = "Absent",
                                modifier = Modifier.weight(1f)
                            )
                            StatusBadge(
                                label = "Lunch served",
                                status = v.isLunchCollected,
                                activeText = "Served",
                                inactiveText = "Pending",
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // Status Overrides
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GlassSurface),
                            border = BorderStroke(1.dp, GlassBorder),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("STATUS OVERRIDES", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Spacer(modifier = Modifier.height(12.dp))

                                val isSuperOrAdmin = adminRole == "superadmin" || adminRole == "super_admin" || adminRole == "admin"

                                val presentGiftEnabled = isSuperOrAdmin && !viewModel.isSaving
                                val lunchEnabled = isSuperOrAdmin && !viewModel.isSaving

                                OverrideSwitchRow(
                                    label = "Gift Collected Override",
                                    checked = v.isGiftCollected,
                                    isSaving = viewModel.isSaving,
                                    enabled = presentGiftEnabled,
                                    onCheckedChange = { checked ->
                                        handleOverride(context, viewModel, serial, "gift", checked)
                                    }
                                )
                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                OverrideSwitchRow(
                                    label = "Attendance Presence Override",
                                    checked = v.isPresent,
                                    isSaving = viewModel.isSaving,
                                    enabled = presentGiftEnabled,
                                    onCheckedChange = { checked ->
                                        handleOverride(context, viewModel, serial, "present", checked)
                                    }
                                )
                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                OverrideSwitchRow(
                                    label = "Lunch Served Override",
                                    checked = v.isLunchCollected,
                                    isSaving = viewModel.isSaving,
                                    enabled = lunchEnabled,
                                    onCheckedChange = { checked ->
                                        handleOverride(context, viewModel, serial, "lunch", checked)
                                    }
                                )

                                if (!isSuperOrAdmin) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "* Access Restricted: Status overrides can only be modified by Admins/Superadmins.",
                                        color = WarningAmber,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }

                    // Audit Info
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GlassSurface),
                            border = BorderStroke(1.dp, GlassBorder),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("AUDIT TRAIL", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "Last Updated By: ${v.updatedBy ?: "System"}", color = LightText, fontSize = 13.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "Updated At: ${formatTimestamp(v.updatedAt)}", color = GrayText, fontSize = 12.sp)
                            }
                        }
                    }

                    // Inline QR Code for Admin/Superadmin (shown directly in personal details)
                    val isSuperOrAdmin = adminRole == "superadmin" || adminRole == "super_admin" || adminRole == "admin"
                    if (isSuperOrAdmin) {
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = GlassSurface),
                                border = BorderStroke(1.dp, GlassBorder),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "VOLUNTEER QR CODE (ADMIN VIEW)",
                                        color = AlertCyan,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.sp
                                    )
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    val qrBitmap = remember(v.uniqueId) { generateQrCodeBitmap(v.uniqueId, 200) }
                                    Image(
                                        bitmap = qrBitmap.asImageBitmap(),
                                        contentDescription = "Volunteer QR Code",
                                        modifier = Modifier
                                            .size(200.dp)
                                            .clip(RoundedCornerShape(16.dp))
                                            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                                            .background(Color.White)
                                            .padding(12.dp)
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = "Scannable Unique ID: ${v.uniqueId}",
                                        color = LightText,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    // Actions
                    item {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.padding(vertical = 12.dp)
                        ) {
                            Button(
                                onClick = {
                                    navController.navigate(Screen.Scanner.route) {
                                        popUpTo(Screen.Dashboard.route)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = NeonViolet),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                            ) {
                                Icon(Icons.Default.QrCodeScanner, contentDescription = "Scanner Icon")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("RESCAN / SCAN NEXT", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } ?: Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = NeonViolet)
            }
        }
    }



    } else {
        // ================= PARTICIPANT DETAIL VIEW =================
        val participant by viewModel.observeParticipant(serial).collectAsState(initial = null)

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("Participant Details", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = LightText)
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.Transparent)
                )
            },
            containerColor = Color.Transparent
        ) { innerPadding ->
            participant?.let { p ->
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    viewModel.updateError?.let { err ->
                        item {
                            val isAccessDenied = err.contains("Access Denied")
                            val bannerColor = if (isAccessDenied) Color.Red else WarningAmber
                            val bannerText = if (isAccessDenied) err else "Offline Mode: Changes will be locally cached & synced on reconnect. ($err)"
                            Card(
                                colors = CardDefaults.cardColors(containerColor = bannerColor.copy(alpha = 0.15f)),
                                border = BorderStroke(1.dp, bannerColor.copy(alpha = 0.3f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.Warning, contentDescription = "Warning status", tint = bannerColor)
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(
                                        text = bannerText,
                                        color = LightText,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }

                    if (fromScan) {
                        item {
                            val mode = viewModel.activeMode
                            val isUpdateMode = mode != "show_info"
                            val bannerText = if (isUpdateMode) "Scan Update Mode Success" else "Participant Info Lookup (Read-Only)"
                            val bannerColor = if (isUpdateMode) SuccessGreen else NeonBlue

                            Card(
                                colors = CardDefaults.cardColors(containerColor = bannerColor.copy(alpha = 0.15f)),
                                border = BorderStroke(1.dp, bannerColor.copy(alpha = 0.3f)),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        imageVector = if (isUpdateMode) Icons.Default.CheckCircle else Icons.Default.Info,
                                        contentDescription = "Status Banner",
                                        tint = bannerColor
                                    )
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(text = bannerText, color = LightText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GlassSurface),
                            border = BorderStroke(1.dp, GlassBorder),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(RoundedCornerShape(30.dp))
                                            .background(Brush.linearGradient(listOf(NeonViolet, NeonBlue))),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        val initial = (p.fullName ?: "U").take(1).uppercase()
                                        Text(text = initial, color = LightText, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column {
                                        Text(text = p.fullName ?: "Unknown Participant", color = LightText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                        Text("Serial: ${p.serial}", color = GrayText, fontSize = 13.sp)
                                    }
                                }

                                Spacer(modifier = Modifier.height(20.dp))
                                Text("PROFILE DETAILS", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Spacer(modifier = Modifier.height(12.dp))

                                ProfileField(
                                    label = "Email Address",
                                    value = p.emailAddress ?: "N/A",
                                    onClick = p.emailAddress?.let { email ->
                                        {
                                            val emailIntent = Intent(Intent.ACTION_SENDTO).apply { data = Uri.parse("mailto:$email") }
                                            try { context.startActivity(emailIntent) } catch (e: Exception) { }
                                        }
                                    }
                                )
                                ProfileField(
                                    label = "Phone Number",
                                    value = p.phoneNumber ?: "N/A",
                                    onClick = p.phoneNumber?.let { phone ->
                                        {
                                            val dialIntent = Intent(Intent.ACTION_DIAL).apply { data = Uri.parse("tel:$phone") }
                                            try { context.startActivity(dialIntent) } catch (e: Exception) { }
                                        }
                                    }
                                )
                                ProfileField(label = "Institution", value = p.institution ?: "N/A")
                                ProfileField(label = "Level / Class", value = "${p.level ?: "N/A"} (${p.classYearStudentOf ?: "N/A"})")
                                ProfileField(label = "Event", value = p.event ?: "N/A")
                                ProfileField(label = "T-Shirt Size", value = p.tShirtSize ?: "N/A")
                                ProfileField(label = "Allocated Room", value = p.allocatedRoom ?: "Pending")
                                ProfileField(label = "Payment Info", value = "${p.paymentMethod ?: "N/A"} - ${p.paymentNumber ?: "N/A"} (TxID: ${p.transactionId ?: "N/A"})")
                            }
                        }
                    }

                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StatusBadge(
                                    label = "Kit Status",
                                    status = p.isKitCollected,
                                    activeText = "Collected",
                                    inactiveText = "Pending",
                                    modifier = Modifier.weight(1f)
                                )
                                StatusBadge(
                                    label = "Attendance",
                                    status = p.isPresent,
                                    activeText = "Present",
                                    inactiveText = "Absent",
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                StatusBadge(
                                    label = "Launch",
                                    status = p.isCollectLaunch,
                                    activeText = "Served",
                                    inactiveText = "Pending",
                                    modifier = Modifier.weight(1f)
                                )
                                StatusBadge(
                                    label = "Breakfast Status",
                                    status = p.isBreakfastCollected,
                                    activeText = "Served",
                                    inactiveText = "Pending",
                                    activeColor = Color(0xFF17A2B8),
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GlassSurface),
                            border = BorderStroke(1.dp, GlassBorder),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("STATUS OVERRIDES", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Spacer(modifier = Modifier.height(12.dp))

                                val isSuperOrAdmin = adminRole == "superadmin" || adminRole == "super_admin" || adminRole == "admin"
                                val overridesEnabled = isSuperOrAdmin && !viewModel.isSaving

                                OverrideSwitchRow(
                                    label = "Kit Collected Override",
                                    checked = p.isKitCollected,
                                    isSaving = viewModel.isSaving,
                                    enabled = overridesEnabled,
                                    onCheckedChange = { checked ->
                                        handleOverride(context, viewModel, serial, "kit", checked)
                                    }
                                )
                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                OverrideSwitchRow(
                                    label = "Attendance Presence Override",
                                    checked = p.isPresent,
                                    isSaving = viewModel.isSaving,
                                    enabled = overridesEnabled,
                                    onCheckedChange = { checked ->
                                        handleOverride(context, viewModel, serial, "present", checked)
                                    }
                                )
                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                OverrideSwitchRow(
                                    label = "Lunch Served Override",
                                    checked = p.isCollectLaunch,
                                    isSaving = viewModel.isSaving,
                                    enabled = overridesEnabled,
                                    onCheckedChange = { checked ->
                                        handleOverride(context, viewModel, serial, "launch", checked)
                                    }
                                )
                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                OverrideSwitchRow(
                                    label = "Breakfast Served Override",
                                    checked = p.isBreakfastCollected,
                                    isSaving = viewModel.isSaving,
                                    enabled = overridesEnabled,
                                    onCheckedChange = { checked ->
                                        handleOverride(context, viewModel, serial, "breakfast", checked)
                                    }
                                )

                                if (!isSuperOrAdmin) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "* Access Restricted: Status overrides can only be modified by Admins/Superadmins.",
                                        color = WarningAmber,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                    }

                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = GlassSurface),
                            border = BorderStroke(1.dp, GlassBorder),
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("AUDIT TRAIL", color = AlertCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(text = "Last Updated By: ${p.updatedBy ?: "System"}", color = LightText, fontSize = 13.sp)
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(text = "Updated At: ${formatTimestamp(p.updatedAt)}", color = GrayText, fontSize = 12.sp)
                            }
                        }
                    }

                    item {
                        Column(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.padding(vertical = 12.dp)
                        ) {
                            if (!p.admitCardUrl.isNullOrBlank()) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    OutlinedButton(
                                        onClick = { navController.navigate(Screen.PdfViewer.createRoute(serial)) },
                                        border = BorderStroke(1.dp, GlassBorder),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LightText),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(50.dp)
                                    ) {
                                        Icon(Icons.Default.PictureAsPdf, contentDescription = "PDF Icon")
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("VIEW PDF", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                    }

                                    Button(
                                        onClick = { viewModel.downloadAdmitCard(context, p.serial, p.admitCardUrl) },
                                        colors = ButtonDefaults.buttonColors(containerColor = NeonBlue),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(50.dp),
                                        enabled = viewModel.downloadProgress == null
                                    ) {
                                        if (viewModel.downloadProgress != null) {
                                            CircularProgressIndicator(color = LightText, modifier = Modifier.size(20.dp))
                                        } else {
                                            Icon(Icons.Default.Download, contentDescription = "Download Icon")
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("DOWNLOAD", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                        }
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    navController.navigate(Screen.Scanner.route) {
                                        popUpTo(Screen.Dashboard.route)
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = NeonViolet),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp)
                            ) {
                                Icon(Icons.Default.QrCodeScanner, contentDescription = "Scanner Icon")
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("RESCAN / SCAN NEXT", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } ?: Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = NeonViolet)
            }
        }
    }
}
}

private fun formatTimestamp(rawTimestamp: String?): String {
    if (rawTimestamp.isNullOrBlank()) return "N/A"
    return try {
        val odt = java.time.OffsetDateTime.parse(rawTimestamp)
        val localDateTime = odt.atZoneSameInstant(java.time.ZoneId.systemDefault())
        val formatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a - EEEE, dd MMMM yyyy", java.util.Locale.getDefault())
        localDateTime.format(formatter)
    } catch (_: Exception) {
        try {
            val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            parser.timeZone = TimeZone.getTimeZone("UTC")
            val date = parser.parse(rawTimestamp)
            if (date != null) {
                val formatter = SimpleDateFormat("hh:mm a - EEEE, dd MMMM yyyy", Locale.getDefault())
                formatter.format(date)
            } else {
                rawTimestamp
            }
        } catch (_: Exception) {
            rawTimestamp
        }
    }
}

private fun handleOverride(
    context: Context,
    viewModel: DetailViewModel,
    serial: String,
    actionType: String,
    value: Boolean
) {
    val isVol = viewModel.managementMode.value == "volunteer"
    if (viewModel.isBiometricEnabled) {
        val activity = context as? FragmentActivity
        if (activity != null && BiometricHelper.isBiometricAvailable(context)) {
            BiometricHelper.showBiometricPrompt(
                activity = activity,
                title = "Authorize Overrides",
                subtitle = "Authenticate to make manual status changes",
                onSuccess = {
                    if (isVol) {
                        val vAction = when (actionType) {
                            "kit" -> "gift"
                            "present" -> "present"
                            "lunch" -> "lunch"
                            else -> actionType
                        }
                        viewModel.updateVolunteerStatus(serial, vAction, value)
                    } else {
                        viewModel.updateStatus(serial, actionType, value)
                    }
                },
                onFailure = { err ->
                    Toast.makeText(context, "Authentication Failed: $err", Toast.LENGTH_SHORT).show()
                }
            )
        } else {
            if (isVol) {
                val vAction = when (actionType) {
                    "kit" -> "gift"
                    "present" -> "present"
                    "lunch" -> "lunch"
                    else -> actionType
                }
                viewModel.updateVolunteerStatus(serial, vAction, value)
            } else {
                viewModel.updateStatus(serial, actionType, value)
            }
        }
    } else {
        if (isVol) {
            val vAction = when (actionType) {
                "kit" -> "gift"
                "present" -> "present"
                "lunch" -> "lunch"
                else -> actionType
            }
            viewModel.updateVolunteerStatus(serial, vAction, value)
        } else {
            viewModel.updateStatus(serial, actionType, value)
        }
    }
}

private fun generateQrCodeBitmap(text: String, size: Int): android.graphics.Bitmap {
    val bitmap = android.graphics.Bitmap.createBitmap(size, size, android.graphics.Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(bitmap)
    val writer = QRCodeWriter()
    try {
        val bitMatrix = writer.encode(text, BarcodeFormat.QR_CODE, size, size)
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

private fun triggerVibration(context: Context) {
    try {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
        if (vibrator != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(200)
            }
        }
    } catch (_: Exception) { }
}

@Composable
fun ProfileField(label: String, value: String, onClick: (() -> Unit)? = null) {
    Column(
        modifier = Modifier
            .padding(vertical = 4.dp)
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
    ) {
        Text(label, color = GrayText, fontSize = 11.sp)
        Text(
            text = value,
            color = if (onClick != null) AlertCyan else LightText,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            textDecoration = if (onClick != null) TextDecoration.Underline else null
        )
    }
}

@Composable
fun StatusBadge(
    label: String,
    status: Boolean,
    activeText: String,
    inactiveText: String,
    activeColor: Color = SuccessGreen,
    inactiveColor: Color = GrayText,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(
            containerColor = if (status) activeColor.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.05f)
        ),
        border = BorderStroke(1.dp, if (status) activeColor.copy(alpha = 0.3f) else GlassBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(label, color = GrayText, fontSize = 10.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = if (status) activeText else inactiveText,
                color = if (status) activeColor else inactiveColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun OverrideSwitchRow(
    label: String,
    checked: Boolean,
    isSaving: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = if (enabled) LightText else GrayText, fontSize = 13.sp)
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            enabled = enabled && !isSaving,
            colors = SwitchDefaults.colors(
                checkedThumbColor = SuccessGreen,
                checkedTrackColor = SuccessGreen.copy(alpha = 0.3f),
                uncheckedThumbColor = GrayText,
                uncheckedTrackColor = GlassSurface
            )
        )
    }
}
