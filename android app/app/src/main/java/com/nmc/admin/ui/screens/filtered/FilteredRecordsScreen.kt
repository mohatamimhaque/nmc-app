package com.nmc.admin.ui.screens.filtered

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Vibrator
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.data.local.entities.CachedRegistration
import com.nmc.admin.data.local.entities.CachedVolunteer
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.data.repository.VolunteerRepository
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject

sealed class FilteredResultItem {
    data class Participant(val data: CachedRegistration) : FilteredResultItem()
    data class Volunteer(val data: CachedVolunteer) : FilteredResultItem()
}

@HiltViewModel
class FilteredRecordsViewModel @Inject constructor(
    private val registrationRepository: RegistrationRepository,
    private val volunteerRepository: VolunteerRepository,
    private val encryptedPrefs: EncryptedPrefs
) : ViewModel() {

    var mode by mutableStateOf("participant")
    var filterType by mutableStateOf("")
    var filterValue by mutableStateOf("")

    var results by mutableStateOf<List<FilteredResultItem>>(emptyList())
    var totalCount by mutableStateOf(0)
    var isSearching by mutableStateOf(false)

    var page by mutableStateOf(0)
    val limit = 15

    val hasMore: Boolean
        get() = (page + 1) * limit < totalCount

    fun initParams(mode: String, type: String, value: String) {
        this.mode = mode
        this.filterType = type
        this.filterValue = value
        loadRecords()
    }

    fun loadRecords(resetPage: Boolean = true) {
        if (resetPage) {
            page = 0
        }
        viewModelScope.launch {
            isSearching = true
            if (mode == "volunteer") {
                totalCount = volunteerRepository.getFilteredCount(filterType, filterValue)
                val list = volunteerRepository.getFilteredPaged(filterType, filterValue, limit, page * limit)
                results = list.map { FilteredResultItem.Volunteer(it) }
            } else {
                totalCount = registrationRepository.getFilteredCount(filterType, filterValue)
                val list = registrationRepository.getFilteredPaged(filterType, filterValue, limit, page * limit)
                results = list.map { FilteredResultItem.Participant(it) }
            }
            isSearching = false
        }
    }

    fun nextPage() {
        if (hasMore) {
            page++
            loadRecords(resetPage = false)
        }
    }

    fun previousPage() {
        if (page > 0) {
            page--
            loadRecords(resetPage = false)
        }
    }

    fun getAdminRole(): String = encryptedPrefs.getAdminRole() ?: ""

    fun exportToCsv(context: Context) {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                try {
                    val csvString = if (mode == "volunteer") {
                        val all = volunteerRepository.getFilteredAll(filterType, filterValue)
                        generateVolunteerCsv(all)
                    } else {
                        val all = registrationRepository.getFilteredAll(filterType, filterValue)
                        generateParticipantCsv(all)
                    }

                    val filename = "NMC26_Export_${filterType}_${filterValue.replace(" ", "_")}.csv"

                    // Save to Cache for sharing
                    val cacheFile = File(context.cacheDir, filename)
                    FileOutputStream(cacheFile).use { it.write(csvString.toByteArray(Charsets.UTF_8)) }
                    val shareUri = FileProvider.getUriForFile(context, "com.nmc.admin.fileprovider", cacheFile)

                    // Write to Downloads MediaStore
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        val contentValues = ContentValues().apply {
                            put(MediaStore.MediaColumns.DISPLAY_NAME, filename)
                            put(MediaStore.MediaColumns.MIME_TYPE, "text/csv")
                            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                        }
                        val resolver = context.contentResolver
                        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                        if (uri != null) {
                            resolver.openOutputStream(uri)?.use { os ->
                                os.write(csvString.toByteArray(Charsets.UTF_8))
                            }
                        }
                    } else {
                        val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                        val file = File(downloadDir, filename)
                        FileOutputStream(file).use { os ->
                            os.write(csvString.toByteArray(Charsets.UTF_8))
                        }
                    }

                    withContext(Dispatchers.Main) {
                        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                        vibrator?.vibrate(150)
                        Toast.makeText(context, "Exported successfully to Downloads!", Toast.LENGTH_SHORT).show()

                        // Trigger Share Intent
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/csv"
                            putExtra(Intent.EXTRA_STREAM, shareUri)
                            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                        context.startActivity(Intent.createChooser(intent, "Share Export CSV"))
                    }
                } catch (e: Exception) {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(context, "Failed export: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun generateParticipantCsv(list: List<CachedRegistration>): String {
        val sb = StringBuilder()
        sb.append("Serial,Full Name,Email,Phone,Institution,Level,Event,T-Shirt Size,Room,Kit Status,Presence Status,Launch Status,Breakfast Status,Registered At,Updated By,Updated At\n")
        for (p in list) {
            sb.append("\"${escapeCsv(p.serial)}\",")
            sb.append("\"${escapeCsv(p.fullName ?: "")}\",")
            sb.append("\"${escapeCsv(p.emailAddress ?: "")}\",")
            sb.append("\"${escapeCsv(p.phoneNumber ?: "")}\",")
            sb.append("\"${escapeCsv(p.institution ?: "")}\",")
            sb.append("\"${escapeCsv(p.level ?: "")}\",")
            sb.append("\"${escapeCsv(p.event ?: "")}\",")
            sb.append("\"${escapeCsv(p.tShirtSize ?: "")}\",")
            sb.append("\"${escapeCsv(p.allocatedRoom ?: "")}\",")
            sb.append(if (p.isKitCollected) "Collected" else "Pending").append(",")
            sb.append(if (p.isPresent) "Present" else "Absent").append(",")
            sb.append(if (p.isCollectLaunch) "Served" else "Pending").append(",")
            sb.append(if (p.isBreakfastCollected) "Served" else "Pending").append(",")
            sb.append("\"${escapeCsv(p.createdAt ?: "")}\",")
            sb.append("\"${escapeCsv(p.updatedBy ?: "")}\",")
            sb.append("\"${escapeCsv(p.updatedAt ?: "")}\"\n")
        }
        return sb.toString()
    }

    private fun generateVolunteerCsv(list: List<CachedVolunteer>): String {
        val sb = StringBuilder()
        sb.append("Unique ID,Name,Email,Phone,Segment,Department,Student ID,Year,T-Shirt Size,Presence,Gift Status,Lunch Status,Registered At,Updated By,Updated At\n")
        for (v in list) {
            sb.append("\"${escapeCsv(v.uniqueId)}\",")
            sb.append("\"${escapeCsv(v.name ?: "")}\",")
            sb.append("\"${escapeCsv(v.email ?: "")}\",")
            sb.append("\"${escapeCsv(v.number ?: "")}\",")
            sb.append("\"${escapeCsv(v.segment ?: "")}\",")
            sb.append("\"${escapeCsv(v.department ?: "")}\",")
            sb.append("\"${escapeCsv(v.studentId ?: "")}\",")
            sb.append("\"${escapeCsv(v.year ?: "")}\",")
            sb.append("\"${escapeCsv(v.tShirtSize ?: "")}\",")
            sb.append(if (v.isPresent) "Present" else "Absent").append(",")
            sb.append(if (v.isGiftCollected) "Collected" else "Pending").append(",")
            sb.append(if (v.isLunchCollected) "Served" else "Pending").append(",")
            sb.append("\"${escapeCsv(v.createdAt ?: "")}\",")
            sb.append("\"${escapeCsv(v.updatedBy ?: "")}\",")
            sb.append("\"${escapeCsv(v.updatedAt ?: "")}\"\n")
        }
        return sb.toString()
    }

    private fun escapeCsv(str: String): String {
        return str.replace("\"", "\"\"")
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilteredRecordsScreen(
    navController: NavController,
    mode: String,
    type: String,
    value: String,
    viewModel: FilteredRecordsViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val adminRole = viewModel.getAdminRole()
    val isSuperOrAdmin = adminRole == "superadmin" || adminRole == "super_admin" || adminRole == "admin"

    LaunchedEffect(mode, type, value) {
        viewModel.initParams(mode, type, value)
    }

    val displayTitle = remember(type, value) {
        val typeLabel = when (type) {
            "kit", "gift" -> "Distributed"
            "present" -> "Attendance"
            "launch", "lunch" -> "Served"
            else -> type.substring(0, 1).uppercase() + type.substring(1)
        }
        "$typeLabel: ${value.uppercase()}"
    }

    ObsidianGradientBg {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(displayTitle, color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = LightText)
                        }
                    },
                    actions = {
                        if (isSuperOrAdmin) {
                            IconButton(onClick = { viewModel.exportToCsv(context) }) {
                                Icon(Icons.Default.Download, contentDescription = "Export Excel/CSV", tint = AlertCyan)
                            }
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
                    .padding(horizontal = 16.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${viewModel.totalCount} records found matching filter",
                        color = GrayText,
                        fontSize = 13.sp
                    )
                    if (isSuperOrAdmin) {
                        TextButton(
                            onClick = { viewModel.exportToCsv(context) },
                            colors = ButtonDefaults.textButtonColors(contentColor = AlertCyan)
                        ) {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Export CSV / Excel", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                if (viewModel.isSearching) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = NeonViolet)
                    }
                } else if (viewModel.results.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = GrayText, modifier = Modifier.size(36.dp))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("No records match this selection", color = GrayText, fontSize = 14.sp)
                        }
                    }
                } else {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(viewModel.results) { item ->
                            when (item) {
                                is FilteredResultItem.Participant -> {
                                    val p = item.data
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = GlassSurface),
                                        border = BorderStroke(1.dp, GlassBorder),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                navController.navigate(Screen.Detail.createRoute(p.serial, fromScan = false))
                                            }
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = p.fullName ?: "No Name",
                                                    color = LightText,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 14.sp
                                                )
                                                Text(
                                                    text = p.serial,
                                                    color = AlertCyan,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 12.sp
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text(p.event ?: "No Event", color = GrayText, fontSize = 12.sp)
                                                Text(p.level ?: "No Level", color = GrayText, fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                                is FilteredResultItem.Volunteer -> {
                                    val v = item.data
                                    Card(
                                        colors = CardDefaults.cardColors(containerColor = GlassSurface),
                                        border = BorderStroke(1.dp, GlassBorder),
                                        shape = RoundedCornerShape(12.dp),
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                navController.navigate(Screen.Detail.createRoute(v.uniqueId, fromScan = false))
                                            }
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = v.name ?: "No Name",
                                                    color = LightText,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 14.sp
                                                )
                                                val displayId = if (isSuperOrAdmin) "${v.serialNo ?: "N/A"} / ${v.uniqueId}" else (v.serialNo ?: "N/A")
                                                Text(
                                                    text = displayId,
                                                    color = AlertCyan,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 12.sp
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text(v.segment ?: "No Segment", color = GrayText, fontSize = 12.sp)
                                                Text(v.department ?: "No Dept", color = GrayText, fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Pagination Control Section
                        if (viewModel.totalCount > viewModel.limit) {
                            item {
                                val totalPages = ((viewModel.totalCount + viewModel.limit - 1) / viewModel.limit)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    TextButton(
                                        onClick = { viewModel.previousPage() },
                                        enabled = viewModel.page > 0
                                    ) {
                                        Text(
                                            text = "Previous",
                                            color = if (viewModel.page > 0) NeonViolet else GrayText,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Text(
                                        text = "Page ${viewModel.page + 1} of $totalPages",
                                        color = LightText,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    TextButton(
                                        onClick = { viewModel.nextPage() },
                                        enabled = viewModel.hasMore
                                    ) {
                                        Text(
                                            text = "Next",
                                            color = if (viewModel.hasMore) NeonViolet else GrayText,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(80.dp))
                        }
                    }
                }
            }
        }
    }
}
