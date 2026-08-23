# พร้อมปัน — Project Specification

## 1. เป้าหมาย

“พร้อมปัน” เป็นเว็บไซต์สำหรับค้นหาเครื่องแจกสิ่งของช่วยเหลือ ดูตำแหน่ง สถานะ และจำนวนชุดที่ยังแจกได้ พร้อมพื้นที่ Admin สำหรับบริหารเครื่อง สต็อก แผนการแจก และรายชื่อผู้มีสิทธิ์

โครงการนี้เป็นงานนำเสนอ ไม่ใช่ระบบ production สำหรับเหตุภัยพิบัติจริง เป้าหมายขนาด v1 คือผู้เข้าชมเว็บพร้อมกันประมาณ 100 คนและรายชื่อผู้มีสิทธิ์เริ่มต้นไม่เกิน 1,000 คน

## 2. ขอบเขต v1

### อยู่ในขอบเขต

- เว็บไซต์ Next.js ที่ทำทั้ง frontend และ backend
- หน้า public แบบ mobile-first
- หน้า Admin แบบ desktop/tablet-first และ responsive
- Auth.js/NextAuth Credentials สำหรับผู้ดูแลส่วนกลางหนึ่งบัญชี
- PostgreSQL สำหรับข้อมูลระบบ
- แผนที่ Leaflet โดยใช้ข้อมูล OpenStreetMap
- การอัปโหลดรูปเครื่องหนึ่งรูป
- การจัดการเครื่อง ช่องจ่าย สต็อก แผนการแจก ผู้มีสิทธิ์ และ activity log
- Dashboard พร้อมตัวเลขสรุป alert และกราฟจำนวนผู้รับสำเร็จ
- CSV import/export
- Device API บน Next.js สำหรับ authorization, desired state, heartbeat และ events
- MicroPython service ที่พร้อม copy ไปใช้กับโค้ด ESP32 ปัจจุบัน
- Device simulator และเอกสาร contract สำหรับทดสอบก่อนต่อ hardware

### ไม่อยู่ในขอบเขต

- การแก้ อัปโหลด หรือ flash ไฟล์เข้า repository/เครื่อง ESP32 จริง
- การสั่งหมุนมอเตอร์หรือปลดล็อกประตูจากเว็บ
- GPS หรือการขอตำแหน่งผู้เข้าชม
- Routing engine ภายในเว็บ
- ตารางเวลาเปิด–ปิดรายวันหรือรายสัปดาห์
- ผู้ดูแลหลายบัญชีและการแบ่ง role
- Email, SMS หรือ push notification
- Dark mode
- Analytics ขั้นสูงนอกเหนือจากกราฟจำนวนผู้รับสำเร็จ

Device API และ client service จะพร้อมใช้งานและทดสอบด้วย simulator ใน v1 แต่การนำ client ไปติดตั้งและประกอบเข้ากับ firmware จริงเป็นขั้นตอนถัดไป สถานะ online จะแสดงจาก heartbeat จริงหรือ simulator เท่านั้น

## 3. ผู้ใช้งาน

### ผู้เข้าชมเว็บ

- ไม่ต้อง login
- ค้นหาและกรองเครื่อง
- ดูสถานะ จำนวนชุดที่แจกได้ และเวลาอัปเดตล่าสุด
- เปิดหน้ารายละเอียดและดูตำแหน่งบนแผนที่

### ผู้ดูแลส่วนกลาง

- มีหนึ่งบัญชีและบริหารข้อมูลทั้งหมด
- Login ด้วย username และ password จาก environment variables
- สร้างและเผยแพร่เครื่อง จัดการสต็อก แผนแจก และผู้มีสิทธิ์
- ดู alert กราฟ และประวัติการทำรายการ

## 4. Routes

### Public

- `/` — รายการเครื่องที่เผยแพร่
- `/machines/[code]` — รายละเอียดเครื่องตามรหัสคงที่ เช่น `DSP-0001`

### Admin

- `/admin/login` — Login
- `/admin` — Dashboard
- `/admin/dispensers` — รายการเครื่อง
- `/admin/dispensers/new` — สร้างเครื่อง
- `/admin/dispensers/[code]` — รายละเอียด แก้ไข สต็อก และแผนแจก
- `/admin/recipients` — รายชื่อผู้มีสิทธิ์และ CSV import/export
- `/admin/activity` — ประวัติการทำรายการ

### Device API

