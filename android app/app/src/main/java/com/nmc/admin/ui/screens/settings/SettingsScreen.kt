package com.nmc.admin.ui.screens.settings

import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.logging.AuditLogger
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import androidx.compose.material.icons.filled.Lock
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsDataStore: SettingsDataStore,
    private val auditLogger: AuditLogger
) : ViewModel() {

    var activeMode by mutableStateOf("kit")
    var isShowInfoEnabled by mutableStateOf(true)
    var isBiometricEnabled by mutableStateOf(false)
    var logContents by mutableStateOf("")

    val managementMode = settingsDataStore.managementModeFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, "participant")

    val canManageVolunteers = settingsDataStore.canManageVolunteersFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    val canManageKit = settingsDataStore.canManageKitFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    val canManagePresents = settingsDataStore.canManagePresentsFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    val canManageLunch = settingsDataStore.canManageLunchFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    val canManageBreakfast = settingsDataStore.canManageBreakfastFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    init {
        viewModelScope.launch {
            settingsDataStore.scanModeFlow.collectLatest { mode ->
                val allowed = when (mode) {
                    "kit" -> settingsDataStore.canManageKitFlow.first()
                    "present" -> settingsDataStore.canManagePresentsFlow.first()
                    "launch" -> settingsDataStore.canManageLunchFlow.first()
                    "breakfast" -> settingsDataStore.canManageBreakfastFlow.first()
                    else -> true
                }
                if (!allowed) {
                    settingsDataStore.saveScanMode("show_info")
                } else {
                    activeMode = mode
                }
            }
        }
        viewModelScope.launch {
            settingsDataStore.showInfoFlow.collectLatest { isShowInfoEnabled = it }
        }
        viewModelScope.launch {
            settingsDataStore.biometricEnabledFlow.collectLatest { isBiometricEnabled = it }
        }
    }

    fun saveScanMode(mode: String) {
        viewModelScope.launch {
            settingsDataStore.saveScanMode(mode)
        }
    }

    fun saveShowInfo(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.saveShowInfo(enabled)
        }
    }

    fun saveBiometricEnabled(enabled: Boolean) {
        viewModelScope.launch {
            settingsDataStore.saveBiometricEnabled(enabled)
        }
    }

    fun saveManagementMode(mode: String) {
        viewModelScope.launch {
            settingsDataStore.saveManagementMode(mode)
        }
    }


    fun loadLogs() {
        logContents = auditLogger.readLogs()
    }

    fun shareLogs(context: Context) {
        val zipFile = auditLogger.exportLogsToZip()
        if (zipFile != null && zipFile.exists()) {
            val uri = FileProvider.getUriForFile(
                context,
                "com.nmc.admin.fileprovider",
                zipFile
            )
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/zip"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(Intent.createChooser(intent, "Share Diagnostic Audit Logs"))
        } else {
            Toast.makeText(context, "No log trail found.", Toast.LENGTH_SHORT).show()
        }
    }

    fun clearLogs(context: Context) {
        auditLogger.clearLogs()
        logContents = ""
        Toast.makeText(context, "Audit logs cleared successfully.", Toast.LENGTH_SHORT).show()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    navController: NavController,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    
    val canManageVolunteers by viewModel.canManageVolunteers.collectAsState()
    val canManageKit by viewModel.canManageKit.collectAsState()
    val canManagePresents by viewModel.canManagePresents.collectAsState()
    val canManageLunch by viewModel.canManageLunch.collectAsState()
    val canManageBreakfast by viewModel.canManageBreakfast.collectAsState()
    val managementMode by viewModel.managementMode.collectAsState()

    val modes = if (managementMode == "volunteer") {
        listOf(
            "kit" to "Kit Distributions Mode",
            "present" to "Attendance / Presence Mode",
            "launch" to "Lunch Servings Mode",
            "show_info" to "Show Info Lookup Mode (Read-Only)"
        )
    } else {
        listOf(
            "kit" to "Kit Distributions Mode",
            "present" to "Attendance / Presence Mode",
            "launch" to "Launch served Mode",
            "breakfast" to "Breakfast Collection Mode",
            "show_info" to "Show Info Lookup Mode (Read-Only)"
        )
    }

    var showLogsDialog by remember { mutableStateOf(false) }

    ObsidianGradientBg {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("Scanner Settings", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Switch Management target (Restricted to permitted users only)
            if (canManageVolunteers) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = GlassSurface),
                    border = BorderStroke(1.dp, GlassBorder),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "MANAGEMENT TARGET",
                            color = AlertCyan,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Manage Volunteers", color = LightText, fontSize = 14.sp)
                                Text("Switch check-ins tracking from Participant to Volunteer targets", color = GrayText, fontSize = 11.sp)
                            }
                            Switch(
                                checked = managementMode == "volunteer",
                                onCheckedChange = { checked ->
                                    val newMode = if (checked) "volunteer" else "participant"
                                    viewModel.saveManagementMode(newMode)
                                },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = SuccessGreen,
                                    checkedTrackColor = SuccessGreen.copy(alpha = 0.3f)
                                )
                            )
                        }
                    }
                }
            }



            // Scanner Modes Group
            Card(
                colors = CardDefaults.cardColors(containerColor = GlassSurface),
                border = BorderStroke(1.dp, GlassBorder),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .selectableGroup()
                ) {
                    Text(
                        text = "ACTIVE SCAN TARGET MODE",
                        color = AlertCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    modes.forEach { (modeKey, modeTitle) ->
                        val selected = viewModel.activeMode == modeKey
                        val isEnabled = when (modeKey) {
                            "kit" -> canManageKit
                            "present" -> canManagePresents
                            "launch" -> canManageLunch
                            "breakfast" -> canManageBreakfast
                            else -> true
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                                .selectable(
                                    selected = selected,
                                    onClick = { if (isEnabled) viewModel.saveScanMode(modeKey) },
                                    role = Role.RadioButton,
                                    enabled = isEnabled
                                ),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selected,
                                onClick = null,
                                enabled = isEnabled,
                                colors = RadioButtonDefaults.colors(
                                    selectedColor = NeonViolet,
                                    unselectedColor = GrayText
                                )
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = modeTitle,
                                color = if (isEnabled) LightText else GrayText.copy(alpha = 0.5f),
                                fontSize = 14.sp,
                                modifier = Modifier.weight(1f)
                            )
                            if (!isEnabled) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "Restricted Option",
                                    tint = GrayText.copy(alpha = 0.6f),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }

            // General Configs Card
            Card(
                colors = CardDefaults.cardColors(containerColor = GlassSurface),
                border = BorderStroke(1.dp, GlassBorder),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "GENERAL OPTIONS",
                        color = AlertCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    // Parallel Detail View Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Show Details Parallel", color = LightText, fontSize = 14.sp)
                            Text("Open details view automatically after status changes", color = GrayText, fontSize = 11.sp)
                        }
                        Switch(
                            checked = viewModel.isShowInfoEnabled,
                            onCheckedChange = { viewModel.saveShowInfo(it) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = SuccessGreen,
                                checkedTrackColor = SuccessGreen.copy(alpha = 0.3f)
                            )
                        )
                    }

                    HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 12.dp))

                    // Biometric Authentication Toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Biometric Security Lock", color = LightText, fontSize = 14.sp)
                            Text("Requires lock confirmation on overrides & app launch", color = GrayText, fontSize = 11.sp)
                        }
                        Switch(
                            checked = viewModel.isBiometricEnabled,
                            onCheckedChange = { viewModel.saveBiometricEnabled(it) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = SuccessGreen,
                                checkedTrackColor = SuccessGreen.copy(alpha = 0.3f)
                            )
                        )
                    }
                }
            }

            // Diagnostics Card
            Card(
                colors = CardDefaults.cardColors(containerColor = GlassSurface),
                border = BorderStroke(1.dp, GlassBorder),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "DIAGNOSTICS & AUDIT TRAIL",
                        color = AlertCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    // View Logs Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.loadLogs()
                                showLogsDialog = true
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("View Diagnostic Logs", color = LightText, fontSize = 14.sp)
                            Text("Inspect raw local audit trail entries directly", color = GrayText, fontSize = 11.sp)
                        }
                    }

                    HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))

                    // Share Logs Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.shareLogs(context) }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Share Diagnostic Logs", color = LightText, fontSize = 14.sp)
                            Text("Export and email base64-obfuscated audit trails", color = GrayText, fontSize = 11.sp)
                        }
                    }

                    HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))

                    // Clear Logs Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { viewModel.clearLogs(context) }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Clear Audit Logs", color = ErrorRed, fontSize = 14.sp)
                            Text("Delete the encrypted log trail permanently", color = GrayText, fontSize = 11.sp)
                        }
                    }
                }
            }

            // Navigate to About
            Card(
                colors = CardDefaults.cardColors(containerColor = GlassSurface),
                border = BorderStroke(1.dp, GlassBorder),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { navController.navigate(Screen.About.route) }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Info, contentDescription = "Info", tint = NeonViolet)
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text("About Application", color = LightText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("Version details, developer credit, and app info", color = GrayText, fontSize = 11.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Scrollable Logs Dialog Modal
    if (showLogsDialog) {
        AlertDialog(
            onDismissRequest = { showLogsDialog = false },
            title = { Text("Diagnostic Log Audit Trail", color = LightText, fontWeight = FontWeight.Bold) },
            text = {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(350.dp)
                        .border(1.dp, GlassBorder, RoundedCornerShape(8.dp))
                        .background(ObsidianBg)
                        .padding(8.dp)
                ) {
                    val scrollState = rememberScrollState()
                    Text(
                        text = if (viewModel.logContents.isBlank()) "No log entries found." else viewModel.logContents,
                        color = LightText,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { showLogsDialog = false }) {
                    Text("CLOSE", color = NeonViolet, fontWeight = FontWeight.Bold)
                }
            },
            containerColor = ObsidianBg
        )
    }
}
}
