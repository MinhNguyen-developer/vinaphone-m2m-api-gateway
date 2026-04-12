# Vinaphone M2M API Gateway

Backend API gateway cho hệ thống quản lý SIM M2M Vinaphone.  
Gateway này đứng giữa **React Dashboard** và **API nội bộ của Vinaphone**, có nhiệm vụ xác thực, chuẩn hoá dữ liệu, lưu trạng thái quản lý nội bộ và cung cấp các endpoint cho frontend.

---

## Mục lục

1. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt](#cài-đặt)
4. [Biến môi trường](#biến-môi-trường)
5. [Cấu trúc project](#cấu-trúc-project)
6. [Database & Prisma](#database--prisma)
7. [Modules & Endpoints](#modules--endpoints)
8. [Luồng trạng thái SIM](#luồng-trạng-thái-sim)
9. [Authentication](#authentication)
10. [Chạy ứng dụng](#chạy-ứng-dụng)
11. [Docker](#docker)
12. [Lưu ý kỹ thuật](#lưu-ý-kỹ-thuật)

---

## Kiến trúc tổng quan

```
React Dashboard  ►  NestJS API Gateway  ►  Vinaphone Internal API
                        |
                        v
                   PostgreSQL DB  (via Prisma ORM)
              (trạng thái nội bộ, alert config,
               nhóm, lịch sử xác nhận)
```

- **React Dashboard** gọi toàn bộ qua NestJS – không gọi thẳng Vinaphone API.
- NestJS **proxy + cache** dữ liệu SIM từ Vinaphone, đồng thời lưu riêng trạng thái quản lý nội bộ (`Mới / Đã hoạt động / Đã xác nhận`), cấu hình cảnh báo, nhóm sản phẩm.
- Vinaphone API được gọi theo lịch (cron) hoặc on-demand để đồng bộ `usedMB`, `systemStatus`, `firstUsedAt`.

---

## Yêu cầu hệ thống

| Công cụ    | Phiên bản tối thiểu | Ghi chú                          |
| ---------- | ------------------- | -------------------------------- |
| Node.js    | 20.x LTS            | https://nodejs.org               |
| npm        | 10.x                | đi kèm Node.js                   |
| PostgreSQL | 15.x                | Hoặc dùng Docker                 |
| Redis      | 7.x                 | Cache & throttle (khuyến nghị)   |

---

## Cài đặt

```bash
# 1. Cài đặt dependencies (Prisma client sẽ được generate tự động qua postinstall)
npm install

# 2. Tạo file .env từ mẫu
cp .env.example .env
# Chỉnh sửa DATABASE_URL và các biến còn lại trong .env

# 3. Tạo migration và apply vào database
npm run db:migrate
```

---

## Biến môi trường

Tạo file `.env` ở root project (copy từ `.env.example`):

```dotenv
# App
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1
FRONTEND_URL=http://localhost:5173

# Database (PostgreSQL) - Prisma connection URL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vinaphone_m2m

# JWT
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=8h

# Vinaphone Upstream API
VINAPHONE_API_BASE_URL=https://api.vinaphone.vn/m2m/v1
VINAPHONE_API_KEY=your_api_key_here
VINAPHONE_API_TIMEOUT_MS=10000

# Sync Schedule (cron expression - mặc định 10 phút/lần)
SYNC_CRON=*/10 * * * *

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

> ⚠️ **Không commit file `.env`**. Dùng `.env.example` để chia sẻ cấu hình mẫu.

---

## Cấu trúc project

```
src/
├── app.module.ts
├── main.ts
│
├── config/                     # ConfigModule, configuration factory
│   └── configuration.ts
│
├── prisma/                     # Prisma integration
│   ├── prisma.module.ts        # Global PrismaModule
│   └── prisma.service.ts       # PrismaService (extends PrismaClient)
│
├── generated/
│   └── prisma/                 # Auto-generated Prisma client (git-ignored)
│
├── auth/                       # JWT authentication
│   ├── auth.module.ts
│   ├── auth.controller.ts      # POST /auth/login
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── public.decorator.ts     # @Public() decorator
│   └── dto/login.dto.ts
│
├── sims/                       # SIM M2M management
│   ├── sims.module.ts
│   ├── sims.controller.ts
│   ├── sims.service.ts
│   └── dto/
│       ├── query-sim.dto.ts
│       ├── update-sim-status.dto.ts
│       └── update-first-used-at.dto.ts
│
├── master-sims/                # SIM chủ
│   ├── master-sims.module.ts
│   ├── master-sims.controller.ts
│   └── master-sims.service.ts
│
├── usage-history/              # Lịch sử sử dụng dung lượng
│   ├── usage-history.module.ts
│   ├── usage-history.controller.ts
│   └── usage-history.service.ts
│
├── groups/                     # Nhóm SIM / sản phẩm
│   ├── groups.module.ts
│   ├── groups.controller.ts
│   └── groups.service.ts
│
├── alerts/                     # Cấu hình & theo dõi cảnh báo
│   ├── alerts.module.ts
│   ├── alerts.controller.ts
│   ├── alerts.service.ts
│   └── dto/update-alert-check.dto.ts
│
└── sync/                       # Cron job đồng bộ từ Vinaphone API
    ├── sync.module.ts
    └── sync.service.ts

prisma/
├── schema.prisma               # Database schema (source of truth)
└── migrations/                 # Prisma migration history

prisma.config.ts                # Prisma 7 datasource config
```

---

## Database & Prisma

Project sử dụng **Prisma 7** với **PostgreSQL** thông qua driver adapter `@prisma/adapter-pg`.

### Schema models

| Model         | Bảng DB         | Mô tả                                      |
| ------------- | --------------- | ------------------------------------------ |
| `Sim`         | `sims`          | Thông tin SIM M2M, trạng thái nội bộ       |
| `UsageHistory`| `usage_history` | Lịch sử dung lượng theo tháng (YYYY-MM)    |
| `MasterSim`   | `master_sims`   | SIM chủ, dung lượng gói / đã dùng          |
| `Group`       | `groups`        | Nhóm SIM                                   |
| `SimGroup`    | `sim_groups`    | Bảng nối nhiều-nhiều Sim ↔ Group           |
| `AlertConfig` | `alert_configs` | Cấu hình cảnh báo ngưỡng dung lượng        |
| `AlertCheck`  | `alert_checks`  | Lịch sử xác nhận cảnh báo                  |

### Lệnh Prisma

```bash
# Tạo migration mới (dev) + apply
npm run db:migrate

# Apply migration vào production (không tạo mới)
npm run db:deploy

# Mở Prisma Studio (GUI quản lý data)
npm run db:studio

# Regenerate Prisma client (chạy tự động sau npm install)
npx prisma generate
```

---

## Modules & Endpoints

Tất cả endpoint đều yêu cầu **Bearer JWT token** trong header (trừ `POST /auth/login`).

```
Authorization: Bearer <token>
```

---

### `POST /auth/login`

Đăng nhập, nhận JWT token.

**Request body:**
```json
{ "username": "admin", "password": "your_password" }
```

**Response:**
```json
{ "access_token": "eyJhbGci...", "expires_in": "8h" }
```

---

### `GET /sims`

Lấy danh sách SIM M2M (merge Vinaphone API + trạng thái nội bộ).

**Query parameters:**

| Tham số         | Kiểu   | Mô tả                                                            |
| --------------- | ------ | ---------------------------------------------------------------- |
| `page`          | number | Trang (mặc định: 1)                                              |
| `pageSize`      | number | Số bản ghi/trang (mặc định: 50, tối đa: 200)                     |
| `productCode`   | string | Lọc theo mã sản phẩm                                             |
| `masterSimCode` | string | Lọc theo SIM chủ                                                 |
| `systemStatus`  | string | `ACTIVE` / `INACTIVE` / `PENDING` / `SUSPENDED`                  |
| `status`        | string | Trạng thái nội bộ: `Mới` / `Đã hoạt động` / `Đã xác nhận`       |
| `search`        | string | Tìm theo SĐT, IMSI, hoặc mã hợp đồng                            |

---

### `PATCH /sims/:id/status`

Cập nhật trạng thái quản lý nội bộ của SIM.

**Request body:** `{ "action": "confirm" }` hoặc `{ "action": "reset" }`

| `action`  | Trạng thái kết quả | Điều kiện                                          |
| --------- | ------------------ | -------------------------------------------------- |
| `confirm` | `Đã xác nhận`      | SIM phải đang ở trạng thái `Đã hoạt động`          |
| `reset`   | `Mới`              | Xoá `firstUsedAt`, `confirmedAt`, `usedMB = 0`    |

---

### `PATCH /sims/:id/first-used-at`

Sửa thủ công thời gian kích hoạt.

**Request body:** `{ "firstUsedAt": "2025-03-01 08:00" }`

---

### `GET /sims/:phoneNumber/usage-history`

Lịch sử dung lượng theo tháng của một SIM.

**Query:** `fromMonth=YYYY-MM` & `toMonth=YYYY-MM`

---

### `GET /master-sims`

Danh sách SIM chủ kèm dung lượng tổng / đã dùng / còn lại.

> `remainingMB` = `packageCapacityMB - usedMB` (tính server-side)

---

### `GET /master-sims/:code/members`

Danh sách SIM thành viên thuộc SIM chủ. Hỗ trợ phân trang (`page`, `pageSize`).

---

### `GET /groups`

Danh sách nhóm SIM kèm số lượng SIM trong nhóm (`simCount`).

---

### `GET /alerts`

Danh sách cấu hình cảnh báo.

---

### `GET /alerts/triggered`

Danh sách SIM đang **vượt ngưỡng** cảnh báo.  
Query: `?productCode=vina1200`

---

### `PATCH /alerts/triggered/:simId/:alertId/check`

Đánh dấu cảnh báo đã được kiểm tra.

**Request body:** `{ "checked": true }`

---

## Luồng trạng thái SIM

```
 ┌──────────────────┐
 │       Mới        │  ◄── SIM mới thêm vào hệ thống (usedMB = 0)
 └────────┬─────────┘
          │  usedMB > 0 lần đầu (phát hiện qua sync cron)
          ▼
 ┌──────────────────┐
 │  Đã hoạt động   │  ◄── firstUsedAt được ghi nhận tự động
 └────────┬─────────┘
          │  Admin xác nhận  PATCH /sims/:id/status { action: "confirm" }
          ▼
 ┌──────────────────┐
 │  Đã xác nhận    │
 └────────┬─────────┘
          │  Admin reset     PATCH /sims/:id/status { action: "reset" }
          ▼
 ┌──────────────────┐
 │       Mới        │  ◄── usedMB = 0, firstUsedAt/confirmedAt bị xoá
 └──────────────────┘
```

Logic auto-transition trong `SyncService`:

```typescript
if (sim.status === 'Mới' && newUsedMB > 0) {
  // Prisma update
  await this.prisma.sim.update({
    where: { id: sim.id },
    data: { status: 'Đã hoạt động', firstUsedAt: now, usedMB: newUsedMB },
  });
}
```

---

## Authentication

- **JWT (HS256)** với `@nestjs/jwt` + `passport-jwt`
- Token hết hạn sau `JWT_EXPIRES_IN` (mặc định `8h`)
- `JwtAuthGuard` áp dụng global, trừ các route được đánh dấu `@Public()`

---

## Chạy ứng dụng

```bash
# Development (hot reload)
npm run start:dev

# Production build + start
npm run build && npm run start:prod
```

Swagger UI (chỉ khi `NODE_ENV != production`):  
`http://localhost:3000/api/docs`

---

## Docker

```bash
# Build và chạy toàn bộ stack
docker compose up --build

# Chỉ chạy DB + Redis (dev API chạy local)
docker compose up postgres redis
```

`docker-compose.yml` bao gồm PostgreSQL 15, Redis 7, và service API với healthcheck.  
Migration (`prisma migrate deploy`) chạy tự động khi container API khởi động.

---

## Lưu ý kỹ thuật

| # | Lưu ý |
|---|-------|
| 1 | **ORM:** Sử dụng **Prisma 7** với `@prisma/adapter-pg`. Schema tại `prisma/schema.prisma` là nguồn sự thật cho database. |
| 2 | **Timezone:** Lưu DB theo UTC, trả về API format `YYYY-MM-DD HH:mm` theo `UTC+7`. Set `TZ=Asia/Ho_Chi_Minh` trong production. |
| 3 | **Encoding:** PostgreSQL dùng `ENCODING = 'UTF8'`. Response `Content-Type: application/json; charset=utf-8`. |
| 4 | **Pagination:** Luôn phân trang. Tối đa `pageSize = 200`. |
| 5 | **usedMB đơn vị:** Thống nhất **MB** (`Int`). 1 GB = 1024 MB. |
| 6 | **Sync cron:** `SyncService` dùng `SchedulerRegistry` + `CronJob`, đọc `SYNC_CRON` từ env lúc runtime. |
| 7 | **master_sims.usedMB:** Tính lại mỗi lần sync = `SUM(sims.usedMB WHERE masterSimCode = code)` qua `prisma.sim.aggregate`. |
| 8 | **Rate limiting:** `@nestjs/throttler` (100 req / 60s mặc định). |
| 9 | **Prisma client:** Auto-generated vào `src/generated/prisma/` (git-ignored). Chạy lại bằng `npx prisma generate` hoặc tự động qua `postinstall`. |
| 10 | **Auth production:** `STATIC_USERS` trong `auth.service.ts` chỉ dùng cho dev. Thay bằng DB table + bcrypt trước khi deploy. |
