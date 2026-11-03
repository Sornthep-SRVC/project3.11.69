const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET: ดึงรายการรอบประเมิน
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM evaluation_periods
       ORDER BY id DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ไม่สามารถดึงรอบประเมินได้",
    });
  }
});

// POST: เพิ่มรอบประเมิน
router.post("/", async (req, res) => {
  try {
    const {
      period_name,
      start_date,
      end_date,
      status,
    } = req.body;

    if (!period_name || !start_date || !end_date) {
      return res.status(400).json({
        message: "กรุณากรอกชื่อและวันที่รอบประเมิน",
      });
    }

    if (end_date < start_date) {
      return res.status(400).json({
        message: "วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น",
      });
    }

    const result = await pool.query(
      `INSERT INTO evaluation_periods
       (period_name, start_date, end_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        period_name,
        start_date,
        end_date,
        status || "draft",
      ]
    );

    res.status(201).json({
      message: "เพิ่มรอบประเมินสำเร็จ",
      period: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ไม่สามารถเพิ่มรอบประเมินได้",
    });
  }
});

module.exports = router;