# CareSync Service Management Architecture

## Executive Overview
CareSync is a specialized **Hospital Service Management & Ticket Management Platform** engineered around ServiceNow ITSM concepts. It bridges clinical operations and enterprise IT support by providing a modern, fast, role-tailored frontend while utilizing ServiceNow as the backend system of record for incident tracking, task routing, SLA management, and workflow automation.

```
                    CARESYNC FRONTEND (React + TS + Tailwind)
                                       |
                                 REST API LAYER
                                       |
                           BACKEND API (Node.js / Express)
                                       |
                             SERVICENOW API LAYER
                                       |
                        SERVICENOW PDI (dev183600)
                                       |
         -------------------------------------------------------------
         |             |            |               |                |
     Incident       Request       Task             SLA           Workflow
     (incident)   (sc_request) (sys_user)     (contract_sla)   (flow_designer)
         |             |            |               |                |
         -------------------------------------------------------------
                                       |
                              ServiceNow Database
```

---

## Pre-Implementation Audit & Discovery Findings

### 1. Existing Architecture
- **Framework**: Monolithic Express + Vite (TypeScript) application.
- **API Runtime**: Single Express process proxying calls to ServiceNow REST endpoints and serving static assets.
- **ServiceNow Instance**: Target instance `https://dev183600.service-now.com`.

### 2. Frontend Layer
- React 19, Vite 6, Tailwind CSS v4, Lucide React icons, Framer Motion.
- UI components previously focused heavily on bedside clinical handoffs, bed allocation, and medication barcode scanning.
- **Redesign Target**: Pivot primary UI/UX to focus on **Hospital Service & Incident Management** (Raise Ticket, Track Status, IT Support Workflows, Admin SLA Monitoring) while maintaining clinical context as optional ticket metadata.

### 3. Backend API Layer
- Express server providing `/api/*` endpoints.
- Abstracted ServiceNow HTTP client (`server/servicenow.ts`) handling Basic Auth with fallback endpoints.
- Integration modes: `SERVICE_NOW_MODE=live` (connects directly to ServiceNow PDI) and `SERVICE_NOW_MODE=mock` (resilient offline/development fallback).

### 4. ServiceNow Integration & Tables Discovered
- `incident` (Standard ServiceNow Incident table)
- `sys_user` & `sys_user_has_role` (User authentication & role assignment)
- `x_snc_caresync_1_patient` / `x_1850353_caresy_0_patient` (Patient records)
- `x_snc_caresync_1_clinical_task` / `x_1850353_caresy_0_clin_task` (Clinical operational tasks)
- `x_snc_caresync_1_bed_management` / `x_1850353_caresy_0_bed_mgmt` (Bed status & turnover)
- `x_snc_caresync_1_medication_administration_record` (MAR barcode audits)

### 5. Role-Based Access Model
- **Doctor**: Raise ticket, view my tickets, track ticket progress, receive resolution notifications.
- **Nurse**: Raise ticket (ward/station issues), view active tickets, track status.
- **Receptionist**: Raise ticket (kiosk/printer/access issues), track patient intake tickets.
- **Hospital Staff**: General operational support requests (facility, maintenance, equipment).
- **IT Support Staff**: Operational queue management, ticket assignment, work notes update, state transitions, resolution.
- **Hospital Administrator**: System-wide service dashboard, SLA performance breach monitoring, category/department analytics, integration health check.

---

## System Separation & Security Principles

1. **ServiceNow as Truth**:
   - The frontend NEVER calculates or overrides ServiceNow SLA status.
   - ServiceNow generates official Ticket Numbers (`INC0010245`, etc.) and manages state transitions.
2. **Credential Isolation**:
   - ServiceNow credentials (`SERVICENOW_USERNAME`, `SERVICENOW_PASSWORD`) remain exclusively inside the backend API layer.
   - Browser clients interact ONLY with backend REST endpoints (`/api/tickets`, `/api/health`, `/api/auth`).
3. **Fail-Safe Mode**:
   - Configured via `SERVICE_NOW_MODE=live|mock`.
   - In `mock` mode, the backend simulates ServiceNow Table API behavior seamlessly without throwing errors if PDI is offline.
