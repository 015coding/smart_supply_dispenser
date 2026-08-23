# พร้อมปัน — Device API Contract

## 1. ขอบเขต

Device API เป็น HTTPS interface ระหว่าง Next.js บน Vercel กับ MicroPython client ที่เตรียมไว้สำหรับ ESP32 ปัจจุบัน Contract ใช้สำหรับ simulator และ copy-ready overlay ใน v1 แต่ไม่มี remote motor dispense หรือ remote door unlock

Base path:

```text
https://<deployment-domain>/api/device/v1
```

## 2. Authentication

ทุก request ส่ง:

```http
Authorization: Bearer <DEVICE_SHARED_SECRET>
X-Device-Code: DSP-0001
Content-Type: application/json
```

- `DEVICE_SHARED_SECRET` เป็นค่าร่วมทุกเครื่องสำหรับโครงงาน
- Secret แยกจาก `ADMIN_PASSWORD_HASH` และ `AUTH_SECRET`
- Server เปรียบเทียบ secret แบบ constant-time
- Device code ต้องตรงกับเครื่องที่ published หรือเปิดให้ทดสอบใน Admin
- ไม่ส่ง secret หรือเลขบัตรใน URL/query string
- Error และ access logs ห้ามบันทึก Authorization header หรือเลขบัตรจาก body
- การตอบ authentication failure ใช้ `401` แบบข้อความกลาง ไม่บอกว่า code หรือ secret ผิด

## 3. Transport

- Production ใช้ HTTPS เท่านั้น
- Client เรียก HTTPS URL โดยตรงและไม่เริ่มจาก HTTP เพื่อหลีกเลี่ยง redirect/handshake เพิ่ม
- TLS client ต้องส่ง SNI และตรวจ certificate เมื่อ MicroPython build รองรับ
- Client ต้อง sync เวลาด้วย NTP ก่อนใช้ certificate validation
- Response สำหรับ snapshot ต้องมี `Content-Length` และไม่ใช้ chunked transfer
- Payload JSON ใช้ UTF-8 และชื่อ field แบบคงที่
- หาก hardware ใช้ TLS ไม่ได้ สามารถเพิ่ม local HTTP-to-HTTPS gateway ภายหลังโดยรักษา contract นี้

## 4. Sync cadence

- Sync เมื่อ boot หลัง clock พร้อม
- Sync ทุก 10 นาทีเมื่อว่าง
- Sync ก่อนเริ่มแจกหากครั้งล่าสุดเกิน 10 นาที
- `authorize`, `sync` และ `report` ทุก endpoint อัปเดต heartbeat
- Admin ถือว่า connectivity offline เมื่อไม่มี request สำเร็จเกิน 20 นาที
- Public ไม่แสดง connectivity และไม่เปลี่ยน service status ตาม heartbeat

## 5. Endpoints

### `POST /sync`

ใช้ส่ง heartbeat และขอสถานะที่เครื่องควรนำไปใช้

Request:

```json
{
  "firmware_version": "1.0.0",
  "client_version": "1.0.0",
  "clock_ready": true,
  "applied_plan_version": 3,
  "applied_eligibility_version": 8,
  "applied_stock_revision": 41,
  "local_stock": {
    "1": 10,
    "2": 10,
    "3": 9
  }
}
```

Response `200`:

```json
{
  "server_time": "2026-08-23T08:30:00Z",
  "service_day": "2026-08-23",
  "desired_plan": {
    "version": 3,
    "effective_service_day": "2026-08-23",
    "channels": [
      {"number": 1, "enabled": true, "count": 10},
      {"number": 2, "enabled": true, "count": 10},
      {"number": 3, "enabled": true, "count": 9}
    ]
  },
  "stock_revision": 41,
  "eligibility": {
    "version": 8,
    "changed": false,
    "snapshot_path": null
  }
}
```

หากรายชื่อเปลี่ยน `changed` เป็น `true` และ `snapshot_path` เป็น path ภายใน base API เครื่องจึงเรียก snapshot เพิ่มหนึ่งครั้ง

Admin adjustment แสดง `รอเครื่อง sync` จน request ถัดไปส่ง `applied_stock_revision` ที่ตรงกับ server

### `GET /eligibility-snapshot`

ตัวอย่าง:

```text
GET /api/device/v1/eligibility-snapshot?version=8
```

Response `200` เป็น `text/csv`:

```csv
citizen_id,name
0000000000000,
1111111111111,
```

Headers:

```http
Content-Type: text/csv; charset=utf-8
Content-Length: <bytes>
Cache-Control: no-store
X-Snapshot-Version: 8
X-Record-Count: 2
X-Content-SHA256: <hex digest>
```

Client อ่าน `response.raw` ทีละ chunk ลง `users.csv.tmp`, ตรวจ byte digest และจำนวน record แล้วจึง rename แทน `users.csv` หาก request ขาดหรือ checksum ผิดให้ลบไฟล์ชั่วคราวและใช้รายชื่อเดิม

Snapshot ส่งเฉพาะเลขบัตร ส่วน name เป็นค่าว่างเพื่อลดข้อมูลส่วนบุคคลบนเครื่อง

### `POST /authorize`

ใช้ตรวจสิทธิ์ส่วนกลางก่อนเริ่มแจกเมื่อ online โดยไม่มีการจองสิทธิ์