- อยู่ใต้ `/api/device/v1/*`
- ยืนยันตัวตนด้วยรหัสเครื่องและ shared device secret หนึ่งค่าที่แยกจาก admin/Auth.js secrets
- Contract ต้อง versioned, idempotent และไม่ใช้ admin credential
- รายละเอียด endpoint และ payload จะถูกล็อกในรอบออกแบบ Device API

ทุก route ใต้ `/admin` ยกเว้น `/admin/login` ต้องมี session และทุก Server Action/Route Handler ที่แก้ข้อมูลต้องตรวจสิทธิ์ซ้ำฝั่ง server

## 5. หน้า Public

### หน้า `/`

- เริ่มด้วยรายการ card ไม่ใช่แผนที่รวม
- แสดงรูปหรือ placeholder, ชื่อจุด, จังหวัด/อำเภอ, สถานะ, จำนวนชุดที่แจกได้ และวันเวลาที่อัปเดตล่าสุด
- ค้นหาจากชื่อเครื่องหรือที่อยู่
- กรองตามจังหวัด อำเภอ และสถานะ
- เรียงเครื่องพร้อมแจกก่อน
- ไม่มี GPS และไม่คำนวณระยะทาง
- Card ทั้งใบกดเพื่อเปิดรายละเอียดได้

### หน้ารายละเอียดเครื่อง

- แสดงรหัสและชื่อเครื่อง
- รูปเครื่อง
- สถานะการให้บริการ
- จำนวนชุดที่แจกได้
- รายการสิ่งของ หน่วย และจำนวนคงเหลือรายช่อง
- วันเวลาที่อัปเดตล่าสุด
- ที่อยู่ จุดสังเกต เบอร์ติดต่อ optional และประกาศ optional
- Leaflet map พร้อม marker จาก latitude/longitude
- ปุ่มเปิดตำแหน่งใน OpenStreetMap
- แสดง attribution ของ OpenStreetMap บนแผนที่ตลอดเวลา
- ไม่มีระบบคำนวณเส้นทางภายในเว็บ

## 6. สถานะและจำนวนคงเหลือ

### Lifecycle

- `draft` — ข้อมูลยังไม่ครบหรือยังไม่ต้องการเผยแพร่
- `published` — ปรากฏในหน้า public
- `archived` — เลิกใช้และซ่อนจาก public แต่ยังรักษาประวัติ

เครื่องที่เคยเผยแพร่แล้วไม่ลบถาวรผ่าน UI

### Service status

- `available` — พร้อมแจก
- `out_of_stock` — มีอย่างน้อยหนึ่งช่องในชุดเหลือศูนย์
- `temporarily_closed` — ผู้ดูแลปิดชั่วคราว
- `maintenance` — ปิดซ่อมบำรุง

Lifecycle, service status และ connectivity status เป็นคนละแนวคิด

เมื่อเครื่องอยู่ในโหมดปกติ สถานะ `out_of_stock` คำนวณอัตโนมัติจากสต็อก ส่วน `temporarily_closed` และ `maintenance` เป็นการตั้งค่าโดยผู้ดูแล

### Available bundle count

ทุกช่องจ่ายในแผนเป็นส่วนที่จำเป็นของชุด จำนวนชุดที่แจกได้คำนวณจากยอดคงเหลือต่ำสุด เช่น 10, 10 และ 9 ชิ้น เท่ากับแจกได้ 9 ชุด ไม่ใช่ 29 ชิ้น

## 7. การสร้างและจัดการเครื่อง

- ระบบสร้าง internal UUID และรหัสอ่านง่ายรูปแบบ `DSP-0001`
- รหัสเครื่องแก้ไม่ได้หลังสร้าง แต่ชื่อและสถานที่แก้ได้
- ผู้ดูแลบันทึก draft ที่ข้อมูลยังไม่ครบได้
- ก่อนเผยแพร่ต้องมีชื่อ ที่อยู่ จังหวัด อำเภอ พิกัด และอย่างน้อยหนึ่งช่องที่กำหนดชื่อสินค้า หน่วย ความจุ และจุดแจ้งเตือน
- จำนวนเริ่มต้นเป็นศูนย์ได้ แต่เครื่องจะแสดง `out_of_stock`
- เครื่องให้บริการ 24 ชั่วโมงเมื่อพร้อม ไม่มี field ตารางเวลา
- พิกัดกรอกเป็นตัวเลขหรือเลือก/ลาก marker บนแผนที่ได้ และทั้งสองรูปแบบอัปเดตหากัน
- รองรับช่องจ่ายสูงสุดสามช่องตาม hardware ปัจจุบัน

