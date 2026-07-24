package com.nmc.admin.ui.screens.detail

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.os.Vibrator
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.data.local.entities.CachedRegistration
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

@HiltViewModel
class PdfViewerViewModel @Inject constructor(
    private val repository: RegistrationRepository,
    private val okHttpClient: OkHttpClient
) : ViewModel() {

    var isLoadingPdf by mutableStateOf(false)
    var pdfLoadError by mutableStateOf<String?>(null)
    var pdfFile by mutableStateOf<File?>(null)

    var downloadProgress by mutableStateOf<Float?>(null)
    var downloadMessage by mutableStateOf<String?>(null)

    fun observeParticipant(serial: String): Flow<CachedRegistration?> {
        return repository.observeParticipant(serial)
    }

    fun loadPdf(url: String, serial: String) {
        viewModelScope.launch {
            isLoadingPdf = true
            pdfLoadError = null
            withContext(Dispatchers.IO) {
                try {
                    val request = Request.Builder().url(url).build()
                    val response = okHttpClient.newCall(request).execute()
                    if (response.isSuccessful) {
                        val body = response.body
                        if (body != null) {
                            val tempFile = File.createTempFile("admit_card_${serial}", ".pdf")
                            tempFile.deleteOnExit()
                            FileOutputStream(tempFile).use { fos ->
                                body.byteStream().copyTo(fos)
                            }
                            withContext(Dispatchers.Main) {
                                pdfFile = tempFile
                            }
                        } else {
                            pdfLoadError = "Response body is empty."
                        }
                    } else {
                        pdfLoadError = "Server error code ${response.code} loading PDF."
                    }
                } catch (e: Exception) {
                    pdfLoadError = e.message ?: "Failed to load PDF."
                }
            }
            isLoadingPdf = false
        }
    }

    fun downloadAdmitCard(serial: String, url: String, context: Context) {
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
                                    downloadMessage = "Saved to Downloads"
                                    downloadProgress = null
                                    
                                    val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                                    vibrator?.vibrate(200)
                                }
                            } else {
                                downloadMessage = "Could not create file."
                                downloadProgress = null
                            }
                        }
                    } else {
                        downloadMessage = "Server returned error ${response.code}"
                        downloadProgress = null
                    }
                } catch (e: Exception) {
                    downloadMessage = e.message ?: "Failed to save file."
                    downloadProgress = null
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PdfViewerScreen(
    navController: NavController,
    serial: String,
    viewModel: PdfViewerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val participant by viewModel.observeParticipant(serial).collectAsState(initial = null)

    var pdfBitmaps by remember { mutableStateOf<List<Bitmap>>(emptyList()) }

    LaunchedEffect(participant) {
        participant?.admitCardUrl?.let { url ->
            viewModel.loadPdf(url, serial)
        }
    }

    LaunchedEffect(viewModel.pdfFile) {
        viewModel.pdfFile?.let { file ->
            withContext(Dispatchers.IO) {
                try {
                    val fileDescriptor = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY)
                    val pdfRenderer = PdfRenderer(fileDescriptor)
                    val bitmaps = mutableListOf<Bitmap>()
                    
                    for (i in 0 until pdfRenderer.pageCount) {
                        val page = pdfRenderer.openPage(i)
                        val bitmap = Bitmap.createBitmap(page.width * 2, page.height * 2, Bitmap.Config.ARGB_8888)
                        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                        bitmaps.add(bitmap)
                        page.close()
                    }
                    
                    pdfRenderer.close()
                    fileDescriptor.close()
                    
                    withContext(Dispatchers.Main) {
                        pdfBitmaps = bitmaps
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    LaunchedEffect(viewModel.downloadMessage) {
        viewModel.downloadMessage?.let { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            viewModel.downloadMessage = null
        }
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Admit Card", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = LightText)
                    }
                },
                actions = {
                    participant?.admitCardUrl?.let { url ->
                        IconButton(
                            onClick = { viewModel.downloadAdmitCard(serial, url, context) },
                            enabled = viewModel.downloadProgress == null
                        ) {
                            Icon(Icons.Default.Download, contentDescription = "Download Admit Card", tint = LightText)
                        }
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = ObsidianBg)
            )
        },
        containerColor = ObsidianBg
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            if (viewModel.isLoadingPdf) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(color = NeonViolet)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Loading Admit Card...", color = GrayText, fontSize = 14.sp)
                }
            } else if (viewModel.pdfLoadError != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = viewModel.pdfLoadError ?: "Failed to display PDF.",
                        color = ErrorRed,
                        textAlign = TextAlign.Center,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            participant?.admitCardUrl?.let { url ->
                                viewModel.loadPdf(url, serial)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = NeonViolet)
                    ) {
                        Text("Retry", color = LightText)
                    }
                }
            } else if (pdfBitmaps.isNotEmpty()) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    itemsIndexed(pdfBitmaps) { _, bitmap ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = BorderStroke(1.dp, GlassBorder),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .wrapContentHeight()
                        ) {
                            ZoomableImage(bitmap = bitmap)
                        }
                    }
                }
            }

            // Download Progress Bar Overlay
            viewModel.downloadProgress?.let { progress ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.5f)),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .background(ObsidianBg, RoundedCornerShape(16.dp))
                            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                            .padding(24.dp)
                    ) {
                        CircularProgressIndicator(progress = progress, color = NeonViolet)
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Downloading Admit Card: ${(progress * 100).toInt()}%",
                            color = LightText,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ZoomableImage(bitmap: Bitmap) {
    var scale by remember { mutableStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }

    Image(
        bitmap = bitmap.asImageBitmap(),
        contentDescription = "Admit Card Page",
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 4f)
                    offset = if (scale == 1f) Offset.Zero else offset + pan
                }
            }
            .graphicsLayer(
                scaleX = scale,
                scaleY = scale,
                translationX = offset.x,
                translationY = offset.y
            )
    )
}
