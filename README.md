# 🚀 Member Management System (Full-Stack Workshop)

ระบบจัดการข้อมูลสมาชิกแบบ Full-Stack พัฒนาด้วย **Node.js**, **Express**, และ **MongoDB** พร้อมฟีเจอร์การลงทะเบียน, เข้าสู่ระบบ, เปลี่ยนรหัสผ่าน, ค้นหาสมาชิก และการควบคุมสิทธิ์การลบบัญชี

---

## 🛠️ Tech Stack & Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Native MongoDB Driver)
- **Security**: Bcrypt.js (Password Hashing)
- **Frontend**: HTML5, CSS3, JavaScript (Fetch API)
- **Tools**: VS Code, MongoDB Compass, GitHub Desktop

---

## ✨ Features (คุณสมบัติระบบ)

1. **Member Registration**: สมัครสมาชิกพร้อมตรวจสอบความถูกต้องของข้อมูล (Validation) และเข้ารหัสรหัสผ่านด้วย `bcrypt.js`
2. **User Authentication**: เข้าสู่ระบบ ตรวจสอบรหัสผ่าน บันทึกเวลาเข้าใช้งานล่าสุด (`lastLoginAt`) และนับจำนวนการเข้าสู่ระบบ (`loginCount`)
3. **Password Management**: เปลี่ยนรหัสผ่านโดยต้องยืนยันรหัสผ่านเดิมด้วย `bcrypt.compare` พร้อมบันทึกเวลาที่เปลี่ยนรหัสผ่าน (`passwordChangedAt`)
4. **Member Search**: ดึงรายชื่อสมาชิกพร้อมระบบค้นหาตามชื่อโดยใช้ `$regex` (Case-insensitive)
5. **Role-Based Authorization**: ระบบตรวจสอบสิทธิ์ในการลบบัญชีผู้ใช้ (จำกัดเฉพาะผู้ที่มีบทบาท `admin` เท่านั้น)

---
