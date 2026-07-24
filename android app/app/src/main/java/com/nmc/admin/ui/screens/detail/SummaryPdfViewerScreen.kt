package com.nmc.admin.ui.screens.detail

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.BuildConfig
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

@HiltViewModel
class SummaryPdfViewerViewModel @Inject constructor(
    private val okHttpClient: OkHttpClient
) : ViewModel() {

    var isLoadingPdf by mutableStateOf(false)
    var pdfLoadError by mutableStateOf<String?>(null)
    var pdfFile by mutableStateOf<File?>(null)

    var downloadProgress by mutableStateOf<Float?>(null)
    var downloadMessage by mutableStateOf<String?>(null)

    fun loadPdf(reportType: String) {
        viewModelScope.launch {
            isLoadingPdf = true
            pdfLoadError = null
            withContext(Dispatchers.IO) {
                try {
                    val baseUrl = BuildConfig.NMC_API_BASE_URL
                    val cleanBaseUrl = if (baseUrl.endsWith("/")) baseUrl.substring(0, baseUrl.length - 1) else baseUrl
                    val url = if (reportType == "volunteer") {
                        "$cleanBaseUrl/admin/volunteers/summary-pdf"
                    } else {
                        "$cleanBaseUrl/admin/registrations/summary-pdf"
                    }

                    val request = Request.Builder()
                        .url(url)
                        .header("Accept", "application/pdf")
                        .build()

                    val response = okHttpClient.newCall(request).execute()
                    if (response.isSuccessful) {
                        val contentType = response.header("Content-Type") ?: ""
                        if (!contentType.contains("application/pdf", ignoreCase = true)) {
                            val errorBody = response.body?.string() ?: ""
                            withContext(Dispatchers.Main) {
                                pdfLoadError = if (errorBody.contains("error")) {
                                    try {
                                        org.json.JSONObject(errorBody).getString("error")
                                    } catch (e: Exception) {
                                        "Error: $errorBody"
                                    }
                                } else {
                                    "Server error: Received content type '$contentType' instead of PDF."
                                }
                            }
                            return@withContext
                        }

                        val body = response.body
                        if (body != null) {
                            val tempFile = File.createTempFile("summary_${reportType}", ".pdf")
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
                        pdfLoadError = "Server returned code ${response.code} loading PDF."
                    }
                } catch (e: Exception) {
                    pdfLoadError = e.message ?: "Failed to load PDF."
                }
            }
            isLoadingPdf = false
        }
    }

    fun downloadPdfReport(reportType: String, context: Context) {
        viewModelScope.launch {
            downloadProgress = 0f
            downloadMessage = null

            withContext(Dispatchers.IO) {
                try {
                    val baseUrl = BuildConfig.NMC_API_BASE_URL
                    val cleanBaseUrl = if (baseUrl.endsWith("/")) baseUrl.substring(0, baseUrl.length - 1) else baseUrl
                    val url = if (reportType == "volunteer") {
                        "$cleanBaseUrl/admin/volunteers/summary-pdf"
                    } else {
                        "$cleanBaseUrl/admin/registrations/summary-pdf"
                    }

                    val request = Request.Builder()
                        .url(url)
                        .header("Accept", "application/pdf")
                        .build()

                    val response = okHttpClient.newCall(request).execute()
                    if (response.isSuccessful) {
                        val contentType = response.header("Content-Type") ?: ""
                        if (!contentType.contains("application/pdf", ignoreCase = true)) {
                            val errorBody = response.body?.string() ?: ""
                            downloadMessage = if (errorBody.contains("error")) {
                                try {
                                    org.json.JSONObject(errorBody).getString("error")
                                } catch (e: Exception) {
                                    "Error: $errorBody"
                                }
                            } else {
                                "Received content type '$contentType' instead of PDF."
                            }
                            return@withContext
                        }

                        val body = response.body
                        if (body != null) {
                            val totalBytes = body.contentLength()
                            val fileName = "NMC26_${reportType.capitalize()}_Summary_Report.pdf"
                            
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
                                val buffer = ByteArray(4096)
                                var bytesRead: Int
                                var downloadedBytes = 0L
                                body.byteStream().use { inputStream ->
                                    outputStream.use { fos ->
                                        while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                                            fos.write(buffer, 0, bytesRead)
                                            downloadedBytes += bytesRead
                                            if (totalBytes > 0) {
                                                downloadProgress = downloadedBytes.toFloat() / totalBytes
                                            }
                                        }
                                    }
                                }
                                downloadMessage = "Saved to Downloads folder."
                            } else {
                                downloadMessage = "Failed to open output stream."
                            }
                        } else {
                            downloadMessage = "Response body is empty."
                        }
                    } else {
                        downloadMessage = "Server returned code ${response.code}"
                    }
                } catch (e: Exception) {
                    downloadMessage = e.message ?: "Failed to download."
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SummaryPdfViewerScreen(
    navController: NavController,
    reportType: String,
    viewModel: SummaryPdfViewerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var pdfBitmaps by remember { mutableStateOf<List<Bitmap>>(emptyList()) }

    LaunchedEffect(reportType) {
        viewModel.loadPdf(reportType)
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
                        
                        // summary report is landscape, so double width for rendering to maintain quality
                        val width = page.width * 2
                        val height = page.height * 2
                        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
                        
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
                    withContext(Dispatchers.Main) {
                        viewModel.pdfLoadError = "Renderer error: ${e.message}"
                    }
                }
            }
        }
    }

    LaunchedEffect(viewModel.downloadMessage) {
        viewModel.downloadMessage?.let { msg ->
            Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            viewModel.downloadMessage = null
            viewModel.downloadProgress = null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        text = if (reportType == "volunteer") "Volunteer Summary Report" else "Participant Summary Report",
                        color = LightText,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = LightText)
                    }
                },
                actions = {
                    if (viewModel.pdfFile != null) {
                        IconButton(onClick = { viewModel.downloadPdfReport(reportType, context) }) {
                            Icon(Icons.Default.Download, contentDescription = "Download Report", tint = SuccessGreen)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = ObsidianBg)
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(ObsidianBg)
                .padding(padding)
        ) {
            if (viewModel.isLoadingPdf) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(color = NeonViolet)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Loading Summary PDF...", color = LightText)
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
                        text = viewModel.pdfLoadError ?: "Failed to display report.",
                        color = ErrorRed,
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = { viewModel.loadPdf(reportType) },
                        colors = ButtonDefaults.buttonColors(containerColor = NeonViolet)
                    ) {
                        Text("Retry", color = LightText)
                    }
                }
            } else if (pdfBitmaps.isNotEmpty()) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    itemsIndexed(pdfBitmaps) { _, bitmap ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(GlassSurface)
                                .border(1.dp, GlassBorder, RoundedCornerShape(12.dp))
                                .padding(4.dp)
                        ) {
                            Image(
                                bitmap = bitmap.asImageBitmap(),
                                contentDescription = "Page summary",
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(bitmap.width.toFloat() / bitmap.height.toFloat())
                            )
                        }
                    }
                }
            }

            // Download progress indicator overlay
            viewModel.downloadProgress?.let { progress ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.6f)),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = ObsidianBg),
                        border = BorderStroke(1.dp, GlassBorder)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            CircularProgressIndicator(progress = { progress }, color = NeonViolet)
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "Saving Report: ${(progress * 100).toInt()}%",
                                color = LightText,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}