### รูปเครื่อง

- หนึ่งรูปต่อเครื่อง
- ไฟล์ต้นฉบับสูงสุด 5 MB
- ตรวจชนิดไฟล์, resize และแปลงเป็น WebP
- เก็บใน public Vercel Blob ไม่เก็บ binary ใน PostgreSQL
- หากไม่มีรูปใช้ placeholder

## 8. ช่องจ่าย แผนการแจก และสต็อก

แต่ละช่องมี:

- ลำดับช่อง 1–3
- ชื่อสิ่งของแบบ free text
- หน่วยมาตรฐาน: ชิ้น, ชุด, ขวด, กระป๋อง, ถุง, กล่อง, แพ็ก
- หน่วยกำหนดเองเมื่อเลือก “อื่น ๆ”
- ความจุสูงสุด
- ยอดคงเหลือที่รายงาน
- จุดแจ้งเตือนของใกล้หมด
- สถานะใช้งานในแผน

การเปลี่ยนองค์ประกอบชุดสร้าง distribution plan revision ใหม่และมีผลในวันให้บริการถัดไป การเติมหรือปรับยอดสต็อกมีผลทันที

### Stock actions

- `เติมสินค้า` — ระบุจำนวนที่เพิ่ม
- `ปรับยอด` — ระบุยอดใหม่และเหตุผล
- ทุก action ทำ transaction ระหว่าง current balance, inventory movement, alert state และ activity log
- ห้ามให้ยอดติดลบหรือเกินความจุโดยไม่มี validation error

## 9. Alerts

- แสดงเฉพาะใน Admin Dashboard
- สร้างจากสภาพของใกล้หมด ของหมด หรือเงื่อนไขปฏิบัติการที่ต้องตรวจสอบ
- จุดแจ้งเตือนกำหนดแยกแต่ละช่อง
- ผู้ดูแลทำเครื่องหมาย “รับทราบ” ได้ แต่ alert ยังอยู่จนกว่าสาเหตุจะหมด
- Alert ของใกล้หมด/หมดปิดอัตโนมัติหลังยอดกลับสูงกว่าเงื่อนไข

## 10. ผู้มีสิทธิ์รับของ

ข้อมูลต่อคนมีเพียง:

- เลขประจำตัวประชาชน
- ชื่อ
- สถานะ active/deactivated
- created/updated timestamps

### Security

- ตรวจรูปแบบ 13 หลักและ checksum เลขประจำตัวประชาชนไทย
- เข้ารหัสเลขบัตรแบบ reversible ก่อนเก็บ
- เก็บ keyed hash แยกสำหรับ exact lookup และ unique constraint
- แสดงเลขแบบปิดบังเป็นค่าเริ่มต้น
- ไม่ส่งข้อมูลผู้มีสิทธิ์ไปหน้า public

### Actions

- เพิ่มและแก้ไขรายบุคคล
- ปิดสิทธิ์โดยยังรักษาประวัติ
- การลบถาวรเป็น action แยกที่ต้องยืนยันชัดเจน
- Import CSV รูปแบบ `citizen_id,name`
- แสดง preview แถวผ่าน/ไม่ผ่านก่อนยืนยัน
- นำเข้าเฉพาะแถวผ่านได้
- ดาวน์โหลดแถวผิดพร้อมเหตุผลได้ โดยไฟล์ผลลัพธ์สร้างชั่วคราวและไม่เก็บในฐานข้อมูล
- Export รายชื่อผ่าน endpoint ที่ตรวจ admin session และห้าม cache

## 11. กติกาการแจกและ Device Integration

