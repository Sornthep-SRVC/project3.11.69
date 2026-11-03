
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET: ดึงข้อมูลบุคลากรทั้งหมด
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM employees ORDER BY id"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดข้อมูลบุคลากรได้",
    });
  }
});

// POST: เพิ่มบุคลากร
router.post("/", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      position,
    } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อและนามสกุล",
      });
    }

    // บันทึกลงฐานข้อมูล
    const result = await pool.query(
      `INSERT INTO employees
        (first_name, last_name, email, position)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        first_name,
        last_name,
        email || null,
        position || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "เพิ่มบุคลากรสำเร็จ",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create employee error:", error);

    res.status(500).json({
      success: false,
      message: "ไม่สามารถเพิ่มบุคลากรได้",
    });
  }
});

// PUT: แก้ไขข้อมูลบุคลากร
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, position } = req.body;

    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อและนามสกุล",
      });
    }

    const result = await pool.query(
      `UPDATE employees
       SET first_name = $1,
           last_name = $2,
           email = $3,
           position = $4
       WHERE id = $5
       RETURNING *`,
      [first_name, last_name, email || null, position || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลบุคลากร",
      });
    }

    res.json({
      success: true,
      message: "แก้ไขข้อมูลบุคลากรสำเร็จ",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถแก้ไขข้อมูลบุคลากรได้",
    });
  }
});

// DELETE: ลบข้อมูลบุคลากร
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลบุคลากร",
      });
    }

    res.json({
      success: true,
      message: "ลบข้อมูลบุคลากรสำเร็จ",
    });
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      message: "ไม่สามารถลบข้อมูลบุคลากรได้",
    });
  }
});

module.exports = router;
