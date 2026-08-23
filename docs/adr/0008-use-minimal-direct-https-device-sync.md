---
status: accepted
---

# Use minimal direct HTTPS device sync

ESP32 จะเชื่อม Device API บน Vercel ด้วย HTTPS โดยรวมข้อมูลและลดจำนวน request ต่อการรับของ แทนการใช้ HTTP ซึ่ง Vercel จะ redirect กลับ HTTPS อยู่ดี รายชื่อผู้มีสิทธิ์จะดาวน์โหลดเป็น versioned snapshot ผ่าน response เดียวและเขียนแบบ streaming ลงไฟล์ชั่วคราวก่อนสลับใช้งาน หาก TLS ใช้งานกับ hardware จริงไม่ได้จึงค่อยเพิ่ม local HTTP-to-HTTPS gateway โดยไม่เปลี่ยน contract หลัก
