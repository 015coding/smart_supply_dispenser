---
status: accepted
---

# Use one shared device secret for the prototype

เครื่องทุกเครื่องจะส่งรหัสเครื่องพร้อม `DEVICE_SHARED_SECRET` ค่าเดียวผ่าน HTTPS เพื่อยืนยันกับ Device API โดย secret นี้แยกจาก admin password และ Auth.js secret เราเลือกการตั้งค่าที่ง่ายสำหรับโครงงาน แม้ยอมรับว่า secret จากเครื่องหนึ่งรั่วจะกระทบทุกเครื่องและการหมุนค่าต้องอัปเดตเครื่องทั้งหมด
