# Volunteer Management - Android App Backend API Documentation

This document describes the secure backend API endpoints created for managing volunteer records for the National Mathematics Carnival 2026 Android Admin Application.

## Authentication & Authorization

All endpoints are securely protected. Requests must be authenticated using the Supabase access token (JWT) passed in the `Authorization` header:

- **Header**: `Authorization: Bearer <supabase_access_token>`
- **How to obtain token**:
  Call the auth gateway: `POST /api/admin/login` (email/password payload). The returned `session.access_token` JWT is the value to pass in this header.
- **Access Rules**:
  - **super_admin** & **admin**: Full access to all endpoints, including statistics, participant management, and volunteer management.
  - **registration_editor**: Full access to participant registrations. Can manage volunteers only if explicitly granted the `can_manage_volunteers` permission.
  - **volunteer**: Permitted to login only on the Android application (blocked from logging into the website admin panel). By default:
    - **Read-Only**: Can search and view participant registration details.
    - **Manage Participants**: If explicitly granted `can_manage_registrations` permission, they can update status flags (Kits, Attendance, Launch).
    - **Manage Volunteers**: If explicitly granted `can_manage_volunteers` permission, they can retrieve and update volunteer details.
  - Unauthenticated requests return `401 Unauthorized`. Unpermitted requests return `403 Forbidden`.

---

## Cloudflare R2 Storage Configuration

These configurations are used by the file upload endpoint (`POST /api/admin/upload`) to authenticate and save volunteer images to the Cloudflare R2 bucket:

```ini
R2_ACCOUNT_ID=d284e14d88a942f51c8a61cd326b32f8
R2_ACCESS_KEY_ID=9361421e6876221d8d7c5f797b26b4e0
R2_SECRET_ACCESS_KEY=4623d08392f473ef0cbcb993fe484c2e85b78a9411e723f07855bdaf38ae7efb
R2_BUCKET_NAME=nmc
R2_PUBLIC_URL=https://pub-99e7fad4ec9f4d2dafa1e77c8558eee0.r2.dev
```

---

## Authentication Gateway (Secure Login)
*   **Route**: `POST /api/admin/login`
*   **Description**: Authenticates volunteers, registration editors, and administrators using either **Email Address** OR **Mobile Number** and password (default password: `12345678`). Auto-provisions volunteer accounts if logging in for the first time.
*   **Request Format (Mobile or Email)**:
    *   Content-Type: `application/json`
    *   Body (Mobile login):
        ```json
        {
          "mobile": "01812345678",
          "password": "12345678"
        }
        ```
    *   Body (Email login or using "email"/"identifier" field):
        ```json
        {
          "email": "editor@example.com",
          "password": "12345678"
        }
        ```
