# CareSync API Reference Specification

Base Endpoint: `/api`

All API endpoints return standard JSON responses:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive status message"
}
```

---

## 1. System Health & Integration Status

### `GET /api/health`
Checks overall API layer health.
**Response**:
```json
{
  "status": "healthy",
  "service": "CareSync Service Management API",
  "mode": "live",
  "serviceNow": {
    "connected": true,
    "message": "ServiceNow reachable and authenticated",
    "configured": true
  },
  "timestamp": "2026-09-25T20:25:00.000Z"
}
```

### `GET /api/servicenow/health`
Explicitly tests connectivity to the target ServiceNow PDI instance.
**Response**:
```json
{
  "success": true,
  "instanceUrl": "https://dev183600.service-now.com",
  "connected": true,
  "ping": "ServiceNow Scripted REST API Connected & Operational"
}
```

---

## 2. Authentication API (`/api/auth`)

### `POST /api/auth/login`
Authenticates a user by username/ID and password.
**Request**:
```json
{
  "userId": "CS-10294",
  "password": "UserPassword123"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "sys_id": "sys_user_9921",
    "userId": "CS-10294",
    "name": "Dr. Sarah Jenkins",
    "email": "sarah.jenkins@caresync.org",
    "role": "doctor",
    "dept": "Radiology"
  }
}
```

---

## 3. Tickets & Service Requests API (`/api/tickets`)

### `GET /api/tickets`
Fetches a list of incident and service tickets. Supports query params: `role`, `user`, `status`, `category`, `search`.
**Response**:
```json
{
  "success": true,
  "count": 4,
  "tickets": [
    {
      "id": "INC0010245",
      "sysId": "sys_inc_881",
      "number": "INC0010245",
      "title": "Radiology printer is not printing",
      "description": "The printer near Radiology workstation 2 is showing an error.",
      "category": "Hardware",
      "subcategory": "Printer",
      "issueType": "Incident",
      "priority": "High",
      "status": "In Progress",
      "caller": "Dr. Sarah Jenkins",
      "location": "Radiology Dept Room 2B",
      "department": "Radiology",
      "assignedTo": "IT Support Team",
      "created": "2026-09-25T09:42:00Z",
      "updated": "2026-09-25T10:02:00Z",
      "slaStatus": "On Track",
      "slaTimeLeft": "02:14 remaining",
      "workNotes": [
        "09:48 AM - Assigned to IT Support",
        "10:02 AM - Work Started"
      ],
      "timeline": [
        { "time": "09:42 AM", "event": "Ticket Created" },
        { "time": "09:48 AM", "event": "Assigned to IT Support" },
        { "time": "10:02 AM", "event": "Work Started" }
      ]
    }
  ]
}
```

### `POST /api/tickets`
Creates a new incident or service request ticket.
**Request**:
```json
{
  "issueType": "Incident",
  "category": "Hardware",
  "subcategory": "Printer",
  "shortDescription": "Radiology printer is not printing",
  "description": "The printer near Radiology workstation 2 is showing an error and is not printing patient reports.",
  "location": "Radiology Department",
  "department": "Radiology",
  "priority": "High",
  "attachment": null
}
```
**Response**:
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "ticket": {
    "number": "INC0010245",
    "sysId": "sys_inc_881",
    "status": "New",
    "priority": "High"
  }
}
```

### `GET /api/tickets/:id`
Returns detailed information for a single ticket.

### `PATCH /api/tickets/:id`
Updates ticket status, assigned technician, or resolution notes.
**Request**:
```json
{
  "status": "Resolved",
  "workNote": "Replaced paper tray sensor and cleared jam.",
  "resolution": "Printer hardware sensor replaced."
}
```

### `POST /api/tickets/:id/comments`
Appends a work note or customer communication comment.

---

## 4. Operational Dashboard API (`/api/dashboard`)

### `GET /api/dashboard`
Returns metric summaries for role dashboards.
**Response**:
```json
{
  "success": true,
  "metrics": {
    "totalTickets": 24,
    "openTickets": 4,
    "inProgress": 2,
    "waiting": 1,
    "resolved": 12,
    "closed": 5,
    "highPriority": 3,
    "slaBreaches": 0,
    "avgResolutionTime": "42 mins"
  },
  "byCategory": {
    "Hardware": 8,
    "Software": 6,
    "Network": 4,
    "Access": 4,
    "Printer": 2
  }
}
```
