package com.nmc.admin.ui.theme

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

@Composable
fun ObsidianGradientBg(
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "glow")

    val pulseFraction by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(12000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(ObsidianBg)
            .drawBehind {
                val width = size.width
                val height = size.height

                // Spot 1: Neon Violet glow spot drifting near the top-right
                val angle = pulseFraction * Math.PI * 2
                val x1 = width * (0.7f + 0.12f * kotlin.math.sin(angle).toFloat())
                val y1 = height * (0.2f + 0.12f * kotlin.math.cos(angle).toFloat())
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(NeonViolet.copy(alpha = 0.15f), Color.Transparent),
                        center = Offset(x1, y1),
                        radius = width * 0.75f
                    ),
                    center = Offset(x1, y1),
                    radius = width * 0.75f
                )

                // Spot 2: Neon Blue glow spot drifting near the bottom-left
                val x2 = width * (0.2f + 0.12f * kotlin.math.cos(angle).toFloat())
                val y2 = height * (0.8f + 0.12f * kotlin.math.sin(angle).toFloat())
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(NeonBlue.copy(alpha = 0.15f), Color.Transparent),
                        center = Offset(x2, y2),
                        radius = width * 0.75f
                    ),
                    center = Offset(x2, y2),
                    radius = width * 0.75f
                )
            }
    ) {
        content()
    }
}
