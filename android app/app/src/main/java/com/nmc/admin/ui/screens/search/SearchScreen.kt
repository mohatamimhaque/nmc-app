package com.nmc.admin.ui.screens.search

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.data.local.EncryptedPrefs
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.data.local.entities.CachedRegistration
import com.nmc.admin.data.local.entities.CachedVolunteer
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.data.repository.VolunteerRepository
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SearchResultItem {
    data class Participant(val data: CachedRegistration) : SearchResultItem()
    data class Volunteer(val data: CachedVolunteer) : SearchResultItem()
}

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val repository: RegistrationRepository,
    private val volunteerRepository: VolunteerRepository,
    private val settingsDataStore: SettingsDataStore,
    private val encryptedPrefs: EncryptedPrefs
) : ViewModel() {

    val managementMode = settingsDataStore.managementModeFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, "participant")

    var selectedFilter1 by mutableStateOf("All") // Level or Segment
    var selectedFilter2 by mutableStateOf("All") // Event or Department
    var queryText by mutableStateOf("")

    var results by mutableStateOf<List<SearchResultItem>>(emptyList())
    var isSearching by mutableStateOf(false)

    var page by mutableStateOf(0)
    val limit = 15
    var totalCount by mutableStateOf(0)

    val hasMore: Boolean
        get() = (page + 1) * limit < totalCount

    init {
        viewModelScope.launch {
            managementMode.collectLatest {
                selectedFilter1 = "All"
                selectedFilter2 = "All"
                performSearch(resetPage = true)
            }
        }
    }

    fun performSearch(resetPage: Boolean = true) {
        if (resetPage) {
            page = 0
        }
        viewModelScope.launch {
            isSearching = true
            val query = queryText.trim()
            val mode = managementMode.value
            if (mode == "volunteer") {
                totalCount = volunteerRepository.getSearchCount(selectedFilter1, selectedFilter2, query)
                val list = volunteerRepository.searchVolunteersPaged(selectedFilter1, selectedFilter2, query, limit, page * limit)
                results = list.map { SearchResultItem.Volunteer(it) }
            } else {
                totalCount = repository.getSearchCount(selectedFilter1, selectedFilter2, query)
                val list = repository.searchRegistrationsPaged(selectedFilter1, selectedFilter2, query, limit, page * limit)
                results = list.map { SearchResultItem.Participant(it) }
            }
            isSearching = false
        }
    }

    fun nextPage() {
        if (hasMore) {
            page++
            performSearch(resetPage = false)
        }
    }

    fun previousPage() {
        if (page > 0) {
            page--
            performSearch(resetPage = false)
        }
    }

    fun getAdminRole(): String = encryptedPrefs.getAdminRole() ?: ""
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    navController: NavController,
    viewModel: SearchViewModel = hiltViewModel()
) {
    val managementMode by viewModel.managementMode.collectAsState()
    val adminRole = viewModel.getAdminRole()
    val isSuperOrAdmin = adminRole == "superadmin" || adminRole == "super_admin" || adminRole == "admin"

    // Config filters based on management mode
    val filter1List = if (managementMode == "volunteer") {
        listOf("All", "Public Relations", "Registration", "Decoration", "Logistics")
    } else {
        listOf("All", "School level", "Intermediate level", "University level")
    }

    val filter2List = if (managementMode == "volunteer") {
        listOf("All", "CSE", "Physics", "EEE", "Math")
    } else {
        listOf("All", "Math Olympiad", "Math Game", "Article Writing", "Poster Presentation")
    }

    var filter1DropdownExpanded by remember { mutableStateOf(false) }
    var filter2DropdownExpanded by remember { mutableStateOf(false) }

    ObsidianGradientBg {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text(if (managementMode == "volunteer") "Volunteer Search" else "Participant Search", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = LightText)
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.Transparent)
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { navController.navigate(Screen.Scanner.route) },
                    containerColor = NeonViolet,
                    contentColor = LightText,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .padding(bottom = 16.dp)
                        .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                ) {
                    Icon(Icons.Default.QrCodeScanner, contentDescription = "Open Scanner")
                }
            },
            containerColor = Color.Transparent
        ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            // Text Search Box
            OutlinedTextField(
                value = viewModel.queryText,
                onValueChange = {
                    viewModel.queryText = it
                    viewModel.performSearch(resetPage = true)
                },
                label = { Text("Search by name, serial, or phone", color = GrayText) },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search Icon", tint = GrayText) },
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

            Spacer(modifier = Modifier.height(12.dp))

            // Dropdown Filters Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Filter 1 Selector (Level / Segment)
                Box(modifier = Modifier.weight(1f)) {
                    OutlinedButton(
                        onClick = { filter1DropdownExpanded = true },
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, GlassBorder),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = GlassSurface,
                            contentColor = LightText
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (viewModel.selectedFilter1 == "All") {
                                if (managementMode == "volunteer") "All Segments" else "All Levels"
                            } else viewModel.selectedFilter1,
                            fontSize = 11.sp,
                            maxLines = 1
                        )
                        Icon(Icons.Default.ArrowDropDown, contentDescription = "Open")
                    }
                    DropdownMenu(
                        expanded = filter1DropdownExpanded,
                        onDismissRequest = { filter1DropdownExpanded = false },
                        modifier = Modifier.background(ObsidianBg).border(1.dp, GlassBorder)
                    ) {
                        filter1List.forEach { f1 ->
                            DropdownMenuItem(
                                text = { Text(f1, color = LightText) },
                                onClick = {
                                    viewModel.selectedFilter1 = f1
                                    filter1DropdownExpanded = false
                                    viewModel.performSearch(resetPage = true)
                                }
                            )
                        }
                    }
                }

                // Filter 2 Selector (Event / Department)
                Box(modifier = Modifier.weight(1f)) {
                    OutlinedButton(
                        onClick = { filter2DropdownExpanded = true },
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, GlassBorder),
                        colors = ButtonDefaults.outlinedButtonColors(
                            containerColor = GlassSurface,
                            contentColor = LightText
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = if (viewModel.selectedFilter2 == "All") {
                                if (managementMode == "volunteer") "All Departments" else "All Events"
                            } else viewModel.selectedFilter2,
                            fontSize = 11.sp,
                            maxLines = 1
                        )
                        Icon(Icons.Default.ArrowDropDown, contentDescription = "Open")
                    }
                    DropdownMenu(
                        expanded = filter2DropdownExpanded,
                        onDismissRequest = { filter2DropdownExpanded = false },
                        modifier = Modifier.background(ObsidianBg).border(1.dp, GlassBorder)
                    ) {
                        filter2List.forEach { f2 ->
                            DropdownMenuItem(
                                text = { Text(f2, color = LightText) },
                                onClick = {
                                    viewModel.selectedFilter2 = f2
                                    filter2DropdownExpanded = false
                                    viewModel.performSearch(resetPage = true)
                                }
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Results List
            if (viewModel.isSearching) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NeonViolet)
                }
            } else if (viewModel.results.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No records match filters", color = GrayText, fontSize = 14.sp)
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    items(viewModel.results) { item ->
                        when (item) {
                            is SearchResultItem.Participant -> {
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
                            is SearchResultItem.Volunteer -> {
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
                                    text = "Page ${viewModel.page + 1} of $totalPages (Total ${viewModel.totalCount})",
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
