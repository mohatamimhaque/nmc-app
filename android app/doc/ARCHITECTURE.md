# NMC 2026 Admin Application - System Architecture

This document describes the software architecture, class design, data flows, and offline synchronization mechanisms of the **NMC 2026 Android Admin Application**.

---

## 1. Architectural Patterns

The application conforms to standard Android architecture principles, utilizing an **offline-first MVVM (Model-View-ViewModel)** structure combined with the **Repository pattern**.

```mermaid
graph TD
    UI[Jetpack Compose Views] -->|Observe State / Trigger Intent| VM[Architecture ViewModels]
    VM -->|Fetch / Update Request| Repo[Data Repository]
    Repo -->|Local Read/Write| DB[(Room SQLite encrypted Cache)]
    Repo -->|Remote Request| Network[Retrofit HTTP Client]
    Network <-->|Sync / Push / Fetch| API[NMC API Server]
```

### Components:
1.  **View Layer (Jetpack Compose)**: Declarative UI components that react to state changes in the ViewModel. Views do not directly communicate with databases or networking clients.
2.  **ViewModel Layer (Jetpack ViewModels)**: Manages UI state using `StateFlow` and handles background operations within `viewModelScope` coroutine contexts.
3.  **Repository Layer (Data Repositories)**: The single source of truth for UI data. Decides dynamically whether to fetch from local Room databases, trigger remote API calls, or coordinate background offline synchronization.
4.  **Local Data Source (Room DB encrypted with SQLCipher)**: Provides encrypted on-device persistence for offline resiliency.
5.  **Remote Data Source (Retrofit API Service)**: Connects to the event backend API.

---

## 2. Core Class & Injection Graph

The project utilizes **Dagger Hilt** for dependency injection. The diagram below illustrates class associations and construction dependencies:

```mermaid
classDiagram
    class NetworkModule {
        +provideRetrofit() Retrofit
        +provideNmcApiService() NmcApiService
    }
    class DatabaseModule {
        +provideDatabase() AppDatabase
        +provideRegistrationDao() RegistrationDao
    }
    class AppDatabase {
        +registrationDao() RegistrationDao
        +offlinePatchDao() OfflinePatchDao
    }
    class RegistrationRepository {
        -apiService: NmcApiService
        -registrationDao: RegistrationDao
        -offlinePatchDao: OfflinePatchDao
        -settingsDataStore: SettingsDataStore
        +updateStatus() Result
        +observeTotalCount() Flow
    }
    class DashboardViewModel {
        -repository: RegistrationRepository
        +totalCount: StateFlow
        +breakfastServedCount: StateFlow
    }
    class SettingsDataStore {
        +canManageBreakfastFlow: Flow
        +saveCanManageBreakfast()
    }
    
    NetworkModule ..> RegistrationRepository : Injects NmcApiService
    DatabaseModule ..> RegistrationRepository : Injects DAOs
    AppDatabase --> RegistrationDao : Contains
    RegistrationRepository --> RegistrationDao : Queries
    RegistrationRepository --> NmcApiService : Calls
    DashboardViewModel --> RegistrationRepository : Observes
    RegistrationRepository --> SettingsDataStore : Saves permissions
```

---

## 3. Dynamic Data Flows

### A. Real-time Scanner Check-In Flow
This flow represents the check-in process when scanning a QR code ticket:

```mermaid
sequenceDiagram
    autonumber
    participant UI as ScannerScreen (UI)
    participant VM as ScannerViewModel
    participant Repo as RegistrationRepository
    participant Dao as RegistrationDao
    participant API as NmcApiService

    UI->>VM: processScannedSerial(serial)
    VM->>Repo: updateStatus(serial, mode, value=true)
    Note over Repo: Update local database first<br/>to show instant UI feedback
    Repo->>Dao: updateBreakfastStatus(serial, true)
    Dao-->>UI: Live Flow emits new counts
    Note over Repo: Send remote request
    Repo->>API: updateBreakfast(BreakfastStatusRequest)
    alt Remote Success
        API-->>Repo: 200 OK (UpdateStatusResponse)
    else Remote Failure / Offline
        API--xRepo: Timeout / No Network
        Note over Repo: Queue update offline
        Repo->>Dao: insert(OfflinePatch)
    else Access Denied (403 Forbidden)
        API-->>Repo: 403 Forbidden
        Note over Repo: Rollback UI State
        Repo->>Dao: updateBreakfastStatus(serial, false)
        Dao-->>UI: Live Flow emits reverted counts
        Repo-->>UI: Return failure toast
    end
```

---

## 4. Offline Synchronization (WorkManager)

The application handles on-ground connectivity loss seamlessly using an offline queue.

1.  **Queue Insertion**: When status changes are triggered offline, the repository saves the operation as an `OfflinePatch` in the `offline_patches_queue` database table.
2.  **Sync Execution**:
    -   `SyncWorkManager` registers a task constrained to run exclusively on `NetworkType.CONNECTED`.
    -   WorkManager executes the sync loop sequentially, processing patches in the queue and verifying authorization tokens.
    -   Successfully synchronized elements are immediately dropped from the local offline queue.


<p align="center">
  Developed by <b>Mohatamim Haque</b> <br/>
  <a href="https://wa.me/8801518749114" target="_blank"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp"/></a>
  <a href="mailto:mohatamimhaque7@gmail.com" target="_blank"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="mailto:mohatamimhaque@outlook.com" target="_blank"><img src="https://img.shields.io/badge/Outlook-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white" alt="Outlook"/></a>
  <a href="https://facebook.com/mohatamim44" target="_blank"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook"/></a>
  <a href="https://linkedin.com/in/mohatamim" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mohatamimhaque" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
</p>
