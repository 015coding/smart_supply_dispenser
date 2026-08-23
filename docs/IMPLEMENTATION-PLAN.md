# แผนพัฒนา “พร้อมปัน” เป็น Web Application พร้อม REST API และ OpenAPI

## สถานะการลงมือทำ

อัปเดตล่าสุด: 23 ส.ค. 2569

| ระยะ | สถานะ | จุดเริ่มต้นถัดไป |
| --- | --- | --- |
| Repository และ Foundation scaffold | เสร็จ | ทำ domain rules, privacy utilities และ service-day utility ให้ผ่าน unit tests |
| Domain, data model และ business services | กำลังทำ | เริ่มจาก `src/lib/domain/` และ `src/lib/server/store.ts` |
| Authentication และ security boundary | รอ | หลัง store และ API response/error boundary พร้อม |
| Public/Admin REST API และ OpenAPI | รอ | หลัง authentication boundary |
| Public/Admin UI | รอ | หลัง REST API หลัก |
| Recipient/CSV, dashboard, retention | รอ | หลัง dispenser และ API mutation |
| Device API, simulator และ MicroPython client | รอ | หลัง store มี report/revision workflow |
| Deploy และ hardening | รอ | หลัง full test/build และ code review |

Checkpoint ล่าสุด: `d68401c` — `chore: scaffold next app and domain test seams` (pushed to `main`).

## 1. สรุปแนวทาง

พัฒนาระบบใหม่จากสเปกใน `docs/PROJECT-SPEC.md`, Device contract ใน `docs/DEVICE-API.md` และใช้ Prototype 2 เป็น reference ด้านหน้าตาและ user flow โดยไม่ยกโค้ด prototype ที่เก็บข้อมูลใน memory มาใช้เป็น production code

ผลลัพธ์คือระบบเดียวที่ประกอบด้วย:

- Public website สำหรับค้นหาและดูรายละเอียดเครื่องแจกสิ่งของ
- Admin workspace สำหรับจัดการเครื่อง ช่องจ่าย แผนการแจก สต็อก ผู้มีสิทธิ์ alert และรายงาน
- REST API เป็น application interface หลักของทั้ง Public และ Admin UI
- Device API สำหรับ ESP32 ตาม `/api/device/v1`
- OpenAPI 3.1 document ครอบคลุม Public API, Admin API และ Device API
- Device simulator และคู่มือเชื่อม MicroPython เดิมเข้ากับ API
- Deploy บน Vercel Hobby ใช้ Neon PostgreSQL และ Vercel Blob
- ไม่แก้ firmware MicroPython จริงและไม่ทำ MicroPython client adapter ในรอบนี้

## 2. Architecture และ Interface

### 2.1 Technology stack

- Next.js App Router + TypeScript
- React Server Components สำหรับ page shell/metadata และ client components เฉพาะส่วน interactive
- Tailwind CSS และ accessible component primitives
- Drizzle ORM กับ PostgreSQL pooled connection
- Auth.js Credentials provider แบบ JWT session
- Zod เป็น schema validation กลาง
- สร้าง OpenAPI จาก Zod operation registry เพื่อลด schema ซ้ำ
- สร้าง TypeScript API types จาก OpenAPI และใช้ typed fetch client ในหน้าเว็บ
- React Hook Form สำหรับฟอร์ม Admin
- Leaflet/React Leaflet และ OpenStreetMap
- Recharts สำหรับ dashboard chart
- Vercel Blob สำหรับรูปเครื่อง
- Vitest สำหรับ unit/integration และ Playwright สำหรับ E2E
- ล็อก dependency versions ด้วย lockfile และใช้ Node.js runtime เดียวกันใน local, CI และ Vercel

REST API เป็น boundary หลักของ application: Public/Admin UI อ่านและแก้ข้อมูลผ่าน `/api/v1`; Route Handler ทำหน้าที่ auth, validation และเรียก application service ซึ่งเป็นจุดรวม transaction และ business rules

### 2.2 API conventions

