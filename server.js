import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { verifySignature, announcementsFromPush } from "./lib/github.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

await pool.query(`
  CREATE TABLE IF NOT EXISTS announcements (
    id serial PRIMARY KEY,
    repo text NOT NULL,
    sha text UNIQUE NOT NULL,
    author text,
    message text NOT NULL,
    changes jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

async function handleGithub(req, res) {
  const raw = await readBody(req);
  if (!verifySignature(WEBHOOK_SECRET, raw, req.headers["x-hub-signature-256"])) {
    res.writeHead(401).end("invalid signature");
    return;
  }
  const event = req.headers["x-github-event"];
  if (event === "ping") return res.writeHead(200).end("pong");
  if (event !== "push") return res.writeHead(202).end("ignored event");

  const payload = JSON.parse(raw.toString("utf8"));
  const rows = announcementsFromPush(payload);
  if (rows === null) return res.writeHead(202).end("ignored branch");

  let stored = 0;
  for (const r of rows) {
    const result = await pool.query(
      `INSERT INTO announcements (repo, sha, author, message, changes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (sha) DO NOTHING`,
      [r.repo, r.sha, r.author, r.message, JSON.stringify(r.changes)]
    );
    stored += result.rowCount;
  }
  sendJson(res, 200, { stored });
}

async function serveStatic(req, res, pathname) {
  const filePath = normalize(join(ROOT, pathname === "/" ? "index.html" : pathname));
  if (!filePath.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end("not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "POST" && url.pathname === "/github") return await handleGithub(req, res);
    if (req.method === "GET" && url.pathname === "/health") return res.writeHead(200).end("ok");
    if (req.method === "GET" && url.pathname === "/api/announcements") {
      const { rows } = await pool.query(
        `SELECT id, repo, sha, author, message, changes, created_at
         FROM announcements ORDER BY id DESC LIMIT 50`
      );
      return sendJson(res, 200, rows);
    }
    if (req.method === "GET" && url.pathname === "/api/announcements/latest") {
      const { rows } = await pool.query(`SELECT COALESCE(MAX(id), 0)::int AS max FROM announcements`);
      return sendJson(res, 200, { max: rows[0].max });
    }
    if (req.method === "GET") return await serveStatic(req, res, url.pathname);
    res.writeHead(405).end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500).end("server error");
  }
});

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

