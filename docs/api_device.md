# พร้อมปัน — Device API Specification

> เวอร์ชันเอกสาร: 1.0
> ตรวจสอบกับ implementation: 24 สิงหาคม 2026
> API version: `v1`
> สถานะ: implemented prototype contract

เอกสารนี้อธิบาย HTTP contract ระหว่างเครื่องแจกสิ่งของ (ESP32/MicroPython หรือ simulator) กับเว็บ “พร้อมปัน” โดยอ้างอิง route, validation schema, authentication guard, store behavior และ OpenAPI ที่อยู่ใน repository ปัจจุบัน

คำว่า **ต้อง (MUST)** หมายถึงข้อกำหนดที่ client ต้องทำเพื่อให้ทำงานกับ API ปัจจุบัน ส่วน **ควร (SHOULD)** คือแนวทางที่แนะนำเพื่อให้ทนต่อ network failure และป้องกันข้อมูลซ้ำ

## 1. ภาพรวม

Base URL:

```text
https://<deployment-domain>/api/device/v1
```

สำหรับ local development:

```text
http://localhost:3000/api/device/v1
```

Endpoint ทั้งหมด:

| Method | Path | หน้าที่ | Idempotency |
|---|---|---|---|
| `POST` | `/sync` | ส่ง heartbeat/version ที่ apply แล้ว และรับ desired state | ส่งซ้ำได้ โดยค่าที่ส่งล่าสุดแทน device state เดิม |
| `GET` | `/eligibility-snapshot?version={n}` | ดาวน์โหลดรายชื่อ active แบบ CSV | เป็น safe/idempotent GET |
| `POST` | `/authorize` | ตรวจสิทธิ์ก่อนเริ่มจ่าย โดยไม่จองสิทธิ์ | ไม่เปลี่ยนสิทธิ์ จึงตรวจซ้ำได้ |
| `POST` | `/report` | รายงานผลหลังจบรอบและ reconcile stock | idempotent ด้วย `(device_code, report_id)` |

Device API ไม่มีคำสั่งสั่งหมุนมอเตอร์ ปลดล็อกประตู หรือควบคุม hardware จากระยะไกล เครื่องเป็นฝ่ายเริ่ม request ทุกครั้ง

## 2. Transport และรูปแบบข้อมูล

- Production ต้องเรียกผ่าน HTTPS โดยตรง
- JSON ใช้ UTF-8 และชื่อ field เป็น case-sensitive
- Request แบบ `POST` ควรส่ง `Content-Type: application/json`
- JSON success response ส่ง `Content-Type: application/json; charset=utf-8`
- ทุก response ที่สร้างโดย Device API กำหนด `Cache-Control: no-store, max-age=0`
- Timestamp จาก server เป็น UTC แบบ ISO 8601 เช่น `2026-08-23T08:30:00.000Z`
- `service_day` เป็นวันที่ปฏิบัติงานรูปแบบ `YYYY-MM-DD` ตาม timezone `Asia/Bangkok`
- ไม่มี CORS header สำหรับเรียกจาก browser ข้าม origin เพราะ API นี้ออกแบบให้เรียกจาก device/simulator โดยตรง
- ปัจจุบันไม่มี application-level rate limiter และไม่มี quota/rate-limit header

ตัวอย่างตัวแปรที่ใช้ในคำสั่งด้านล่าง:

```bash
export DEVICE_API_BASE_URL="https://example.com/api/device/v1"
export DEVICE_CODE="DSP-0001"
export DEVICE_SHARED_SECRET="replace-with-device-secret"
```

ห้าม commit secret จริงลง repository, firmware example, log หรือเอกสาร

## 3. Authentication

ทุก request ต้องส่ง header สองค่า:

```http
Authorization: Bearer <DEVICE_SHARED_SECRET>
X-Device-Code: DSP-0001
```

สำหรับ `POST` ให้ส่งเพิ่ม:

```http
Content-Type: application/json
```

### 3.1 กติกาการตรวจสอบ

1. `Authorization` ต้องขึ้นต้นด้วย `Bearer ` ตรงตามตัวพิมพ์
2. Token หลัง `Bearer ` ต้องตรงกับ environment variable `DEVICE_SHARED_SECRET`
3. `X-Device-Code` จะถูก trim และแปลงเป็นตัวพิมพ์ใหญ่ก่อน lookup
4. เครื่องต้องมีอยู่ในระบบและมีสถานะอย่างใดอย่างหนึ่ง:
   - `published`; หรือ
   - `draft` ที่เปิด `device_api_enabled_for_testing`
5. เครื่อง `archived`, draft ที่ไม่ได้เปิดทดสอบ, code ที่ไม่มีอยู่ และ secret ผิด จะได้คำตอบกลางแบบเดียวกัน