- Public/Admin base path: `/api/v1`
- Device base path: `/api/device/v1`
- JSON ใช้ `snake_case` ให้สอดคล้องกับ Device API เดิม
- เวลาใน response เป็น ISO 8601 UTC
- `service_day` เป็น `YYYY-MM-DD` ตาม timezone `Asia/Bangkok`
- รายการแบบแบ่งหน้าใช้ `page` และ `page_size`; ค่าเริ่มต้น 20 และสูงสุด 100
- List response มี `items` และ `pagination: {page, page_size, total, total_pages}`
- Validation และ business error ใช้ `application/problem+json` พร้อม `status`, `code`, `detail`, `field_errors` และ `trace_id`
- Error/log ห้ามมี password, session cookie, device secret หรือเลขบัตรประชาชนแบบเต็ม
- Mutation ของ Admin ตรวจ Auth.js session, HTTP Origin และ Host เพื่อป้องกัน CSRF
- Device report ใช้ `(dispenser_id, report_id)` เป็น idempotency key
- Import commit idempotent ตาม `import_id`
- Endpoint ที่คืนข้อมูลอ่อนไหวหรือ CSV ใช้ `Cache-Control: no-store`

### 2.3 Authentication

- Auth.js ใช้ Credentials provider และ route มาตรฐาน `/api/auth/*`
- Auth.js routes อยู่นอก OpenAPI ตามตัวเลือกที่กำหนด
- Admin username และ bcrypt/argon password hash อ่านจาก environment variables
- ใช้ secure, HTTP-only, SameSite cookie ใน production
- ไม่มีตาราง Admin user, registration หรือ forgot-password
- ทุก `/admin/*` ยกเว้น login ถูกป้องกันทั้งระดับ route และ API
- Login rate limit ใช้ bucket ใน PostgreSQL โดยเก็บเพียง keyed hash ของ IP
- Device ใช้ shared `DEVICE_SHARED_SECRET` ผ่าน Bearer token ร่วมกับ `X-Device-Code`
- เปรียบเทียบ secret แบบ constant-time และคืนข้อความ `401` กลาง
- Draft dispenser เรียก Device API ได้เฉพาะเมื่อตั้ง `device_api_enabled_for_testing`; archived dispenser ถูกปฏิเสธเสมอ

### 2.4 Public REST API

- `GET /api/v1/public/dispensers`
  - รองรับ `q`, `province`, `district`, `status`, `page`, `page_size`
  - ค้นจากชื่อ รหัส และที่อยู่
  - คืนเฉพาะ lifecycle `published`
  - เรียงพร้อมแจกก่อน จากนั้นเรียงตามชื่อ
  - คืน filter facets สำหรับจังหวัดและอำเภอ

- `GET /api/v1/public/dispensers/{code}`
  - คืนข้อมูล public, รูป, สถานะ, available bundle count, รายการช่องที่อยู่ในแผนปัจจุบัน, ที่อยู่, พิกัด, contact, notice และ last reported time
  - ไม่คืน connectivity, pending revisions, internal UUID, activity หรือ recipient data

### 2.5 Admin REST API

Dashboard และ alert:

- `GET /api/v1/admin/dashboard`
  - รับช่วง `7d`, `30d` หรือ `from/to` และ optional dispenser code
  - คืน summary cards, active alerts, recent dispensers, recent activity และ completed-recipient chart
- `GET /api/v1/admin/alerts`
- `POST /api/v1/admin/alerts/{id}/acknowledge`
  - การรับทราบไม่ resolve alert
  - alert resolve อัตโนมัติเมื่อสาเหตุหาย

Dispenser:

- `GET /api/v1/admin/dispensers`
- `POST /api/v1/admin/dispensers`
  - สร้าง draft และรหัส `DSP-0001` แบบ transaction-safe
- `GET /api/v1/admin/dispensers/{code}`
- `PATCH /api/v1/admin/dispensers/{code}`
  - แก้ metadata, location, contact, notice, manual service override และ test-device flag
- `POST /api/v1/admin/dispensers/{code}/publish`
- `POST /api/v1/admin/dispensers/{code}/archive`
- `PUT /api/v1/admin/dispensers/{code}/image`
  - multipart, สูงสุด 5 MB, ตรวจ MIME/signature, resize และแปลง WebP
- `DELETE /api/v1/admin/dispensers/{code}/image`
- `GET /api/v1/admin/dispensers/{code}/plans`
- `POST /api/v1/admin/dispensers/{code}/plans`
  - สร้าง immutable revision ใหม่
