# ServiceNow Field & Table Mapping Reference

This document mapsCareSync Frontend fields to ServiceNow backend table fields.

## 1. Incident Table Mapping (`incident`)

| Frontend Field | ServiceNow Technical Field | Data Type | Notes / Value Mapping |
| :--- | :--- | :--- | :--- |
| `id` / `sysId` | `sys_id` | `String (32-char guid)` | Unique ServiceNow record identifier |
| `number` / `ticketNumber` | `number` | `String` | e.g. `INC0010245` (Auto-generated) |
| `title` / `shortDescription` | `short_description` | `String` | Brief summary of issue |
| `description` | `description` | `String` | Full issue details |
| `category` | `category` | `Choice` | `hardware`, `software`, `network`, `access`, `printer`, `application`, `patient_info`, `medical_equipment`, `bed_mgmt`, `other` |
| `subcategory` | `subcategory` | `Choice` | e.g. `printer`, `workstation`, `emr_login`, `wifi` |
| `priority` | `priority` | `Choice` | `1` (Critical), `2` (High), `3` (Moderate), `4` (Low) |
| `urgency` | `urgency` | `Choice` | `1` (High), `2` (Medium), `3` (Low) |
| `impact` | `impact` | `Choice` | `1` (High), `2` (Medium), `3` (Low) |
| `status` / `state` | `state` | `Integer / Choice` | `1`=New, `2`=In Progress, `3`=On Hold/Waiting, `6`=Resolved, `7`=Closed |
| `caller` / `requester` | `caller_id` | `Reference (sys_user)` | Requester sys_id / Display Name |
| `assignedGroup` | `assignment_group` | `Reference` | e.g. `IT Support Team`, `Biomedical Support` |
| `assignedTo` | `assigned_to` | `Reference (sys_user)` | Assigned technician sys_id / Display Name |
| `location` | `location` | `String` | e.g. `Radiology Department - Room 2B` |
| `department` | `department` | `String` | e.g. `Radiology`, `Emergency`, `ICU` |
| `created` | `sys_created_on` / `opened_at` | `DateTime` | Auto timestamp from ServiceNow |
| `updated` | `sys_updated_on` | `DateTime` | Auto update timestamp |
| `workNotes` | `work_notes` | `Journal Field` | Internal IT technician comments |
| `resolutionNotes` | `close_notes` | `String` | Resolution notes entered upon ticket closure |
| `slaStatus` | `sla_due` / `contract_sla` | `Calculated` | `On Track`, `At Risk`, `Breached` |

---

## 2. User & Auth Table Mapping (`sys_user`)

| Frontend Field | ServiceNow Field | Description |
| :--- | :--- | :--- |
| `userId` / `username` | `user_name` | Unique hospital ID (e.g. `CS-10294` or email) |
| `name` | `first_name` + `last_name` | User full name |
| `email` | `email` | Email address |
| `password` | `employee_number` | Encrypted/Stored credential reference |
| `role` | `title` / `sys_user_has_role` | `doctor`, `nurse`, `receptionist`, `staff`, `it_support`, `admin` |
| `department` | `department` | User hospital department |
| `phone` | `mobile_phone` | Contact phone number |

---

## 3. Clinical & Operational Supplementary Tables

### Patient Context Table (`x_snc_caresync_1_patient` / `x_1850353_caresy_0_patient`)
- `patient_name` -> Patient Full Name
- `room_number` -> Room/Bed location
- `status` -> Clinical condition tag
- `diagnosis` -> Admitting diagnosis

### Bed Management Table (`x_snc_caresync_1_bed_management`)
- `bed_number` -> Bed ID
- `department` -> Ward/Department
- `status` -> `Occupied`, `Cleaning`, `Available`, `Bottleneck`
- `u_prediction_available_time` -> Predictive turnover ETA
