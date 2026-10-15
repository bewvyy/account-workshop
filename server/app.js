const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');
const path = require('path'); // 1. เพิ่มการเรียกใช้งาน path module

const MONGO_URL = 'mongodb://127.0.0.1:27017';
const DATABASE_NAME = 'account-db';
const PORT = 3000;

const app = express();
app.use(express.json());

// 2. แก้ไขการชี้ตำแหน่งโฟลเดอร์ public ย้อนกลับไป 1 ชั้น (..)
app.use(express.static(path.join(__dirname, '../public')));

let users = null;
const HIDE_PASSWORD = { projection: { passwordHash: 0 } };

// POST /api/register - สมัครสมาชิก
app.post('/api/register', async (req, res) => {
  const { username, name, email, password } = req.body;
  if (!username || !name || !email || !password) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ error: 'username ต้องเป็น a-z, 0-9 หรือ _ ยาว 3-20 ตัว' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' });
  }

  const user = { username, name, email: email.toLowerCase(), role: 'member', createdAt: new Date() };
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await users.insertOne({ ...user, passwordHash });
    res.status(201).json({ _id: result.insertedId, ...user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'username หรือ email นี้ถูกใช้แล้ว' });
    }
    throw err;
  }
});

// POST /api/login - เข้าสู่ระบบ
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await users.findOne({ username });
  const ok = user && (await bcrypt.compare(password ?? '', user.passwordHash));

  if (!ok) {
    return res.status(401).json({ error: 'username หรือรหัสผ่านไม่ถูกต้อง' });
  }

  await users.updateOne(
    { _id: user._id },
    { $inc: { loginCount: 1 },$set: { lastLoginAt: new Date() } }
  );

  res.json({
    message: 'เข้าสู่ระบบสำเร็จ',
    user: { username: user.username, name: user.name, role: user.role }
  });
});

// GET /api/users - ดึงรายชื่อสมาชิก (รองรับค้นหาตามชื่อด้วย $regex)
app.get('/api/users', async (req, res) => {
  const { q } = req.query;
  const filter = q ? { name: { $regex: q,$options: 'i' } } : {};
  const list = await users.find(filter, HIDE_PASSWORD).sort({ createdAt: -1 }).toArray();
  res.json(list);
});

// PATCH /api/users/:username/password - เปลี่ยนรหัสผ่าน (พร้อมบันทึก passwordChangedAt)
app.patch('/api/users/:username/password', async (req, res) => {
  const { username } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร' });
  }

  const user = await users.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  }

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await users.updateOne(
    { username },
    { 
      $set: { 
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date()
      } 
    }
  );

  res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
});

// DELETE /api/users/:username - ลบบัญชี (ตรวจสอบสิทธิ์ admin)
app.delete('/api/users/:username', async (req, res) => {
  const currentRole = req.headers['x-user-role'];
  
  if (currentRole !== 'admin') {
    return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: เฉพาะ admin เท่านั้นที่ลบบัญชีได้' });
  }

  const result = await users.deleteOne({ username: req.params.username });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  }
  res.status(204).end();
});

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  users = client.db(DATABASE_NAME).collection('users');
  await users.createIndex({ username: 1 }, { unique: true });
  await users.createIndex({ email: 1 }, { unique: true });

  console.log('เชื่อมต่อ MongoDB สำเร็จ');
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

main().catch(err => {
  console.error('เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err.message);
  process.exit(1);
});
