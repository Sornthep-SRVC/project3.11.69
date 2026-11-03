
const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// POST: Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // ตรวจสอบว่ากรอกข้อมูลครบหรือไม่
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        message: "กรุณากรอก Username และ Password",
      });
    }

    // ค้นหาผู้ใช้งานจากฐานข้อมูล
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    const user = result.rows[0];

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Username หรือ Password ไม่ถูกต้อง",
      });
    }

    // สร้าง JWT Token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      status: "success",
      message: "Login สำเร็จ",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      status: "error",
      message: "เกิดข้อผิดพลาดภายในระบบ",
    });
  }
});

module.exports = router;
