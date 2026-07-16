# Volunteer Management - Android App Backend API Documentation

This document describes the secure backend API endpoints created for managing volunteer records for the National Mathematics Carnival 2026 Android Admin Application.

## Authentication & Authorization

All endpoints are securely protected. Requests must be authenticated using the Supabase access token (JWT) passed in the `Authorization` header:

*   **Header**: `Authorization: Bearer <supabase_access_token>`
*   **How to obtain token**:
    Call the auth gateway: `POST /api/admin/login` (email/password payload). The returned `session.access_token` JWT is the value to pass in this header.
*   **Access Rules**: Only users with the role `super_admin`, `admin`, or a `registration_editor` with explicitly granted `can_manage_volunteers` permission are authorized. Unauthenticated requests return `401 Unauthorized`. Unpermitted users return `403 Forbidden`.

---

## Authentication Gateway (Secure Login)
*   **Route**: `POST /api/admin/login`
*   **Description**: Authenticates admin email and password. Returns JWT session tokens.
*   **Request Format**:
    *   Content-Type: `application/json`
    *   Body:
        ```json
        {
          "email": "editor@example.com",
          "password": "securepassword123"
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
        "role": "registration_editor"
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
        "unique_id": "V260001",
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
        "unique_id": "V260001",
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
        "created_at": "2026-07-16T12:00:00.000Z",
        "updated_at": "2026-07-16T12:30:00.000Z",
        "updated_by": "Sifat Ahmed"
      }
    }
    ```
*   **Response (404 Not Found)**:
    ```json
    {
      "error": "Volunteer with unique_id \"V269999\" not found."
    }
    ```

---

## 3. Create a Volunteer
*   **Route**: `POST /api/admin/volunteers`
*   **Description**: Creates a new volunteer entry.
*   **Request Format**:
    ```json
    {
      "unique_id": "V260002",
      "name": "Sajid Karim",
      "email": "sajid@example.com",
      "number": "01512345678",
      "image_url": null,
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
        "unique_id": "V260002",
        "name": "Sajid Karim",
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

### Scenario A: Fast Attendance Scan (Gate Entrance)
1.  Admin selects "Attendance Mode" in the app.
2.  App activates camera scanner and decodes the volunteer's ID barcode (e.g., `V260001`).
3.  App calls `PATCH /api/admin/volunteers/present` with body `{"unique_id": "V260001", "is_present": true}`.
4.  If successful, the app shows a green checkmark and says "Mahir Faysal Checked In". If status is `403 Forbidden`, the app warns "Access Denied: Inadequate Permissions".

### Scenario B: Gift Distribution Desk
1.  Admin selects "Gift collection mode" in the app.
2.  Admin scans the volunteer's QR code.
3.  App first calls `GET /api/admin/volunteers/single?unique_id=V260001` to display details (Name, Segment, T-shirt size, etc.).
4.  Admin hands over the correct T-shirt size (e.g., `XL`) and presses "Mark Gift Collected".
5.  App calls `PATCH /api/admin/volunteers/gift` with body `{"unique_id": "V260001", "is_gift_collected": true}`.

### Scenario C: Lunch Token Redemption
1.  Admin selects "Lunch service mode" in the app.
2.  Admin scans the QR code.
3.  App first calls `GET /api/admin/volunteers/single?unique_id=V260001`.
4.  App checks if `"is_lunch_collected"` is already `true`. If so, show a red alarm "Error: Lunch already served!".
5.  If not served, the admin hands over lunch and presses "Confirm Lunch Served".
6.  App calls `PATCH /api/admin/volunteers/lunch` with body `{"unique_id": "V260001", "is_lunch_collected": true}`.
