package com.nmc.admin.ui.screens.splash

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
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
import com.nmc.admin.data.repository.RegistrationRepository
import com.nmc.admin.ui.navigation.Screen
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.StateFlow
import javax.inject.Inject

import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn

@HiltViewModel
class SplashViewModel @Inject constructor(
    private val repository: RegistrationRepository,
    private val settingsDataStore: com.nmc.admin.data.local.SettingsDataStore
) : ViewModel() {
    val isAuthorized: StateFlow<Boolean> = repository.isAuthorized
    val canManageVolunteers = settingsDataStore.canManageVolunteersFlow
        .stateIn(viewModelScope, SharingStarted.Lazily, false)
}

@Composable
fun SplashScreen(
    navController: NavController,
    viewModel: SplashViewModel = hiltViewModel()
) {
    val isAuthorized by viewModel.isAuthorized.collectAsState()
    val canManageVolunteers by viewModel.canManageVolunteers.collectAsState()

    var startAnimation by remember { mutableStateOf(false) }
    
    val alphaAnim = animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0f,
        animationSpec = tween(durationMillis = 1000, easing = FastOutSlowInEasing),
        label = "alpha"
    )
    
    val scaleAnim = animateFloatAsState(
        targetValue = if (startAnimation) 1f else 0.75f,
        animationSpec = tween(durationMillis = 1000, easing = EaseOutBack),
        label = "scale"
    )

    val offsetYAnim = animateDpAsState(
        targetValue = if (startAnimation) 0.dp else 40.dp,
        animationSpec = tween(durationMillis = 1000, easing = EaseOutBack),
        label = "offsetY"
    )

    // Pulsating background glow animation
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.9f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    LaunchedEffect(key1 = true) {
        startAnimation = true
        delay(1300) // Snap transition

        if (isAuthorized) {
            if (canManageVolunteers) {
                navController.navigate(Screen.ChooseManage.route) {
                    popUpTo(Screen.Splash.route) { inclusive = true }
                }
            } else {
                navController.navigate(Screen.Dashboard.route) {
                    popUpTo(Screen.Splash.route) { inclusive = true }
                }
            }
        } else {
            navController.navigate(Screen.Login.route) {
                popUpTo(Screen.Splash.route) { inclusive = true }
            }
        }
    }

    ObsidianGradientBg {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            // Pulsating Neon Backdrop Glow
            Box(
                modifier = Modifier
                    .size(240.dp * pulseScale)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(
                                NeonViolet.copy(alpha = 0.35f),
                                Color.Transparent
                            )
                        )
                    )
            )

            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .offset(y = offsetYAnim.value)
                    .alpha(alphaAnim.value)
                    .scale(scaleAnim.value)
            ) {
                Image(
                    painter = painterResource(id = R.drawable.logo),
                    contentDescription = "NMC Logo",
                    modifier = Modifier.size(130.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "NMC 2026 ADMIN",
                    color = LightText,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "v1.0.0",
                    color = GrayText,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Normal
                )
            }

            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 40.dp)
                    .alpha(alphaAnim.value),
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
