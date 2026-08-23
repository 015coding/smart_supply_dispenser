---
status: superseded by ADR-0008
---

# Apply paginated eligibility snapshots atomically

Device API จะส่งรายชื่อผู้มีสิทธิ์เป็น snapshot ที่มี version และแบ่งหน้าละไม่เกิน 100 รายการ MicroPython client เขียนข้อมูลลงไฟล์ชั่วคราวและแทน `users.csv` เฉพาะเมื่อได้รับครบและตรวจสอบผ่าน วิธีนี้ใช้ RAM ต่ำและรักษารายชื่อเดิมไว้เมื่อเครือข่ายขาดระหว่าง sync แม้ต้องดาวน์โหลด snapshot ใหม่ทั้งชุดเมื่อ version เปลี่ยน
