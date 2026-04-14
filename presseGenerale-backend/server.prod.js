const path = require("path");
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

dotenv.config({ path: path.join(__dirname, ".env.production") });

const app = express();

const isDev = process.env.NODE_ENV !== "production";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isDev || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));

// Front + Cypress utilisent REACT_APP_PRESSE_GENERALE_API=…/api puis /messages/* ; routes réelles sous /api/presse-generale/messages/*.
app.use((req, res, next) => {
  const u = req.url.split("?")[0];
  if (u === "/api/messages" || u.startsWith("/api/messages/")) {
    req.url = req.url.replace(/^\/api\/messages/, "/api/presse-generale/messages");
  } else if (u.startsWith("/api/message/")) {
    req.url = req.url.replace(/^\/api\/message\//, "/api/presse-generale/messages/");
  }
  next();
});

const upload = multer({ storage: multer.memoryStorage() });

let nextId = 1;
const messages = [];

function requireBearer(req, res, next) {
  const auth = req.header("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

app.get("/", (req, res) => res.status(200).send("PRESSE-GENERALE-BACKEND (prod) actif"));

function findMessageById(id) {
  return messages.find((m) => Number(m.id) === Number(id));
}

/** Lecture publique du seul champ format (point de vérité pour media-backend). */
app.get("/api/presse-generale/messages/:id/format", (req, res) => {
  const id = Number(req.params.id);
  const m = findMessageById(id);
  if (!m) return res.status(404).json({ error: "not found" });
  const fmt = m.format != null && m.format !== "" ? String(m.format) : null;
  return res.status(200).json({ id: m.id, format: fmt });
});

app.get("/api/presse-generale/messages/", requireBearer, (req, res) => {
  res.json(messages);
});

function createMessageFromRequest(req, res) {
  const body = req.body || {};
  const title = (body.title || body.titre || "").toString();
  const content = (body.content || body.contenu || "").toString();
  const format = body.format != null ? String(body.format).trim() : null;

  if (!title) return res.status(400).json({ error: "title required" });

  const created = {
    id: nextId++,
    title,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...body,
  };

  created.title = title;
  created.content = content;
  if (format) created.format = format;

  messages.unshift(created);
  return res.status(201).json(created);
}

app.post("/api/presse-generale/messages/new", requireBearer, upload.any(), (req, res) => {
  return createMessageFromRequest(req, res);
});
app.post("/api/presse-generale/messages/new/", requireBearer, upload.any(), (req, res) => {
  return createMessageFromRequest(req, res);
});

app.post("/api/presse-generale/messages/", requireBearer, (req, res) => {
  return createMessageFromRequest(req, res);
});

app.get("/api/presse-generale/messages/:id", requireBearer, (req, res) => {
  const id = Number(req.params.id);
  const m = findMessageById(id);
  if (!m) return res.status(404).json({ error: "not found" });
  return res.json(m);
});

app.put("/api/presse-generale/messages/:id", requireBearer, (req, res) => {
  const id = Number(req.params.id);
  const idx = messages.findIndex((m) => Number(m.id) === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });

  const current = messages[idx];
  const updated = {
    ...current,
    ...req.body,
    id: current.id,
    updatedAt: new Date().toISOString(),
  };
  messages[idx] = updated;
  res.json(updated);
});

app.delete("/api/presse-generale/messages/:id", requireBearer, (req, res) => {
  const id = Number(req.params.id);
  const idx = messages.findIndex((m) => Number(m.id) === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });
  messages.splice(idx, 1);
  res.status(204).send();
});

/** Supervision / E2E (002_servicesStatusExtended) : statuts attendus 200 | 401 | 400. */
app.get("/api/ping", (req, res) => {
  res.status(200).json({ ok: true, store: "memory" });
});

const port = Number(process.env.PORT || 7006);
app.listen(port, () => {
  console.log(`presseGenerale-backend listening on ${port}`);
});