ตัวอย่าง authentication error:

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, max-age=0
X-Trace-Id: 49bcded7-f66b-4bf8-a74b-0dcdcd8fe44a
```

```json
{
  "type": "about:blank",
  "title": "Request Error",
  "status": 401,
  "code": "device_unauthorized",
  "detail": "อุปกรณ์ไม่ผ่านการยืนยันตัวตน",
  "trace_id": "49bcded7-f66b-4bf8-a74b-0dcdcd8fe44a"
}
```

Server ไม่บอกว่า secret, device code หรือ lifecycle ส่วนใดผิด เพื่อลดการเปิดเผยข้อมูล

### 3.2 Shared-secret model

prototype v1 ใช้ secret เดียวร่วมกันทุกเครื่อง หาก secret จากเครื่องใดรั่ว ต้องเปลี่ยน secret และอัปเดตทุกเครื่อง ไม่มี endpoint สำหรับออก token, refresh token หรือ rotate secret รายเครื่อง

## 4. Common error format

Error จาก application ใช้โครงสร้างต่อไปนี้:

```json
{
  "type": "about:blank",
  "title": "Request Error",
  "status": 422,
  "code": "validation_error",
  "detail": "ข้อมูลที่ส่งมาไม่ผ่านการตรวจสอบ",
  "field_errors": {
    "channels.0.number": "Number must be less than or equal to 3"
  },
  "trace_id": "3ac7f4b7-8935-437f-b92c-6d3880f94d2e"
}
```

| Field | Type | มีเสมอ | ความหมาย |
|---|---|---:|---|
| `type` | string | ใช่ | ปัจจุบันเป็น `about:blank` |
| `title` | string | ใช่ | `Request Error` สำหรับ 4xx หรือ `Internal Server Error` สำหรับ 5xx |
| `status` | integer | ใช่ | HTTP status เดียวกับ response |
| `code` | string | ใช่ | machine-readable error code |
| `detail` | string | ใช่ | รายละเอียดสำหรับผู้พัฒนา ปัจจุบันเป็นภาษาไทย |
| `field_errors` | object | ไม่ | map จาก field path ไปข้อความ validation |
| `trace_id` | UUID string | ใช่ | ใช้จับคู่ log ฝั่ง server โดยไม่ต้อง log payload อ่อนไหว |

`X-Trace-Id` ใน response header จะตรงกับ `trace_id` ใน body

### 4.1 Error code ที่ implementation ปัจจุบันสร้างได้

| HTTP | `code` | สาเหตุ | Client action |
|---:|---|---|---|
| `400` | `invalid_json` | body ไม่ใช่ JSON ที่ parse ได้ | แก้ serialization ไม่ควร retry payload เดิม |
| `400` | `invalid_snapshot_version` | query `version` หาย ไม่ใช่ integer หรือมีค่าน้อยกว่า 0 | เรียก `/sync` ใหม่เพื่อรับ version ล่าสุด |
| `401` | `device_unauthorized` | header/secret/code/lifecycle ไม่ผ่าน | หยุด retry และตรวจ configuration |
| `404` | `not_found` | snapshot version ไม่ตรงกับ version ปัจจุบัน | เรียก `/sync` แล้วดาวน์โหลด path ใหม่ |
| `422` | `validation_error` | JSON ถูกต้องแต่ field ไม่ผ่าน schema | แก้ payload ไม่ควร retry payload เดิม |
| `500` | `internal_error` | server error ที่ไม่ได้คาดไว้ | เก็บงานไว้และ retry ด้วย backoff |

หมายเหตุ: OpenAPI ปัจจุบันประกาศ `429` สำหรับ `/sync` และ `409` สำหรับ `/report` ไว้ล่วงหน้า แต่ route implementation ปัจจุบันยังไม่มี rate limiter หรือ branch ที่สร้างสอง status นี้ Client ควรรองรับไว้เพื่อ forward compatibility

## 5. `POST /sync`

ส่ง heartbeat, software version, revision ที่เครื่อง apply แล้ว และยอด stock ที่เครื่องถืออยู่ จากนั้นรับ desired plan, stock revision และ eligibility version ล่าสุด

### 5.1 Request

```http
POST /api/device/v1/sync HTTP/1.1
Authorization: Bearer <DEVICE_SHARED_SECRET>
X-Device-Code: DSP-0001
Content-Type: application/json
```

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

Request schema:

| Field | Type | Required | Validation | ความหมาย |
|---|---|---:|---|---|
| `firmware_version` | string | ใช่ | ยาวไม่เกิน 80 ตัวอักษร | เวอร์ชัน firmware หลัก |
| `client_version` | string | ใช่ | ยาวไม่เกิน 80 ตัวอักษร | เวอร์ชัน Device API client/overlay |
| `clock_ready` | boolean | ใช่ | ต้องเป็น JSON boolean | เครื่อง sync นาฬิกาแล้วหรือไม่ |
| `applied_plan_version` | integer หรือ `null` | ใช่ | ต้องเป็น integer เมื่อไม่ใช่ null | plan ที่เครื่อง apply สำเร็จ; `null` เมื่อยังไม่มี |
| `applied_eligibility_version` | integer | ใช่ | `>= 0` | snapshot ที่สลับใช้งานสำเร็จแล้ว |
| `applied_stock_revision` | integer | ใช่ | `>= 0` | stock revision ส่วนกลางล่าสุดที่เครื่อง acknowledge |
| `local_stock` | object | ใช่ | key เป็น string; value เป็น integer `>= 0` | ยอดที่เครื่องเห็น แนะนำ key `"1"` ถึง `"3"` |

Device schema ไม่ coerce string เป็น number ดังนั้น `"41"` ใช้แทน `41` ไม่ได้ Unknown fields จะถูกตัดทิ้งโดย validation schema

ตัวอย่าง cURL:

```bash
curl --fail-with-body \
  -X POST "$DEVICE_API_BASE_URL/sync" \
  -H "Authorization: Bearer $DEVICE_SHARED_SECRET" \
  -H "X-Device-Code: $DEVICE_CODE" \
  -H "Content-Type: application/json" \
  --data '{
    "firmware_version":"1.0.0",
    "client_version":"1.0.0",
    "clock_ready":true,
    "applied_plan_version":3,
    "applied_eligibility_version":8,
    "applied_stock_revision":41,
    "local_stock":{"1":10,"2":10,"3":9}
  }'
