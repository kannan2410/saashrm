# SaaS HRM - Phase 1 MVP Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Static Web Apps                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + TailwindCSS + Zustand               │  │
│  │  ┌─────────┬──────────┬──────────┬─────────┬───────────┐  │  │
│  │  │ Login   │Dashboard │Employees │ Leave   │ Chat      │  │  │
│  │  │ Page    │  Page    │  Page    │  Page   │ Page      │  │  │
│  │  └─────────┴──────────┴──────────┴─────────┴───────────┘  │  │
│  │  ┌──────────┬──────────┬──────────┐                       │  │
│  │  │Attendance│ Payroll  │ Settings │                       │  │
│  │  │  Page    │  Page    │  Page    │                       │  │
│  │  └──────────┴──────────┴──────────┘                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS + WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Azure App Service                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express + TypeScript + Socket.IO               │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │  Controllers  │  │   Services   │  │   Middleware    │  │  │
│  │  │  ┌──────────┐ │  │  ┌─────────┐ │  │  ┌──────────┐  │  │  │
│  │  │  │  Auth    │ │  │  │  Auth   │ │  │  │JWT Auth  │  │  │  │
│  │  │  │  Employee│ │  │  │  Emp.   │ │  │  │RBAC      │  │  │  │
│  │  │  │  Attend. │ │  │  │  Attend.│ │  │  │Validator │  │  │  │
│  │  │  │  Leave   │ │  │  │  Leave  │ │  │  │Error Hndl│  │  │  │
│  │  │  │  Payroll │ │  │  │  Payroll│ │  │  │Rate Limit│  │  │  │
│  │  │  │  Chat    │ │  │  │  Chat   │ │  │  │Logger    │  │  │  │
│  │  │  │  Logo    │ │  │  │  Logo   │ │  │  └──────────┘  │  │  │
│  │  │  └──────────┘ │  │  └─────────┘ │  └────────────────┘  │  │
│  │  └──────────────┘  └──────────────┘                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────────┬───────────────┘
           │                                      │
           ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────────┐
│  Azure MySQL        │              │  Azure Blob Storage     │
│  Flexible Server    │              │  ┌───────────────────┐  │
│  ┌───────────────┐  │              │  │ company-logos      │  │
│  │ companies     │  │              │  │ chat-files         │  │
│  │ users         │  │              │  └───────────────────┘  │
│  │ employees     │  │              └─────────────────────────┘
│  │ attendances   │  │
│  │ leaves        │  │
│  │ payrolls      │  │
│  │ chat_channels │  │
│  │ chat_messages │  │
│  └───────────────┘  │
└─────────────────────┘
```

## 2. Database Design (ER Diagram)

```
┌──────────────┐       ┌──────────────────┐
│   Company    │───────│  CompanyLogo      │
│──────────────│  1:0-1│──────────────────│
│ id (PK)      │       │ id (PK)          │
│ name         │       │ company_id (FK)  │
│ domain       │       │ url              │
│ created_at   │       │ blob_name        │
│ updated_at   │       │ file_name        │
└──────┬───────┘       │ file_size        │
       │               │ mime_type        │
       │ 1:N           │ uploaded_at      │
       │               └──────────────────┘
       ▼
┌──────────────┐       ┌──────────────────┐
│    User      │───────│    Employee      │
│──────────────│  1:1  │──────────────────│
│ id (PK)      │       │ id (PK)          │
│ email (UQ)   │       │ employee_code(UQ)│
│ password     │       │ full_name        │
│ role (ENUM)  │       │ email (UQ)       │
│ is_active    │       │ department       │
│ company_id   │       │ designation      │
│ created_at   │       │ manager_id (FK)──┤──► self-reference
│ updated_at   │       │ date_of_joining  │
└──────┬───────┘       │ employment_type  │
       │               │ salary           │
       │               │ work_location    │
       │               │ status           │
       │               │ company_id (FK)  │
       │               │ user_id (FK)     │
       │               └────────┬─────────┘
       │                   │    │    │
       │              ┌────┘    │    └────┐
       │              ▼         ▼         ▼
       │   ┌──────────────┐ ┌───────┐ ┌────────┐
       │   │  Attendance  │ │ Leave │ │Payroll │
       │   │──────────────│ │───────│ │────────│
       │   │ id           │ │ id    │ │ id     │
       │   │ employee_id  │ │emp_id │ │emp_id  │
       │   │ date         │ │type   │ │month   │
       │   │ login_time   │ │start  │ │year    │
       │   │ logout_time  │ │end    │ │basic   │
       │   │ total_hours  │ │days   │ │hra     │
       │   └──────────────┘ │reason │ │allow.  │
       │                    │status │ │gross   │
       │                    └───┬───┘ │pf      │
       │                        │     │tax     │
       │               ┌───────┘     │net     │
       │               ▼             └────────┘
       │   ┌──────────────────┐
       │   │ LeaveApproval    │
       │   │──────────────────│
       │   │ id               │
       │   │ leave_id (FK)    │
       │   │ approver_id (FK) │──► User
       │   │ role             │
       │   │ action           │
       │   │ comment          │
       │   └──────────────────┘
       │
       │   ┌──────────────┐      ┌─────────────────┐
       ├──►│ ChatChannel   │─────│ ChannelMember    │
       │   │──────────────│ 1:N │─────────────────│
       │   │ id           │     │ id              │
       │   │ name         │     │ channel_id (FK) │
       │   │ type         │     │ user_id (FK)    │──► User
       │   │ company_id   │     └─────────────────┘
       │   │ created_by   │
       │   └──────┬───────┘
       │          │ 1:N
       │          ▼
       │   ┌──────────────┐      ┌─────────────────┐
       └──►│ ChatMessage   │─────│ ChatFile         │
           │──────────────│ 1:N │─────────────────│
           │ id           │     │ id              │
           │ channel_id   │     │ message_id (FK) │
           │ sender_id    │     │ url             │
           │ content      │     │ blob_name       │
           │ is_pinned    │     │ file_name       │
           │ created_at   │     │ file_size       │
           └──────────────┘     │ mime_type       │
                                └─────────────────┘

