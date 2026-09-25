# CareSync — Clinical & ServiceNow IT Operations (Integrated)

The polished React UI (TARGET) now runs on the real CareSync backend (SOURCE):
authentication, RBAC, patients, AI clinical handoffs, predictive bed
intelligence, medication safety, family voice, approvals, and a real ServiceNow
`incident` bridge — all going through one server-side ServiceNow Table API
client. **The UI was not redesigned**; the mock backend was replaced with the
real integration behind it.

## Architecture

```
Browser (React 19 + Vite + Tailwind SPA)
  │  src/services/api.ts  → fetch() to same-origin /api/*
  ▼
Express server (server.ts, port 3000)
  ├── server/servicenow.ts → ServiceNow Table API (Basic Auth, server-side creds only)
  ├── server/ai.ts         → Google Gemini (REST): handoff triage, bed ETA, family voice
  ├── server/email.ts      → Nodemailer (Gmail): OTP, approval links, mismatch escalation
  ├── server/approvals.ts  → pending staff-approval store (with the addRequest/getRequest fix)
  └── server/routes.ts     → all /api routes
  ▼
ServiceNow PDI (x_snc_caresync_1_* tables, sys_user, sys_user_has_role, incident)
```

Credentials never reach the browser. React talks only to `/api/*`; the Express
layer is the only thing that talks to ServiceNow, Gemini, or Gmail.

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Summary:

- `SERVICENOW_INSTANCE`, `SERVICENOW_USERNAME`, `SERVICENOW_PASSWORD` — the PDI + an
  integration user allowed to create `sys_user`, write `sys_user_has_role`, and CRUD
  the five `x_snc_caresync_1_*` tables (on a PDI, `admin` works for testing).
- `GEMINI_API_KEY_MAIN`, `GEMINI_API_KEY_VOICE` (or single `GEMINI_API_KEY`) + `GEMINI_MODEL`
  — from Google AI Studio. Set `GEMINI_MODEL` to a model your account currently exposes.
- `EMAIL_USER`, `EMAIL_PASS` — the free Gmail SMTP option: a Gmail address plus a
  Google **App Password** (2FA required; do not use the normal Gmail password).
  Gmail does not charge for this use. Leave both blank in local dev and OTP codes
  are returned in the API response so registration is still testable.
- `PORT` — defaults to 3000.

## Install & run

```bash
npm install
cp .env.example .env      # then edit .env
npm run dev               # tsx + Vite middleware, http://localhost:3000
# production:
npm run build && npm start
```

`npm run lint` runs `tsc --noEmit`. Both `npm run build` (Vite + esbuild) and the
type-check pass cleanly.

## Connection status is truthful

`GET /api/health` actually pings ServiceNow (`sys_user`, limit 1). The sidebar
footer and login screen show **Connected / Offline / Checking** from that check —
no permanent fake "CONNECTED". When ServiceNow can't be reached, the app loads
its bundled demo data and labels itself **Demo** rather than pretending records synced.

## ServiceNow tables used

`x_snc_caresync_1_patient`, `x_snc_caresync_1_clinical_task`,
`x_snc_caresync_1_bed_management`,
`x_snc_caresync_1_medication_administration_record`,
`x_snc_caresync_1_care_plan` (schema present; no dedicated UI panel yet),
plus `sys_user`, `sys_user_role`, `sys_user_has_role`, and `incident`.

> The UI's `Patient`/`Bed` types are richer than the ServiceNow schema. Real
> ServiceNow values (name, room, status, department, prediction fields, …) are
> mapped in via `src/services/mappers.ts`; the remaining UI-only fields (vitals
> trends, imaging, timeline) are presentational defaults, not claimed ServiceNow data.

## What to test end-to-end (from a machine that can reach your PDI)

| Flow | Where | ServiceNow effect |
|---|---|---|
| Patient registration + OTP | Auth screen → Register → Patient | `sys_user` + `x_snc_caresync_1_patient`, `.patient` role |
| Staff registration + approval | Register → Doctor/Nurse → approve via email link **or** `POST /api/approvals/:id` | `sys_user` + `x_snc_caresync_1.<role>` role |
| Login | Auth screen with `CS-#####` | Reads `sys_user` |
| AI Handoff | Care Tasks → New Task → **AI Evaluate** → Create | Gemini triage → `x_snc_caresync_1_clinical_task` |
| Predictive Bed Board | Bed Management → select bed → **Run AI Prediction** | Gemini ETA → updates `x_snc_caresync_1_bed_management` |
| Medication Safety | Medication → scan a pending admin | Writes `x_snc_caresync_1_medication_administration_record`; mismatch emails escalation |
| Family Voice | Family Portal → send a message | Reads patient status only; never writes; multilingual fallback |
| Incidents | Administration / New Incident | Real `incident` create/update/work-note when connected |

## Demo flow (hackathon)

Login → Overview → open a patient (Patient 360) → Care Tasks (AI Evaluate a
dictation, create task → clinical_task) → Bed Management (Run AI Prediction →
bottleneck + ETA written back) → Medication Safety (barcode verify → MAR;
mismatch escalation) → Family Voice (safe multilingual status) → Analytics.

## Known limitations (carried over intentionally)

- `otpStore` and the approvals list are in-memory — reset on restart, not
  multi-instance safe. Swap for Redis / a ServiceNow table for durability.
- Approval links use the incoming request host, so they work after deployment;
  use HTTPS in production and configure the deployed domain at the proxy/platform.
- `cors()` is open; scope it to your front-end origin before public exposure.
- One service account authenticates to ServiceNow for all sessions; ServiceNow
  ACLs therefore don't restrict per portal user — RBAC is enforced in the app
  (nav + backend route guards). Mirror server-side per-user auth if this goes further.
- This build was validated by type-check, production build, and local boot only;
  the true ServiceNow/Gemini/Gmail round-trips must be run from your own network.