```

### 5.2 Success response

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, max-age=0
```

```json
{
  "server_time": "2026-08-23T08:30:00.000Z",
  "service_day": "2026-08-23",
  "desired_plan": {
    "version": 3,
    "effectiveServiceDay": "2026-08-23",
    "channels": [
      { "number": 1, "enabled": true, "count": 10 },
      { "number": 2, "enabled": true, "count": 10 },
      { "number": 3, "enabled": true, "count": 9 }
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

Response schema:

| Field | Type | ความหมาย |
|---|---|---|
| `server_time` | ISO 8601 string | เวลาปัจจุบันของ server เป็น UTC |
| `service_day` | `YYYY-MM-DD` | วันให้บริการปัจจุบันใน `Asia/Bangkok` |
| `desired_plan` | object หรือ `null` | plan revision ล่าสุด; null เมื่อยังไม่มี plan |
| `desired_plan.version` | integer | plan version ที่ server ต้องการให้เครื่องใช้ |
| `desired_plan.effectiveServiceDay` | string | วันเริ่มมีผลของ plan |
| `desired_plan.channels` | array | ช่องใน plan revision |
| `desired_plan.channels[].number` | integer | หมายเลขช่อง |
| `desired_plan.channels[].enabled` | boolean | ช่องนี้อยู่ในชุดแจกหรือไม่ |
| `desired_plan.channels[].count` | integer | ยอดคงเหลือจาก central stock ledger ของช่องนั้น |
| `stock_revision` | integer | revision ล่าสุดของ central stock ledger |
| `eligibility.version` | integer | eligibility snapshot version ล่าสุด |
| `eligibility.changed` | boolean | true เมื่อ version ที่ device apply ไม่เท่ากับ server |
| `eligibility.snapshot_path` | string หรือ `null` | relative path สำหรับดาวน์โหลด snapshot; null เมื่อไม่เปลี่ยน |

> **Wire-format exception:** implementation ปัจจุบันส่ง `desired_plan.effectiveServiceDay` เป็น camelCase จริง ไม่ใช่ `effective_service_day` ตามเอกสาร contract เก่า Client ต้องอ่านชื่อ field ตามตารางนี้จนกว่าจะมีการแก้ API แบบมี migration plan

เมื่อ version ไม่ตรง ตัวอย่าง `eligibility` จะเป็น:

```json
{
  "version": 9,
  "changed": true,
  "snapshot_path": "/api/device/v1/eligibility-snapshot?version=9"
}
```

### 5.3 Server-side effects

- อัปเดต `lastSeenAt`
- บันทึก `firmwareVersion` และ `clientVersion` หลัง trim; string ว่างจะถูกเก็บเป็น null
- แทนค่า applied plan/eligibility/stock revision ด้วยค่าจาก request
- ไม่เปลี่ยน central stock balance
- ใน implementation ปัจจุบัน `clock_ready` และ `local_stock` ผ่าน validation แต่ยังไม่ถูกใช้ reconcile หรือบันทึก
- `desired_plan` เลือก plan ที่มี version สูงสุด แม้ effective day อยู่ในอนาคต

### 5.4 Errors

`400 invalid_json`, `401 device_unauthorized`, `422 validation_error`, `500 internal_error` และอาจรองรับ `429` ในอนาคต

## 6. `GET /eligibility-snapshot`

ดาวน์โหลดรายชื่อผู้มีสิทธิ์ active ทั้งหมดของ version ปัจจุบันเป็น CSV หนึ่ง response เพื่อเขียนลงไฟล์ชั่วคราวและสลับใช้งานแบบ atomic

### 6.1 Request

```http
GET /api/device/v1/eligibility-snapshot?version=8 HTTP/1.1
Authorization: Bearer <DEVICE_SHARED_SECRET>
X-Device-Code: DSP-0001
```

Query parameter:

| Parameter | Type | Required | Validation |
|---|---|---:|---|
| `version` | integer | ใช่ | `>= 0` และต้องเท่ากับ eligibility version ปัจจุบัน |

ตัวอย่าง cURL ที่เก็บทั้งไฟล์และ header:

```bash
curl --fail-with-body \
  "$DEVICE_API_BASE_URL/eligibility-snapshot?version=8" \
  -H "Authorization: Bearer $DEVICE_SHARED_SECRET" \
  -H "X-Device-Code: $DEVICE_CODE" \
  --dump-header snapshot.headers \
  --output users.csv.tmp