- ผู้มีสิทธิ์รับชุดสิ่งของครบหนึ่งครั้งต่อ service day ทั้งระบบ
- เมื่อ online เครื่องส่งเลขบัตรผ่าน HTTPS ให้ระบบส่วนกลางตรวจสิทธิ์และห้ามบันทึกเลขดิบใน access/error logs
- เมื่อเรียก server ไม่สำเร็จ เครื่อง fallback ไปตรวจรายชื่อและประวัติในเครื่อง
- ไม่มีการจองสิทธิ์ก่อนจ่าย
- ตัดสิทธิ์ทันทีเมื่อเครื่องยืนยันว่าจ่ายครบชุด
- การจ่ายบางส่วนไม่ตัดสิทธิ์
- ผู้ที่ได้บางส่วนสามารถไปเครื่องอื่นและรับชุดเต็ม แม้อาจได้บางรายการซ้ำ
- ยอมรับความเสี่ยงที่เลขเดียวกันอาจใช้สองเครื่องพร้อมกันก่อน status อัปเดต
- หากเครื่อง offline ให้ใช้รายชื่อที่ sync ล่าสุดและทำงานต่อ
- เหตุการณ์ offline ส่งกลับเมื่อเชื่อมต่อและลงย้อนหลังตาม service day เดิม
- การบังคับสิทธิ์จึงเป็น best effort เพื่อไม่หยุดการช่วยเหลือ
- ESP32 เรียก Device API บน Vercel ด้วย HTTPS โดยตรงเป็นค่าเริ่มต้น
- ลด request โดยไม่ส่งข้อมูลแยกทุกมอเตอร์และรวม heartbeat/stock เข้ากับ transaction report เมื่อทำได้
- รายชื่อผู้มีสิทธิ์ส่งเป็น versioned snapshot ผ่าน response เดียวและเขียนลงไฟล์แบบ streaming
- Client เขียน snapshot ลงไฟล์ชั่วคราว ตรวจจำนวน/checksum แล้วจึงสลับแทน `users.csv`; หากไม่ครบให้ใช้ไฟล์เดิม
- Snapshot เก็บเฉพาะเลขบัตรและใช้ค่าว่างในคอลัมน์ `name` เพื่อคงรูปแบบ CSV โดยไม่กระจายชื่อไปยังเครื่อง
- Stock ledger บนเว็บเป็นแหล่งข้อมูลหลักสำหรับหน้า public
- Admin refill/adjustment และ distribution report สร้าง stock movements; ESP32 เก็บสำเนายอดเพื่อทำงาน offline
- เมื่อ sync ระบบ reconcile movement แล้วส่งยอดล่าสุดกลับให้เครื่อง
- Public ไม่แสดง online/offline และ connectivity ไม่เปลี่ยน service status อัตโนมัติ; ผู้เข้าชมเห็นเวลาอัปเดตล่าสุดตามเดิม
- Connectivity แสดงเฉพาะ Admin
- เครื่อง offline ใช้ distribution plan version ล่าสุดที่ apply สำเร็จต่อไป; Admin เห็น `แผนยังไม่ sync`
- Admin refill/adjustment เปลี่ยน stock ledger และหน้า public ทันที พร้อม badge `รอเครื่อง sync` ใน Admin จนเครื่อง acknowledge
- หาก hardware รับ TLS ไม่ไหว สามารถเพิ่ม local HTTP-to-HTTPS gateway ภายหลังโดยไม่เปลี่ยน payload contract
- Sync ตอน boot, ทุก 10 นาทีขณะว่าง และก่อนแจกหากไม่ได้ sync เกิน 10 นาที
- Dashboard ถือว่า connectivity offline เมื่อไม่มี heartbeat เกิน 20 นาที
- ส่ง distribution report เพียงครั้งเดียวหลังจบรอบ โดยรวมผล ยอดคงเหลือ และ error
- หากส่ง report ไม่สำเร็จให้ retry จาก `usage.csv` โดยจำเลขบรรทัดล่าสุดใน `sync_state.json`

v1 รวมการสร้าง Device API, simulator และ MicroPython client service ที่พร้อม copy แต่ไม่รวมการติดตั้ง client เข้า firmware จริง

## 12. Dashboard และกราฟ

### Summary cards

- เครื่องทั้งหมด
- เครื่องพร้อมแจก
- เครื่องไม่พร้อมแจก
- จำนวนชุดที่แจกได้รวม
- จำนวน alert ที่ต้องจัดการ

ตามด้วยรายการ alert และตารางเครื่องที่อัปเดตล่าสุด

### กราฟจำนวนผู้รับสำเร็จ

- กราฟแท่งรายวัน
- ค่าเริ่มต้น 7 วันล่าสุด
- เลือก 7 วัน, 30 วัน หรือช่วงกำหนดเอง
- กรองทุกเครื่องหรือรายเครื่อง
- นับเฉพาะผู้มีสิทธิ์ที่ได้รับครบชุดจาก completed distribution records ที่ server ได้รับ
- ข้อมูล offline ยังไม่แสดงจน sync แล้วจึง backfill ตามวันเกิดเหตุการณ์
- ก่อนติดตั้ง service บน ESP32 กราฟอ่านข้อมูลจาก simulator ได้ และแสดง empty state เมื่อยังไม่มี completed distribution record

## 13. Activity log และ Export

Activity log เก็บ:

