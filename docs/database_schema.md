# Database Relational Model & ER Diagrams

This document details the PostgreSQL schema relationships, the Entity-Relationship (ER) diagram, and trigger-execution flowcharts for the NMC 2026 platform.

---

## 1. Entity-Relationship (ER) Diagram

The diagram below maps the complete relational model of the 40 database tables.

```mermaid
erDiagram
    EVENTS {
        uuid id PK
        text slug
        text title
        text category
        text status
        integer registration_limit_total
        boolean registration_limit_per_email
        boolean registration_limit_per_phone
    }
    EVENT_FAQS {
        uuid id PK
        uuid event_id FK
        text question
        text answer
    }
    INTERNAL_FORM_SECTIONS {
        uuid id PK
        uuid event_id FK
        text title
        text description
    }
    INTERNAL_FORM_FIELDS {
        uuid id PK
        uuid event_id FK
        uuid section_id FK
        text label
        text field_type
        text helper_text
        jsonb config
        jsonb validation
        jsonb logic
    }
    EVENT_REGISTRATIONS {
        uuid id PK
        uuid event_id FK
        jsonb form_data
        text status
        text public_id
        text registrant_email
        text registrant_phone
    }
    SPONSOR_CATEGORIES {
        uuid id PK
        text name
    }
    SPONSORS {
        uuid id PK
        uuid category_id FK
        text name
        text logo_url
    }
    SUB_COMMITTEES {
        uuid id PK
        text name
    }
    COMMITTEE_MEMBERS {
        uuid id PK
        uuid sub_committee_id FK
        text name
        text role
    }
    CLUB_PARTNER_CATEGORIES {
        uuid id PK
        text name
    }
    CLUB_PARTNERS {
        uuid id PK
        uuid category_id FK
        text name
        text logo_url
    }
    USERS_REGISTRY {
        uuid id PK
        text name
        text role
    }
    USER_LOCATIONS {
        uuid user_id PK
        doubleprecision latitude
        doubleprecision longitude
    }
    SECURE_MESSAGES {
        uuid id PK
        uuid sender_id FK
        text target_type
        text message_text
    }
    CONTACT_PAGE {
        uuid id PK
        text hero_title
        text form_title
        text recipient_email
    }
    CONTACT_SUBMISSIONS {
        uuid id PK
        text name
        text email
        text message
    }

    EVENTS ||--o{ EVENT_FAQS : "defines FAQs"
    EVENTS ||--o{ INTERNAL_FORM_SECTIONS : "divides into steps"
    EVENTS ||--o{ INTERNAL_FORM_FIELDS : "specifies form inputs"
    INTERNAL_FORM_SECTIONS ||--o{ INTERNAL_FORM_FIELDS : "contains"
    EVENTS ||--o{ EVENT_REGISTRATIONS : "collects registrants"
    SPONSOR_CATEGORIES ||--o{ SPONSORS : "classifies"
    SUB_COMMITTEES ||--o{ COMMITTEE_MEMBERS : "groups"
    CLUB_PARTNER_CATEGORIES ||--o{ CLUB_PARTNERS : "classifies"
    USERS_REGISTRY ||--|| USER_LOCATIONS : "contains current coordinates"
    USERS_REGISTRY ||--o{ SECURE_MESSAGES : "initiates"
    CONTACT_PAGE ||--o{ CONTACT_SUBMISSIONS : "logs entries to"
```

---

## 2. Table-to-Table Relationship References

The following table summarizes foreign key relationships and delete cascades:

| Primary (Parent) Table | Foreign (Child) Table | Linking Column | On Delete Action | Description |
| :--- | :--- | :--- | :--- | :--- |
| `events` | `event_faqs` | `event_id` | **CASCADE** | FAQs are auto-deleted if parent event is deleted. |
| `events` | `internal_form_sections` | `event_id` | **CASCADE** | Step sections are deleted if event is deleted. |
| `events` | `internal_form_fields` | `event_id` | **CASCADE** | Custom registration fields deleted if event is deleted. |
| `internal_form_sections` | `internal_form_fields` | `section_id` | **SET NULL** | Form fields remain; their section assignment is cleared. |
| `events` | `event_registrations` | `event_id` | **CASCADE** | Participant form submissions deleted if event is deleted. |
| `sponsor_categories` | `sponsors` | `category_id` | **SET NULL** | Sponsor cards stay intact; category gets unassigned. |
| `sub_committees` | `committee_members` | `sub_committee_id` | **CASCADE** | Member profiles auto-deleted if sub-committee is deleted. |
| `club_partner_categories`| `club_partners` | `category_id` | **SET NULL** | Partner logos stay intact; category unassigned. |
| `users_registry` | `user_locations` | `user_id` | **CASCADE** | Location tracking coordinates deleted if user is removed. |
| `users_registry` | `secure_messages` | `sender_id` | **CASCADE** | Sent messages deleted if user registry row is removed. |

---

## 3. Database Trigger Flowcharts

The database uses pl/pgsql triggers to manage operations in the background:

### A. Modified Time Auditor (`set_updated_at`)
Any update query triggering a row edit fires a before-update trigger to reset the `updated_at` timestamp.

```mermaid
flowchart TD
    UpdateReq[Admin submits Update Form] --> DBProcess[Postgres parses query]
    DBProcess --> TriggerCheck{Before Update Trigger?}
    TriggerCheck -->|Yes| ExecuteFunction[Run public.set_updated_at]
    ExecuteFunction --> OverrideField[Set NEW.updated_at = now]
    OverrideField --> Commit[Commit transaction to DB]
```

### B. Bulk Room Allocation Handler (`update_allocated_rooms`)
A stored SQL procedure accepting a JSON array of participant serial numbers and room strings, performing high-speed updates in a single database transaction.

```mermaid
flowchart TD
    JSONPayload[Admin uploads Room Allocations JSON] --> RPC[Execute public.update_allocated_rooms]
    RPC --> ExtractJSON[Parse array elements serial & allocated_room]
    ExtractJSON --> TempTable[Generate inline derived mapping table]
    TempTable --> BulkUpdate[Execute SQL bulk JOIN update on processed_registrations]
    BulkUpdate --> NullifyEmpty[Evaluate empty strings to NULL]
    NullifyEmpty --> EndCommit[Commit room updates to disk]
```

### C. Bulk Admit Card PDF Handler (`update_admit_cards`)
Fires when the admit card generator microservice successfully uploads a compiled PDF file to R2 storage, logging the public URL location to database records.

```mermaid
flowchart TD
    PDFPayload[Admit Card Generator sends JSON maps] --> RPCAdmit[Execute public.update_admit_cards]
    RPCAdmit --> ExtractAdmit[Parse array elements serial & admit_card_url]
    ExtractAdmit --> JoinUpdate[Execute JOIN update query on processed_registrations]
    JoinUpdate --> SetTime[Update updated_at and updated_by fields]
    SetTime --> DoneCommit[Commit transaction to DB]
```


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
