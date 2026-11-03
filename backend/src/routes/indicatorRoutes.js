const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// GET: ดึงตัวชี้วัดตามหัวข้อ
router.get("/:topicId", async (req, res) => {
  try {
    const { topicId } = req.params;

    const result = await pool.query(
      `SELECT * FROM evaluation_indicators
       WHERE topic_id = $1
       ORDER BY id`,
      [topicId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ไม่สามารถดึงตัวชี้วัดได้",
    });
  }
});

// POST: เพิ่มตัวชี้วัด
router.post("/", async (req, res) => {
  try {
    const {
      topic_id,
      indicator_name,
      description,
      weight,
      evidence,
    } = req.body;

    if (!topic_id || !indicator_name) {
      return res.status(400).json({
        message: "กรุณาระบุหัวข้อและชื่อตัวชี้วัด",
      });
    }

    const result = await pool.query(
      `INSERT INTO evaluation_indicators
       (topic_id, indicator_name, description, weight, evidence)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        topic_id,
        indicator_name,
        description || null,
        weight || 0,
        evidence || null,
      ]
    );

    res.status(201).json({
      message: "เพิ่มตัวชี้วัดสำเร็จ",
      indicator: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ไม่สามารถเพิ่มตัวชี้วัดได้",
    });
  }
});

// DELETE: ลบตัวชี้วัด
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM evaluation_indicators
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "ไม่พบตัวชี้วัดที่ต้องการลบ",
      });
    }

    res.json({
      message: "ลบตัวชี้วัดสำเร็จ",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ไม่สามารถลบตัวชี้วัดได้",
    });
  }
});

// PUT: แก้ไขตัวชี้วัด
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      indicator_name,
      description,
      weight,
      evidence,
    } = req.body;

    if (!indicator_name) {
      return res.status(400).json({
        message: "กรุณาระบุชื่อตัวชี้วัด",
      });
    }

    const result = await pool.query(
      `UPDATE evaluation_indicators
       SET indicator_name = $1,
           description = $2,
           weight = $3,
           evidence = $4
       WHERE id = $5
       RETURNING *`,
      [
        indicator_name,
        description || null,
        weight || 0,
        evidence || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "ไม่พบตัวชี้วัดที่ต้องการแก้ไข",
      });
    }

    res.json({
      message: "แก้ไขตัวชี้วัดสำเร็จ",
      indicator: result.rows[0],
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "ไม่สามารถแก้ไขตัวชี้วัดได้",
    });
  }
});

module.exports = router;