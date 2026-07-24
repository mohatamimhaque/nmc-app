package com.nmc.admin.ui.navigation

import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.nmc.admin.ui.screens.about.AboutScreen
import com.nmc.admin.ui.screens.dashboard.DashboardScreen
import com.nmc.admin.ui.screens.detail.DetailScreen
import com.nmc.admin.ui.screens.detail.PdfViewerScreen
import com.nmc.admin.ui.screens.login.LoginScreen
import com.nmc.admin.ui.screens.scanner.ScannerScreen
import com.nmc.admin.ui.screens.search.SearchScreen
import com.nmc.admin.ui.screens.settings.SettingsScreen
import com.nmc.admin.ui.screens.splash.SplashScreen
import com.nmc.admin.ui.screens.profile.ProfileScreen
import com.nmc.admin.ui.screens.usermanagement.UserManagementScreen
import com.nmc.admin.data.local.EncryptedPrefs
import androidx.hilt.navigation.compose.hiltViewModel

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object ChooseManage : Screen("choose_manage")
    object Scanner : Screen("scanner")
    object Detail : Screen("detail/{serial}?fromScan={fromScan}") {
        fun createRoute(serial: String, fromScan: Boolean = false) = "detail/$serial?fromScan=$fromScan"
    }
    object PdfViewer : Screen("pdf_viewer/{serial}") {
        fun createRoute(serial: String) = "pdf_viewer/$serial"
    }
    object Search : Screen("search")
    object Settings : Screen("settings")
    object About : Screen("about")
    object Profile : Screen("profile")
    object UserManagement : Screen("user_management")

    object FilteredRecords : Screen("filtered_records/{mode}/{type}/{value}") {
        fun createRoute(mode: String, type: String, value: String) = "filtered_records/$mode/$type/$value"
    }

    object SummaryPdfViewer : Screen("summary_pdf_viewer/{reportType}") {
        fun createRoute(reportType: String) = "summary_pdf_viewer/$reportType"
    }
}

@Composable
fun AppNavigation(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Screen.Splash.route) {
        composable(Screen.Splash.route) {
            SplashScreen(navController = navController)
        }
        composable(Screen.ChooseManage.route) {
            com.nmc.admin.ui.screens.choose.ChooseManageScreen(navController = navController)
        }
        composable(Screen.Login.route) {
            LoginScreen(navController = navController)
        }
        composable(Screen.Dashboard.route) {
            DashboardScreen(navController = navController)
        }
        composable(Screen.Scanner.route) {
            ScannerScreen(navController = navController)
        }
        composable(
            route = Screen.Detail.route,
            arguments = listOf(
                navArgument("serial") { type = NavType.StringType },
                navArgument("fromScan") {
                    type = NavType.BoolType
                    defaultValue = false
                }
            )
        ) { backStackEntry ->
            val serial = backStackEntry.arguments?.getString("serial") ?: ""
            val fromScan = backStackEntry.arguments?.getBoolean("fromScan") ?: false
            DetailScreen(navController = navController, serial = serial, fromScan = fromScan)
        }
        composable(
            route = Screen.PdfViewer.route,
            arguments = listOf(navArgument("serial") { type = NavType.StringType })
        ) { backStackEntry ->
            val serial = backStackEntry.arguments?.getString("serial") ?: ""
            PdfViewerScreen(navController = navController, serial = serial)
        }
        composable(Screen.Search.route) {
            SearchScreen(navController = navController)
        }
        composable(Screen.Settings.route) {
            SettingsScreen(navController = navController)
        }
        composable(Screen.About.route) {
            AboutScreen(navController = navController)
        }
        composable(Screen.Profile.route) {
            ProfileScreen(navController = navController)
        }
        composable(Screen.UserManagement.route) {
            UserManagementScreen(navController = navController)
        }
        composable(
            route = Screen.FilteredRecords.route,
            arguments = listOf(
                navArgument("mode") { type = NavType.StringType },
                navArgument("type") { type = NavType.StringType },
                navArgument("value") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val mode = backStackEntry.arguments?.getString("mode") ?: "participant"
            val type = backStackEntry.arguments?.getString("type") ?: ""
            val value = backStackEntry.arguments?.getString("value") ?: ""
            com.nmc.admin.ui.screens.filtered.FilteredRecordsScreen(
                navController = navController,
                mode = mode,
                type = type,
                value = value
            )
        }
        composable(
            route = Screen.SummaryPdfViewer.route,
            arguments = listOf(navArgument("reportType") { type = NavType.StringType })
        ) { backStackEntry ->
            val reportType = backStackEntry.arguments?.getString("reportType") ?: "participant"
            com.nmc.admin.ui.screens.detail.SummaryPdfViewerScreen(navController = navController, reportType = reportType)
        }

    }
}