*   **Response Format (200 OK)**:
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
        "id": "u-uuid-5678",
        "email": "editor@example.com",
        "display_name": "Sifat Ahmed",
        "role": "registration_editor",
        "can_manage_volunteers": false,
        "can_manage_registrations": true,
        "can_manage_kit": true,
        "can_manage_presents": true,
        "can_manage_lunch": true
      }
    }
    ```

---

## 1. Retrieve All Volunteers
*   **Route**: `GET /api/admin/volunteers`
*   **Description**: Retrieves the complete list of registered volunteers from the database.
*   **Response Format (200 OK)**:
    ```json
    [
      {
        "unique_id": "CY6NGPU3",
        "serial_no": "V260001",
        "name": "Mahir Faysal",
        "email": "mahir@example.com",
        "number": "01812345678",
        "image_url": "https://example.com/images/mahir.jpg",
        "segment": "Public Relations",
        "department": "CSE",
        "student_id": "2021331001",
        "year": "3rd Year",
        "t_shirt_size": "XL",
        "is_present": true,
        "is_gift_collected": true,
        "is_lunch_collected": false,
        "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CY6NGPU3",
        "created_at": "2026-07-16T12:00:00.000Z",
        "updated_at": "2026-07-16T12:30:00.000Z",
        "updated_by": "Sifat Ahmed"
      }
    ]
    ```

---

## 2. Retrieve Single Volunteer (QR/Barcode Scanner Lookup)
*   **Route**: `GET /api/admin/volunteers/single`
*   **Query Parameters**:
    -   `unique_id`: `string` (required)
*   **Description**: Retrieves the details of a single volunteer matching the scanned barcode or unique ID.
*   **Response Format (200 OK)**:
    ```json
    {
      "success": true,
      "volunteer": {
        "unique_id": "CY6NGPU3",
        "serial_no": "V260001",
        "name": "Mahir Faysal",
        "email": "mahir@example.com",
        "number": "01812345678",
        "image_url": "https://example.com/images/mahir.jpg",
        "segment": "Public Relations",
        "department": "CSE",
        "student_id": "2021331001",
        "year": "3rd Year",
        "t_shirt_size": "XL",
        "is_present": true,
        "is_gift_collected": true,
        "is_lunch_collected": false,
        "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CY6NGPU3",
        "created_at": "2026-07-16T12:00:00.000Z",
        "updated_at": "2026-07-16T12:30:00.000Z",
        "updated_by": "Sifat Ahmed"
      }
    }
    ```
*   **Response (404 Not Found)**:
    ```json
    {
      "error": "Volunteer with unique_id \"CY6NGPU3\" not found."
    }
    ```

---

## 3. Create a Volunteer
*   **Route**: `POST /api/admin/volunteers`
*   **Description**: Creates a new volunteer entry.
*   **Image Upload Workflow (Optional)**:
    If a volunteer photo needs to be saved:
    1. Upload the image file to the Cloudflare R2 bucket first by making a `POST` request to `/api/admin/upload` with the file passed in the Form-Data parameter named `file`.
    2. Retrieve the public image URL from the response (e.g., `{"url": "https://..."}`).
    3. Include this URL as the `"image_url"` value in the `POST` request body below.
*   **Request Format**:
    ```json
    {
      "unique_id": "CY6NGPU3", // Optional: if omitted, will be auto-generated as a random 8-character string
      "serial_no": "V260002", // Optional: if omitted, will be auto-generated sequentially (V260001, V260002, etc.)
      "name": "Sajid Karim",
      "email": "sajid@example.com",
      "number": "01512345678",
      "image_url": "https://pub-99e7fad4ec9f4d2dafa1e77c8558eee0.r2.dev/site-settings/1784048865-sajid.jpg",
      "segment": "Registration",
      "department": "Physics",
      "student_id": "2022441012",
      "year": "2nd Year",
      "t_shirt_size": "L"
    }
    ```
*   **Response Format (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "unique_id": "CY6NGPU3",
        "serial_no": "V260002",
        "name": "Sajid Karim",
        "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CY6NGPU3",
        ...
      }
    }
    ```

---

## 4. Quick Attendance Verification (Toggle Presence)
*   **Route**: `PATCH /api/admin/volunteers/present`
*   **Description**: Check-in or check-out a volunteer by marking their presence.
*   **Request Format**:
    ```json
    {
      "unique_id": "V260001",
      "is_present": true
    }
    ```
*   **Response Format (200 OK)**:
    ```json
    {
      "success": true,
      "updated": true,
      "unique_id": "V260001",
      "updatedBy": "Sifat Ahmed",
      "updatedAt": "2026-07-16T12:45:00.000Z"
    }
    ```

---

## 5. Track Gift Collection
*   **Route**: `PATCH /api/admin/volunteers/gift`
*   **Description**: Update the status of gift/t-shirt/token collection for a volunteer.
*   **Request Format**:
    ```json
    {
      "unique_id": "V260001",
      "is_gift_collected": true
    }
    ```
*   **Response Format (200 OK)**:
    ```json
    {
      "success": true,
      "updated": true,
      "unique_id": "V260001",
      "updatedBy": "Sifat Ahmed",
      "updatedAt": "2026-07-16T12:46:00.000Z"
    }
    ```

---

## 6. Track Lunch Service
*   **Route**: `PATCH /api/admin/volunteers/lunch`
*   **Description**: Update lunch collection status for a volunteer.
*   **Request Format**:
    ```json
    {
      "unique_id": "V260001",
      "is_lunch_collected": true
    }
    ```
*   **Response Format (200 OK)**:
    ```json
    {
      "success": true,
      "updated": true,
      "unique_id": "V260001",
      "updatedBy": "Sifat Ahmed",
      "updatedAt": "2026-07-16T12:47:00.000Z"
    }
    ```

---

