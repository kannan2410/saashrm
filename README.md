# SaaS HRM - Complete Project Documentation

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Backend Architecture](#5-backend-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Authentication & Signup Flow](#7-authentication--signup-flow)
8. [Module-by-Module Breakdown](#8-module-by-module-breakdown)
9. [Real-Time Chat System](#9-real-time-chat-system)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Security](#11-security)
12. [Setup & Running](#12-setup--running)
13. [Seed Data](#13-seed-data)

---

## 1. Project Overview

SaaS HRM is a **Phase 1 MVP** of a multi-tenant HR Management platform with an integrated Enterprise Chat system. It is built as a monorepo with separate `backend/` and `frontend/` directories.

**Key Capabilities:**
- Company signup with email OTP verification
- Role-based access control (5 roles)
- Employee management with org tree
- Attendance tracking (check-in/check-out)
- Leave management with multi-level approval chain
- Payroll generation with PDF salary slips
- Real-time enterprise chat (channels, DMs, file sharing)
- Calendar view combining attendance, leaves, and holidays
- Company settings (logo, holidays)

**Multi-Tenancy:** Every company gets isolated data via a `companyId` column on all tables. Users only ever see data from their own company.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend Runtime** | Node.js + Express.js |
| **Language** | TypeScript (both ends) |
| **Database** | MySQL |
| **ORM** | Prisma |
| **Authentication** | JWT (jsonwebtoken) + Bcrypt |
| **Validation** | Zod |
| **Real-Time** | Socket.IO |
| **File Storage** | Azure Blob Storage |
| **Email** | Nodemailer (SMTP) |
| **PDF Generation** | PDFKit |
| **Frontend Framework** | React 18 |
| **State Management** | Zustand |
| **HTTP Client** | Axios |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Build Tool** | Vite |
| **Containerization** | Docker |

---

## 3. Project Structure

```
saashrm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database models & relations
│   │   ├── seed.ts                # Seed data script
│   │   └── migrations/           # Auto-generated migration files
│   ├── src/
│   │   ├── server.ts             # Entry point - Express + Socket.IO setup
│   │   ├── config/
│   │   │   ├── env.ts            # Environment variables loader
│   │   │   ├── database.ts       # Prisma client instance
│   │   │   └── azure-storage.ts  # Azure Blob upload/delete helpers
│   │   ├── middleware/
│   │   │   ├── auth.ts           # JWT verification (sets req.user)
│   │   │   ├── authorize.ts      # Role-based access guard
│   │   │   ├── validate.ts       # Zod schema validation
│   │   │   ├── error-handler.ts  # Centralized error formatting
│   │   │   └── request-logger.ts # HTTP request logger
│   │   ├── dtos/
│   │   │   ├── auth.dto.ts       # login, signup, verifySignup schemas
│   │   │   ├── employee.dto.ts   # create/update employee schemas
│   │   │   ├── leave.dto.ts      # apply/approve leave schemas
│   │   │   ├── payroll.dto.ts    # generate payroll schema
│   │   │   ├── chat.dto.ts       # create channel schema
│   │   │   └── holiday.dto.ts    # create/update holiday schemas
│   │   ├── routes/
│   │   │   ├── index.ts          # Mounts all route groups under /api
│   │   │   ├── auth.routes.ts
│   │   │   ├── employee.routes.ts
│   │   │   ├── attendance.routes.ts
│   │   │   ├── leave.routes.ts
│   │   │   ├── payroll.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── company.routes.ts
│   │   │   ├── holiday.routes.ts
│   │   │   └── calendar.routes.ts
│   │   ├── controllers/          # Request handlers (one per module)
│   │   │   ├── auth.controller.ts
│   │   │   ├── employee.controller.ts
│   │   │   ├── attendance.controller.ts
│   │   │   ├── leave.controller.ts
│   │   │   ├── payroll.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── company.controller.ts
│   │   │   ├── company-logo.controller.ts
│   │   │   ├── holiday.controller.ts
│   │   │   └── calendar.controller.ts
│   │   ├── services/             # Business logic (one per module)
│   │   │   ├── auth.service.ts
│   │   │   ├── employee.service.ts
│   │   │   ├── attendance.service.ts
│   │   │   ├── leave.service.ts
│   │   │   ├── payroll.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── company-logo.service.ts
│   │   │   ├── holiday.service.ts
│   │   │   └── calendar.service.ts
│   │   ├── sockets/
│   │   │   └── chat.socket.ts    # Socket.IO event handlers
│   │   ├── types/
│   │   │   └── index.ts          # JwtPayload, AuthRequest, ApiResponse
│   │   └── utils/
│   │       ├── app-error.ts      # AppError class hierarchy
│   │       ├── response.ts       # sendSuccess / sendPaginated helpers
│   │       ├── logger.ts         # Winston logger
│   │       ├── email.ts          # Nodemailer transporter + sendMail()
│   │       └── otp-store.ts      # In-memory OTP store with expiry
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # React DOM root + BrowserRouter
│   │   ├── App.tsx               # Route definitions + ProtectedRoute
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx     # Login + Signup with OTP verification
│   │   │   ├── DashboardPage.tsx # Welcome stats + quick actions
│   │   │   ├── EmployeePage.tsx  # Employee list + create/edit
│   │   │   ├── AttendancePage.tsx# Monthly attendance report
│   │   │   ├── LeavePage.tsx     # Apply/view leaves + approvals
│   │   │   ├── PayrollPage.tsx   # Payroll list + PDF download
│   │   │   ├── ChatPage.tsx      # Real-time chat interface
│   │   │   ├── CalendarPage.tsx  # Monthly calendar grid
│   │   │   ├── ProfilePage.tsx   # User profile + photo + password
│   │   │   ├── OrgTreePage.tsx   # Hierarchical org chart
│   │   │   └── SettingsPage.tsx  # Company name, logo, holidays
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx # Sidebar + Header + content wrapper
│   │   │   │   ├── Sidebar.tsx   # Navigation menu (260px fixed)
│   │   │   │   └── Header.tsx    # Top bar with logo + user dropdown
│   │   │   └── ui/
│   │   │       ├── Modal.tsx     # Reusable modal dialog
│   │   │       ├── DataTable.tsx # Generic sortable/paginated table
│   │   │       ├── StatsCard.tsx # Metric card with icon
│   │   │       └── StatusBadge.tsx # Colored status pill
│   │   ├── stores/
│   │   │   ├── authStore.ts      # Auth state (login, OTP, logout)
│   │   │   └── chatStore.ts      # Chat state (channels, messages)
│   │   ├── services/
│   │   │   ├── api.ts            # Axios instance with JWT interceptor
│   │   │   └── socket.ts         # Socket.IO singleton
│   │   └── types/
│   │       └── index.ts          # All TypeScript interfaces & enums
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
```

---

## 4. Database Schema

### Models & Relationships

```
Company (1)─────────(N) User
   │                     │
   │                     │ (1:1)
   │                     │
   │                (N) Employee ──────(N) Attendance
   │                     │    │
   │                     │    ├──────(N) Leave ─────(N) LeaveApproval
   │                     │    │
   │                     │    ├──────(N) LeaveBalance
   │                     │    │
   │                     │    ├──────(N) Payroll
   │                     │    │
   │                     │    └── managerId ──► Employee (self-ref)
   │
   ├──────(1) CompanyLogo
   │
   ├──────(N) Holiday
   │
   └──────(N) ChatChannel ───(N) ChannelMember ──► User
                  │
                  └──────(N) ChatMessage ───(N) ChatFile
                                │
                                └── replyToId ──► ChatMessage (self-ref)
```

### Model Details

| Model | Key Fields | Unique Constraints |
|-------|-----------|-------------------|
| **Company** | id, name, domain | - |
| **User** | id, email, password, role, companyId, isActive, customStatus | email |
| **Employee** | id, employeeCode, fullName, email, department, designation, managerId, salary, status | employeeCode, email, userId |
| **Attendance** | id, employeeId, date, loginTime, logoutTime, totalHours | - |
| **Leave** | id, employeeId, leaveType, startDate, endDate, totalDays, status, reason | - |
| **LeaveApproval** | id, leaveId, approverId, role, action, comment | - |
| **LeaveBalance** | id, employeeId, leaveType, year, total, used, remaining | (employeeId, leaveType, year) |
| **Payroll** | id, employeeId, month, year, basicSalary, hra, grossEarnings, netSalary | (employeeId, month, year) |
| **Holiday** | id, companyId, name, date, type | (companyId, date, name) |
| **ChatChannel** | id, name, type (PUBLIC/PRIVATE/DIRECT), companyId, createdById | - |
| **ChannelMember** | id, channelId, userId | (channelId, userId) |
| **ChatMessage** | id, channelId, senderId, content, isPinned, replyToId | - |
| **ChatFile** | id, messageId, url, blobName, fileName, fileSize, mimeType | - |
| **CompanyLogo** | id, companyId, url, blobName, fileName | companyId |

### Roles (Enum)

```
EMPLOYEE  - Basic access (own data only)
TEAM_LEAD - Can approve leaves (level 1)
MANAGER   - Can approve leaves (level 2), view employees
HR        - Can approve leaves (level 3), manage employees, payroll
ADMIN     - Full access, bypass approval chain, company settings
```

---

## 5. Backend Architecture

### Request Flow

```
Client Request
    │
    ▼
Express Server (server.ts)
    │
    ├── Helmet (security headers)
    ├── CORS (origin check)
    ├── Rate Limiter (100 req / 15 min)
    ├── JSON Parser
    ├── Request Logger
    │
    ▼
Route Matcher (/api/*)
    │
    ├── validate(zodSchema)     ← Validates req.body
    ├── authenticate            ← Verifies JWT, sets req.user
    ├── authorize('ADMIN','HR') ← Checks role (optional)
    │
    ▼
Controller
    │  - Extracts params from req
    │  - Calls service method
    │  - Sends response via sendSuccess()
    │
    ▼
Service
    │  - Contains business logic
    │  - Queries database via Prisma
    │  - Throws AppError on failure
    │
    ▼
Prisma ORM ──► MySQL Database
```

### Error Handling Flow

```
Service throws AppError
    │
    ▼
Controller catches ──► next(err)
    │
    ▼
error-handler middleware
    │
    ├── AppError (operational) ──► { success: false, message: "..." } with correct status code
    └── Unknown error ──► { success: false, message: "Internal server error" } with 500
```

### Standard API Response Format

```json
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}

// Paginated
{
  "success": true,
  "message": "Data retrieved",
  "data": [ ... ],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

// Error
{
  "success": false,
  "message": "Validation error description"
}
```

---

## 6. Frontend Architecture

### Routing

```
/login          ──► LoginPage        (public)
/dashboard      ──► DashboardPage    (protected)
/employees      ──► EmployeePage     (protected)
/attendance     ──► AttendancePage   (protected)
/leave          ──► LeavePage        (protected)
/payroll        ──► PayrollPage      (protected)
/chat           ──► ChatPage         (protected)
/calendar       ──► CalendarPage     (protected)
/profile        ──► ProfilePage      (protected)
/org-tree       ──► OrgTreePage      (protected)
/settings       ──► SettingsPage     (protected)
```

All protected routes are wrapped in `<ProtectedRoute>` which checks `useAuthStore.isAuthenticated`. Unauthenticated users are redirected to `/login`.

### Layout

```
┌─────────────────────────────────────────────────┐
│                   Header                         │
│  [Page Title]              [Company Logo] [User] │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │            Content Area               │
│ (260px)  │         (Page Component)              │
│          │                                       │
│ Dashboard│                                       │
│ Employees│                                       │
│ Attend.. │                                       │
│ Leave    │                                       │
│ Payroll  │                                       │
│ Chat     │                                       │
│ Calendar │                                       │
│ Profile  │                                       │
│ Org Tree │                                       │
│ Settings │                                       │
│          │                                       │
│ [Logout] │                                       │
└──────────┴──────────────────────────────────────┘
```

### State Management (Zustand)

**authStore** - Manages authentication state:
- `user`, `token`, `isAuthenticated`, `isLoading`
- `login()` - POST /auth/login, store JWT
- `sendOtp()` - POST /auth/send-otp, validate signup form
- `verifyOtpAndSignup()` - POST /auth/signup with email + OTP
- `logout()` - Clear token, disconnect socket
- `fetchProfile()` - GET /auth/profile
- `hasRole()` - Check current user's role

**chatStore** - Manages chat state:
- `channels`, `directMessages`, `activeChannel`, `messages`
- `fetchChannels()` / `fetchDirectMessages()`
- `fetchMessages()` - Load messages for active channel
- `addMessage()` / `removeMessage()` - Real-time updates
- `createChannel()` / `startDirectMessage()`

### API Service (Axios)

- **Base URL:** `/api` (proxied to backend via Vite)
- **Request interceptor:** Attaches `Authorization: Bearer <token>` header
- **Response interceptor:** On 401 error, redirects to `/login`

### Socket.IO Service

- Singleton pattern - `getSocket()` returns or creates connection
- Authenticates with JWT token from localStorage
- Auto-connects to `http://localhost:4000`
- `disconnectSocket()` called on logout

---

## 7. Authentication & Signup Flow

### Login Flow

```
User                    Frontend                     Backend
  │                        │                            │
  ├─ Enter email/password ─►                            │
  │                        ├── POST /auth/login ────────►
  │                        │                            ├── Find user by email
  │                        │                            ├── Verify password (bcrypt)
  │                        │                            ├── Generate JWT
  │                        ◄── { token, user } ─────────┤
  │                        ├── Store token in localStorage
  │                        ├── GET /auth/profile ───────►
  │                        ◄── { user details } ────────┤
  │                        ├── Navigate to /dashboard
  ◄── Dashboard shown ─────┤
```

### Signup Flow (with OTP Verification)

```
User                    Frontend                     Backend
  │                        │                            │
  │  Step 1: Fill Form     │                            │
  ├─ Company, Name, ───────►                            │
  │  Email, Password       ├── POST /auth/send-otp ────►
  │                        │   {companyName, fullName,  ├── Check email not taken
  │                        │    email, password}        ├── Generate 6-digit OTP
  │                        │                            ├── Store OTP + form data in memory (5 min TTL)
  │                        │                            ├── Send OTP via email (or log to console in dev)
  │                        ◄── { message: "OTP sent" } ─┤
  │                        ├── Show OTP input screen     │
  │                        ├── Start 60s resend cooldown │
  │                        │                            │
  │  Step 2: Enter OTP     │                            │
  ├─ 6-digit code ─────────►                            │
  │                        ├── POST /auth/signup ───────►
  │                        │   { email, otp }           ├── Verify OTP from store
  │                        │                            ├── Retrieve stored signup data
  │                        │                            ├── Transaction:
  │                        │                            │   ├── Create Company
  │                        │                            │   ├── Create User (ADMIN role)
  │                        │                            │   ├── Create Employee
  │                        │                            │   ├── Init Leave Balances
  │                        │                            │   ├── Create "General" chat channel
  │                        │                            │   └── Add user to channel
  │                        │                            ├── Generate JWT
  │                        ◄── { token, user } ─────────┤
  │                        ├── Store token, fetch profile
  │                        ├── Navigate to /dashboard
  ◄── Dashboard shown ─────┤
```

### OTP Details
- **Format:** 6-digit numeric code
- **Storage:** In-memory Map keyed by email (lowercase)
- **Expiry:** 5 minutes
- **Cleanup:** Expired entries swept every 60 seconds
- **Resend:** Generates new OTP, overwrites previous (old OTP invalidated)
- **Dev mode:** When SMTP credentials are empty, OTP is printed to server console

---

## 8. Module-by-Module Breakdown

### 8.1 Employee Management

**Who can access:**
- All users can view/edit their own profile
- ADMIN, HR can create employees and edit any employee
- MANAGER can view employees

**Create Employee Flow:**
1. Admin/HR fills form (name, email, password, department, designation, salary, etc.)
2. Backend creates a User record (with hashed password) and linked Employee record
3. Auto-generates unique employee code (EMP00001, EMP00002, ...)
4. Initializes leave balances for current year (12 Casual, 10 Sick, 15 Earned)

**Org Tree:**
- Employees can have a `managerId` pointing to another Employee
- The org tree endpoint builds a recursive hierarchy
- Frontend renders this as an expandable tree view

**Profile Photo:**
- Uploaded to Azure Blob Storage
- Max 5MB, image types only
- One photo per employee (replace on re-upload)

---

### 8.2 Attendance

**How it works:**
- Employee clicks "Check In" - creates an attendance record with `loginTime`
- Employee clicks "Check Out" - updates the record with `logoutTime` and calculates `totalHours`
- Multiple check-in/check-out sessions per day are supported
- Each session is a separate record with the same `date`

**Today's Status API returns:**
- Whether user is currently checked in
- All sessions for today
- Total hours worked today

**Monthly Report:**
- Aggregates all attendance records for a given month
- Shows per-day breakdown with hours
- Summary: total present days, total hours

---

### 8.3 Leave Management

**Leave Types:** CASUAL (12/yr), SICK (10/yr), EARNED (15/yr), UNPAID (unlimited)

**Application Flow:**
1. Employee selects leave type, start date, end date, and reason
2. Backend validates:
   - Start date <= End date
   - Sufficient balance (except UNPAID)
   - No duplicate/overlapping leaves
3. Leave created with status `PENDING`

**Approval Chain:**
```
Employee applies
    │
    ▼
TEAM_LEAD reviews ──► APPROVED ──► moves to next level
    │                    │
    │               REJECTED ──► Leave rejected (final)
    ▼
MANAGER reviews ──► APPROVED ──► moves to next level
    │                    │
    │               REJECTED ──► Leave rejected (final)
    ▼
HR reviews ──► APPROVED ──► Leave balance deducted, Leave status = APPROVED
    │
    REJECTED ──► Leave rejected (final)

Note: ADMIN can approve at any stage (bypasses chain)
```

**Each approval creates a `LeaveApproval` record** with the approver's role, action, and optional comment.

**Leave Balance:** Tracked per employee, per leave type, per year. Deducted only when finally approved by HR/Admin.

---

### 8.4 Payroll

**Generation (Admin/HR only):**
1. Select employee, month, and year
2. Backend calculates from employee's salary field:
   - Basic Salary = 50% of total salary
   - HRA = 20% of total salary
   - Allowances = 30% of total salary (or custom amount)
   - Gross Earnings = Basic + HRA + Allowances
   - PF = 12% of Basic Salary
   - Tax = ~10% of Gross Earnings
   - Leave Deduction = (daily rate x unpaid leave days in that month)
   - Other Deductions = custom amount
   - Net Salary = Gross Earnings - Total Deductions
3. Unique constraint prevents duplicate payroll for same employee/month/year

**PDF Salary Slip:**
- Generated on-demand using PDFKit
- Contains company name, employee details, full earnings/deductions breakdown
- Downloaded as a PDF file

---

### 8.5 Calendar

**Monthly view combining three data sources:**

| Day Status | Color/Indicator | Source |
|-----------|----------------|--------|
| Present | Green | Attendance records |
| Absent | Red | No attendance + not weekend/holiday/leave |
| Leave (Approved) | Blue | Leave records (APPROVED) |
| Leave (Pending) | Yellow | Leave records (PENDING) |
| Holiday | Purple | Holiday records |
| Weekend | Gray | Saturday/Sunday |
| Future | Default | Dates after today |

Each day includes:
- Attendance sessions (check-in/out times, hours)
- Leave details (type, status)
- Holiday details (name, type)

---

### 8.6 Company Settings

**Company Name:** Admin can update the company name.

**Company Logo:**
- Upload: PNG, JPG, or SVG (max 5MB)
- Stored in Azure Blob Storage (`company-logos` container)
- One logo per company (old one deleted on re-upload)
- Displayed in the Header component

**Holidays:**
- HR/Admin can create, edit, and delete holidays
- Types: NATIONAL, COMPANY, REGIONAL
- Unique per (company, date, name)
- Shown in Calendar view

---

## 9. Real-Time Chat System

### Architecture

```
Frontend (React)                    Backend (Node.js)
    │                                    │
    ├── Socket.IO Client ◄──────────────► Socket.IO Server
    │   (with JWT auth)                  │   (chat.socket.ts)
    │                                    │
    ├── REST API ◄──────────────────────► Express Routes
    │   (channels, history, files)       │   (chat.routes.ts)
    │                                    │
    └── Zustand chatStore               └── ChatService
        (local state)                       (database operations)
```

### Channel Types

| Type | Description | Visibility |
|------|-----------|-----------|
| PUBLIC | Open channels anyone in the company can see and join | All company users |
| PRIVATE | Invite-only channels | Members only |
| DIRECT | 1-on-1 messaging between two users | Two participants |

### Socket.IO Events

**Client to Server:**
| Event | Payload | Description |
|-------|---------|------------|
| `join:channel` | `{ channelId }` | Join a channel room |
| `leave:channel` | `{ channelId }` | Leave a channel room |
| `message:send` | `{ channelId, content, replyToId?, file? }` | Send a message |
| `message:edit` | `{ messageId, content }` | Edit a message |
| `message:delete` | `{ messageId }` | Delete a message |
| `presence:list` | - | Request online users list |

**Server to Client:**
| Event | Payload | Description |
|-------|---------|------------|
| `message:receive` | Full message object | New message in channel |
| `message:updated` | Updated message | Edited message |
| `message:deleted` | `{ messageId }` | Deleted message |
| `user:joined` | `{ userId, channelId }` | User joined channel |
| `presence:online` | `{ userId }` | User came online |
| `presence:offline` | `{ userId }` | User went offline |
| `presence:list` | `userId[]` | List of online users |

### Features
- **Message replies:** Messages can reference another message via `replyToId`
- **Pinned messages:** Any message can be pinned/unpinned in a channel
- **File attachments:** Files uploaded to Azure Blob (max 15MB), attached to messages
- **Online presence:** Tracked per user with multi-tab support (Set of socket IDs per user)
- **Custom status:** Users can set a text status (e.g., "In a meeting", "On vacation")
- **Company rooms:** All users auto-join a `company:{companyId}` room for presence broadcasts

---

## 10. API Endpoints Reference

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/send-otp` | No | Send OTP for signup (validates full form) |
| POST | `/signup` | No | Verify OTP and create account |
| POST | `/login` | No | Authenticate with email/password |
| GET | `/profile` | Yes | Get current user profile |
| POST | `/change-password` | Yes | Change password |

### Employees (`/api/employees`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/me` | Yes | All | Get own employee profile |
| PATCH | `/me` | Yes | All | Update own profile |
| POST | `/me/photo` | Yes | All | Upload profile photo |
| DELETE | `/me/photo` | Yes | All | Delete profile photo |
| GET | `/departments` | Yes | All | List departments |
| GET | `/org-tree` | Yes | All | Get org hierarchy |
| GET | `/` | Yes | ADMIN, HR, MANAGER | List employees (paginated) |
| GET | `/:id` | Yes | ADMIN, HR, MANAGER | Get employee by ID |
| POST | `/` | Yes | ADMIN, HR | Create employee |
| PATCH | `/:id` | Yes | ADMIN, HR | Update employee |

### Attendance (`/api/attendance`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/check-in` | Yes | Record check-in time |
| POST | `/check-out` | Yes | Record check-out time |
| GET | `/today` | Yes | Get today's attendance status |
| GET | `/monthly` | Yes | Get own monthly report |
| GET | `/monthly/:employeeId` | Yes | Get employee's monthly report |

### Leave (`/api/leaves`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/apply` | Yes | All | Apply for leave |
| GET | `/my` | Yes | All | Get own leave requests |
| GET | `/balances` | Yes | All | Get leave balances |
| GET | `/pending` | Yes | TL, MGR, HR, ADMIN | Get pending approvals |
| POST | `/:id/approve` | Yes | TL, MGR, HR, ADMIN | Approve/reject leave |

### Payroll (`/api/payroll`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/my` | Yes | All | Get own payroll history |
| GET | `/all` | Yes | ADMIN, HR | Get all company payrolls |
| GET | `/:id` | Yes | All | Get payroll slip details |
| GET | `/:id/download` | Yes | All | Download PDF salary slip |
| POST | `/generate` | Yes | ADMIN, HR | Generate payroll for employee |

### Chat (`/api/chat`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/channels` | Yes | Create channel |
| GET | `/channels` | Yes | Get user's channels |
| GET | `/channels/:id/messages` | Yes | Get messages (cursor paginated) |
| GET | `/channels/:id/pinned` | Yes | Get pinned messages |
| POST | `/channels/:id/join` | Yes | Join public channel |
| GET | `/channels/:id/members` | Yes | Get channel members |
| POST | `/channels/:id/members` | Yes | Add member to channel |
| GET | `/users` | Yes | Get company users |
| GET | `/dm` | Yes | Get DM channels |
| POST | `/dm` | Yes | Start/get DM channel |
| POST | `/messages/:id/pin` | Yes | Toggle pin on message |
| DELETE | `/messages/:id` | Yes | Delete message |
| PATCH | `/status` | Yes | Update custom status |
| POST | `/upload` | Yes | Upload chat file |

### Company (`/api/company`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| PATCH | `/name` | Yes | ADMIN | Update company name |
| GET | `/logo` | Yes | All | Get company logo |
| POST | `/logo` | Yes | ADMIN | Upload/replace logo |
| DELETE | `/logo` | Yes | ADMIN | Delete logo |

### Holidays (`/api/holidays`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/` | Yes | All | Get holidays by year |
| POST | `/` | Yes | HR, ADMIN | Create holiday |
| PUT | `/:id` | Yes | HR, ADMIN | Update holiday |
| DELETE | `/:id` | Yes | HR, ADMIN | Delete holiday |

### Calendar (`/api/calendar`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/month` | Yes | Get monthly calendar data |

---

## 11. Security

| Measure | Implementation |
|---------|---------------|
| **Authentication** | JWT tokens (HS256, 8-hour expiry) |
| **Password Hashing** | Bcrypt with 12 salt rounds |
| **Role-Based Access** | 5 roles with middleware guards |
| **Input Validation** | Zod schemas on every endpoint |
| **Rate Limiting** | 100 requests per 15 minutes (configurable) |
| **CORS** | Restricted to frontend origin only |
| **Security Headers** | Helmet (CSP, X-Frame-Options, etc.) |
| **OTP Verification** | 6-digit, 5-min TTL, single-use |
| **Multi-Tenancy** | companyId isolation on all queries |
| **Socket Auth** | JWT verified on Socket.IO handshake |
| **Error Handling** | No stack traces in production responses |
| **File Uploads** | Size limits (5MB logos, 15MB chat files), type validation |

---

## 12. Setup & Running

### Prerequisites
- Node.js 18+
- MySQL 8+
- Azure Blob Storage account (optional - file uploads disabled without it)
- SMTP credentials (optional - OTP logged to console without it)

### Backend Setup

```bash
cd backend
cp .env.example .env          # Configure your environment variables
npm install                    # Install dependencies
npx prisma migrate dev         # Run database migrations
npx prisma db seed             # Seed initial data
npm run dev                    # Start dev server on port 4000
```

### Frontend Setup

```bash
cd frontend
npm install                    # Install dependencies
npm run dev                    # Start Vite dev server on port 5173
```

### Environment Variables (backend/.env)

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="mysql://user:password@localhost:3306/saashrm"

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h

# Azure Blob Storage (optional)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER_LOGOS=company-logos
AZURE_STORAGE_CONTAINER_CHAT=chat-files

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000

# SMTP (optional - OTP logged to console when empty)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="SaaS HRM <noreply@saashrm.com>"
```

### Vite Proxy (frontend/vite.config.ts)

The frontend dev server proxies API and WebSocket requests to the backend:
- `/api/*` proxied to `http://localhost:4000`
- `/socket.io/*` proxied to `http://localhost:4000` (WebSocket)
- `/uploads/*` proxied to `http://localhost:4000`

---

## 13. Seed Data

The seed script creates a sample company with pre-configured users:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@acme.com | admin123 | ADMIN | Company administrator |
| hr@acme.com | hr1234 | HR | HR manager |
| john@acme.com | emp123 | EMPLOYEE | Regular employee |

The seed also creates:
- Sample employees with departments and designations
- Initial leave balances for the current year
- A "General" public chat channel
- Sample holidays
