
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/auth.middleware");

// GET: Admin ดึงรายการมอบหมายทั้งหมด
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ea.id,
        ea.period_id,
        ea.evaluator_id,
        ea.evaluatee_id,
        ea.status,
        ep.period_name,
        evaluator.first_name AS evaluator_first_name,
        evaluator.last_name AS evaluator_last_name,
        evaluatee.first_name AS evaluatee_first_name,
        evaluatee.last_name AS evaluatee_last_name
      FROM evaluation_assignments ea
      JOIN evaluation_periods ep
        ON ea.period_id = ep.id
      JOIN employees evaluator
        ON ea.evaluator_id = evaluator.id
      JOIN employees evaluatee
        ON ea.evaluatee_id = evaluatee.id
      ORDER BY ea.id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("GET assignments error:", error);

    res.status(500).json({
      message: "ไม่สามารถดึงข้อมูลการมอบหมายได้",
    });
  }
});

// GET: กรรมการดึงรายการประเมินของตัวเอง
router.get("/my", authMiddleware, async (req, res) => {
  try {
    // ตรวจสอบข้อมูลผู้ล็อกอินจาก JWT
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่",
      });
    }

    // Admin สามารถดูรายการทั้งหมด
    if (req.user.role === "admin") {
      const result = await pool.query(`
        SELECT
          ea.id,
          ea.period_id,
          ea.evaluator_id,
          ea.evaluatee_id,
          ea.status,
          ep.period_name,
          evaluator.first_name AS evaluator_first_name,
          evaluator.last_name AS evaluator_last_name,
          evaluatee.first_name AS evaluatee_first_name,
          evaluatee.last_name AS evaluatee_last_name
        FROM evaluation_assignments ea
        JOIN evaluation_periods ep
          ON ea.period_id = ep.id
        JOIN employees evaluator
          ON ea.evaluator_id = evaluator.id
        JOIN employees evaluatee
          ON ea.evaluatee_id = evaluatee.id
        ORDER BY ea.id DESC
      `);

      return res.json(result.rows);
    }

    // ค้นหา employee_id ของผู้ล็อกอิน
    const userResult = await pool.query(
      `
      SELECT employee_id
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: "ไม่พบข้อมูลผู้ใช้งาน",
      });
    }

    const employeeId = userResult.rows[0].employee_id;

    if (!employeeId) {
      return res.status(400).json({
        message: "บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลบุคลากร",
      });
    }

    // ดึงเฉพาะรายการที่กรรมการคนนี้ได้รับมอบหมาย
    const result = await pool.query(
      `
      SELECT
        ea.id,
        ea.period_id,
        ea.evaluator_id,
        ea.evaluatee_id,
        ea.status,
        ep.period_name,
        evaluator.first_name AS evaluator_first_name,
        evaluator.last_name AS evaluator_last_name,
        evaluatee.first_name AS evaluatee_first_name,
        evaluatee.last_name AS evaluatee_last_name
      FROM evaluation_assignments ea
      JOIN evaluation_periods ep
        ON ea.period_id = ep.id
      JOIN employees evaluator
        ON ea.evaluator_id = evaluator.id
      JOIN employees evaluatee
        ON ea.evaluatee_id = evaluatee.id
      WHERE ea.evaluator_id = $1
      ORDER BY ea.id DESC
      `,
      [employeeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET my assignments error:", error);

    res.status(500).json({
      message: "ไม่สามารถดึงรายการประเมินของผู้ใช้งานได้",
    });
  }
});

// POST: เพิ่มการมอบหมายผู้ประเมิน
router.post("/", async (req, res) => {
  try {
    const {
      period_id,
      evaluator_id,
      evaluatee_id,
    } = req.body;

    if (!period_id || !evaluator_id || !evaluatee_id) {
      return res.status(400).json({
        message: "กรุณากรอกข้อมูลให้ครบ",
      });
    }

    if (Number(evaluator_id) === Number(evaluatee_id)) {
      return res.status(400).json({
        message: "ไม่สามารถประเมินตนเองได้",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO evaluation_assignments
        (period_id, evaluator_id, evaluatee_id)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [period_id, evaluator_id, evaluatee_id]
    );

    res.status(201).json({
      message: "มอบหมายผู้ประเมินสำเร็จ",
      assignment: result.rows[0],
    });
  } catch (error) {
    console.error("POST assignment error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "มีการมอบหมายรายการนี้แล้ว",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "ไม่พบรอบการประเมินหรือบุคลากรที่เลือก",
      });
    }

    res.status(500).json({
      message: "ไม่สามารถมอบหมายผู้ประเมินได้",
    });
  }
});

// DELETE: ลบการมอบหมาย
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM evaluation_assignments
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "ไม่พบรายการมอบหมาย",
      });
    }

    res.json({
      message: "ลบรายการมอบหมายสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE assignment error:", error);

    res.status(500).json({
      message: "ไม่สามารถลบรายการมอบหมายได้",
    });
  }
});

module.exports = router;
