import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth/auth.js";
import todoRoutes from "./routes/todos/todos.js";
import userRoutes from "./routes/user/user.js";
import notFound from "./middleware/notFound.js";
import pool from "./config/db.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:8080",
  credentials: true
}));

app.use("/auth", authRoutes);
app.use("/todos", todoRoutes);
app.use("/user", userRoutes);

app.use(notFound);

const PORT = process.env.PORT || 5000;

async function waitForMysql() {
  let connected = false;
  while (!connected) {
    try {
      await pool.query("SELECT 1");
      connected = true;
      console.log("MySQL is ready !");
    } catch (err) {
      console.log("MySQL error, new start in 1s...");
      await new Promise(res => setTimeout(res, 1000));
    }
  }
}

async function startServer() {
  await waitForMysql();
  app.listen(PORT, () => {
    console.log(`API started on port : ${PORT}`);
  });
}

startServer();