LeaveBalance
┌──────────────────┐
│ id               │
│ employee_id (FK) │
│ leave_type       │
│ year             │
│ total            │
│ used             │
│ remaining        │
└──────────────────┘
```

### Indexing Strategy

| Table           | Index                       | Purpose                        |
|-----------------|-----------------------------|--------------------------------|
| users           | email (unique)              | Login lookup                   |
| users           | company_id                  | Company-scoped queries         |
| employees       | employee_code (unique)      | Code lookup                    |
| employees       | email (unique)              | Email lookup                   |
| employees       | company_id, department      | Filtered listing               |
| employees       | manager_id                  | Hierarchy queries              |
| employees       | status                      | Status filtering               |
| attendances     | employee_id + date (unique) | One record per day             |
| attendances     | date                        | Date-range reports             |
| leaves          | employee_id, status         | Employee leave queries         |
| leaves          | start_date, end_date        | Date-range queries             |
| payrolls        | employee_id + month + year  | Unique monthly record          |
| chat_messages   | channel_id, created_at      | Message pagination             |
| channel_members | channel_id + user_id        | Membership lookup              |

## 3. Backend Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── config/
│   │   ├── env.ts             # Environment variables
│   │   ├── database.ts        # Prisma client instance
│   │   └── azure-storage.ts   # Azure Blob helpers
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── leave.controller.ts
│   │   ├── payroll.controller.ts
│   │   ├── chat.controller.ts
│   │   └── company-logo.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── employee.service.ts
│   │   ├── attendance.service.ts
│   │   ├── leave.service.ts
│   │   ├── payroll.service.ts
│   │   ├── chat.service.ts
│   │   └── company-logo.service.ts
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification
│   │   ├── authorize.ts       # Role-based access
│   │   ├── validate.ts        # Zod validation
│   │   ├── error-handler.ts   # Centralized errors
│   │   └── request-logger.ts  # Request logging
│   ├── routes/
│   │   ├── index.ts           # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── leave.routes.ts
│   │   ├── payroll.routes.ts
│   │   ├── chat.routes.ts
│   │   └── company.routes.ts
│   ├── dtos/
│   │   ├── auth.dto.ts
│   │   ├── employee.dto.ts
│   │   ├── leave.dto.ts
│   │   ├── payroll.dto.ts
│   │   └── chat.dto.ts
│   ├── sockets/
│   │   └── chat.socket.ts     # Socket.IO handlers
│   ├── types/
│   │   └── index.ts           # Shared types
│   ├── utils/
│   │   ├── app-error.ts       # Error classes
│   │   ├── response.ts        # Response helpers
│   │   └── logger.ts          # Winston logger
│   └── server.ts              # Entry point
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

### API Endpoints

| Method | Endpoint                          | Auth    | Roles              |
|--------|-----------------------------------|---------|---------------------|
| POST   | /api/auth/login                   | No      | -                   |
| GET    | /api/auth/profile                 | Yes     | All                 |
| GET    | /api/employees                    | Yes     | Admin, HR, Manager  |
| GET    | /api/employees/me                 | Yes     | All                 |
| GET    | /api/employees/:id                | Yes     | Admin, HR, Manager  |
| POST   | /api/employees                    | Yes     | Admin, HR           |
| PATCH  | /api/employees/:id                | Yes     | Admin, HR           |
| GET    | /api/employees/departments        | Yes     | All                 |
| POST   | /api/attendance/check-in          | Yes     | All                 |
| POST   | /api/attendance/check-out         | Yes     | All                 |
| GET    | /api/attendance/today             | Yes     | All                 |
| GET    | /api/attendance/monthly           | Yes     | All                 |
| POST   | /api/leaves/apply                 | Yes     | All                 |
| GET    | /api/leaves/my                    | Yes     | All                 |
| GET    | /api/leaves/balances              | Yes     | All                 |
| GET    | /api/leaves/pending               | Yes     | TL, Mgr, HR, Admin  |
| POST   | /api/leaves/:id/approve           | Yes     | TL, Mgr, HR, Admin  |
| GET    | /api/payroll/my                   | Yes     | All                 |
| GET    | /api/payroll/all                  | Yes     | Admin, HR           |
| GET    | /api/payroll/:id                  | Yes     | All                 |
| GET    | /api/payroll/:id/download         | Yes     | All                 |
| POST   | /api/payroll/generate             | Yes     | Admin, HR           |
| POST   | /api/chat/channels                | Yes     | All                 |
| GET    | /api/chat/channels                | Yes     | All                 |
| GET    | /api/chat/channels/:id/messages   | Yes     | All                 |
| POST   | /api/chat/channels/:id/join       | Yes     | All                 |
| POST   | /api/chat/messages/:id/pin        | Yes     | All                 |
| POST   | /api/chat/upload                  | Yes     | All                 |
| GET    | /api/company/logo                 | Yes     | All                 |
| POST   | /api/company/logo                 | Yes     | Admin               |
| DELETE | /api/company/logo                 | Yes     | Admin               |

## 4. Frontend Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx    # Main shell
│   │   │   ├── Sidebar.tsx      # Left navigation
│   │   │   └── Header.tsx       # Top bar
│   │   └── ui/
│   │       ├── StatusBadge.tsx   # Status labels
│   │       ├── Modal.tsx         # Modal dialog
│   │       ├── StatsCard.tsx     # Statistics card
│   │       └── DataTable.tsx     # Reusable table
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── EmployeePage.tsx
│   │   ├── AttendancePage.tsx
│   │   ├── LeavePage.tsx
│   │   ├── PayrollPage.tsx
│   │   ├── ChatPage.tsx
│   │   └── SettingsPage.tsx
│   ├── stores/
│   │   ├── authStore.ts         # Auth + user state
│   │   └── chatStore.ts         # Chat state
│   ├── services/
│   │   ├── api.ts               # Axios instance
│   │   └── socket.ts            # Socket.IO client
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── App.tsx                  # Router + protected routes
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind + custom classes
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## 5. Security Implementation

| Security Measure           | Implementation                                          |
|----------------------------|---------------------------------------------------------|
| Password Hashing           | bcrypt with 12 salt rounds                              |
| Authentication             | JWT with configurable expiration (default 8h)           |
| Authorization              | Role-based middleware (RBAC)                             |
| Input Validation           | Zod schemas on all endpoints                            |
| File Validation            | Type + size checks (Logo: 5MB, Chat: 15MB)              |
| Rate Limiting              | express-rate-limit (100 req/15min)                      |
| Security Headers           | Helmet.js                                               |
| CORS                       | Configurable origin whitelist                           |
| SQL Injection              | Prisma ORM (parameterized queries)                      |
| XSS                        | React auto-escaping + Helmet CSP                        |
| Azure Blob                 | Private containers, connection string auth              |

## 6. Deployment Steps

### Azure MySQL Flexible Server
1. Create Azure MySQL Flexible Server
2. Set admin credentials
3. Create database: `saashrm`
4. Configure firewall rules
5. Set `DATABASE_URL` in backend env

### Azure Blob Storage
1. Create Storage Account
2. Create containers: `company-logos`, `chat-files`
3. Set access level to Private
4. Copy connection string to `AZURE_STORAGE_CONNECTION_STRING`

### Backend - Azure App Service
1. Create App Service (Node 20 LTS)
2. Configure environment variables from `.env.example`
3. Deploy via GitHub Actions or `az webapp up`
4. Run `npx prisma migrate deploy` post-deploy
5. Run `npx ts-node prisma/seed.ts` for initial data
6. Enable WebSockets in App Service configuration

### Frontend - Azure Static Web Apps
1. Create Static Web App from GitHub repo
2. Set app location: `frontend`
3. Set output location: `dist`
4. Configure API proxy to backend App Service URL
5. Set custom domain if needed

### Environment Variables (Backend)
```
PORT=4000
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:3306/saashrm
JWT_SECRET=<strong-random-string>
JWT_EXPIRES_IN=8h
AZURE_STORAGE_CONNECTION_STRING=<connection-string>
AZURE_STORAGE_CONTAINER_LOGOS=company-logos
AZURE_STORAGE_CONTAINER_CHAT=chat-files
CORS_ORIGIN=https://your-frontend-domain.azurestaticapps.net
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 7. Future Scaling Plan

### Phase 2 Candidates
- Recruitment module
- Performance reviews
- Training management
- Document management
- Advanced reporting / analytics

### Scaling Strategy
| Component     | Current          | Scale To                        |
|---------------|------------------|---------------------------------|
| Backend       | Single instance  | Multiple instances + load balancer |
| Database      | Single server    | Read replicas + connection pooling |
| File Storage  | Azure Blob       | CDN for static assets            |
| WebSocket     | In-memory        | Redis adapter for multi-instance |
| Caching       | None             | Redis for hot data               |
| Search        | SQL LIKE         | Elasticsearch for full-text      |
| Auth          | JWT              | JWT + refresh tokens + sessions  |
| Monitoring    | Winston logs     | Application Insights + alerts    |

### Multi-Tenancy Path
- Current: `company_id` column-level isolation
- Next: Schema-per-tenant for enterprise clients
- Final: Dedicated database per tenant for regulated industries
