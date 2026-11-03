
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET: ดึงหัวข้อการประเมินทั้งหมด
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM evaluation_topics ORDER BY id"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get evaluation topics error:", error);

    res.status(500).json({
      success: false,
      message: "ไม่สามารถโหลดหัวข้อการประเมินได้",
    });
  }
});

// POST: เพิ่มหัวข้อการประเมิน
router.post("/", async (req, res) => {
  try {
    const { topic_name, description } = req.body;

    if (!topic_name || !topic_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อหัวข้อการประเมิน",
      });
    }

    const result = await pool.query(
      `INSERT INTO evaluation_topics
        (topic_name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [topic_name.trim(), description || null]
    );

    res.status(201).json({
      success: true,
      message: "เพิ่มหัวข้อการประเมินสำเร็จ",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Create evaluation topic error:", error);

    res.status(500).json({
      success: false,
      message: "ไม่สามารถเพิ่มหัวข้อการประเมินได้",
    });
  }
});

module.exports = router;
