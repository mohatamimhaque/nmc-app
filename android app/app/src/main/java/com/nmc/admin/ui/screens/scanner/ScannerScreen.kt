package com.nmc.admin.ui.screens.scanner

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Vibrator
import android.view.ViewGroup
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import kotlin.OptIn
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.FlashOff
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.data.repository.VolunteerRepository
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ScannerViewModel @Inject constructor(
    private val repository: RegistrationRepository,
    private val volunteerRepository: VolunteerRepository,
    private val settingsDataStore: SettingsDataStore,
    private val encryptedPrefs: EncryptedPrefs
) : ViewModel() {

    var activeMode by mutableStateOf("kit")
    var managementMode by mutableStateOf("participant")
    var isShowInfoStandalone by mutableStateOf(false)
    var isProcessing by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)
    var warningType by mutableStateOf<String?>(null) // "already_processed" or "invalid"
    var lastScannedSerial by mutableStateOf("")

    val isAuthorized = repository.isAuthorized

    init {
        viewModelScope.launch {
            settingsDataStore.scanModeFlow.collectLatest {
                activeMode = it
            }
        }
        viewModelScope.launch {
            settingsDataStore.managementModeFlow.collectLatest {
                managementMode = it
            }
        }
        viewModelScope.launch {
            combine(
                settingsDataStore.scanModeFlow,
                settingsDataStore.showInfoFlow
            ) { mode, showInfo ->
                mode == "show_info" && showInfo
            }.collectLatest {
                isShowInfoStandalone = it
            }
        }
    }

    fun processScannedSerial(serial: String, onSuccess: (String) -> Unit) {
        if (isProcessing) return
        isProcessing = true
        errorMessage = null
        warningType = null
        lastScannedSerial = serial

        val isVol = managementMode == "volunteer"
        val mode = activeMode

        viewModelScope.launch {
            val canManageVol = settingsDataStore.canManageVolunteersFlow.first()
            val canManageReg = settingsDataStore.canManageRegistrationsFlow.first()
            val role = encryptedPrefs.getAdminRole() ?: ""
            val isSuperOrAdmin = role == "superadmin" || role == "super_admin" || role == "admin"
            val isEditor = role == "registration_editor"
            val isVolunteer = role == "volunteer"

            if (mode != "show_info") {
                if (isVol) {
                    val allowed = isSuperOrAdmin || isEditor || canManageVol || isVolunteer
                    if (!allowed) {
                        errorMessage = "Access Restricted: You do not have permission to manage volunteers."
                        isProcessing = false
                        return@launch
                    }
                } else {
                    val canManageKit = settingsDataStore.canManageKitFlow.first()
                    val canManagePresents = settingsDataStore.canManagePresentsFlow.first()
                    val canManageLunch = settingsDataStore.canManageLunchFlow.first()
                    val canManageBreakfast = settingsDataStore.canManageBreakfastFlow.first()
                    
                    val hasSpecificPermission = when (mode) {
                        "kit" -> canManageKit
                        "present" -> canManagePresents
                        "launch" -> canManageLunch
                        "breakfast" -> canManageBreakfast
                        else -> false
                    }
                    
                    val allowed = isSuperOrAdmin || isEditor || canManageReg || hasSpecificPermission
                    if (!allowed) {
                        errorMessage = "Access Restricted: You do not have permission to manage participants in this mode."
                        isProcessing = false
                        return@launch
                    }
                }
            }

            if (isVol) {
                // VOLUNTEER LOOKUP
                val result = volunteerRepository.getSingleVolunteer(serial)
                if (result.isFailure) {
                    errorMessage = "Invalid QR code. Volunteer not found."
                    warningType = "invalid"
                    isProcessing = false
                    return@launch
                }

                val volunteer = result.getOrNull()
                if (volunteer == null) {
                    errorMessage = "Invalid QR code. Volunteer not found."
                    warningType = "invalid"
                    isProcessing = false
                    return@launch
                }

                // SECURITY CHECK:
                // Volunteers are only allowed to scan using the 'serial' ID.
                // Scanning a 'unique_id' QR code is blocked for other volunteers.
                if (isVolunteer && serial == volunteer.uniqueId) {
                    errorMessage = "Access Restricted: Volunteers cannot scan other volunteers' Unique ID QR codes."
                    isProcessing = false
                    return@launch
                }

                if (mode == "show_info") {
                    onSuccess(serial)
                } else {
                    // Check if already checked in
                    val alreadyCollected = when (mode) {
                        "kit" -> volunteer.isGiftCollected
                        "present" -> volunteer.isPresent
                        "launch" -> volunteer.isLunchCollected
                        else -> false
                    }

                    if (alreadyCollected) {
                        val modeText = when (mode) {
                            "kit" -> "Gift Distribution"
                            "present" -> "Attendance"
                            "launch" -> "Lunch served"
                            else -> "Target mode"
                        }
                        errorMessage = "Warning: Already checked in for $modeText!"
                        warningType = "already_processed"
                        isProcessing = false
                    } else {
                        // Update status
                        val vAction = when (mode) {
                            "kit" -> "gift"
                            "present" -> "present"
                            "launch" -> "lunch"
                            else -> mode
                        }
                        val updateResult = volunteerRepository.updateStatus(serial, vAction, true)
                        if (updateResult.isSuccess) {
                            onSuccess(serial)
                        } else {
                            val ex = updateResult.exceptionOrNull()
                            if (ex is retrofit2.HttpException && ex.code() == 403) {
                                errorMessage = "Access Denied: You do not have permissions to perform this update."
                                warningType = null
                            } else if (ex is retrofit2.HttpException && ex.code() == 401) {
                                repository.logout()
                            } else {
                                errorMessage = ex?.message ?: "Update failed"
                            }
                            isProcessing = false
                        }
                    }
                }
            } else {
                // PARTICIPANT LOOKUP
                val result = repository.getSingleRegistration(serial)
                if (result.isFailure) {
                    errorMessage = "Invalid QR code. Participant not found."
                    warningType = "invalid"
                    isProcessing = false
                    return@launch
                }

                val participant = result.getOrNull()
                if (participant == null) {
                    errorMessage = "Invalid QR code. Participant not found."
                    warningType = "invalid"
                    isProcessing = false
                    return@launch
                }

                if (mode == "show_info") {
                    onSuccess(serial)
                } else {
                    val alreadyCollected = when (mode) {
                        "kit" -> participant.isKitCollected
                        "present" -> participant.isPresent
                        "launch" -> participant.isCollectLaunch
                        "breakfast" -> participant.isBreakfastCollected
                        else -> false
                    }

                    if (alreadyCollected) {
                        val modeText = when (mode) {
                            "kit" -> "Kit Collection"
                            "present" -> "Attendance"
                            "launch" -> "Launch served"
                            "breakfast" -> "Breakfast served"
                            else -> "Target mode"
                        }
                        errorMessage = "Warning: Already checked in for $modeText!"
                        warningType = "already_processed"
                        isProcessing = false
                    } else {
                        val updateResult = repository.updateStatus(serial, mode, true)
                        if (updateResult.isSuccess) {
                            onSuccess(serial)
                        } else {
                            val ex = updateResult.exceptionOrNull()
                            if (ex is retrofit2.HttpException && ex.code() == 403) {
                                errorMessage = "Access Denied: You do not have permissions to perform this update."
                                warningType = null
                            } else if (ex is retrofit2.HttpException && ex.code() == 401) {
                                repository.logout()
                            } else {
                                errorMessage = ex?.message ?: "Update failed"
                            }
                            isProcessing = false
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalGetImage::class)
class QrCodeAnalyzer(
    private val onQrCodeDetected: (String) -> Unit
) : ImageAnalysis.Analyzer {
    private val scanner = BarcodeScanning.getClient()

    override fun analyze(imageProxy: ImageProxy) {
        val mediaImage = imageProxy.image
        if (mediaImage != null) {
            val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
            scanner.process(image)
                .addOnSuccessListener { barcodes ->
                    for (barcode in barcodes) {
                        val rawValue = barcode.rawValue
                        if (!rawValue.isNullOrBlank()) {
                            onQrCodeDetected(rawValue)
                            break
                        }
                    }
                }
                .addOnFailureListener { }
                .addOnCompleteListener {
                    imageProxy.close()
                }
        } else {
            imageProxy.close()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScannerScreen(
    navController: NavController,
    viewModel: ScannerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val isAuthorized by viewModel.isAuthorized.collectAsState()
    LaunchedEffect(isAuthorized) {
        if (!isAuthorized) {
            navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission(),
        onResult = { granted ->
            hasCameraPermission = granted
        }
    )

    LaunchedEffect(key1 = true) {
        if (!hasCameraPermission) {
            launcher.launch(Manifest.permission.CAMERA)
        }
    }

    var flashEnabled by remember { mutableStateOf(false) }
    var manualSerial by remember { mutableStateOf("") }
    var isScanActive by remember { mutableStateOf(true) }
    var camera: Camera? by remember { mutableStateOf(null) }

    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    val infiniteTransition = rememberInfiniteTransition(label = "scanner_line")
    val animatedOffsetY by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(2200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scanner_offset"
    )

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    val isVol = viewModel.managementMode == "volunteer"
                    Text(
                        text = when (viewModel.activeMode) {
                            "kit" -> if (isVol) "Gift Distribution Mode" else "Kit Collection Mode"
                            "present" -> "Attendance Verification"
                            "launch" -> if (isVol) "Lunch Servings Mode" else "Launch Servings Mode"
                            "breakfast" -> "Breakfast Collection Mode"
                            else -> "Participant Info Lookup"
                        },
                        color = LightText,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = LightText
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        flashEnabled = !flashEnabled
                        camera?.cameraControl?.enableTorch(flashEnabled)
                    }) {
                        Icon(
                            imageVector = if (flashEnabled) Icons.Default.FlashOn else Icons.Default.FlashOff,
                            contentDescription = "Toggle Torch",
                            tint = if (flashEnabled) AlertCyan else LightText
                        )
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = ObsidianBg)
            )
        },
        containerColor = ObsidianBg
    ) { innerPadding ->
        if (hasCameraPermission) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                AndroidView(
                    factory = { ctx ->
                        val previewView = PreviewView(ctx).apply {
                            scaleType = PreviewView.ScaleType.FILL_CENTER
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                        }

                        val executor = ContextCompat.getMainExecutor(ctx)
                        cameraProviderFuture.addListener({
                            val cameraProvider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build().also {
                                it.setSurfaceProvider(previewView.surfaceProvider)
                            }

                            val imageAnalysis = ImageAnalysis.Builder()
                                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                .build()
                                .also { analysis ->
                                    analysis.setAnalyzer(
                                        executor,
                                        QrCodeAnalyzer { rawValue ->
                                            if (isScanActive && !viewModel.isProcessing) {
                                                isScanActive = false
                                                val vibrator = ctx.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                                                vibrator?.vibrate(100)

                                                viewModel.processScannedSerial(rawValue) { serial ->
                                                    navController.navigate(Screen.Detail.createRoute(serial, fromScan = true)) {
                                                        popUpTo(Screen.Scanner.route) { inclusive = true }
                                                    }
                                                }
                                            }
                                        }
                                    )
                                }

                            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                            try {
                                cameraProvider.unbindAll()
                                camera = cameraProvider.bindToLifecycle(
                                    lifecycleOwner,
                                    cameraSelector,
                                    preview,
                                    imageAnalysis
                                )
                                camera?.cameraControl?.enableTorch(flashEnabled)
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }, executor)

                        previewView
                    },
                    modifier = Modifier.fillMaxSize()
                )

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.5f)),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(260.dp)
                            .border(2.dp, NeonViolet, RoundedCornerShape(24.dp))
                            .clip(RoundedCornerShape(24.dp))
                            .background(Color.Transparent)
                    ) {
                        val lineY = 260.dp * animatedOffsetY
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(2.dp)
                                .offset(y = lineY)
                                .background(
                                    Brush.horizontalGradient(
                                        listOf(
                                            Color.Transparent,
                                            AlertCyan,
                                            AlertCyan,
                                            Color.Transparent
                                        )
                                    )
                                )
                        )
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .padding(24.dp)
                        .background(ObsidianBg.copy(alpha = 0.85f), RoundedCornerShape(16.dp))
                        .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    if (viewModel.isProcessing) {
                        CircularProgressIndicator(color = NeonViolet)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "Processing scan automatically...",
                            color = LightText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    } else {
                        Text(
                            text = "Align QR Code inside neon frame",
                            color = LightText,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = manualSerial,
                            onValueChange = { manualSerial = it },
                            label = { Text("Manual Serial Entry Fallback", color = GrayText) },
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(onDone = {
                                if (manualSerial.isNotBlank()) {
                                    viewModel.processScannedSerial(manualSerial.trim()) { serial ->
                                        navController.navigate(Screen.Detail.createRoute(serial, fromScan = true)) {
                                            popUpTo(Screen.Scanner.route) { inclusive = true }
                                        }
                                    }
                                }
                            }),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = LightText,
                                unfocusedTextColor = LightText,
                                focusedBorderColor = NeonViolet,
                                unfocusedBorderColor = GlassBorder,
                                focusedContainerColor = GlassSurface,
                                unfocusedContainerColor = GlassSurface
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        viewModel.errorMessage?.let { error ->
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(error, color = if (viewModel.warningType == "already_processed") WarningAmber else ErrorRed, fontSize = 13.sp, textAlign = TextAlign.Center)
                            Spacer(modifier = Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Button(
                                    onClick = {
                                        viewModel.errorMessage = null
                                        viewModel.warningType = null
                                        isScanActive = true
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = NeonBlue),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Text("Rescan", color = LightText)
                                }

                                if (viewModel.warningType == "already_processed") {
                                    OutlinedButton(
                                        onClick = {
                                            val serial = viewModel.lastScannedSerial
                                            viewModel.errorMessage = null
                                            viewModel.warningType = null
                                            navController.navigate(Screen.Detail.createRoute(serial, fromScan = true)) {
                                                popUpTo(Screen.Scanner.route) { inclusive = true }
                                            }
                                        },
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LightText),
                                        border = BorderStroke(1.dp, GlassBorder),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("View Details", fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Camera permission is required to scan QR codes.",
                    color = ErrorRed,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(24.dp)
                )
            }
        }
    }
}
