# NMC 2026 — Android Mobile App Integration & Update Guide

This document provides developer instructions for updating the **NMC 2026 Android App** to support **Phone Number Login**, Bearer Authentication, Live Attendance/Check-ins, and **Summary PDF Downloads** for Volunteer and Participant Management.

---

## 1. Authentication & Mobile Login API

The login endpoint supports both **Mobile Phone Number** (e.g. `01727183143` or `+8801727183143`) AND **Email Address** for volunteers, registration editors, and super admins.

### 🔑 Login Request
- **Endpoint**: `POST /api/admin/login`
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "email": "01727183143",
  "password": "your_password"
}
```
> **Note**: For volunteer/editor accounts imported from DB lists, the default password is `12345678` unless customized. The `email` field accepts both valid mobile numbers (e.g., `01727183143`) and email addresses.

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "user": {
    "id": "c1f7a8e9-...",
    "email": "mdsayedulislam@example.com",
    "role": "volunteer",
    "name": "Md Sayedul Islam",
    "phone": "01727183143"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "..."
  }
}
```

#### Utilizing Bearer Token in Subsequent API Requests
Store `access_token` in Android `SharedPreferences` / `EncryptedSharedPreferences`. Pass it in the HTTP header for all protected API calls:
```http
Authorization: Bearer <access_token>
```

---

## 2. Summary PDF Report Download APIs

Android admins and super admins can download or view the complete landscape **Summary PDF Reports** matching the website design format.

### 📄 Volunteer Management Summary PDF
- **Endpoint**: `GET /api/admin/volunteers/summary-pdf`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Accept: text/html, application/pdf
  ```
- **Returns**: Formatted HTML/PDF summary document containing Stats Cards, Sub-committee/Department breakdown tables, and complete 75-volunteer roster.
- **Android Usage**:
  - Open in an Android WebView (`webView.loadUrl("https://nmcbd.app/api/admin/volunteers/summary-pdf", headers)`).
  - Or download via Android `DownloadManager` as `.pdf` / `.html`.

### 📄 Participant Management Summary PDF
- **Endpoint**: `GET /api/admin/registrations/summary-pdf`
- **Headers**:
  ```http
  Authorization: Bearer <access_token>
  Accept: text/html, application/pdf
  ```
- **Returns**: Formatted HTML/PDF summary document containing Total Registrations, Kit/Lunch/Present stats, Level & Event breakdown tables, and complete 326+ participant roster.

---

## 3. Volunteer Management & Operations APIs

### 📋 Fetch All Volunteers
- **Endpoint**: `GET /api/admin/volunteers`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: Array of volunteer objects with `unique_id`, `serial_no`, `name`, `number`, `is_present`, `is_gift_collected`, `is_lunch_collected`, `segment`, `department`.

### 🟢 Toggle Volunteer Attendance (Present / Absent)
- **Endpoint**: `POST /api/admin/volunteers/present`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "unique_id": "TULGHSPD",
    "is_present": true
  }
  ```

### 🎁 Toggle Volunteer Gift Collection
- **Endpoint**: `POST /api/admin/volunteers/gift`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "unique_id": "TULGHSPD",
    "is_gift_collected": true
  }
  ```

### 🍱 Toggle Volunteer Lunch Collection
- **Endpoint**: `POST /api/admin/volunteers/lunch`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "unique_id": "TULGHSPD",
    "is_lunch_collected": true
  }
  ```

---

## 4. Participant Check-in & Operations APIs

### 🟢 Update Kit / Attendance / Lunch Status
- **Endpoint**: `POST /api/admin/registrations/single`
- **Headers**: `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body**:
  ```json
  {
    "serial": "NMC26-S-MO-086",
    "is_present": true,
    "is_kit_coollect": true,
    "is_collect_launch": true
  }
  ```

### 🔍 Find Room API (Public / App API)
- **Endpoint**: `GET /api/registrations/find-room?query=NMC26-I-AW-001`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "serial": "NMC26-I-AW-001",
      "name": "Saddman Faruque Walid",
      "category": "Intermediate level (Article Writing)",
      "institution": "DUET",
      "allocated_room": "twb",
      "is_allocated": true,
      "location": {
        "lat": 24.01685993912403,
        "lng": 90.41899431404634,
        "location_name": "Textile Workshop Building (টেক্সটাইল ওয়ার্কশপ ভবন)",
        "venue": "Textile Workshop Building, DUET"
      }
    }
  }
  ```

---

## 5. Android Kotlin Integration Code Example

```kotlin
// Android Retrofit / OkHttp Example for Phone Number Login
val jsonMediaType = "application/json; charset=utf-8".toMediaType()
val loginBody = JSONObject().apply {
    put("email", "01727183143") // Phone number or email
    put("password", "12345678")
}.toString().toRequestBody(jsonMediaType)

val request = Request.Builder()
    .url("https://nmcbd.app/api/admin/login")
    .post(loginBody)
    .build()

client.newCall(request).enqueue(object : Callback {
    override fun onResponse(call: Call, response: Response) {
        val bodyStr = response.body?.string()
        val json = JSONObject(bodyStr)
        val accessToken = json.getJSONObject("session").getString("access_token")
        
        // Save bearer token securely
        saveToken(accessToken)
    }
    
    override fun onFailure(call: Call, e: IOException) {
        // Handle error
    }
})
```