## 7. Get Volunteer aggregate statistics
*   **Route**: `GET /api/admin/volunteers/summary`
*   **Description**: Retrieves counts for presence, gift collection, lunch service, and breakdowns by segments/departments.
*   **Web Admin Dashboard Click Interaction**:
    On the Web Admin panel, clicking any status pill inside the statistics overview cards will filter the volunteer list dynamically on the search page:
    *   **Total Volunteers**: Resets filters and displays the full volunteer database.
    *   **Attendance**: Click **PRESENT** or **ABSENT** to filter the list.
    *   **Gift / T-Shirt**: Click **COLLECTED** or **PENDING** to filter the list.
    *   **Lunch Service**: Click **SERVED** or **PENDING** to filter the list.
*   **Response Format (200 OK)**:
    ```json
    {
      "success": true,
      "total": 120,
      "attendance": {
        "present": 95,
        "absent": 25
      },
      "gift_collection": {
        "collected": 88,
        "pending": 32
      },
      "lunch_status": {
        "served": 92,
        "pending": 28
      },
      "by_segment": {
        "Public Relations": 20,
        "Registration": 35,
        "Decoration": 15,
        "Logistics": 50
      },
      "by_department": {
        "CSE": 45,
        "Physics": 25,
        "EEE": 30,
        "Math": 20
      }
    }
    ```

---

## Android App Check-In Workflows

> [!NOTE]
> The Android Admin application generates and renders QR codes dynamically on the device screen using the volunteer's `unique_id` (a random 8-character string, e.g., `CY6NGPU3`). Scanning these codes checks in volunteers or handles lunch/gift redemptions.

### Scenario A: Fast Attendance Scan (Gate Entrance)
1.  Admin selects "Attendance Mode" in the app.
2.  App activates camera scanner and decodes the volunteer's scanned QR code (e.g. `CY6NGPU3`, which corresponds to their `unique_id`).
3.  App calls `PATCH /api/admin/volunteers/present` with body `{"unique_id": "CY6NGPU3", "is_present": true}`.
4.  If successful, the app shows a green checkmark and says "Mahir Faysal Checked In". If status is `403 Forbidden`, the app warns "Access Denied: Inadequate Permissions".

### Scenario B: Gift Distribution Desk
1.  Admin selects "Gift collection mode" in the app.
2.  Admin scans the volunteer's QR code.
3.  App first calls `GET /api/admin/volunteers/single?unique_id=CY6NGPU3` to display details (Name, Segment, T-shirt size, etc.).
4.  Admin hands over the correct T-shirt size (e.g., `XL`) and presses "Mark Gift Collected".
5.  App calls `PATCH /api/admin/volunteers/gift` with body `{"unique_id": "CY6NGPU3", "is_gift_collected": true}`.

### Scenario C: Lunch Token Redemption
1.  Admin selects "Lunch service mode" in the app.
2.  Admin scans the QR code.
3.  App first calls `GET /api/admin/volunteers/single?unique_id=CY6NGPU3`.
4.  App checks if `"is_lunch_collected"` is already `true`. If so, show a red alarm "Error: Lunch already served!".
5.  If not served, the admin hands over lunch and presses "Confirm Lunch Served".
6.  App calls `PATCH /api/admin/volunteers/lunch` with body `{"unique_id": "CY6NGPU3", "is_lunch_collected": true}`.

---

## Self Profile Management (All Users & Volunteers)