- `POST /api/v1/admin/dispensers/{code}/stock-movements`
  - รองรับ `refill` และ `adjustment`
  - adjustment ต้องมีเหตุผล
- `GET /api/v1/admin/dispensers/{code}/device-state`
  - คืน last seen, firmware/client version และ applied/desired revisions

Recipient:

- `GET /api/v1/admin/recipients`
- `POST /api/v1/admin/recipients`
- `GET /api/v1/admin/recipients/{id}`
- `PATCH /api/v1/admin/recipients/{id}`
  - แก้ชื่อ, เปลี่ยนเลขบัตร หรือ activate/deactivate
- `DELETE /api/v1/admin/recipients/{id}`
  - hard delete พร้อม explicit confirmation token
- `POST /api/v1/admin/eligibility-imports/preview`
  - รับ CSV `citizen_id,name`
  - ตรวจ encoding, header, checksum และรายการซ้ำ
- `GET /api/v1/admin/eligibility-imports/{id}`
- `POST /api/v1/admin/eligibility-imports/{id}/commit`
- `GET /api/v1/admin/eligibility-imports/{id}/errors.csv`

Activity และ export:

- `GET /api/v1/admin/activity`
- `GET /api/v1/admin/exports/dispensers.csv`
- `GET /api/v1/admin/exports/stock.csv`
- `GET /api/v1/admin/exports/recipients.csv`
- `GET /api/v1/admin/exports/activity.csv`

### 2.6 Device API

คง endpoint หลักตาม contract เดิม:

- `POST /api/device/v1/sync`
- `GET /api/device/v1/eligibility-snapshot?version={version}`
- `POST /api/device/v1/authorize`
- `POST /api/device/v1/report`

พฤติกรรมที่ต้องล็อก:

- ทุก request ที่ authenticate สำเร็จอัปเดต `last_seen_at`
- Connectivity เป็น online เมื่อ request สำเร็จภายใน 20 นาที
- Connectivity ไม่เปลี่ยน public service status
- Snapshot สร้างเป็น UTF-8 CSV ใน memory เพราะ v1 จำกัดประมาณ 1,000 รายการ
- Snapshot ต้องส่ง `Content-Length`, version, record count และ SHA-256
- Snapshot ส่งเลขบัตรแต่ไม่ส่งชื่อ
- `authorize` ตรวจ active recipient, daily entitlement, dispenser status และ applied plan โดยไม่มีการจองสิทธิ์
- Network/server failure เป็นหน้าที่ firmware ที่จะ fallback offline; API ไม่คืนคำตอบ allow ปลอม
- `complete` report สร้าง stock movements และ completed distribution
- `partial` ลดสต็อกเฉพาะช่องที่สำเร็จแต่ไม่ใช้ daily entitlement
- `failed` เก็บ report/error แต่ไม่ลดสต็อก
- Report ซ้ำตอบ `duplicate: true` โดยไม่สร้าง movement หรือ completed record ซ้ำ
- `count_after` จากเครื่องใช้ตรวจ drift; การลด ledger คำนวณจาก channel result เพื่อไม่ให้ delayed report เขียนทับ Admin refill
- หาก report ระบุว่าจ่ายสำเร็จแต่ยอดส่วนกลางเป็นศูนย์ ให้คงยอดศูนย์, บันทึก discrepancy และเปิด operational alert
- Response คืน reconciled stock และ revision ล่าสุดให้เครื่องเสมอ
- Rate limit คืน `429` และ `Retry-After`; revision conflict คืน `409`

### 2.7 OpenAPI documentation

- ใช้ OpenAPI 3.1 และมี source of truth เดียวจาก schema/operation registry
- แบ่ง tags เป็น `Public`, `Admin`, `Admin Dispensers`, `Recipients`, `Exports` และ `Device`
- ระบุ cookie security สำหรับ Admin และ Bearer + `X-Device-Code` สำหรับ Device
- มี request/response example ทั้ง success, validation error, unauthorized, conflict และ rate limit
- ให้บริการ JSON ที่ `GET /api/openapi.json`
- ให้บริการ Swagger UI ที่ `/api-docs`
- ไม่ใส่ secret จริงใน example หรือ Swagger configuration
- Export static `openapi.json` ระหว่าง build เพื่อใช้ lint, generate types และส่งให้ผู้ทำ MicroPython
- เพิ่มตัวอย่าง `curl` สำหรับ sync, snapshot, authorize และ report
- ระบุชัดว่า `/api/auth/*` เป็น Auth.js protocol และไม่อยู่ใน application OpenAPI

