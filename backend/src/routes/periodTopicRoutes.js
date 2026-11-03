const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET: ดึงหัวข้อทั้งหมดของรอบประเมิน
router.get("/:periodId", async (req, res) => {
  try {
    const { periodId } = req.params;

    const result = await pool.query(
      `
      SELECT
        et.id,
        et.topic_name,
        et.description
      FROM evaluation_period_topics ept
      JOIN evaluation_topics et
        ON ept.topic_id = et.id
      WHERE ept.period_id = $1
      ORDER BY et.id
      `,
      [periodId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET period topics error:", error);
    res.status(500).json({
      message: "ไม่สามารถดึงหัวข้อของรอบประเมินได้",
    });
  }
});

// POST: เพิ่มหัวข้อเข้ารอบประเมิน
router.post("/", async (req, res) => {
  try {
    const { period_id, topic_id } = req.body;

    if (!period_id || !topic_id) {
      return res.status(400).json({
        message: "กรุณาเลือกรอบประเมินและหัวข้อ",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO evaluation_period_topics
        (period_id, topic_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [period_id, topic_id]
    );

    res.status(201).json({
      message: "เพิ่มหัวข้อเข้ารอบประเมินสำเร็จ",
      topic: result.rows[0],
    });
  } catch (error) {
    console.error("POST period topic error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "หัวข้อนี้อยู่ในรอบประเมินแล้ว",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "ไม่พบรอบประเมินหรือหัวข้อที่เลือก",
      });
    }

    res.status(500).json({
      message: "ไม่สามารถเพิ่มหัวข้อได้",
    });
  }
});

// DELETE: ลบหัวข้อออกจากรอบประเมิน
router.delete("/:periodId/:topicId", async (req, res) => {
  try {
    const { periodId, topicId } = req.params;

    const result = await pool.query(
      `
      DELETE FROM evaluation_period_topics
      WHERE period_id = $1
        AND topic_id = $2
      RETURNING *
      `,
      [periodId, topicId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "ไม่พบหัวข้อในรอบประเมิน",
      });
    }

    res.json({
      message: "ลบหัวข้อออกจากรอบประเมินสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE period topic error:", error);
    res.status(500).json({
      message: "ไม่สามารถลบหัวข้อได้",
    });
  }
});

module.exports = router;