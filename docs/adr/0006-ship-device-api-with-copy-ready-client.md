---
status: accepted
---

# Ship the device API with a copy-ready client

v1 จะส่งมอบทั้ง Device API บน Next.js และ MicroPython service ที่พร้อม copy ไปใช้กับ ESP32 โดยยังไม่แก้หรืออัปโหลดเข้า repository ของเครื่องจริง API จะใช้ HTTPS แบบเครื่องดึง desired state และส่ง heartbeat/events กลับ วิธีนี้ทำให้ฝั่งเว็บและ protocol ทดสอบจบก่อนได้ ขณะที่การติดตั้งบน hardware ยังเป็นขั้นตอนแยกและไม่มี remote motor/door commands