## 3. Data Model และ Business Rules

### 3.1 ตารางหลัก

- `dispensers`
  - UUID, immutable code, lifecycle, metadata, location, image reference, manual service override, test-device flag และ timestamps
- `dispensing_channels`
  - dispenser, channel number 1–3, supply name, unit/custom unit, capacity, low-stock threshold และ current balance
- `distribution_plans`
  - dispenser, immutable version, effective service day และ created time
- `distribution_plan_items`
  - snapshot ของ channel, enabled state และ quantity per bundle
- `stock_movements`
  - channel, type, delta, balance before/after, dispenser stock revision, source reference, reason และ timestamp
- `operational_alerts`
  - issue type, entity, opened/acknowledged/resolved timestamps
- `recipients`
  - encrypted citizen ID, keyed lookup hash, name, active status และ timestamps
- `eligibility_versions`
  - monotonic version และ record count
- `eligibility_imports` / `eligibility_import_rows`
  - preview result, errors, status และ expiry
- `device_states`
  - last seen, firmware/client versions และ applied plan/eligibility/stock revisions
- `device_reports` / `device_report_channels`
  - raw business result ที่ไม่มี secret และ idempotency fields
- `completed_distributions`
  - recipient lookup hash/reference, dispenser, service day, plan version และ report reference
- `daily_distribution_summaries`
  - สรุปแบบไม่ระบุตัวบุคคลหลัง retention
- `administrative_activities`
  - actor, action, entity และ masked field diff
- `rate_limit_buckets`
  - keyed subject, route, window และ counter

เพิ่ม foreign keys, unique constraints และ indexes ตาม query จริง โดยเฉพาะ dispenser code, recipient lookup hash, report idempotency, service day และ active alerts

### 3.2 กติกาธุรกิจ

- Service day เริ่ม 00:00 น. `Asia/Bangkok`
- เก็บ timestamp ทั้งหมดเป็น UTC
- `available_bundle_count` คือค่าต่ำสุดของช่อง enabled ใน active plan
- Normal status เป็น `out_of_stock` เมื่อช่องในชุดอย่างน้อยหนึ่งช่องเหลือศูนย์ มิฉะนั้นเป็น `available`
- `temporarily_closed` และ `maintenance` override สถานะจาก stock
- Draft ไม่มี plan ที่ active ต่อ public
- ครั้งแรกที่ publish ให้ initial plan มีผลใน service day ปัจจุบัน
- การเปลี่ยนองค์ประกอบชุดหลัง publish สร้าง version ที่มีผล service day ถัดไป
- เติม/ปรับสต็อกมีผลทันที
- Stock mutation ล็อก channel rows และทำ balance, ledger, revision, alert และ activity ใน transaction เดียว
- ห้าม Admin ทำยอดต่ำกว่าศูนย์หรือเกิน capacity
- Report จากอุปกรณ์ไม่สร้างยอดติดลบ แต่สร้าง discrepancy alert เมื่อข้อมูลไม่สอดคล้อง
- Eligibility version เพิ่มหนึ่งครั้งต่อ transaction ที่เปลี่ยนรายการ active
- เลขบัตรตรวจ 13 หลักและ Thai checksum ก่อนเข้ารหัส
- เข้ารหัสเลขบัตรด้วย authenticated encryption และใช้ HMAC-SHA-256 แยกสำหรับ exact lookup/uniqueness
- หน้า Admin แสดงเลขบัตรแบบ masking; export เท่านั้นที่ถอดรหัสหลังตรวจ session
- Daily entitlement ตรวจจาก completed distribution ใน service day เดียวกันทั้งระบบ
- การแจกซ้ำจาก race/offline สามารถถูกบันทึกได้ตาม ADR แต่ dashboard นับ distinct recipient ต่อ service day

## 4. ลำดับการพัฒนา

### ระยะที่ 1: Foundation

