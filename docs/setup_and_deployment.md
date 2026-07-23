# Setup & Deployment Guide

This guide details instructions for setting up, running, and deploying the Next.js web application, the Python FastAPI admit card generator, and configuring the Android application.

---

## 1. Next.js Web Application & Admin Panel

The main website is built with Next.js 14 and acts as the central hub.

### Local Development Setup

1.  **Prerequisites**: Ensure you have [Node.js (v18.x or v20.x)](https://nodejs.org/) and `npm` installed.
2.  **Install Dependencies**: Run the following command in the project root folder:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    *   Duplicate the template file [\.env.example](file:///d:/nmc/nmc26/.env.example) and name it `.env.local`.
    *   Fill in the Supabase details, Cloudflare R2 bucket details, and other credentials.
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The site will start on [http://localhost:3000](http://localhost:3000).

### Production Deployment to Vercel

1.  **Create Vercel Project**: Push the repository to GitHub and link it to Vercel.
2.  **Environment Variables**: In Vercel Project Settings, add all variables defined in `.env.local`.
3.  **Supabase Integration**: Ensure your production Supabase database connections are active and Row-Level Security (RLS) is enabled.
4.  **Vercel Build**: The project will build automatically via the standard Next.js CI/CD pipeline using:
    ```bash
    npm run build
    ```

---

## 2. FastAPI Admit Card Generator ("Autocrat")

This script runs locally on a **Windows machine** with **Microsoft PowerPoint** installed, because it leverages Windows COM automation (`win32com`) to perform PPTX-to-PDF conversion.

### Setup Instructions (Windows)

1.  **Prerequisites**:
    *   Windows OS.
    *   Microsoft Office/PowerPoint installed.
    *   Python 3.10+ installed.
2.  **Install Required Libraries**:
    In your command prompt, run:
    ```cmd
    pip install fastapi uvicorn python-pptx qrcode pillow pywin32 python-dotenv
    ```
3.  **Configure API Key**:
    The FastAPI service validates requests using the `X-API-Key` header, matched against `ADMIT_CARD_SECRET_KEY` in `.env.local`. Ensure this is identical in both systems.

### Running the Server

1.  Navigate to the project root directory.
2.  Start Uvicorn specifying the app directory:
    ```cmd
    python -m uvicorn --app-dir "admit card" autocrat:app --host 127.0.0.1 --port 8080 --reload
    ```
3.  *Alternatively*, navigate directly into the `admit card` directory and run:
    ```cmd
    cd "admit card"
    python -m uvicorn autocrat:app --host 127.0.0.1 --port 8080 --reload
    ```

### Troubleshooting: Port Conflict (Error `[WinError 10013]`)

If port `8080` is already occupied, you will see a socket access forbidden error.

1.  Find the process ID (PID) occupying port `8080`:
    ```cmd
    netstat -ano | findstr 8080
    ```
2.  Terminate the process (e.g., if PID is `2624`):
    ```cmd
    taskkill /F /PID 2624
    ```
3.  Alternatively, configure a different port (e.g., `8081`) and update `ADMIT_CARD_GENERATOR_URL` in `.env.local` to `http://127.0.0.1:8081`.

---

## 3. Kotlin Android Application Configuration

The Android application is a separate codebase but relies on the Next.js API.

### Configuration & Base URLs

To prepare the Android application for development or release, configure the build-time constants:

1.  **Base API URL**: Ensure the endpoint points to the deployed web application:
    ```ini
    # Located in gradle.properties or local.properties
    NMC_API_BASE_URL=https://yourdomain.com/api
    ```
2.  **Supabase Auth Keys**:
    Make sure the Android client uses the identical Supabase API URL and public anon key configured in the Next.js environment.
3.  **Local Encryption**: The Room Database is encrypted with SQLCipher. Set a strong passphrase for the database key injection inside the app's `DatabaseModule`.

---

## 4. Troubleshooting & Operational FAQ Matrix

Use this matrix to diagnose and fix errors during development or event-day operations.

| Component | Error Symptom | Probable Cause | Corrective Action |
| :--- | :--- | :--- | :--- |
| **FastAPI Generator** | `pywintypes.com_error: (-2147024894, ...)` | PowerPoint is locked, hung, or running in protected mode in the background. | 1. Open Windows Task Manager.<br>2. Force-quit all running instances of `POWERPNT.EXE`. <br>3. Restart the uvicorn generator script. |
| **FastAPI Generator** | PowerPoint converted PDF is blank or corrupt | COM initialization failed inside the active worker thread. | Ensure `pythoncom.CoInitialize()` and `pythoncom.CoUninitialize()` are wrapping the win32com dispatcher logic (as done in `autocrat.py`). |
| **Next.js Web App** | File Upload fails with `500 Internal Server Error` | Sharp image processing library binary mismatch or R2 key failure. | 1. Verify Cloudflare R2 bucket credentials in `.env.local`.<br>2. On Vercel, make sure the Node runtime matches project configurations. Reinstall dependencies using `npm ci`. |
| **Next.js Web App** | API calls return `403 Forbidden` | Supabase RLS policies are blocking read/write database transactions. | 1. Run the database migration files under `supabase/migrations/` to set up RLS policies.<br>2. Ensure the user's role is correctly set to `super_admin`, `admin`, or `registration_editor` inside `admin_users`. |
| **Android Client** | Retrofit calls return `401 Unauthorized` | Supabase JWT token has expired or is invalid. | Log out of the application, clear local application cache, and log back in to get a fresh Bearer token. |
| **Android Client** | Database crashes with `sqlite3_key failed` | Room Database encryption passphrase key mismatch. | Clean the application data/storage on the device or change the SQLite database build key version to force rebuild schema. |
| **R2 Storage** | Generated Admit Cards return `404` or `Access Denied` | R2 Bucket visibility is set to private. | Go to Cloudflare Dashboard -> R2 -> Bucket Settings and enable the public domain/URI link mapped to `R2_PUBLIC_URL`. |



---
<p align="center">
  Developed by <b>Mohatamim Haque</b> <br/>
  <a href="https://wa.me/8801518749114" target="_blank"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp"/></a>
  <a href="mailto:mohatamimhaque7@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="mailto:mohatamimhaque@outlook.com"><img src="https://img.shields.io/badge/Outlook-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white" alt="Outlook"/></a>
  <a href="https://facebook.com/mohatamim44" target="_blank"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook"/></a>
  <a href="https://linkedin.com/in/mohatamim" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mohatamimhaque" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
</p>