```

### 6.2 Success response

```http
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Length: <byte-length>
Cache-Control: no-store, max-age=0
X-Snapshot-Version: 8
X-Record-Count: 2
X-Content-SHA256: <64-character-lowercase-hex>
```

```csv
citizen_id,name
1101700201601,คุณสายฝน
1234567890123,ตัวอย่างผู้มีสิทธิ์
```

Header semantics:

| Header | ความหมาย |
|---|---|
| `Content-Length` | จำนวน byte ของ UTF-8 body ทั้งหมด |
| `X-Snapshot-Version` | version ที่อยู่ในไฟล์ |
| `X-Record-Count` | จำนวน data rows ไม่รวม header |
| `X-Content-SHA256` | SHA-256 ของ body bytes ทั้งหมด รวม header, comma และ newline |

CSV behavior:

- บรรทัดแรกเป็น `citizen_id,name`
- มีเฉพาะ recipient ที่ `active=true`
- ปัจจุบันส่งทั้งเลขบัตรที่ถอดรหัสแล้วและชื่อ
- Field ที่มี comma, quote หรือ newline จะถูก quote ตามกติกา CSV และ quote ภายในจะถูกซ้ำเป็น `""`
- หากมีข้อมูลอย่างน้อยหนึ่งแถว ไฟล์ลงท้ายด้วย newline
- หากไม่มีข้อมูล body คือ `citizen_id,name\n`, record count เป็น `0`
- ลำดับปัจจุบันเรียงตาม internal recipient UUID ไม่รับประกันว่าเรียงตามเลขบัตรหรือชื่อ
- ไม่มี pagination, range request หรือ conditional GET

> **Privacy note:** Project specification เดิมระบุว่า `name` ควรเป็นค่าว่าง แต่ implementation และ test ปัจจุบันส่งชื่อจริง Client ต้องรองรับคอลัมน์นี้ แต่ deployment ที่ต้องลด PII บน device ควรแก้ server contract ก่อนใช้งานจริง

### 6.3 Atomic apply procedure

Client ควรทำตามลำดับนี้:

1. ดาวน์โหลดลง `users.csv.tmp` แบบ streaming ห้ามทับ `users.csv` โดยตรง
2. นับ byte ระหว่างเขียนและเทียบ `Content-Length`
3. คำนวณ SHA-256 จาก byte เดียวกับที่เขียน และเทียบ `X-Content-SHA256`
4. parse header และนับ data rows เทียบ `X-Record-Count`
5. ตรวจ `X-Snapshot-Version` ว่าตรงกับ version ที่ร้องขอ
6. flush/close ไฟล์ชั่วคราว
7. rename แบบ atomic ให้แทน `users.csv`
8. หลัง rename สำเร็จเท่านั้น จึงบันทึก `applied_eligibility_version`
9. หากขั้นตอนไหนล้มเหลว ให้ลบไฟล์ชั่วคราวและใช้ snapshot เก่าต่อ

### 6.4 Errors

- `400 invalid_snapshot_version` — version หาย, ไม่ใช่ integer หรือ `< 0`
- `401 device_unauthorized` — authentication/lifecycle ไม่ผ่าน
- `404 not_found` — version ไม่ตรงกับ version ปัจจุบัน ให้ `/sync` ใหม่
- `500 internal_error` — server error

## 7. `POST /authorize`

ตรวจว่าบุคคลมีสิทธิ์เริ่มรอบแจกหรือไม่เมื่อเครื่อง online Endpoint นี้ **ไม่จองสิทธิ์และไม่ตัดสิทธิ์** สิทธิ์จะถูกใช้เมื่อ server รับ `/report` ที่ `outcome="complete"`

### 7.1 Request

```json
{
  "citizen_id": "1101700201601",
  "service_day": "2026-08-23",
  "local_time": "2026-08-23T15:30:00+07:00"
}
```

| Field | Type | Required | Validation | ความหมาย |
|---|---|---:|---|---|
| `citizen_id` | string | ใช่ | ความยาว 13–20 ตัวอักษร | เลขประจำตัว; server ลบ space และ `-` ก่อน keyed lookup |
| `service_day` | string | ใช่ | ต้องตรง regex `YYYY-MM-DD` | วันที่ที่เครื่องใช้ตัดสิทธิ์รายวัน |
| `local_time` | string | ใช่ | ยาวไม่เกิน 80 ตัวอักษร | เวลาท้องถิ่นจากเครื่อง; ปัจจุบันไม่ validate รูปแบบและไม่ใช้ตัดสินสิทธิ์ |

Schema ของ Device API ไม่ตรวจ checksum เลขบัตรโดยตรง แต่ lookup จะพบได้เฉพาะเลขที่ Admin นำเข้า/สร้างผ่าน validation แล้ว

ตัวอย่าง cURL:

```bash
curl --fail-with-body \
  -X POST "$DEVICE_API_BASE_URL/authorize" \
  -H "Authorization: Bearer $DEVICE_SHARED_SECRET" \
  -H "X-Device-Code: $DEVICE_CODE" \
  -H "Content-Type: application/json" \
  --data '{
    "citizen_id":"1101700201601",
    "service_day":"2026-08-23",
    "local_time":"2026-08-23T15:30:00+07:00"
  }'
