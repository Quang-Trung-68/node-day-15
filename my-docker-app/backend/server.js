import "dotenv/config";
import cors from "cors";
import express from "express";
import mysql from "mysql2/promise";

const PORT = Number(process.env.PORT || 3000);

function getDbConfig() {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
  };
}

let pool;

async function connectWithRetry(maxAttempts = 30, delayMs = 2000) {
  const cfg = getDbConfig();
  for (let i = 0; i < maxAttempts; i++) {
    try {
      pool = mysql.createPool({
        ...cfg,
        waitForConnections: true,
        connectionLimit: 10,
      });
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      await initDb();
      return;
    } catch (err) {
      console.warn(`DB connect attempt ${i + 1}/${maxAttempts}:`, err.message);
      if (pool) {
        try {
          await pool.end();
        } catch {
          /* ignore */
        }
        pool = undefined;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Could not connect to database");
}

async function initDb() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL
    )
  `);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

app.get("/health", async (req, res) => {
  try {
    if (!pool) throw new Error("Pool not ready");
    await pool.execute("SELECT 1");
    res.status(200).json({ db: "connected" });
  } catch {
    res.status(500).json({ db: "disconnected" });
  }
});

app.get("/items", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name FROM items ORDER BY id ASC"
    );
    res.status(200).json(rows);
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/items", async (req, res) => {
  try {
    const name = req.body?.name;
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: 'Body must include { "name": "..." }' });
    }
    const [result] = await pool.execute("INSERT INTO items (name) VALUES (?)", [
      name.trim(),
    ]);
    res.status(201).json({ id: result.insertId, name: name.trim() });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

async function start() {
  await connectWithRetry();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
