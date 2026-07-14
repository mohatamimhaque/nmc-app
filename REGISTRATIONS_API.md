# Processed Registrations Management - API Documentation

This document describes the 4 secure backend API endpoints created for managing participant registration records for the National Mathematics Carnival 2026.

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

## 0. Authentication Gateway (Secure Login)
*   **Route**: `POST /api/admin/login`
*   **Description**: Authenticates admin email and password. Verifies the user has a valid active record in the database `admin_users` table, and returns JWT session tokens.
*   **Request Format**:
    *   Content-Type: `application/json`
    *   Body Parameters:
        -   `email`: `string`
        -   `password`: `string`
    ```json
    {
      "email": "admin@example.com",
      "password": "securepassword123"
    }
    ```
*   **Response Format**:
    *   `200 OK`: Returns session tokens and admin user info.
    ```json
    {
      "success": true,
      "session": {
        "access_token": "eyJhbGciOi...",
        "refresh_token": "rf...",
        "expires_at": 1784048865,
        "expires_in": 3600
      },
      "user": {
        "id": "u-uuid-1234",
        "email": "admin@example.com",
        "display_name": "Mohatamim Haque",
        "role": "registration_editor"
      }
    }
    ```
    *   `401 Unauthorized` (Invalid credentials):
    ```json
    {
      "error": "Invalid login credentials."
    }
    ```
    *   `403 Forbidden` (User is not an authorized administrator):
    ```json
    {
      "error": "Access denied: User is not an authorized administrator."
    }
    ```

---

## 1. Retrieve Registrations
*   **Route**: `GET /api/admin/registrations`
*   **Description**: Retrieves the complete list of processed registrations from the database.
*   **Request Format**:
    *   No body parameters required.
*   **Response Format**:
    *   `200 OK`: Returns a JSON array containing all registration details.
    ```json
    [
      {
        "serial": "260001",
        "full_name": "MD. SIFATULLAH",
        "email_address": "sifat@example.com",
        "phone_number": "01712345678",
        "gender": "Male",
        "t_shirt_size": "L",
        "institution": "Dhaka College",
        "class_year_student_of": "HSC 2nd Year",
        "event": "Math Game",
        "payment_method": "Bkash",
        "payment_number": "01712345678",
        "transaction_id": "TxN82B19A",
        "is_kit_coollect": true,
        "is_present": true,
        "is_collect_launch": false,
        "allocated_room": "Room 302B",
        "updated_by": "mohatamimhaque@outlook.com",
        "updated_at": "2026-07-14T16:00:00.000Z",
        "created_at": "2026-07-14T12:00:00Z"
      }
    ]
    ```

---

## 2. Update Kit Collection
*   **Route**: `PATCH /api/admin/registrations/kit`
*   **Description**: Updates the kit collection status (`is_kit_coollect`) for a single registration using its serial number. Sets the `updated_by` column to the logged-in editor's name and `updated_at` to the current timestamp.
*   **Request Format**:
    *   Content-Type: `application/json`
    *   Body Parameters:
        -   `serial`: `string` (e.g., `"260001"`)
        -   `is_kit_coollect`: `boolean` (e.g. `true` or `false`)
    ```json
    {
      "serial": "260001",
      "is_kit_coollect": true
    }
    ```
*   **Response Format**:
    *   `200 OK`:
    ```json
    {
      "success": true,
      "updated": true,
      "serial": "260001",
      "updatedBy": "Mohatamim Haque",
      "updatedAt": "2026-07-14T16:00:00.000Z"
    }
    ```
    *   `400 Bad Request` (Missing fields or invalid formats):
    ```json
    {
      "error": "Missing or invalid serial or is_kit_coollect parameters."
    }
    ```

---

## 3. Update Launch Collection
*   **Route**: `PATCH /api/admin/registrations/launch`
*   **Description**: Updates the launch collection status (`is_collect_launch`) for a single registration using its serial number. Sets the `updated_by` column to the logged-in editor's name and `updated_at` to the current timestamp.
*   **Request Format**:
    *   Content-Type: `application/json`
    *   Body Parameters:
        -   `serial`: `string` (e.g., `"260001"`)
        -   `is_collect_launch`: `boolean` (e.g. `true` or `false`)
    ```json
    {
      "serial": "260001",
      "is_collect_launch": true
    }
    ```
*   **Response Format**:
    *   `200 OK`:
    ```json
    {
      "success": true,
      "updated": true,
      "serial": "260001",
      "updatedBy": "Mohatamim Haque",
      "updatedAt": "2026-07-14T16:00:00.000Z"
    }
    ```

---

## 4. Update Attendance / Presence
*   **Route**: `PATCH /api/admin/registrations/present`
*   **Description**: Updates the attendance status (`is_present`) for a single registration using its serial number. Sets the `updated_by` column to the logged-in editor's name and `updated_at` to the current timestamp.
*   **Request Format**:
    *   Content-Type: `application/json`
    *   Body Parameters:
        -   `serial`: `string` (e.g., `"260001"`)
        -   `is_present`: `boolean` (e.g. `true` or `false`)
    ```json
    {
      "serial": "260001",
      "is_present": false
    }
    ```
*   **Response Format**:
    *   `200 OK`:
    ```json
    {
      "success": true,
      "updated": true,
      "serial": "260001",
      "updatedBy": "Mohatamim Haque",
      "updatedAt": "2026-07-14T16:00:00.000Z"
    }
    ```
