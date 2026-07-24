package com.nmc.admin.ui.screens.login

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import com.nmc.admin.R
import com.nmc.admin.data.remote.dto.LoginRequest
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val repository: RegistrationRepository
) : ViewModel() {

    var email by mutableStateOf("")
    var password by mutableStateOf("")
    var isLoading by mutableStateOf(false)
    var errorMessage by mutableStateOf<String?>(null)

    init {
        email = ""
        password = ""
        errorMessage = null
    }

    private val _loginSuccess = MutableSharedFlow<Boolean>()
    val loginSuccess: SharedFlow<Boolean> = _loginSuccess

    fun login() {
        if (email.isBlank() || password.isBlank()) {
            errorMessage = "Email/Phone and password are required."
            return
        }
        
        viewModelScope.launch {
            isLoading = true
            errorMessage = null
            
            val result = repository.login(LoginRequest(email.trim(), password))
            if (result.isSuccess) {
                repository.syncRegistrations()
                _loginSuccess.emit(true)
            } else {
                val exception = result.exceptionOrNull()
                val msg = exception?.message ?: ""
                errorMessage = when {
                    // Check if it's a connection/DNS/timeout exception
                    exception is java.io.IOException || 
                    msg.contains("Unable to resolve host", ignoreCase = true) ||
                    msg.contains("No address associated with hostname", ignoreCase = true) ||
                    msg.contains("timeout", ignoreCase = true) ||
                    msg.contains("connect", ignoreCase = true) -> {
                        "No internet connection. Please check your network and try again."
                    }
                    // Check if it's an authorization/authentication exception
                    msg.contains("401", ignoreCase = true) || 
                    msg.contains("unauthorized", ignoreCase = true) -> {
                        "Invalid email or password. Please try again."
                    }
                    // Check if access forbidden
                    msg.contains("403", ignoreCase = true) || 
                    msg.contains("forbidden", ignoreCase = true) -> {
                        "Access denied. You do not have permission to log in."
                    }
                    // Default fallback
                    else -> {
                        "Invalid email or password. Please try again."
                    }
                }
            }
            isLoading = false
        }
    }
}

@Composable
fun LoginScreen(
    navController: NavController,
    viewModel: LoginViewModel = hiltViewModel()
) {
    var passwordVisible by remember { mutableStateOf(false) }

    LaunchedEffect(key1 = true) {
        viewModel.loginSuccess.collectLatest { success ->
            if (success) {
                navController.navigate(Screen.Dashboard.route) {
                    popUpTo(Screen.Login.route) { inclusive = true }
                }
            }
        }
    }

    var startAnimation by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        startAnimation = true
    }

    val cardOffsetY by animateDpAsState(
        targetValue = if (startAnimation) 0.dp else 50.dp,
        animationSpec = tween(durationMillis = 1000, easing = EaseOutBack),
        label = "offsetY"
    )
    val cardAlpha by animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
        label = "alpha"
    )

    ObsidianGradientBg {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp)
                    .offset(y = cardOffsetY)
                    .alpha(cardAlpha),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = GlassSurface),
                    border = BorderStroke(
                        1.dp,
                        Brush.linearGradient(listOf(NeonViolet, NeonBlue))
                    ),
                    shape = RoundedCornerShape(24.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.logo),
                            contentDescription = "NMC Logo",
                            modifier = Modifier.size(95.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "National Mathematics Carnival 2026",
                            color = LightText,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.ExtraBold,
                            textAlign = TextAlign.Center
                        )
                        Text(
                            text = "Admin Management Portal",
                            color = GrayText,
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(28.dp))

                        OutlinedTextField(
                            value = viewModel.email,
                            onValueChange = { viewModel.email = it },
                            label = { Text("Email or Phone Number", color = GrayText) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = LightText,
                                unfocusedTextColor = LightText,
                                focusedBorderColor = NeonViolet,
                                unfocusedBorderColor = GlassBorder,
                                focusedContainerColor = ObsidianBg.copy(alpha = 0.5f),
                                unfocusedContainerColor = ObsidianBg.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text)
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = viewModel.password,
                            onValueChange = { viewModel.password = it },
                            label = { Text("Password", color = GrayText) },
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            trailingIcon = {
                                val image = if (passwordVisible)
                                    Icons.Filled.Visibility
                                else Icons.Filled.VisibilityOff

                                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                    Icon(imageVector = image, contentDescription = "Toggle password", tint = GrayText)
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = LightText,
                                unfocusedTextColor = LightText,
                                focusedBorderColor = NeonViolet,
                                unfocusedBorderColor = GlassBorder,
                                focusedContainerColor = ObsidianBg.copy(alpha = 0.5f),
                                unfocusedContainerColor = ObsidianBg.copy(alpha = 0.5f)
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        if (viewModel.errorMessage != null) {
                            Text(
                                text = viewModel.errorMessage ?: "",
                                color = ErrorRed,
                                fontSize = 13.sp,
                                modifier = Modifier.fillMaxWidth(),
                                textAlign = TextAlign.Start
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                        } else {
                            Spacer(modifier = Modifier.height(16.dp))
                        }

                        Button(
                            onClick = { viewModel.login() },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = NeonViolet,
                                contentColor = LightText
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp),
                            enabled = !viewModel.isLoading
                        ) {
                            if (viewModel.isLoading) {
                                CircularProgressIndicator(color = LightText, modifier = Modifier.size(24.dp))
                            } else {
                                Text("LOG IN", fontSize = 15.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            }
                        }
                    }
                }
            }

            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "created by",
                    color = GrayText.copy(alpha = 0.35f),
                    fontSize = 10.sp,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "mohatamim",
                    color = GrayText.copy(alpha = 0.45f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
