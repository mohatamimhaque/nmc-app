package com.nmc.admin.ui.screens.about

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.navigation.NavController
import com.nmc.admin.R
import com.nmc.admin.logging.AuditLogger
import com.nmc.admin.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class AboutViewModel @Inject constructor(
    private val auditLogger: AuditLogger
) : ViewModel() {

    fun exportAndShareLogs(context: Context) {
        val zipFile = auditLogger.exportLogsToZip()
        if (zipFile != null && zipFile.exists()) {
            val uri = FileProvider.getUriForFile(
                context,
                "com.nmc.admin.fileprovider",
                zipFile
            )
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/zip"
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(Intent.createChooser(intent, "Share Diagnostic Audit Logs"))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutScreen(
    navController: NavController,
    viewModel: AboutViewModel = hiltViewModel()
) {
    val context = LocalContext.current

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("About Application", color = LightText, fontSize = 16.sp, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = LightText)
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
                .padding(24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Logo card
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(24.dp))
                        .background(GlassSurface)
                        .border(1.dp, GlassBorder, RoundedCornerShape(24.dp))
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.logo),
                        contentDescription = "NMC Logo",
                        modifier = Modifier.size(90.dp)
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "NMC 2026 Admin Utility",
                    color = LightText,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                
                Text(
                    text = "Version 1.0.0",
                    color = GrayText,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(24.dp))

                Text(
                    text = "This mobile utility is designed for the on-ground event volunteers and coordinators of the National Mathematics Carnival 2026. It features automated no-click barcode scan registration, real-time status updates, offline local database caching, biometrics security access override checks, and native PDF admit card render capabilities.",
                    color = GrayText,
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Export Log Button
                Button(
                    onClick = { viewModel.exportAndShareLogs(context) },
                    colors = ButtonDefaults.buttonColors(containerColor = NeonViolet),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = "Export Logs")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("EXPORT AUDIT LOG TRAIL", fontWeight = FontWeight.Bold)
                }
            }

            // Courtesy Footer
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 12.dp),
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