- สร้าง Next.js application, TypeScript strict mode, Tailwind, lint/test/build scripts และ `.env.example`
- ตั้ง Drizzle schema, migrations และ PostgreSQL connection
- สร้าง domain enums, Zod schemas, Thai date formatter และ service-day utility
- สร้าง error format, trace ID, safe logging และ API response helpers
- สร้าง OpenAPI registry, JSON endpoint, Swagger UI และ typed client generation
- Gate: migration, typecheck, OpenAPI generation และ production build ผ่าน

### ระยะที่ 2: Authentication และ security boundary

- ติดตั้ง Auth.js Credentials/JWT session
- ทำ Admin login/logout, route protection และ server-side API guards
- เพิ่ม login rate limit, Origin validation และ no-store headers
- เพิ่ม encryption/HMAC utilities พร้อม startup validation ของ keys
- Gate: anonymous เข้า Admin/API ไม่ได้, login ถูก/ผิดทำงาน และ log ไม่มี credential/PII

### ระยะที่ 3: Dispenser, plan และ stock domain

- ทำ schema/service สำหรับ dispenser code allocation, channels, lifecycle และ service status
- ทำ immutable plan revisions และ service-day activation
- ทำ transactional stock ledger, revision และ alert lifecycle
- ทำ Admin REST endpoints และ activity diff
- ทำ image processing/upload/delete ผ่าน Vercel Blob
- Gate: สร้าง draft, publish, เปลี่ยน plan, refill/adjust และ archive ได้ตามกติกา

### ระยะที่ 4: Public website และ Admin UI

- แปลง Prototype 2 เป็น Next.js components โดยรักษาภาษาไทยและ responsive flow
- ทำ public list, search/filter, detail, image placeholder และ Leaflet map
- ทำ Admin dashboard shell, dispenser list/editor, stock dialog และ plan status
- ใช้ typed REST client และแสดง loading, empty, validation, unauthorized, conflict และ retry states
- Gate: E2E จาก login → draft → publish → เห็นใน public → เปิด detail/map ผ่าน

### ระยะที่ 5: Recipient และ CSV workflow

- ทำ validation, encryption, masking และ lookup
- ทำ CRUD/deactivate/hard-delete
- ทำ import preview เป็น persisted import session อายุ 24 ชั่วโมง
- Commit เฉพาะ valid rows และ revalidate ก่อน transaction
- ทำ invalid-row CSV และ protected exports
- เพิ่ม eligibility version หลัง mutation
- Gate: duplicate/checksum/error rows ถูกแยก, commit ซ้ำไม่สร้างข้อมูลซ้ำ และ public ไม่เห็น PII

### ระยะที่ 6: Dashboard, report และ retention

- ทำ summary cards, alert acknowledgement, chart filters และ activity page
- ทำ completed-recipient query แบบ distinct
- ทำ daily retention job ที่ idempotent:
  - aggregate distribution detail เกิน 180 วัน
  - ลบ detail หลัง aggregate สำเร็จ
  - ลบ activity เกินหนึ่งปี
  - ลบ import preview ที่หมดอายุ
- เรียก job ผ่าน protected Vercel Cron endpoint
- Gate: chart รองรับ empty/backfill state และ retention รันซ้ำได้โดยยอดไม่เพิ่มซ้ำ

### ระยะที่ 7: Device API และ simulator

- Implement shared-secret middleware และ device lookup
- Implement sync, snapshot, authorize และ idempotent report
- เพิ่ม revision/heartbeat/connectivity UI
- สร้าง CLI simulator ที่ตั้ง base URL, device code และ secret ผ่าน environment
- Simulator รองรับ boot sync, snapshot download/checksum, allow/deny, complete/partial/failed report, duplicate retry และ offline replay
- ปรับ `docs/DEVICE-API.md` ให้ตรง OpenAPI และเพิ่ม mapping guide สำหรับนำ payload ไปเชื่อม MicroPython เดิม
- Gate: simulator ทำ flow ครบและผลสะท้อนใน Admin/Public/stock/chart อย่างถูกต้อง

### ระยะที่ 8: Deploy และ hardening

