# Processed Registrations Management - API Documentation

This document describes the 6 secure backend API endpoints created for managing participant registration records for the National Mathematics Carnival 2026 Android Admin Application.

## Authentication & Authorization

All endpoints are securely protected. Requests must be authenticated using one of the following methods:

### 1. Bearer Token Authorization (Recommended for Android App)
Your Android application should authenticate by passing the Supabase access token (JWT) in the `Authorization` header:
*   **Header**: `Authorization: Bearer <supabase_access_token>`
*   **How to obtain token**:
    Call the direct Next.js auth endpoint: `POST /api/admin/login` (detailed below) with your admin email and password. The returned `session.access_token` JWT is the value to be passed in this header.
*   **Role Check**: The user account associated with the access token must have one of the authorized roles (`super_admin`, `admin`, `registration_editor`).

### 2. Cookie Session Authorization (Used by Admin Web Panel UI)
Web browsers automatically send cookies that are validated by the server client.

### Access Levels
Requests without valid auth headers or session cookies will return `401 Unauthorized`. If the authenticated account is not in the `admin_users` table or does not have one of the authorized roles, it will return `403 Forbidden`.

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
