package com.nmc.admin.ui.screens.usermanagement

import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
import com.nmc.admin.data.remote.NmcApiService
import com.nmc.admin.data.remote.dto.AdminUserDto
import com.nmc.admin.data.remote.dto.UpdateAdminUserRequest
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UserManagementViewModel @Inject constructor(
    private val apiService: NmcApiService
) : ViewModel() {

    var users by mutableStateOf<List<AdminUserDto>>(emptyList())
    var isLoading by mutableStateOf(false)
    var isSaving by mutableStateOf(false)
    var searchQuery by mutableStateOf("")

    init {
        loadUsers()
    }

    fun loadUsers() {
        viewModelScope.launch {
            isLoading = true
            try {
                val response = apiService.getAdminUsers()
                users = response.data.sortedBy { it.email }
            } catch (e: Exception) {
                users = emptyList()
            }
            isLoading = false
        }
    }

    fun updatePermissions(
        userId: String,
        displayName: String?,
        role: String,
        canManageVolunteers: Boolean,
        canManageRegistrations: Boolean,
        canManageKit: Boolean,
        canManagePresents: Boolean,
        canManageLunch: Boolean,
        canManageBreakfast: Boolean,
        onSuccess: () -> Unit,
        onFailure: (String) -> Unit
    ) {
        viewModelScope.launch {
            isSaving = true
            try {
                val response = apiService.updateAdminUser(
                    UpdateAdminUserRequest(
                        id = userId,
                        displayName = displayName,
                        role = role,
                        canManageVolunteers = canManageVolunteers,
                        canManageRegistrations = canManageRegistrations,
                        canManageKit = canManageKit,
                        canManagePresents = canManagePresents,
                        canManageLunch = canManageLunch,
                        canManageBreakfast = canManageBreakfast
                    )
                )
                if (response.data != null) {
                    loadUsers()
                    onSuccess()
                } else {
                    onFailure(response.error ?: "Update failed")
                }
            } catch (e: Exception) {
                onFailure(e.message ?: "Update failed")
            }
            isSaving = false
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserManagementScreen(
    navController: NavController,
    viewModel: UserManagementViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    var editingUser by remember { mutableStateOf<AdminUserDto?>(null) }

    ObsidianGradientBg {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("Manage Permissions", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
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
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Search field
                OutlinedTextField(
                    value = viewModel.searchQuery,
                    onValueChange = { viewModel.searchQuery = it },
                    label = { Text("Search by email or name", color = GrayText) },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search", tint = GrayText) },
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

                if (viewModel.isLoading) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = NeonViolet)
                    }
                } else {
                    val filteredUsers = remember(viewModel.users, viewModel.searchQuery) {
                        val query = viewModel.searchQuery.trim().lowercase()
                        if (query.isEmpty()) {
                            viewModel.users
                        } else {
                            viewModel.users.filter {
                                it.email.lowercase().contains(query) ||
                                (it.displayName ?: "").lowercase().contains(query)
                            }
                        }
                    }

                    if (filteredUsers.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text("No users found.", color = GrayText, textAlign = TextAlign.Center)
                        }
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.fillMaxSize()
                        ) {
                            items(filteredUsers) { u ->
                                UserCardItem(user = u, onClick = { editingUser = u })
                            }
                        }
                    }
                }
            }
        }

        // Edit Dialog Sheet
        editingUser?.let { u ->
            var selectedRole by remember { mutableStateOf(u.role) }
            var dropdownExpanded by remember { mutableStateOf(false) }

            // Implicit permissions resolved locally
            val isRegEditor = selectedRole == "registration_editor"
            val isSuperOrAdmin = selectedRole == "super_admin" || selectedRole == "superadmin" || selectedRole == "admin"

            var canManageVolunteers by remember { mutableStateOf(u.canManageVolunteers) }
            var canManageKit by remember { mutableStateOf(u.canManageKit) }
            var canManagePresents by remember { mutableStateOf(u.canManagePresents) }
            var canManageLunch by remember { mutableStateOf(u.canManageLunch) }
            var canManageBreakfast by remember { mutableStateOf(u.canManageBreakfast) }

            // Force values if implicit rules match
            LaunchedEffect(selectedRole) {
                if (isRegEditor) {
                    canManageKit = true
                    canManagePresents = true
                    canManageLunch = true
                    canManageBreakfast = true
                }
            }

            val rolesList = listOf("volunteer", "registration_editor", "admin", "super_admin")

            AlertDialog(
                onDismissRequest = { if (!viewModel.isSaving) editingUser = null },
                title = { Text("Edit Permissions", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                text = {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("User: ${u.displayName ?: "No Name"}", color = GrayText, fontSize = 13.sp)
                        Text("Email: ${u.email}", color = GrayText, fontSize = 13.sp)
                        Spacer(modifier = Modifier.height(4.dp))

                        // Role Selector dropdown
                        Box(modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { dropdownExpanded = true },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = LightText),
                                border = BorderStroke(1.dp, GlassBorder),
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("Role: ${selectedRole.replace("_", " ").uppercase()}", fontSize = 13.sp)
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Dropdown")
                                }
                            }
                            DropdownMenu(
                                expanded = dropdownExpanded,
                                onDismissRequest = { dropdownExpanded = false },
                                modifier = Modifier
                                    .background(ObsidianBg)
                                    .border(1.dp, GlassBorder)
                            ) {
                                rolesList.forEach { r ->
                                    DropdownMenuItem(
                                        text = { Text(r.replace("_", " ").uppercase(), color = LightText) },
                                        onClick = {
                                            selectedRole = r
                                            dropdownExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Toggles list
                        PermissionToggleRow(
                            label = "Can Manage Volunteers",
                            checked = isSuperOrAdmin || canManageVolunteers,
                            enabled = !isSuperOrAdmin,
                            onCheckedChange = { canManageVolunteers = it }
                        )

                        PermissionToggleRow(
                            label = "Can Manage Kit Collection",
                            checked = isSuperOrAdmin || isRegEditor || canManageKit,
                            enabled = !isSuperOrAdmin && !isRegEditor,
                            onCheckedChange = { canManageKit = it }
                        )

                        PermissionToggleRow(
                            label = "Can Manage Presents/Attendance",
                            checked = isSuperOrAdmin || isRegEditor || canManagePresents,
                            enabled = !isSuperOrAdmin && !isRegEditor,
                            onCheckedChange = { canManagePresents = it }
                        )

                        PermissionToggleRow(
                            label = "Can Manage Lunch/Launch",
                            checked = isSuperOrAdmin || isRegEditor || canManageLunch,
                            enabled = !isSuperOrAdmin && !isRegEditor,
                            onCheckedChange = { canManageLunch = it }
                        )

                        PermissionToggleRow(
                            label = "Can Manage Breakfast",
                            checked = isSuperOrAdmin || isRegEditor || canManageBreakfast,
                            enabled = !isSuperOrAdmin && !isRegEditor,
                            onCheckedChange = { canManageBreakfast = it }
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            viewModel.updatePermissions(
                                userId = u.id,
                                displayName = u.displayName,
                                role = selectedRole,
                                canManageVolunteers = isSuperOrAdmin || canManageVolunteers,
                                canManageRegistrations = isSuperOrAdmin || isRegEditor,
                                canManageKit = isSuperOrAdmin || isRegEditor || canManageKit,
                                canManagePresents = isSuperOrAdmin || isRegEditor || canManagePresents,
                                canManageLunch = isSuperOrAdmin || isRegEditor || canManageLunch,
                                canManageBreakfast = isSuperOrAdmin || isRegEditor || canManageBreakfast,
                                onSuccess = {
                                    Toast.makeText(context, "Permissions updated", Toast.LENGTH_SHORT).show()
                                    editingUser = null
                                },
                                onFailure = { err ->
                                    Toast.makeText(context, err, Toast.LENGTH_LONG).show()
                                }
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = NeonViolet),
                        enabled = !viewModel.isSaving
                    ) {
                        if (viewModel.isSaving) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(16.dp))
                        } else {
                            Text("Save")
                        }
                    }
                },
                dismissButton = {
                    OutlinedButton(
                        onClick = { editingUser = null },
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = LightText),
                        border = BorderStroke(1.dp, GlassBorder),
                        enabled = !viewModel.isSaving
                    ) {
                        Text("Cancel")
                    }
                },
                containerColor = ObsidianBg,
                textContentColor = LightText
            )
        }
    }
}