```

### 7.2 Success responses

อนุญาต:

```json
{
  "allowed": true,
  "reason": "eligible",
  "service_day": "2026-08-23"
}
```

ไม่อนุญาตยังคงเป็น HTTP `200` เพราะเป็นผลทางธุรกิจ ไม่ใช่ protocol error:

```json
{
  "allowed": false,
  "reason": "already_received",
  "service_day": "2026-08-23"
}
```

Reason enum:

| `reason` | `allowed` | ความหมาย | Device action |
|---|---:|---|---|
| `eligible` | true | พบ active recipient, เครื่องพร้อม, plan พร้อม และยังไม่รับครบในวันนั้น | เริ่มรอบแจก |
| `not_found` | false | ไม่พบ keyed lookup ของเลขนี้ | ปฏิเสธ หรือใช้ offline policy เฉพาะเมื่อ request ล้มเหลวจริง |
| `deactivated` | false | recipient ถูกปิดสิทธิ์ | ปฏิเสธ |
| `dispenser_unavailable` | false | เครื่องไม่ published หรือ service status ไม่ available | ห้ามเริ่มแจก |
| `plan_not_ready` | false | ไม่มี plan ที่ effective ไม่เกิน service day | ห้ามเริ่มแจกและ sync/admin check |
| `already_received` | false | มี completed distribution ของเลขนี้ใน service day เดียวกันแล้ว | ปฏิเสธ |

ลำดับการตัดสินปัจจุบันคือ `not_found` → `deactivated` → `dispenser_unavailable` → `plan_not_ready` → `already_received` → `eligible` ดังนั้น response แสดงสาเหตุแรกที่พบเท่านั้น

หาก `service_day` ตรงรูปแบบแต่ไม่ใช่วันที่จริง เช่น `2026-99-99` schema จะรับผ่าน regex แต่ business logic จะเปลี่ยนเป็น service day ปัจจุบันของ server และคืนค่าที่ใช้จริงใน response Client ต้องใช้ `service_day` จาก response ต่อไป

### 7.3 Concurrency และ offline semantics

- `/authorize` ไม่สร้าง reservation จึงมีโอกาสที่เลขเดียวกันผ่านพร้อมกันที่สองเครื่อง
- เมื่อ network timeout หรือเชื่อมต่อไม่ได้ เครื่องอาจ fallback ไป `users.csv` และ `usage.csv` ตามนโยบาย best effort
- เมื่อ server ตอบ `200` และ `allowed=false` ไม่ถือเป็น network failure และไม่ควร override ด้วย offline allow
- การจ่ายบางส่วนไม่ตัดสิทธิ์ ผู้รับยังอาจไปรับชุดเต็มจากเครื่องอื่นได้

### 7.4 Errors

`400 invalid_json`, `401 device_unauthorized`, `422 validation_error`, `500 internal_error`

## 8. `POST /report`

ส่งผลหนึ่งครั้งหลังรอบแจกจบ โดยรวมผลทุกช่อง, ยอดหลังจ่าย และ error ของ hardware ไว้ใน request เดียว

### 8.1 Request

```json
{
  "report_id": 18,
  "service_day": "2026-08-23",
  "local_time": "2026-08-23T15:31:05+07:00",
  "citizen_id": "1101700201601",
  "outcome": "complete",
  "channels": [
    { "number": 1, "result": "success", "count_after": 9 },
    { "number": 2, "result": "success", "count_after": 9 },
    { "number": 3, "result": "success", "count_after": 8 }
  ],
  "errors": []
}
```

Top-level fields:

| Field | Type | Required | Validation | ความหมาย |
|---|---|---:|---|---|
| `report_id` | integer | ใช่ | `>= 0` | running ID ที่ห้าม reuse ภายในเครื่องเดียวกัน |
| `service_day` | string | ใช่ | regex `YYYY-MM-DD` | วันที่เกิดการแจก รวมกรณีส่งย้อนหลัง |
| `local_time` | string | ใช่ | ยาวไม่เกิน 80 | เวลาที่เครื่องบันทึก |
| `citizen_id` | string | ใช่ | ความยาว 13–20 | ใช้สร้าง keyed hash; raw ID ไม่ถูกเก็บใน report |
| `outcome` | enum | ใช่ | `complete`, `partial`, `failed` | ผลรวมของรอบ |
| `channels` | array | ใช่ | 0–3 รายการ | ผลรายช่อง |
| `errors` | string array | ไม่ | ไม่เกิน 20 รายการ; รายการละไม่เกิน 500 ตัวอักษร | diagnostic ที่ไม่ควรมี secret/PII; default `[]` |

`channels[]`:

| Field | Type | Required | Validation | ความหมาย |
|---|---|---:|---|---|
| `number` | integer | ใช่ | 1–3 | หมายเลขช่อง |
| `result` | enum | ใช่ | `success` หรือ `failed` | ผลการทำงานของช่อง |
| `count_after` | integer | ใช่ | `>= 0` | ยอดที่ device วัดหลังรอบ ใช้ตรวจ discrepancy |

Client ต้องส่งหมายเลขแต่ละ channel ไม่เกินหนึ่งครั้งต่อ report ปัจจุบัน schema ยังไม่ตรวจ duplicate channel number และรายการซ้ำอาจทำให้ central stock ถูกลดซ้ำ

Outcome semantics:

| `outcome` | ตัดสิทธิ์รายวัน | ผลต่อ stock |
|---|---:|---|
| `complete` | ใช่ | ลด 1 สำหรับทุก channel item ที่ `result=success` |
| `partial` | ไม่ | ลด 1 เฉพาะ channel ที่ `result=success` |
| `failed` | ไม่ | implementation ยังลด stock หาก payload มี channel `result=success`; client จึงต้องส่งผลให้สอดคล้องกับ outcome |

Client ต้องตั้ง `complete` เฉพาะเมื่อจ่ายครบตาม plan จริง เพราะ server ปัจจุบันสร้าง completed distribution จากค่า outcome โดยไม่ได้ cross-check ว่าทุก channel สำเร็จ

ตัวอย่าง cURL:

```bash
curl --fail-with-body \
  -X POST "$DEVICE_API_BASE_URL/report" \
  -H "Authorization: Bearer $DEVICE_SHARED_SECRET" \
  -H "X-Device-Code: $DEVICE_CODE" \
  -H "Content-Type: application/json" \
  --data '{
    "report_id":18,
    "service_day":"2026-08-23",
    "local_time":"2026-08-23T15:31:05+07:00",
    "citizen_id":"1101700201601",
    "outcome":"complete",
    "channels":[
      {"number":1,"result":"success","count_after":9},
      {"number":2,"result":"success","count_after":9},
      {"number":3,"result":"success","count_after":8}
    ],
    "errors":[]
  }'
