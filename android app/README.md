# NMC 2026 Admin Android Application

The **NMC 2026 Admin Android Application** is a native mobile utility built in Kotlin with Jetpack Compose for on-ground administrators and event coordinators at the **National Mathematics Carnival 2026**. It provides secure, high-speed participant/volunteer check-in tracking (Kit distribution, Attendance, Lunch, and Breakfast servings) via QR/Barcode scanner.

---

## 📂 Project Documentation Quick-Links

All project requirements, specifications, and architecture manuals are organized inside the `/doc` directory:

1.  📄 **[Product Requirements Document (PRD)](file:///c:/Users/mohatamim/OneDrive%20-%20duet.ac.bd/Desktop/nmc%20android%20%20app/doc/ANDROID_APP_PRD.md)**  
    *Details core app workflows, environment requirements, API endpoint contracts, and UI ASCII wireframes.*
2.  📄 **[Developer Documentation](file:///c:/Users/mohatamim/OneDrive%20-%20duet.ac.bd/Desktop/nmc%20android%20%20app/doc/DEVELOPER_DOCUMENTATION.md)**  
    *Technical specifications, package structure details, role-based authorization scopes, and ProGuard obfuscation rules.*
3.  📄 **[System Architecture & Flow Diagrams](file:///c:/Users/mohatamim/OneDrive%20-%20duet.ac.bd/Desktop/nmc%20android%20%20app/doc/ARCHITECTURE.md)**  
    *Visual system blueprints, Dagger Hilt DI class dependency layouts, check-in haptic sequence charts, and database schemas.*
4.  📄 **[User Manual](file:///c:/Users/mohatamim/OneDrive%20-%20duet.ac.bd/Desktop/nmc%20android%20%20app/doc/USER_MANUAL.md)**  
    *End-user guides for event volunteers, manual status overrides, superadmin control views, and the permissions matrix.*

---

## 🛠️ Build & Compilation Setup

### Prerequisites
- **Android Studio**: Android Studio Koala (or newer).
- **JDK Version**: Java Development Kit (JDK) 17.
- **Minimum SDK**: API Level 26 (Android 8.0 Oreo).
- **Target SDK**: API Level 34 (Android 14.0).

### Local Properties Configuration
Before building, create or ensure a `local.properties` file exists in the root directory to define your local Android SDK location:
```ini
sdk.dir=C\:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk
```

### Building the Project
You can compile and build the APK using the gradle wrapper scripts from your terminal:
```powershell
# Compile Kotlin source files
.\gradlew compileDebugKotlin

# Assemble Debug APK build
.\gradlew assembleDebug
```

---

*courtesy: mohatamim*


<p align="center">
  Developed by <b>Mohatamim Haque</b> <br/>
  <a href="https://wa.me/8801518749114" target="_blank"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp"/></a>
  <a href="mailto:mohatamimhaque7@gmail.com" target="_blank"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="mailto:mohatamimhaque@outlook.com" target="_blank"><img src="https://img.shields.io/badge/Outlook-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white" alt="Outlook"/></a>
  <a href="https://facebook.com/mohatamim44" target="_blank"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook"/></a>
  <a href="https://linkedin.com/in/mohatamim" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mohatamimhaque" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
</p>