@Composable
fun UserCardItem(user: AdminUserDto, onClick: () -> Unit) {
    val displayRole = when (user.role) {
        "superadmin", "super_admin" -> "Super Admin"
        "admin" -> "Admin"
        "volunteer" -> "Volunteer"
        "registration_editor" -> "Reg Editor"
        else -> user.role
    }

    Card(
        colors = CardDefaults.cardColors(containerColor = GlassSurface),
        border = BorderStroke(1.dp, GlassBorder),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = user.displayName ?: "No Name", color = LightText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Text(text = user.email, color = GrayText, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    BadgeText(text = displayRole, color = NeonBlue)
                    if (user.canManageVolunteers) BadgeText(text = "Volunteers", color = SuccessGreen)
                    if (user.canManageKit) BadgeText(text = "Kit", color = SuccessGreen)
                    if (user.canManagePresents) BadgeText(text = "Presents", color = SuccessGreen)
                    if (user.canManageLunch) BadgeText(text = "Lunch", color = SuccessGreen)
                    if (user.canManageBreakfast) BadgeText(text = "Breakfast", color = SuccessGreen)
                }
            }
            Icon(Icons.Default.Edit, contentDescription = "Edit Permissions", tint = AlertCyan, modifier = Modifier.size(18.dp))
        }
    }
}

@Composable
fun BadgeText(text: String, color: Color) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.15f))
            .border(0.5.dp, color.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(text = text, color = color, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
    }
}

@Composable
fun PermissionToggleRow(
    label: String,
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(40.dp)
            .clickable(enabled = enabled) { onCheckedChange(!checked) },
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = label, color = if (enabled) LightText else GrayText.copy(alpha = 0.5f), fontSize = 13.sp)
        Checkbox(
            checked = checked,
            onCheckedChange = if (enabled) onCheckedChange else null,
            enabled = enabled,
            colors = CheckboxDefaults.colors(
                checkedColor = NeonViolet,
                uncheckedColor = GrayText
            )
        )
    }
}
