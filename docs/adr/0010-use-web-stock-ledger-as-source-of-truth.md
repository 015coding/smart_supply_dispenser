---
status: accepted
---

# Use the web stock ledger as the source of truth

หน้า public และ Admin จะคำนวณยอดจาก stock ledger ส่วนกลางซึ่งรับ movement จากการเติม การปรับยอด และรายงานการแจก ESP32 เก็บสำเนาไว้ทำงาน offline และรับยอดที่ reconcile แล้วเมื่อ sync เราเลือก ledger ส่วนกลางเพื่อให้การรายงานและประวัติสอดคล้องกัน โดยยอมรับว่ายอดเว็บอาจล้าหลังระหว่างเครื่อง offline
