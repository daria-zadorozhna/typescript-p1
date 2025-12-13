import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  entities,
  deals,
  addNote,
  listNotes,
  touch,
  createDeal,
} from "./db.js";
import { applyOpsInPlace } from "./patch.js";

const app = express();
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use("/", express.static(path.join(__dirname, "../public")));

app.get("/api/search", (req, res) => {
  const q = String(req.query.q ?? "")
    .toLowerCase()
    .trim();

  const result = [];

  for (const e of entities.values()) {
    if (!q || String(e.name).toLowerCase().includes(q)) {
      result.push({
        id: e.id,
        kind: e.kind, // "person" | "company"
        name: e.name,
        hint:
          e.kind === "company"
            ? (e.domain ?? "no-domain")
            : (e.email ?? "no-email"),
      });
    }
  }

  for (const d of deals.values()) {
    if (!q || d.title.toLowerCase().includes(q)) {
      result.push({
        id: d.id,
        kind: "deal",
        name: d.title,
        hint: `${d.stage} • $${d.amount}`,
      });
    }
  }

  result.sort((a, b) => String(a.name).localeCompare(String(b.name)));

  res.json({ query: q, result });
});

app.get("/api/entity/:id", (req, res) => {
  const id = req.params.id;
  const e = entities.get(id) || entities.get(Number(id));
  if (!e) return res.status(404).json({ error: "Entity not found" });
  res.json({ id, result: e });
});

app.get("/api/deal/:id", (req, res) => {
  const id = req.params.id;
  const d = deals.get(id);
  if (!d) return res.status(404).json({ error: "Deal not found" });
  res.json({ id, result: d });
});

app.get("/api/deals", (req, res) => {
  const ownerId = req.query.ownerId;
  const result = [];
  for (const d of deals.values()) {
    if (ownerId == null || d.ownerId == ownerId) result.push(d);
  }
  res.json({ ownerId, result });
});

app.post("/api/deal", (req, res) => {
  const body = req.body || {};
  const deal = createDeal({
    title: body.title,
    amount: body.amount,
    ownerId: body.ownerId,
    contactIds: body.contactIds,
  });
  res.json({ body, result: deal });
});

app.patch("/api/entity/:id", (req, res) => {
  const id = req.params.id;
  const entity = entities.get(id) || entities.get(Number(id));
  if (!entity) return res.status(404).json({ error: "Entity not found" });

  const body = req.body || {};

  if (body.meta?.snapshot) {
    Object.assign(entity, body.meta.snapshot);
  }
  applyOpsInPlace(entity, body.ops);

  touch(entity);

  res.json({ id, body, result: entity });
});

app.patch("/api/deal/:id", (req, res) => {
  const id = req.params.id;
  const deal = deals.get(id);
  if (!deal) return res.status(404).json({ error: "Deal not found" });

  const body = req.body || {};
  applyOpsInPlace(deal, body.ops);

  if (body.meta?.snapshot) {
    Object.assign(deal, body.meta.snapshot);
  }

  touch(deal);

  res.json({ id, body, result: deal });
});

app.get("/api/notes", (req, res) => {
  const subjectKind = String(req.query.subjectKind ?? "");
  const subjectId = req.query.subjectId; // string
  res.json({
    subjectKind,
    subjectId,
    result: listNotes(subjectKind, subjectId),
  });
});

app.post("/api/note", (req, res) => {
  const body = req.body || {};
  const note = addNote(body.subjectKind, body.subjectId, body.text);
  res.json({ body, result: note });
});

app.listen(3000, () => console.log("http://localhost:3000"));