Request:

```json
{
  "citizen_id": "0000000000000",
  "service_day": "2026-08-23",
  "local_time": "2026-08-23T15:30:00"
}
```

Response allow `200`:

```json
{
  "allowed": true,
  "reason": "eligible",
  "service_day": "2026-08-23"
}
```

Response deny `200`:

```json
{
  "allowed": false,
  "reason": "already_received",
  "service_day": "2026-08-23"
}
```

Reason ที่อนุญาต:

- `eligible`
- `not_found`
- `deactivated`
- `already_received`
- `dispenser_unavailable`
- `plan_not_ready`

Server เข้ารหัส/ทำ keyed lookup ตาม schema และไม่เก็บ raw citizen ID ใน application logs หาก request ล้มเหลวหรือ timeout เครื่อง fallback ไปตรวจ `users.csv` และ `usage.csv` ของตนเอง

### `POST /report`

ส่งหนึ่งครั้งหลังจบรอบ ไม่ส่ง request แยกแต่ละมอเตอร์

Request:

```json
{
  "report_id": 18,
  "service_day": "2026-08-23",
  "local_time": "2026-08-23T15:31:05",
  "citizen_id": "0000000000000",
  "outcome": "complete",
  "channels": [
    {"number": 1, "result": "success", "count_after": 9},
    {"number": 2, "result": "success", "count_after": 9},
    {"number": 3, "result": "success", "count_after": 8}
  ],
  "errors": []
}
```

`outcome`:

- `complete` — จ่ายครบและสร้าง completed distribution record
- `partial` — มีบางช่องสำเร็จแต่ไม่ตัดสิทธิ์
- `failed` — ไม่มีการแจกสำเร็จ

Server ใช้ `(dispenser_id, report_id)` เป็น idempotency key หากได้รับซ้ำให้ตอบผลเดิมโดยไม่สร้าง movement หรือ completed record ซ้ำ

Response `200`:

```json
{
  "accepted": true,
  "duplicate": false,
  "stock_revision": 42,
  "reconciled_stock": {
    "1": 9,
    "2": 9,
    "3": 8
  }
}
```

หาก report ส่งไม่สำเร็จ client ใช้ `usage.csv` เป็นข้อมูล retry และเก็บ `last_synced_usage_row` ใน `sync_state.json` เมื่อ server acknowledge แล้วจึงเลื่อน offset

## 6. Response codes

- `200` — สำเร็จหรือคำตอบทางธุรกิจจาก authorize
- `400` — payload ไม่ถูกต้อง
- `401` — authentication ไม่ผ่าน
- `404` — ไม่พบเครื่องหรือ snapshot version
- `409` — revision conflict ที่ต้อง sync ใหม่
- `413` — payload ใหญ่เกิน
- `429` — request ถี่เกิน พร้อม `Retry-After`
- `500` — server error; client เก็บข้อมูลไว้ retry

Client retry เฉพาะ network error, `409`, `429` และ `5xx` โดยใช้ delay แบบจำกัด ไม่ loop รัวและไม่ขวาง relay fail-safe

## 7. Admin behavior

- Admin เห็น last seen, connectivity, applied plan/eligibility/stock revisions และ client version
- เครื่อง offline ยังคงใช้ plan และ eligibility snapshot ล่าสุด
- Admin เปลี่ยน plan แล้วเห็น `แผนยังไม่ sync` จน version ตรง
- Admin เติม/ปรับยอดแล้ว ledger และ public เปลี่ยนทันที ส่วน Admin เห็น `รอเครื่อง sync` จน revision ตรง
- Connectivity ไม่ถูกเผยแพร่หน้า public

## 8. Copy-ready MicroPython deliverable

ภายในโปรเจกต์เว็บจะมีโฟลเดอร์ `esp32_client/` ซึ่งประกอบด้วย:

- `web_sync_service.py` — HTTPS calls, streaming snapshot, sync state และ retry
- `settings.example.json` — ตัวอย่าง `api_base_url`, `device_code` และ shared secret
- `overlay/` — ไฟล์ที่ปรับจาก `main.py`, `controller.py` และ service ที่จำเป็นสำหรับ copy ทับโค้ดปัจจุบัน
- `README.md` — รายการไฟล์ วิธีสำรอง วิธี copy วิธีตั้งค่า และวิธีทดสอบ
- `simulator/` — script ฝั่งเครื่องจำลองที่ใช้ contract เดียวกัน

Overlay ต้องรักษา fail-safe เดิม: ปิด relay ตอน boot/exception, ไม่รอ network ระหว่างมอเตอร์กำลังทำงาน และ fallback offline เมื่อ request ล้มเหลว

## 9. Test scenarios

- Shared secret ถูก/ผิด
- Device code มี/ไม่มีในระบบ
- Sync version ตรงและไม่ตรง
- Snapshot สำเร็จ, ขาดกลางทาง และ checksum ผิด
- Authorize online allow/deny และ offline fallback
- Complete, partial และ failed report
- Retry report เดิมโดยไม่สร้างข้อมูลซ้ำ
- Admin stock revision รอ sync แล้วเปลี่ยนเป็น applied
- Heartbeat เกิน 20 นาทีแล้ว Admin แสดง offline
- Public ไม่เปลี่ยน service status เพียงเพราะ connectivity offline