- ตั้ง Neon, Vercel Blob, environment variables และ Vercel deployment
- รัน migration ก่อน production promotion
- เพิ่ม security headers, request size limit และ cache policy
- เพิ่ม structured PII-safe logs, error tracking และ health endpoint ที่ไม่เปิดข้อมูลภายใน
- จัดทำ README สำหรับ local setup, migration, deploy, Admin credential, simulator และ ESP32 configuration
- ทำ production smoke test ด้วยข้อมูลที่สร้างผ่าน Admin UI และลบข้อมูลทดสอบก่อนส่งมอบ

## 5. Test Plan และ Acceptance Criteria

### Unit tests

- Thai citizen ID format/checksum
- encryption round trip, HMAC lookup และ masking
- service-day calculation รอบเที่ยงคืน Bangkok
- bundle count จากช่อง enabled
- derived status และ manual override
- publish validation และ plan effective day
- stock boundary, revision และ alert transition
- completed/partial/failed report rules
- OpenAPI schemas serialize/parse payload ตัวอย่างได้

### Integration tests กับ PostgreSQL

- dispenser code ไม่ซ้ำเมื่อสร้างพร้อมกัน
- stock balance, movement, alert และ activity commit/rollback พร้อมกัน
- plan revision immutable และ version เพิ่มถูกต้อง
- recipient uniqueness จาก lookup hash
- CSV preview/commit/idempotency
- Device auth ถูก/ผิด
- Authorize allow/deny ทุก reason
- Report idempotency และ delayed offline report
- Snapshot headers, byte length, record count และ SHA-256
- Retention aggregation รันซ้ำได้
- Admin API ไม่มี session ถูกปฏิเสธ

### Contract tests

- OpenAPI lint ผ่าน
- ทุก operation มี security, request, success และ error response
- ตัวอย่างใน Device API ผ่าน schema validation
- Server response สำคัญถูก validate เทียบ OpenAPI ใน integration tests
- Generated TypeScript client ไม่มี uncommitted diff หลัง build

### E2E tests

- Public ค้นหา/กรองและเปิดรายละเอียดโดยไม่ login
- Admin login ผิด/ถูกและ logout
- สร้าง draft → เพิ่มพิกัด/ช่อง → publish → แสดง public
- Refill/adjust → bundle count และ alert เปลี่ยน
- Import recipients → preview → commit → export
- Simulator authorize → complete report → stock/chart/activity เปลี่ยน
- เครื่องไม่ส่ง heartbeatเกิน 20 นาทีแสดง offline เฉพาะ Admin
- Mobile public, tablet/desktop Admin และ keyboard navigation

### Security checks

- Public/OpenAPI ไม่มีเลขบัตร ชื่อผู้มีสิทธิ์ secret หรือ internal field
- CSV/export/API ที่อ่อนไหวใช้ no-store และ session guard
- Upload ปฏิเสธไฟล์เกินขนาดและไฟล์ปลอมชนิด
- Mutation ข้าม origin ถูกปฏิเสธ
- Error และ structured logs ผ่าน PII redaction
- Shared device secret ผิดไม่เปิดเผยว่ารหัสเครื่องมีจริงหรือไม่

## 6. สมมติฐานและขอบเขตที่ล็อกแล้ว

- เป็นโครงงานสาธิตที่ deploy และใช้งานได้จริงในขนาดเล็ก ไม่อ้าง high availability
- รองรับประมาณ 100 concurrent public visitors และผู้มีสิทธิ์เริ่มต้นไม่เกิน 1,000 คน
- ใช้ Vercel Hobby, Neon PostgreSQL และ Vercel Blob
- มี Admin เดียวจาก environment variables
- Auth.js routes ไม่รวมใน OpenAPI
- Public/Admin application API ทั้งหมดใช้ REST และรวมใน OpenAPI
- Device ใช้ shared secret เดียวตาม ADR เดิม
- Service day เริ่ม 00:00 น. ตาม Asia/Bangkok
- UI ภาษาไทย, light mode, Public mobile-first และ Admin responsive
- Prototype 2 เป็น visual reference เท่านั้น
- ไม่มี seed production data; Admin สร้างข้อมูลผ่าน UI
- ไม่แก้หรือ flash firmware, ไม่สั่งมอเตอร์/ประตูจากเว็บ และไม่สร้าง MicroPython adapter
- ส่งมอบ Device contract, OpenAPI, simulator และ integration guide เพื่อให้เชื่อม MicroPython ในขั้นถัดไป
