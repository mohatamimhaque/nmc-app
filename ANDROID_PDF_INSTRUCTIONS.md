# NMC 2026 Admin Android App - PDF Summary Viewer Integration Instructions

This document provides instructions for the Android application developer on how to consume the updated PDF summary endpoints. 

The backend has been updated to generate and return a **standard binary PDF stream** instead of HTML. 

---

## 1. API Endpoints

Both endpoints require authorization and return a raw binary PDF buffer (`Content-Type: application/pdf`).

### A. Participant Summary PDF
*   **Method / Route**: `GET /api/admin/registrations/summary-pdf`
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Response Content-Type**: `application/pdf`
*   **Content-Disposition**: `inline; filename="Participant_Summary_Report_2026.pdf"`

### B. Volunteer Summary PDF
*   **Method / Route**: `GET /api/admin/volunteers/summary-pdf`
*   **Headers**: `Authorization: Bearer <access_token>`
*   **Response Content-Type**: `application/pdf`
*   **Content-Disposition**: `inline; filename="Volunteer_Summary_Report_2026.pdf"`

---

## 2. Retrofit Client Interface (Kotlin)

When writing your network interface, mark the download methods with `@Streaming` to prevent Retrofit from buffering the entire file into memory at once, which could cause `OutOfMemoryError` on large data sizes.

```kotlin
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.Streaming

interface SummaryApiService {
    @Streaming
    @GET("admin/registrations/summary-pdf")
    suspend fun downloadParticipantSummary(
        @Header("Authorization") token: String
    ): Response<ResponseBody>

    @Streaming
    @GET("admin/volunteers/summary-pdf")
    suspend fun downloadVolunteerSummary(
        @Header("Authorization") token: String
    ): Response<ResponseBody>
}
```

---

## 3. How to Consume & Render in Android

Do **NOT** attempt to render these URLs directly in a standard `WebView`, as Android `WebView` does not support raw binary PDF rendering without external web proxies. Instead, use one of the two standard approaches below:

### Approach A: Natively Render inside Compose with `PdfRenderer` (Recommended)
This approach reads the downloaded PDF file from the device cache/filesystem and draws it onto an Jetpack Compose `Image` component.

```kotlin
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

@Composable
fun PdfSummaryViewer(pdfFile: File, modifier: Modifier = Modifier) {
    var bitmap by remember { mutableStateOf<Bitmap?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(pdfFile) {
        withContext(Dispatchers.IO) {
            try {
                val fileDescriptor = ParcelFileDescriptor.open(pdfFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val renderer = PdfRenderer(fileDescriptor)
                
                if (renderer.pageCount > 0) {
                    // Open the first page of the summary document
                    val page = renderer.openPage(0)
                    
                    // Create a high-quality bitmap matching the page dimensions
                    val bmp = Bitmap.createBitmap(page.width, page.height, Bitmap.Config.ARGB_8888)
                    page.render(bmp, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    
                    bitmap = bmp
                    page.close()
                }
                renderer.close()
                fileDescriptor.close()
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
    }

    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        if (isLoading) {
            CircularProgressIndicator()
        } else {
            bitmap?.let { bmp ->
                Image(
                    bitmap = bmp.asImageBitmap(),
                    contentDescription = "PDF Summary Report Page",
                    modifier = Modifier.fillMaxSize()
                )
            } ?: androidx.compose.material3.Text("Failed to render PDF summary.")
        }
    }
}
```

### Approach B: Open in an External PDF Viewer (Alternative)
Download the PDF to local storage, retrieve its content URI using `FileProvider`, and start an intent to let the user open it using their preferred PDF viewer application (like Google Drive Viewer or Adobe Reader).

```kotlin
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

fun openPdfSummaryExternally(context: Context, pdfFile: File) {
    val authority = "${context.packageName}.fileprovider"
    val uri = FileProvider.getUriForFile(context, authority, pdfFile)
    
    val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/pdf")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    
    try {
        context.startActivity(intent)
    } catch (e: ActivityNotFoundException) {
        Toast.makeText(context, "No PDF Viewer installed on this device.", Toast.LENGTH_LONG).show()
    }
}
```
