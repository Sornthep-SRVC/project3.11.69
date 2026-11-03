
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET: ดึงตัวชี้วัดและคะแนนตามรายการประเมิน
router.get("/:assignmentId", async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await pool.query(
      `
      SELECT
        ei.id AS indicator_id,
        ei.indicator_name,
        ei.description,
        ei.weight,
        ei.evidence,
        es.score,
        es.comment
      FROM evaluation_assignments ea
      JOIN evaluation_period_topics ept
        ON ept.period_id = ea.period_id
      JOIN evaluation_indicators ei
        ON ei.topic_id = ept.topic_id
      LEFT JOIN evaluation_scores es
        ON es.assignment_id = ea.id
        AND es.indicator_id = ei.id
      WHERE ea.id = $1
      ORDER BY ei.id
      `,
      [assignmentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET scores error:", error);

    res.status(500).json({
      message: "ไม่สามารถดึงตัวชี้วัดได้",
    });
  }
});

// POST: บันทึกหรือแก้ไขคะแนน
router.post("/", async (req, res) => {
  try {
    const {
      assignment_id,
      indicator_id,
      score,
      comment,
    } = req.body;

    if (
      assignment_id == null ||
      indicator_id == null ||
      score == null
    ) {
      return res.status(400).json({
        message: "กรุณากรอกข้อมูลให้ครบ",
      });
    }

    const numericScore = Number(score);

    if (!Number.isFinite(numericScore) || numericScore < 0) {
      return res.status(400).json({
        message: "คะแนนต้องเป็นตัวเลขและไม่ต่ำกว่า 0",
      });
    }

    // ตรวจว่าตัวชี้วัดอยู่ในรอบประเมินของ assignment นี้
    const check = await pool.query(
      `
      SELECT ei.id
      FROM evaluation_assignments ea
      JOIN evaluation_period_topics ept
        ON ept.period_id = ea.period_id
      JOIN evaluation_indicators ei
        ON ei.topic_id = ept.topic_id
      WHERE ea.id = $1
        AND ei.id = $2
      `,
      [assignment_id, indicator_id]
    );

    if (check.rows.length === 0) {
      return res.status(400).json({
        message: "ตัวชี้วัดไม่ตรงกับรอบประเมิน",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO evaluation_scores
        (assignment_id, indicator_id, score, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (assignment_id, indicator_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        comment = EXCLUDED.comment,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        assignment_id,
        indicator_id,
        numericScore,
        comment || null,
      ]
    );

    res.status(201).json({
      message: "บันทึกคะแนนสำเร็จ",
      score: result.rows[0],
    });
  } catch (error) {
    console.error("POST score error:", error);

    res.status(500).json({
      message: "ไม่สามารถบันทึกคะแนนได้",
    });
  }
});

module.exports = router;