```

### 8.2 Success response

ครั้งแรก:

```json
{
  "accepted": true,
  "duplicate": false,
  "stock_revision": 44,
  "reconciled_stock": {
    "1": 9,
    "2": 9,
    "3": 8
  }
}
```

เมื่อ retry `report_id` เดิม:

```json
{
  "accepted": true,
  "duplicate": true,
  "stock_revision": 44,
  "reconciled_stock": {
    "1": 9,
    "2": 9,
    "3": 8
  }
}
```

| Field | Type | ความหมาย |
|---|---|---|
| `accepted` | boolean | เป็น true สำหรับ report ที่ตอบ 200 |
| `duplicate` | boolean | true เมื่อ key `(device_code, report_id)` เคยรับแล้ว |
| `stock_revision` | integer | revision หลังประมวลผล report เดิมครั้งแรก |
| `reconciled_stock` | object | central balance ของ channel ที่ request ระบุและมีอยู่ในเครื่อง |

### 8.3 Idempotency contract

- Idempotency key คือ `(X-Device-Code, report_id)`
- `report_id` เดียวกันใช้ซ้ำได้ระหว่างคนละเครื่อง
- เมื่อ key ซ้ำ server คืนผลเดิมและเปลี่ยน `duplicate` เป็น true
- Duplicate ไม่สร้าง stock movement, completed distribution, alert หรือ activity ซ้ำ
- หาก retry ด้วย `report_id` เดิมแต่ payload ต่างจากครั้งแรก server ปัจจุบันยังคืนผลครั้งแรกโดยไม่แจ้ง conflict ดังนั้น client ต้อง persist payload เดิมและส่ง byte-equivalent business data
- Device ต้องเก็บ report ที่ยังไม่ได้ acknowledge ใน durable queue ก่อนส่ง
- เลื่อน queue offset หรือลบรายการได้เมื่อได้รับ HTTP `200` และ `accepted=true` เท่านั้น

### 8.4 Stock reconciliation behavior

สำหรับ channel ที่ `result=success` server ปัจจุบัน:

1. อ่าน central balance ก่อนหน้า
2. คำนวณ `central_after = max(0, balance_before - 1)`
3. เพิ่ม `stock_revision` หนึ่งครั้งต่อ successful channel
4. สร้าง distribution stock movement `delta=-1`
5. เปรียบเทียบ `count_after` กับ `central_after`
6. สร้าง/อัปเดต discrepancy alert หากยอดไม่ตรง หรือ central balance ก่อนหน้ามีค่า `<= 0`

สำหรับ `result=failed` central balance ไม่ลด แต่ค่าปัจจุบันจะอยู่ใน `reconciled_stock`

หลังรับ response Device ควรใช้ `reconciled_stock` เป็นฐานใหม่ แทนการยืนยันว่าค่า local ของตนถูกต้องเสมอ

> Implementation ปัจจุบันลด 1 ต่อ successful channel และยังไม่ใช้ `quantity_per_bundle` จาก plan ในการคำนวณ stock

### 8.5 Privacy และ side effects

- Server normalize `citizen_id` แล้วเก็บเฉพาะ HMAC lookup hash ใน report/completed record
- `outcome=complete` สร้าง completed distribution และทำให้ `/authorize` ครั้งถัดไปของเลขเดียวกัน/service day เดียวกันตอบ `already_received`
- `partial` และ `failed` ไม่สร้าง completed distribution
- อัปเดต `lastReportedAt`, heartbeat, alert และ activity log
- `service_day` ใน report ตรวจเพียงรูปแบบ regex ปัจจุบันยังไม่ตรวจว่าเป็นวันที่ปฏิทินจริง

### 8.6 Errors

`400 invalid_json`, `401 device_unauthorized`, `422 validation_error`, `500 internal_error` และควรรองรับ `409` ในอนาคต

## 9. Recommended device workflow

### 9.1 Boot

1. ตั้ง relay ทุกตัวเป็น OFF ตาม fail-safe
2. โหลด `settings.json`, `sync_state.json`, snapshot และ report queue เดิม
3. เชื่อม Wi-Fi
4. sync NTP ก่อนตรวจ TLS certificate หาก platform ต้องมีเวลาถูกต้อง
5. เรียก `/sync`
6. ถ้า eligibility เปลี่ยน ดาวน์โหลดและ apply snapshot แบบ atomic
7. apply desired plan/central stock เฉพาะเมื่อเขียน state สำเร็จ
8. ส่ง `/sync` รอบถัดไปพร้อม applied revision ใหม่
9. retry report ที่ค้างตามลำดับ โดยไม่ block relay fail-safe

### 9.2 ก่อนแจก

1. หาก sync ล่าสุดเกิน 10 นาที ให้ลอง `/sync`
2. อ่านและ normalize เลขประจำตัว
3. เมื่อ online เรียก `/authorize`
4. เริ่มจ่ายเฉพาะ `allowed=true`
5. ถ้า network request ล้มเหลวจริง ใช้ offline snapshot/usage policy
6. ห้าม fallback เมื่อ server ตอบ business denial (`allowed=false`)

### 9.3 หลังจบรอบ

1. ปิด relay และสรุปผลราย channel
2. สร้าง `report_id` ใหม่ที่ไม่เคยใช้กับ device นี้
3. เขียน report ลง durable queue ก่อนส่ง
4. เรียก `/report` หนึ่งครั้งต่อรอบ ไม่เรียกแยกมอเตอร์
5. เมื่อ 200/accepted ให้นำ `reconciled_stock` ไปใช้และ mark queue item ว่า acknowledged
6. หาก timeout ห้ามสร้าง `report_id` ใหม่ ให้ retry ID และ payload เดิม

## 10. Sync cadence และ connectivity

ค่าที่แนะนำสำหรับ client:

- sync หลัง boot เมื่อ clock/network พร้อม
- sync ทุก 10 นาทีเมื่อเครื่องว่าง
- sync ก่อนแจก หาก successful sync ล่าสุดเกิน 10 นาที
- report queue retry เมื่อ network กลับมา
- ห้ามรอ network แบบ blocking ระหว่าง motor/relay operation

ทุก request ที่ authentication ผ่านจะอัปเดต heartbeat ตั้งแต่ก่อน validate payload ดังนั้น request ที่ JSON ผิดแต่ auth ถูกยังทำให้ Admin เห็น `last seen` ใหม่ได้

Admin ถือว่าเครื่อง online เมื่อ `lastSeenAt` ไม่เกิน 20 นาที และ offline เมื่อเกิน 20 นาที Connectivity นี้ไม่ถูกแสดงใน public page และไม่เปลี่ยน service status อัตโนมัติ

## 11. Retry policy

| ผลลัพธ์ | Retry? | แนวทาง |
|---|---:|---|
| DNS/TLS/connect timeout | ใช่ | exponential backoff และ jitter; ใช้ offline flow ตามชนิดงาน |
| Connection reset/response ขาด | ใช่ | snapshot ทิ้ง `.tmp`; report ใช้ ID เดิม |
| `200` | ไม่ | ประมวลผล response; authorize denial เป็นผลสำเร็จทาง protocol |
| `400` | ไม่ | payload/client bug หรือ snapshot version query ผิด; sync ใหม่เฉพาะ snapshot |
| `401` | ไม่ | configuration/provisioning error |
| `404` snapshot | หลัง sync | version เปลี่ยนระหว่างทาง ให้ sync แล้วใช้ path ใหม่ |
| `409` | หลัง sync | รองรับอนาคต: sync state ก่อน retry |
| `422` | ไม่ | validation/client bug |
| `429` | ใช่ | เคารพ `Retry-After` หากมี |
| `500–599` | ใช่ | capped exponential backoff |

ตัวอย่าง delay: `1s, 2s, 4s, 8s, 16s, 30s` พร้อม random jitter และ reset หลัง request สำเร็จ ไม่ควร loop ถี่โดยไม่มีเพดาน

Timeout ควรแยก connect/read และกำหนดให้เหมาะกับ hardware การ timeout ของ `/report` หมายถึง “ไม่ทราบว่า server รับแล้วหรือไม่” จึงต้อง retry ด้วย report ID เดิม

## 12. Suggested durable client state

ตัวอย่าง `sync_state.json`:

```json
{
  "applied_plan_version": 3,
  "applied_eligibility_version": 8,
  "applied_stock_revision": 44,
  "next_report_id": 19,
  "last_successful_sync": "2026-08-23T15:35:00+07:00",
  "last_synced_usage_row": 18
}
```

กติกา:

- เขียนผ่าน temporary file แล้ว rename เพื่อลดไฟล์เสียเมื่อไฟดับ
- `next_report_id` ต้องเพิ่มแบบ durable ก่อนเริ่มใช้ ID ใหม่
- applied version เปลี่ยนหลัง apply ข้อมูลสำเร็จเท่านั้น ไม่ใช่หลังดาวน์โหลดเริ่มต้น
- ห้ามเก็บ `DEVICE_SHARED_SECRET` ใน log หรือรวมใน diagnostic upload
- หากเก็บชื่อจาก snapshot ต้องถือว่าไฟล์เป็น PII และจำกัดการเข้าถึง/การ copy

## 13. Security requirements

- ใช้ HTTPS และ certificate validation ใน production
- ส่ง SNI เมื่อ TLS stack รองรับ
- sync เวลาให้ถูกต้องก่อน certificate validation
- ห้ามส่ง secret หรือเลขบัตรใน URL/query string
- ห้าม log `Authorization`, raw `citizen_id`, snapshot body หรือ report body ทั้งก้อน
- log ได้เฉพาะ device code, endpoint, status, trace ID, report ID และ revision ที่ไม่ใช่ PII
- อย่าใช้ admin password หรือ `AUTH_SECRET` แทน `DEVICE_SHARED_SECRET`
- Provision secret ผ่านช่องทางแยกจาก firmware source หากทำได้
- เมื่อสงสัยว่า secret รั่ว ต้อง rotate ทุกเครื่องใน prototype shared-secret model
- Snapshot และ offline usage เป็นข้อมูลอ่อนไหว ควรลบอย่างปลอดภัยเมื่อเลิกใช้งานเครื่อง

## 14. Current implementation constraints

ส่วนนี้สำคัญสำหรับการ integration กับ code ใน repository ณ วันที่เอกสารนี้ตรวจสอบ:

1. Application store ปัจจุบันเป็น in-memory `MemoryStore` การ restart process ทำให้ state, report idempotency records และ eligibility version กลับค่าเริ่มต้น จึงยังไม่ใช่ durable production backend
2. `sync.local_stock` และ `sync.clock_ready` validate ได้แต่ยังไม่ถูกใช้
3. Sync ส่ง `effectiveServiceDay` แบบ camelCase
4. Snapshot ปัจจุบันมีชื่อจริง แม้ project specification เดิมต้องการ name ว่าง
5. Report ลด stock ครั้งละ 1 ต่อ successful channel โดยยังไม่ใช้ `quantity_per_bundle`
6. `complete` เชื่อค่า outcome จาก client และยังไม่ cross-check ความสำเร็จทุกช่อง
7. Duplicate report ที่ payload ต่างกันยังตอบผลเดิม ไม่มี `409 idempotency_conflict`
8. Device endpoints ยังไม่มี application rate limiting หรือ `Retry-After`
9. Error body ปัจจุบันส่ง `Content-Type: application/json; charset=utf-8` แม้ OpenAPI อธิบายเป็น `application/problem+json`
10. OpenAPI มี request schemas แต่ success response ของ Device endpoints บางส่วนยังระบุไม่ละเอียดเท่าเอกสารนี้

ข้อจำกัดเหล่านี้ไม่ควรถูกแก้แบบ breaking change โดยไม่เพิ่ม regression tests, อัปเดต OpenAPI และประกาศ migration ให้ client

## 15. Integration test checklist

### Authentication

- [ ] secret และ device code ถูกต้อง
- [ ] secret ผิดได้ `401 device_unauthorized`
- [ ] code ไม่มีอยู่ได้ `401` แบบข้อความเดียวกัน
- [ ] draft ปิด testing ได้ `401`
- [ ] draft เปิด testing เรียกได้
- [ ] archived ได้ `401`

### Sync

- [ ] applied version ตรง → `eligibility.changed=false`
- [ ] applied version ต่าง → ได้ `snapshot_path`
- [ ] ไม่มี plan → `desired_plan=null`
- [ ] firmware/client version ปรากฏใน Admin device state
- [ ] schema ไม่รับ numeric string

### Snapshot

- [ ] version ตรง ดาวน์โหลดสำเร็จ
- [ ] version เก่าได้ `404` แล้ว client sync ใหม่
- [ ] ตรวจ Content-Length, row count และ SHA-256 ผ่าน
- [ ] ตัด connection กลางทางแล้ว snapshot เดิมยังอยู่
- [ ] CSV ที่ชื่อมี comma/quote/newline parse ได้
- [ ] snapshot ว่างมีเพียง header

### Authorization

- [ ] active recipient ได้ `eligible`
- [ ] ไม่พบได้ `not_found`
- [ ] deactivated ได้ `deactivated`
- [ ] stock/override ไม่พร้อมได้ `dispenser_unavailable`
- [ ] ไม่มี effective plan ได้ `plan_not_ready`
- [ ] complete แล้วได้ `already_received`
- [ ] partial/failed แล้วยังไม่ถูกตัดสิทธิ์

### Report

- [ ] complete สร้าง completed distribution
- [ ] partial ไม่สร้าง completed distribution
- [ ] successful channel ลด stock และเพิ่ม revision
- [ ] failed channel ไม่ลด stock
- [ ] count mismatch สร้าง discrepancy alert
- [ ] retry ID เดิมได้ `duplicate=true` และไม่ลด stock ซ้ำ
- [ ] timeout แล้ว client retry payload/ID เดิม
- [ ] offline queue ส่งย้อนหลังด้วย service day เดิม

## 16. Related artifacts

- Interactive API docs: `/api-docs`
- OpenAPI JSON: `/api/openapi.json`
- Generated snapshot: [`../public/openapi.json`](../public/openapi.json)
- Existing high-level contract: [`DEVICE-API.md`](./DEVICE-API.md)
- Project specification: [`PROJECT-SPEC.md`](./PROJECT-SPEC.md)
- Offline policy: [`adr/0001-continue-dispensing-while-offline.md`](./adr/0001-continue-dispensing-while-offline.md)
- Best-effort entitlement: [`adr/0004-use-best-effort-entitlement-enforcement.md`](./adr/0004-use-best-effort-entitlement-enforcement.md)
- Minimal HTTPS sync: [`adr/0008-use-minimal-direct-https-device-sync.md`](./adr/0008-use-minimal-direct-https-device-sync.md)
- Shared secret decision: [`adr/0009-use-one-shared-device-secret.md`](./adr/0009-use-one-shared-device-secret.md)
- Central stock ledger: [`adr/0010-use-web-stock-ledger-as-source-of-truth.md`](./adr/0010-use-web-stock-ledger-as-source-of-truth.md)

เมื่อ contract เปลี่ยน ต้องอัปเดต route/schema, `src/lib/openapi.ts`, generate `public/openapi.json`, เอกสารนี้ และ client/simulator ใน change เดียวกัน
