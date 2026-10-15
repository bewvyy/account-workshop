const message = document.querySelector('#message');
const userTable = document.querySelector('#user-table');
let currentUser = null; // ข้อ 3: จำสถานะผู้ใช้ที่เข้าสู่ระบบอยู่

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? 'error' : 'success';
}

async function postJSON(url, data, method = 'POST') {
  const res = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return { ok: res.ok, body: await res.json() };
}

// สมัครสมาชิก
document.querySelector('#register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const { ok, body } = await postJSON('/api/register', data);
  if (ok) {
    showMessage(`สมัครสมาชิกสำเร็จ ยินดีต้อนรับคุณ ${body.name}`);
    form.reset();
    loadUsers();
  } else {
    showMessage(body.error, true);
  }
});

// เข้าสู่ระบบ
document.querySelector('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const { ok, body } = await postJSON('/api/login', data);
  if (ok) {
    currentUser = body.user; // บันทึกข้อมูลบัญชีที่เข้าสู่ระบบปัจจุบัน
    showMessage(`เข้าสู่ระบบสำเร็จ สวัสดีคุณ ${body.user.name} (${body.user.role})`);
  } else {
    showMessage(body.error, true);
  }
});

// ข้อ 1: เปลี่ยนรหัสผ่าน
document.querySelector('#change-password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const { ok, body } = await postJSON(`/api/users/${data.username}/password`, {
    oldPassword: data.oldPassword,
    newPassword: data.newPassword
  }, 'PATCH');

  if (ok) {
    showMessage(body.message);
    form.reset();
  } else {
    showMessage(body.error, true);
  }
});

// ข้อ 2: โหลดรายชื่อสมาชิกตามการค้นหา
async function loadUsers(query = '') {
  const url = query ? `/api/users?q=${encodeURIComponent(query)}` : '/api/users';
  const res = await fetch(url);
  const users = await res.json();
  userTable.innerHTML = '';
  for (const user of users) {
    const tr = document.createElement('tr');
    for (const value of [user.username, user.name, user.email, user.role]) {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    }
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'ลบ';
    deleteBtn.addEventListener('click', () => deleteUser(user.username));
    
    const actionTd = document.createElement('td');
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);
    userTable.appendChild(tr);
  }
}

// ข้อ 2: Event ปุ่มค้นหา
document.querySelector('#search-btn').addEventListener('click', () => {
  const q = document.querySelector('#search-input').value;
  loadUsers(q);
});

// ข้อ 3: ลบบัญชี (ส่ง Role ปัจจุบันไปให้ Server เช็ก)
async function deleteUser(username) {
  if (!confirm(`ลบบัญชี ${username} หรือไม่?`)) return;
  
  const res = await fetch(`/api/users/${username}`, { 
    method: 'DELETE',
    headers: {
      'x-user-role': currentUser ? currentUser.role : 'guest' // ส่ง role ของผู้ใช้ที่เข้าสู่ระบบอยู่
    }
  });

  if (res.ok) {
    showMessage(`ลบบัญชี ${username} แล้ว`);
    loadUsers();
  } else {
    const data = await res.json();
    showMessage(data.error, true);
  }
}

loadUsers();