- การสร้าง แก้ไข เผยแพร่ และเก็บถาวรเครื่อง
- การเปลี่ยน service status
- การเติมและปรับสต็อก
- การสร้าง distribution plan revision
- การเพิ่ม แก้ ปิดสิทธิ์ ลบ และ import ผู้มีสิทธิ์
- เวลา, action, entity และเฉพาะ field ที่เปลี่ยน
- เลขบัตรใน log ต้องปิดบัง

Activity log แก้ไขหรือลบจาก UI ไม่ได้

CSV export รองรับเครื่อง สต็อก รายชื่อผู้มีสิทธิ์ และประวัติการเปลี่ยนแปลง โดยทุก export ที่มีข้อมูลอ่อนไหวต้องตรวจ session และตั้ง header ไม่ให้ cache

## 14. Retention และพื้นที่จัดเก็บ

- Completed distribution records ที่ระบุตัวผู้รับเก็บ 180 วัน
- หลัง 180 วันรวมเป็น daily distribution summaries ที่ไม่ระบุตัวบุคคล แล้วลบรายละเอียด
- Administrative activity เก็บ 1 ปีแล้วลบอัตโนมัติ
- ไม่เก็บรูปหรือไฟล์ CSV ใน PostgreSQL
- Activity log เก็บ field diff ไม่เก็บ full snapshot
- สร้าง index เฉพาะ query ที่ใช้จริง
- ใช้ scheduled cleanup ขนาดเล็กและ idempotent

## 15. Authentication และความปลอดภัย

- ใช้แพ็กเกจ `next-auth`/Auth.js Credentials provider
- มี admin หนึ่งบัญชี ไม่มีตาราง admin users
- Environment variables เก็บ username และ password hash ไม่เก็บรหัสผ่าน plaintext
- ใช้ server-side session checks สำหรับหน้า Admin และ mutation ทุกจุด
- ไม่มี forgot-password UI; เปลี่ยน credential ด้วย environment variables และ redeploy
- Validation ฝั่ง server เป็นแหล่งตัดสินสุดท้าย
- Error response ไม่เปิดเผย secret, query หรือข้อมูลส่วนบุคคล
- Rate-limit หน้า login แบบประหยัดพื้นที่
- ใช้ secure, HTTP-only cookies ใน production

## 16. Technology

- Next.js App Router + TypeScript
- Next.js Server Components สำหรับอ่านข้อมูล
- Server Actions สำหรับ mutation จาก Admin UI
- Route Handlers เฉพาะ auth, upload/export และ interface ที่ต้องเป็น HTTP
- Auth.js/NextAuth Credentials
- Neon Free PostgreSQL ผ่าน Vercel Marketplace
- ORM/query layer ที่ใช้ PostgreSQL มาตรฐานและ pooled connection เพื่อไม่ผูกกับ proprietary API
- Tailwind CSS และ component primitives ที่เข้าถึงได้
- Leaflet/React Leaflet + OpenStreetMap tiles
- Vercel Blob สำหรับรูป
- Schema validation ฝั่ง server
- Library กราฟแบบ client-side เฉพาะ component กราฟ
- MicroPython HTTP client ที่เข้ากับโครงสร้าง service ของ ESP32 ปัจจุบัน
- Device simulator สำหรับ authorization, heartbeat, sync และ event flow

## 17. Deployment และ Environment

Deploy บน Vercel Hobby สำหรับโครงงาน ไม่อ้างว่าเป็น high-availability production deployment

