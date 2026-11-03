
const express = require("express");
const cors = require("cors");

const employeeRoutes = require("./routes/employeeRoutes");
const evaluationRoutes = require("./routes/evaluationRoutes");
const authRoutes = require("./routes/auth.routes");
const indicatorRoutes = require("./routes/indicatorRoutes");
const periodRoutes = require("./routes/periodRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const scoreRoutes = require("./routes/scoreRoutes");
const periodTopicRoutes = require("./routes/periodTopicRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/evaluation-topics", evaluationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/indicators", indicatorRoutes);
app.use("/api/evaluation-periods", periodRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/scores", scoreRoutes);
app.use("/api/period-topics", periodTopicRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Personnel Evaluation API is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is healthy",
  });
});

module.exports = app;