These endpoints allow any authenticated administrator or volunteer to fetch and update their own credentials/profile details (restricted to the caller's own account only).

### 8. Get Own Profile Info
*   **Route**: `GET /api/admin/profile`
*   **Description**: Retrieves the details of the currently logged-in account. For volunteers, it returns combined data from both `admin_users` and the `volunteers` table.
*   **Response Format (200 OK - Volunteer Profile)**:
    ```json
    {
      "success": true,
      "profile": {
        "id": "u-uuid-5678",
        "email": "editor@example.com",
        "display_name": "Sifat Ahmed",
        "role": "volunteer",
        "can_manage_volunteers": false,
        "can_manage_registrations": false,
        "created_at": "2026-07-16T10:00:00.000Z",
        "volunteer_details": {
          "unique_id": "V260001",
          "name": "Sifat Ahmed",
          "email": "editor@example.com",
          "number": "01812345678",
          "image_url": "https://pub-99e7fad4ec9f4d2dafa1e77c8558eee0.r2.dev/volunteers/sifat.jpg",
          "segment": "Public Relations",
          "department": "CSE",
          "student_id": "2021331001",
          "year": "3rd Year",
          "t_shirt_size": "XL",
          "is_present": true,
          "is_gift_collected": true,
          "is_lunch_collected": false,
          "created_at": "2026-07-16T12:00:00.000Z",
          "updated_at": "2026-07-16T12:30:00.000Z",
          "updated_by": "Super Admin"
        }
      }
    }
    ```

### 9. Update Own Profile Settings
*   **Route**: `PATCH /api/admin/profile`
*   **Description**: Updates the logged-in user's own name, profile photo, or password securely.
*   **Request Format**:
    ```json
    {
      "name": "Sifat Ahmed New Name",
      "image_url": "https://pub-99e7fad4ec9f4d2dafa1e77c8558eee0.r2.dev/volunteers/sifat-new.jpg",
      "password": "mynewsecurepassword123"
    }
    ```
*   **Response Format (200 OK)**:
    Returns the updated profile object.

---

## Admin & User Role Management (Super Admin Exclusive)

These endpoints are strictly restricted to users with the `super_admin` role. These can be integrated into the Android application to build a Management View visible only to Super Admins.

### 10. Retrieve All Admin Users
*   **Route**: `GET /api/admin/admin-users`
*   **Description**: Retrieves the complete list of system administrative users and volunteers.
*   **Response Format (200 OK)**:
    ```json
    {
      "data": [
        {
          "id": "u-uuid-1234",
          "email": "editor@example.com",
          "display_name": "Sifat Ahmed",
          "role": "registration_editor",
          "can_manage_volunteers": true,
          "can_manage_registrations": false,
          "last_login_at": "2026-07-16T12:00:00.000Z",
          "created_at": "2026-07-16T10:00:00.000Z"
        }
      ]
    }
    ```

### 11. Create Admin/Volunteer User
*   **Route**: `POST /api/admin/admin-users`
*   **Description**: Registers a new user inside Supabase Auth and binds them to the check constraint system.
*   **Request Format**:
    ```json
    {
      "email": "newuser@example.com",
      "password": "defaultpassword123",
      "role": "volunteer",
      "display_name": "Asif Iqbal"
    }
    ```
*   **Response Format (200 OK)**:
    ```json
    {
      "data": {
        "id": "u-uuid-5678",
        "email": "newuser@example.com",
        "display_name": "Asif Iqbal",
        "role": "volunteer",
        "created_at": "2026-07-16T15:00:00.000Z"
      }
    }
    ```

### 12. Update Admin/Volunteer User and Permissions
*   **Route**: `PATCH /api/admin/admin-users`
*   **Description**: Updates a user's role, display name, and permission flags.
*   **Request Format**:
    ```json
    {
      "id": "u-uuid-5678",
      "role": "volunteer",
      "display_name": "Asif Iqbal Updated",
      "can_manage_volunteers": true,
      "can_manage_registrations": true
    }
    ```
*   **Response Format (200 OK)**:
    ```json
    {
      "data": {
        "id": "u-uuid-5678",
        "email": "newuser@example.com",
        "display_name": "Asif Iqbal Updated",
        "role": "volunteer",
        "can_manage_volunteers": true,
        "can_manage_registrations": true,
        "last_login_at": null,
        "created_at": "2026-07-16T15:00:00.000Z"
      }
    }
    ```

### 13. Delete Admin/Volunteer User
*   **Route**: `DELETE /api/admin/admin-users`
*   **Query Parameters**:
    -   `id`: `string` (required, user UUID to delete)
*   **Description**: Deletes a user account from Supabase Auth (cascades to the `admin_users` database table).
*   **Response Format (200 OK)**:
    ```json
    {
      "success": true
    }
    ```



---
<p align="center">
  Developed by <b>Mohatamim Haque</b> <br/>
  <a href="https://wa.me/8801518749114" target="_blank"><img src="https://img.shields.io/badge/WhatsApp-25D366?style=flat-square&logo=whatsapp&logoColor=white" alt="WhatsApp"/></a>
  <a href="mailto:mohatamimhaque7@gmail.com" target="_blank"><img src="https://img.shields.io/badge/Email-D14836?style=flat-square&logo=gmail&logoColor=white" alt="Email"/></a>
  <a href="mailto:mohatamimhaque@outlook.com" target="_blank"><img src="https://img.shields.io/badge/Outlook-0078D4?style=flat-square&logo=microsoftoutlook&logoColor=white" alt="Outlook"/></a>
  <a href="https://facebook.com/mohatamim44" target="_blank"><img src="https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white" alt="Facebook"/></a>
  <a href="https://linkedin.com/in/mohatamim" target="_blank"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn"/></a>
  <a href="https://github.com/mohatamimhaque" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub"/></a>
</p>