Environment variables อย่างน้อย:

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `DEVICE_SHARED_SECRET`
- `PII_ENCRYPTION_KEY`
- `PII_LOOKUP_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `NEXT_PUBLIC_MAP_TILE_URL`

ต้องมี `.env.example` ที่ไม่มี secret จริง พร้อม README สำหรับ:

- local development
- migration
- สร้าง Neon integration
- สร้าง Vercel Blob store
- ตั้ง environment variables
- deploy Vercel
- ตั้งรหัสและ secret รายเครื่อง
- รัน Device simulator
- copy และตั้งค่า MicroPython service
- contract และ payload ของ Device API ตาม [DEVICE-API.md](./DEVICE-API.md)

ระบบไม่ seed เครื่อง ผู้มีสิทธิ์ หรือประวัติแจก ตัว Admin สร้างข้อมูลผ่าน UI

## 18. UI และ Accessibility

- ชื่อผลิตภัณฑ์ “พร้อมปัน”
- ภาษาไทยทั้งหมด
- วันที่รูปแบบไทยและปี พ.ศ. เช่น `23 ส.ค. 2569`
- เวลา 24 ชั่วโมงและ timezone `Asia/Bangkok`
- เก็บ timestamp ในฐานข้อมูลเป็น UTC
- Public mobile-first; Admin desktop/tablet-first แต่ action หลักใช้งานบนมือถือได้
- พื้นขาว/เทาอ่อน สีหลักน้ำเงินอมเขียว
- สถานะแสดงด้วยสี ไอคอน และข้อความ ไม่ใช้สีอย่างเดียว
- ปุ่มและ touch target มีขนาดเหมาะกับมือถือ
- ไม่มี dark mode
- มี loading, empty, validation error, not-found และ unauthorized states ที่เข้าใจง่าย

## 19. Testing

Unit tests มีเพียงชุดเล็กสำหรับกติกาที่เสี่ยงผิด:

- คำนวณจำนวนชุดจากยอดต่ำสุด
- derive service status จาก stock และ manual override
- ตรวจรูปแบบ/checksum เลขบัตร
- masking และ keyed lookup behavior ที่สำคัญ

Integration tests ครอบคลุม login protection และ mutation หลักที่กระทบหลายตาราง เช่น เติมสต็อกพร้อม movement/activity

มี E2E happy path หลักอย่างน้อยหนึ่งเส้นทาง: login → สร้าง draft → เพิ่มช่องและพิกัด → เผยแพร่ → เห็นเครื่องใน `/` → เปิดรายละเอียดและแผนที่

## 20. Acceptance Criteria

- ผู้เข้าชมดูรายการเครื่องและรายละเอียดได้โดยไม่ login
- ค้นหา/กรองด้วยชื่อ ที่อยู่ จังหวัด อำเภอ และสถานะได้
- จำนวนชุดและสถานะของหมดคำนวณถูกต้องจากทุกช่องในชุด
- แผนที่แสดง marker จาก latitude/longitude และมี OSM attribution
- `/admin` ป้องกันด้วย credential จาก environment variables
- Admin สร้าง draft และเผยแพร่เครื่องได้โดย validation ครบ
- Admin เติม/ปรับสต็อกและเห็น alert เปลี่ยนตามเงื่อนไข
- Admin จัดการและ import ผู้มีสิทธิ์พร้อม preview ได้
- Admin ดู summary, alert, กราฟ empty/data state และ activity log ได้
- Device simulator ยืนยันตัวตน ดึง desired state ส่ง heartbeat และส่งผลการแจกได้
- MicroPython service ผ่าน syntax/import checks ที่ทำได้โดยไม่ใช้ hardware และมีขั้นตอน copy ชัดเจน
- ไม่มีข้อมูลเลขบัตรหรือ admin secret รั่วสู่ public response
- Build, tests ชุดที่กำหนด และคู่มือ deploy ทำงานได้

## 21. เอกสารอ้างอิงการตัดสินใจ

- [ADR-0001: Continue dispensing while offline](./adr/0001-continue-dispensing-while-offline.md)
- [ADR-0002: Version distribution plans by service day](./adr/0002-version-distribution-plans-by-service-day.md)
- [ADR-0003: Protect citizen identifiers](./adr/0003-protect-citizen-identifiers.md)
- [ADR-0004: Use best-effort entitlement enforcement](./adr/0004-use-best-effort-entitlement-enforcement.md)
- [ADR-0005: Retain detail then anonymize](./adr/0005-retain-detail-then-anonymize.md)
- [ADR-0006: Ship Device API with a copy-ready client](./adr/0006-ship-device-api-with-copy-ready-client.md)
- [ADR-0007: Apply paginated eligibility snapshots atomically](./adr/0007-apply-paginated-eligibility-snapshots-atomically.md)
- [ADR-0008: Use minimal direct HTTPS device sync](./adr/0008-use-minimal-direct-https-device-sync.md)
- [ADR-0009: Use one shared device secret for the prototype](./adr/0009-use-one-shared-device-secret.md)
- [ADR-0010: Use the web stock ledger as the source of truth](./adr/0010-use-web-stock-ledger-as-source-of-truth.md)
- [Device API contract](./DEVICE-API.md)
- [Domain glossary](../CONTEXT.md)

## 22. Static prototype

ต้นแบบ UI แบบ light mode เดียวอยู่ใน [`../prototype/`](../prototype/README.md) และใช้ข้อมูลจำลองใน browser เท่านั้น จึงไม่เปลี่ยน production architecture หรือฐานข้อมูล
