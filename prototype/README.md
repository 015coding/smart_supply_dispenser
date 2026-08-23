# พร้อมปัน — single light-mode prototype

ไฟล์ชุดนี้เป็น prototype แบบ throwaway ตาม `PROJECT-SPEC.md` ใช้แค่ HTML, CSS และ JavaScript ฝั่ง browser เท่านั้น ข้อมูลทั้งหมดอยู่ใน memory และจะ reset เมื่อ refresh หน้าเว็บ

## รันในเครื่อง

จากโฟลเดอร์ `web`:

```bash
python3 -m http.server 4173 --directory prototype
```

เปิด <http://localhost:4173> แล้วใช้ hash route เหล่านี้เพื่อสำรวจ flow:

- `#home` — หน้าค้นหาเครื่องสำหรับประชาชน
- `#detail/DSP-0001` — รายละเอียดเครื่องพร้อม Leaflet/OpenStreetMap และลิงก์เปิดแผนที่
- `#admin-login` — หน้าเข้าสู่ระบบตัวอย่าง (prototype รับค่า username/password ที่ไม่ว่าง)
- `#admin-dashboard` — dashboard ผู้ดูแล
- `#admin-machines` — จัดการเครื่องและสต็อก
- `#admin-recipients` — จัดการรายชื่อผู้มีสิทธิ์
- `#admin-device` — สถานะ device API และ simulator ของ `sync`/`report`

หน้าจอออกแบบ light mode แบบเดียวและ mobile-first สำหรับฝั่งประชาชน; ฝั่ง Admin ใช้ layout desktop-first ตาม spec
