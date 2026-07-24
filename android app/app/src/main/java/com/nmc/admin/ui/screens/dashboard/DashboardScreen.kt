package com.nmc.admin.ui.screens.dashboard

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
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.R
import com.nmc.admin.data.local.SettingsDataStore
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.data.repository.VolunteerRepository
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.ui.platform.LocalContext
import androidx.activity.compose.BackHandler
import android.app.Activity
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: RegistrationRepository,
    private val volunteerRepository: VolunteerRepository,
    private val settingsDataStore: SettingsDataStore
) : ViewModel() {

    val managementMode = settingsDataStore.managementModeFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, "participant")

    val activeScanMode = settingsDataStore.scanModeFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, "kit")

    val canManageVolunteers = settingsDataStore.canManageVolunteersFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)

    // Combined core metrics based on managementMode
    val totalCount = combine(managementMode, repository.observeTotalCount(), volunteerRepository.observeTotalCount()) { mode, pCount, vCount ->
        if (mode == "volunteer") vCount else pCount
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val kitCollectedCount = combine(managementMode, repository.observeKitCollectedCount(), volunteerRepository.observeGiftCollectedCount()) { mode, pCount, vCount ->
        if (mode == "volunteer") vCount else pCount
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val presentCount = combine(managementMode, repository.observePresentCount(), volunteerRepository.observePresentCount()) { mode, pCount, vCount ->
        if (mode == "volunteer") vCount else pCount
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val launchServedCount = combine(managementMode, repository.observeLaunchServedCount(), volunteerRepository.observeLunchServedCount()) { mode, pCount, vCount ->
        if (mode == "volunteer") vCount else pCount
    }.stateIn(viewModelScope, SharingStarted.Lazily, 0)

    val breakfastServedCount = repository.observeBreakfastServedCount()
        .stateIn(viewModelScope, SharingStarted.Lazily, 0)

    // Dynamic Volunteer & Participant Breakdowns
    val volunteerBreakdowns = volunteerRepository.observeAllVolunteers()
        .map { list ->
            val bySegment = list.groupBy { it.segment ?: "Unknown" }.mapValues { it.value.size }
            val byDepartment = list.groupBy { it.department ?: "Unknown" }.mapValues { it.value.size }
            Pair(bySegment, byDepartment)
        }.stateIn(viewModelScope, SharingStarted.Lazily, Pair(emptyMap(), emptyMap()))

    val participantBreakdowns = repository.observeAllRegistrations()
        .map { list ->
            val byLevel = list.groupBy { it.level ?: "Unknown" }.mapValues { it.value.size }
            val byEvent = list.groupBy { it.event ?: "Unknown" }.mapValues { it.value.size }
            Pair(byLevel, byEvent)
        }.stateIn(viewModelScope, SharingStarted.Lazily, Pair(emptyMap(), emptyMap()))

    var isRefreshing by mutableStateOf(false)
    var syncMessage by mutableStateOf<String?>(null)

    val isAuthorized = repository.isAuthorized

    init {
        refreshData()
    }

    fun refreshData() {
        viewModelScope.launch {
            isRefreshing = true
            syncMessage = null
            
            repository.fetchProfileAndSavePermissions()
            
            val mode = managementMode.value
            val result = if (mode == "volunteer") {
                volunteerRepository.syncVolunteers()
            } else {
                repository.syncRegistrations()
            }
            if (result.isFailure) {
                val summaryResult = if (mode == "volunteer") {
                    volunteerRepository.getVolunteerSummary()
                } else {
                    repository.getSummary()
                }
                if (summaryResult.isFailure) {
                    syncMessage = "Offline Mode - Displaying cached data"
                }
            } else {
                syncMessage = "Live stats synchronized"
            }
            isRefreshing = false
        }
    }


    fun logout() {
        repository.logout()
    }

    fun isSuperOrAdmin(): Boolean = repository.isSuperOrAdmin()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    navController: NavController,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    BackHandler(enabled = true) {
        if (drawerState.isOpen) {
            scope.launch { drawerState.close() }
        } else {
            (context as? Activity)?.finish()
        }
    }

    val isAuthorized by viewModel.isAuthorized.collectAsState()
    LaunchedEffect(isAuthorized) {
        if (!isAuthorized) {
            navController.navigate(Screen.Login.route) {
                popUpTo(0) { inclusive = true }
            }
        }
    }

    val managementMode by viewModel.managementMode.collectAsState()
    val canManageVolunteers by viewModel.canManageVolunteers.collectAsState()

    val total by viewModel.totalCount.collectAsState()
    val kitCollected by viewModel.kitCollectedCount.collectAsState()
    val present by viewModel.presentCount.collectAsState()
    val launchServed by viewModel.launchServedCount.collectAsState()
    val breakfastServed by viewModel.breakfastServedCount.collectAsState()

    val volunteerBreakdowns by viewModel.volunteerBreakdowns.collectAsState()
    val participantBreakdowns by viewModel.participantBreakdowns.collectAsState()

    val activeMode by viewModel.activeScanMode.collectAsState()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = ObsidianBg,
                modifier = Modifier.width(280.dp)
            ) {
                // Header
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(GlassSurface)
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Image(
                            painter = painterResource(id = R.drawable.logo),
                            contentDescription = "NMC Logo",
                            modifier = Modifier.size(70.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("NMC 2026 ADMIN", color = LightText, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Menu Options
                NavigationDrawerItem(
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard", tint = NeonViolet) },
                    label = { Text("Dashboard", color = LightText) },
                    selected = true,
                    onClick = { scope.launch { drawerState.close() } },
                    colors = NavigationDrawerItemDefaults.colors(
                        unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent,
                        selectedContainerColor = GlassSurface
                    ),
                    modifier = Modifier.padding(horizontal = 12.dp)
                )

                NavigationDrawerItem(
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile", tint = NeonViolet) },
                    label = { Text("My Profile", color = LightText) },
                    selected = false,
                    onClick = {
                        scope.launch {
                            drawerState.close()
                            navController.navigate(Screen.Profile.route)
                        }
                    },
                    colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )

                NavigationDrawerItem(
                    icon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = NeonViolet) },
                    label = { Text(if (managementMode == "volunteer") "Volunteer Search" else "Participant Search", color = LightText) },
                    selected = false,
                    onClick = {
                        scope.launch {
                            drawerState.close()
                            navController.navigate(Screen.Search.route)
                        }
                    },
                    colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )

                NavigationDrawerItem(
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings", tint = NeonViolet) },
                    label = { Text("Scanner Settings", color = LightText) },
                    selected = false,
                    onClick = {
                        scope.launch {
                            drawerState.close()
                            navController.navigate(Screen.Settings.route)
                        }
                    },
                    colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )

                if (canManageVolunteers) {
                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.CompareArrows, contentDescription = "Switch Target", tint = NeonViolet) },
                        label = { Text("Switch Manage Target", color = LightText) },
                        selected = false,
                        onClick = {
                            scope.launch {
                                drawerState.close()
                                navController.navigate(Screen.ChooseManage.route)
                            }
                        },
                        colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }



                if (viewModel.isSuperOrAdmin()) {
                    NavigationDrawerItem(
                        icon = { Icon(Icons.Default.Description, contentDescription = "PDF Report", tint = NeonViolet) },
                        label = { Text("Download PDF Summary", color = LightText) },
                        selected = false,
                        onClick = {
                            scope.launch {
                                drawerState.close()
                                navController.navigate(Screen.SummaryPdfViewer.createRoute(managementMode))
                            }
                        },
                        colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent),
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                    )
                }

                NavigationDrawerItem(
                    icon = { Icon(Icons.Default.Info, contentDescription = "About", tint = NeonViolet) },
                    label = { Text("About Application", color = LightText) },
                    selected = false,
                    onClick = {
                        scope.launch {
                            drawerState.close()
                            navController.navigate(Screen.About.route)
                        }
                    },
                    colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )

                Spacer(modifier = Modifier.weight(1f))

                // Logout Action
                NavigationDrawerItem(
                    icon = { Icon(Icons.Default.Logout, contentDescription = "Logout", tint = ErrorRed) },
                    label = { Text("Log Out", color = ErrorRed) },
                    selected = false,
                    onClick = {
                        scope.launch {
                            drawerState.close()
                            viewModel.logout()
                            navController.navigate(Screen.Login.route) {
                                popUpTo(Screen.Dashboard.route) { inclusive = true }
                            }
                        }
                    },
                    colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = androidx.compose.ui.graphics.Color.Transparent),
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 12.dp)
                )
            }
        }
    ) {
        ObsidianGradientBg {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = {
                            Text(
                                text = if (managementMode == "volunteer") "Volunteer Controls" else "Participants Controls",
                                color = LightText,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                        },
                        navigationIcon = {
                            IconButton(onClick = { scope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = "Open Navigation Menu", tint = LightText)
                            }
                        },
                        actions = {
                            IconButton(onClick = { navController.navigate(Screen.Search.route) }) {
                                Icon(Icons.Default.Search, contentDescription = "Search", tint = LightText)
                            }
                            IconButton(onClick = { viewModel.refreshData() }) {
                                if (viewModel.isRefreshing) {
                                    CircularProgressIndicator(color = NeonViolet, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                                } else {
                                    Icon(Icons.Default.Refresh, contentDescription = "Sync Data", tint = LightText)
                                }
                            }
                            IconButton(onClick = { navController.navigate(Screen.Settings.route) }) {
                                Icon(Icons.Default.Settings, contentDescription = "Settings", tint = LightText)
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent)
                    )
                },
                floatingActionButton = {
                    ExtendedFloatingActionButton(
                        onClick = { navController.navigate(Screen.Scanner.route) },
                        containerColor = NeonViolet,
                        contentColor = LightText,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .padding(bottom = 16.dp)
                            .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                    ) {
                        Icon(Icons.Default.QrCodeScanner, contentDescription = "Scan icon")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("CAMERA SCAN", fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }
                },
                floatingActionButtonPosition = FabPosition.Center,
                containerColor = Color.Transparent
            ) { innerPadding ->
                val pullToRefreshState = rememberPullToRefreshState()
                if (pullToRefreshState.isRefreshing) {
                    LaunchedEffect(true) {
                        viewModel.refreshData()
                        pullToRefreshState.endRefresh()
                    }
                }

                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .nestedScroll(pullToRefreshState.nestedScrollConnection)
                ) {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Sync Banner
                        viewModel.syncMessage?.let { msg ->
                            item {
                                val isError = msg.contains("Offline")
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (isError) WarningAmber.copy(alpha = 0.15f) else SuccessGreen.copy(alpha = 0.15f)
                                    ),
                                    border = BorderStroke(1.dp, if (isError) WarningAmber.copy(alpha = 0.3f) else SuccessGreen.copy(alpha = 0.3f)),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = if (isError) Icons.Default.Warning else Icons.Default.CloudDone,
                                            contentDescription = "Sync status",
                                            tint = if (isError) WarningAmber else SuccessGreen
                                        )
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Text(msg, color = LightText, fontSize = 13.sp)
                                    }
                                }
                            }
                        }

                        // Big Active Scan Mode Card
                        item {
                            val isVol = managementMode == "volunteer"
                            val modeText = when (activeMode) {
                                "kit" -> if (isVol) "GIFT DISTRIBUTION" else "KIT COLLECTION"
                                "present" -> "ATTENDANCE VERIFICATION"
                                "launch" -> if (isVol) "LUNCH SERVED" else "LAUNCH SERVING"
                                "breakfast" -> "BREAKFAST COLLECTION"
                                else -> "READ-ONLY INFO LOOKUP"
                            }
                            val modeColor = when (activeMode) {
                                "kit" -> SuccessGreen
                                "present" -> NeonViolet
                                "launch" -> WarningAmber
                                "breakfast" -> Color(0xFF17A2B8) // Teal
                                else -> NeonBlue
                            }
                            Card(
                                colors = CardDefaults.cardColors(containerColor = GlassSurface),
                                border = BorderStroke(1.5.dp, modeColor.copy(alpha = 0.4f)),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(16.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = "ACTIVE SCANNING TARGET MODE (${managementMode.uppercase()})",
                                        color = GrayText,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.5.sp
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = modeText,
                                        color = modeColor,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        letterSpacing = 1.sp,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }

                        // Total Summary Card
                        item {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = GlassSurface),
                                border = BorderStroke(1.dp, GlassBorder),
                                shape = RoundedCornerShape(16.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(20.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = if (managementMode == "volunteer") "Total Volunteers" else "Total Registrations",
                                        color = GrayText,
                                        fontSize = 13.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = total.toString(),
                                        color = AlertCyan,
                                        fontSize = 36.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        // Core Metrics
                        item {
                            val isVol = managementMode == "volunteer"
                            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                    Box(modifier = Modifier.weight(1f)) {
                                        MetricCard(
                                            title = if (isVol) "Gift Distribution" else "Kit Collection",
                                            icon = Icons.Default.CardGiftcard,
                                            primaryValue = kitCollected,
                                            secondaryValue = maxOf(0, total - kitCollected),
                                            primaryLabel = "Collected",
                                            secondaryLabel = "Pending",
                                            onPrimaryClick = {
                                                navController.navigate(Screen.FilteredRecords.createRoute(managementMode, if (isVol) "gift" else "kit", "collected"))
                                            },
                                            onSecondaryClick = {
                                                navController.navigate(Screen.FilteredRecords.createRoute(managementMode, if (isVol) "gift" else "kit", "pending"))
                                            },
                                            colorGlow = SuccessGreen
                                        )
                                    }
                                    Box(modifier = Modifier.weight(1f)) {
                                        MetricCard(
                                            title = "Attendance",
                                            icon = Icons.Default.CheckCircle,
                                            primaryValue = present,
                                            secondaryValue = maxOf(0, total - present),
                                            primaryLabel = "Present",
                                            secondaryLabel = "Absent",
                                            onPrimaryClick = {
                                                navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "present", "present"))
                                            },
                                            onSecondaryClick = {
                                                navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "present", "absent"))
                                            },
                                            colorGlow = NeonViolet
                                        )
                                    }
                                }
                                if (isVol) {
                                    MetricCard(
                                        title = "Lunch Served",
                                        icon = Icons.Default.Restaurant,
                                        primaryValue = launchServed,
                                        secondaryValue = maxOf(0, total - launchServed),
                                        primaryLabel = "Served",
                                        secondaryLabel = "Pending",
                                        onPrimaryClick = {
                                            navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "lunch", "served"))
                                        },
                                        onSecondaryClick = {
                                            navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "lunch", "pending"))
                                        },
                                        colorGlow = WarningAmber,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                } else {
                                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Box(modifier = Modifier.weight(1f)) {
                                            MetricCard(
                                                title = "Launch Served",
                                                icon = Icons.Default.Restaurant,
                                                primaryValue = launchServed,
                                                secondaryValue = maxOf(0, total - launchServed),
                                                primaryLabel = "Served",
                                                secondaryLabel = "Pending",
                                                onPrimaryClick = {
                                                    navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "launch", "served"))
                                                },
                                                onSecondaryClick = {
                                                    navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "launch", "pending"))
                                                },
                                                colorGlow = WarningAmber
                                            )
                                        }
                                        Box(modifier = Modifier.weight(1f)) {
                                            MetricCard(
                                                title = "Breakfast Served",
                                                icon = Icons.Default.Restaurant,
                                                primaryValue = breakfastServed,
                                                secondaryValue = maxOf(0, total - breakfastServed),
                                                primaryLabel = "Served",
                                                secondaryLabel = "Pending",
                                                onPrimaryClick = {
                                                    navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "breakfast", "served"))
                                                },
                                                onSecondaryClick = {
                                                    navController.navigate(Screen.FilteredRecords.createRoute(managementMode, "breakfast", "pending"))
                                                },
                                                colorGlow = Color(0xFF17A2B8) // Teal
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // Category Breakdowns
                        if (managementMode == "volunteer") {
                            val (bySegment, byDepartment) = volunteerBreakdowns
                            
                            // Breakdown by Segment
                            item {
                                Column(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(GlassSurface)
                                        .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                                        .padding(16.dp)
                                ) {
                                    Text(
                                        "Breakdown by Segment",
                                        color = LightText,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    if (bySegment.isEmpty()) {
                                        Text("No segment data available", color = GrayText, fontSize = 13.sp)
                                    } else {
                                        bySegment.entries.sortedByDescending { it.value }.forEachIndexed { index, entry ->
                                            if (index > 0) {
                                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                            }
                                            BreakdownRow(entry.key, entry.value) {
                                                navController.navigate(Screen.FilteredRecords.createRoute("volunteer", "segment", entry.key))
                                            }
                                        }
                                    }
                                }
                            }

                            // Breakdown by Department
                            item {
                                Column(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(GlassSurface)
                                        .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                                        .padding(16.dp)
                                ) {
                                    Text(
                                        "Breakdown by Department",
                                        color = LightText,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    if (byDepartment.isEmpty()) {
                                        Text("No department data available", color = GrayText, fontSize = 13.sp)
                                    } else {
                                        byDepartment.entries.sortedByDescending { it.value }.forEachIndexed { index, entry ->
                                            if (index > 0) {
                                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                            }
                                            BreakdownRow(entry.key, entry.value) {
                                                navController.navigate(Screen.FilteredRecords.createRoute("volunteer", "department", entry.key))
                                            }
                                        }
                                    }
                                }
                            }
                        } else {
                            val (byLevel, byEvent) = participantBreakdowns
                            
                            // Breakdown by Level
                            item {
                                Column(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(GlassSurface)
                                        .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                                        .padding(16.dp)
                                ) {
                                    Text(
                                        "Breakdown by Level",
                                        color = LightText,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    if (byLevel.isEmpty()) {
                                        Text("No level data available", color = GrayText, fontSize = 13.sp)
                                    } else {
                                        byLevel.entries.sortedByDescending { it.value }.forEachIndexed { index, entry ->
                                            if (index > 0) {
                                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                            }
                                            BreakdownRow(entry.key, entry.value) {
                                                navController.navigate(Screen.FilteredRecords.createRoute("participant", "level", entry.key))
                                            }
                                        }
                                    }
                                }
                            }

                            // Breakdown by Event
                            item {
                                Column(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(GlassSurface)
                                        .border(1.dp, GlassBorder, RoundedCornerShape(16.dp))
                                        .padding(16.dp)
                                ) {
                                    Text(
                                        "Breakdown by Event",
                                        color = LightText,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.height(12.dp))
                                    if (byEvent.isEmpty()) {
                                        Text("No event data available", color = GrayText, fontSize = 13.sp)
                                    } else {
                                        byEvent.entries.sortedByDescending { it.value }.forEachIndexed { index, entry ->
                                            if (index > 0) {
                                                HorizontalDivider(color = GlassBorder, modifier = Modifier.padding(vertical = 8.dp))
                                            }
                                            BreakdownRow(entry.key, entry.value) {
                                                navController.navigate(Screen.FilteredRecords.createRoute("participant", "event", entry.key))
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        item {
                            Spacer(modifier = Modifier.height(80.dp)) // Padding for FAB
                        }
                    }

                    if (pullToRefreshState.isRefreshing || pullToRefreshState.progress > 0f) {
                        PullToRefreshContainer(
                            state = pullToRefreshState,
                            modifier = Modifier.align(Alignment.TopCenter),
                            containerColor = GlassSurface,
                            contentColor = NeonViolet
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    icon: ImageVector,
    primaryValue: Int,
    secondaryValue: Int,
    primaryLabel: String,
    secondaryLabel: String,
    onPrimaryClick: () -> Unit,
    onSecondaryClick: () -> Unit,
    colorGlow: Color = NeonViolet,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = GlassSurface),
        border = BorderStroke(1.dp, colorGlow.copy(alpha = 0.35f)),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(icon, contentDescription = title, tint = colorGlow, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(title, color = LightText, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onPrimaryClick() }
                        .padding(6.dp)
                ) {
                    Text(primaryLabel, color = GrayText, fontSize = 11.sp)
                    Text(primaryValue.toString(), color = SuccessGreen, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
                Column(
                    horizontalAlignment = Alignment.End,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onSecondaryClick() }
                        .padding(6.dp)
                ) {
                    Text(secondaryLabel, color = GrayText, fontSize = 11.sp)
                    Text(secondaryValue.toString(), color = ErrorRed, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun BreakdownRow(label: String, count: Int, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .clickable { onClick() }
            .padding(vertical = 6.dp, horizontal = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = GrayText, fontSize = 13.sp)
        Text(
            count.toString(),
            color = LightText,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
