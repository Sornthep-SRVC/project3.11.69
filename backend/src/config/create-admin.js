require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createAdmin() {
  try {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (!username || !password) {
      console.log("กรุณากำหนด ADMIN_USERNAME และ ADMIN_PASSWORD ใน .env");
      return;
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.log("บัญชีนี้มีอยู่แล้ว");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (username, password, role)
       VALUES ($1, $2, 'admin')`,
      [username, hashedPassword]
    );

    console.log("สร้างบัญชี Admin สำเร็จ!");
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();