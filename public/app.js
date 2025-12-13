async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.json();
}

const $ = (id) => document.getElementById(id);

const q = $("q");
const searchBtn = $("searchBtn");
const list = $("list");

const details = $("details");
const raw = $("raw");

const dealTitle = $("dealTitle");
const dealAmount = $("dealAmount");
const createDealBtn = $("createDealBtn");
const ownerDeals = $("ownerDeals");

const pathInput = $("path");
const valueInput = $("value");
const applyPatchBtn = $("applyPatchBtn");

const noteKind = $("noteKind");
const noteText = $("noteText");
const addNoteBtn = $("addNoteBtn");
const notesDiv = $("notes");
let selected = null;
let selectedDetails = null;

searchBtn.onclick = async () => {
  const data = await fetchJson(`/api/search?q=${encodeURIComponent(q.value)}`);
  renderList(data.result);
};

function renderList(items) {
  list.innerHTML = "";

  for (const item of items) {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <div><b>${escapeHtml(String(item.name))}</b></div>
      <div class="muted">${escapeHtml(String(item.kind))} • ${escapeHtml(String(item.hint ?? ""))}</div>
      <div class="muted">${escapeHtml(String(item.id))}</div>
    `;

    el.onclick = async () => {
      selected = item;
      const d = await fetchJson(
        `/api/entity/${encodeURIComponent(String(item.id))}`,
      );
      selectedDetails = d.result;

      renderDetails();
      await refreshNotes();
      await refreshOwnerDeals();
    };

    list.appendChild(el);
  }
}

function renderDetails() {
  if (!selectedDetails) {
    details.textContent = "Select item...";
    return;
  }

  details.innerHTML = `
    <div><b>${escapeHtml(String(selectedDetails.name || selectedDetails.title))}</b></div>
    <div class="muted">id: ${escapeHtml(String(selectedDetails.id))}</div>
    <div class="muted">kind: ${escapeHtml(String(selectedDetails.kind || "deal?"))}</div>
  `;
  raw.textContent = JSON.stringify(selectedDetails, null, 2);
}

createDealBtn.onclick = async () => {
  if (!selected) return;

  const body = {
    title: dealTitle.value,
    amount: dealAmount.value,
    entityId: selected.id,
  };

  await fetchJson("/api/deal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await refreshOwnerDeals();
};

async function refreshOwnerDeals() {
  ownerDeals.innerHTML = "";
  if (!selected) return;

  const data = await fetchJson(
    `/api/deals?ownerId=${encodeURIComponent(String(selected.id))}`,
  );
  ownerDeals.innerHTML = data.result
    .map(
      (d) => `<div class="card">
        <div><b>${escapeHtml(d.title)}</b></div>
        <div class="muted">${escapeHtml(d.stage)} • $${escapeHtml(String(d.amount))}</div>
        <div class="muted">dealId: ${escapeHtml(String(d.id))}, ownerId: ${escapeHtml(String(d.ownerId))}</div>
      </div>`,
    )
    .join("");
}

applyPatchBtn.onclick = async () => {
  if (!selected || !selectedDetails) return;

  const path = pathInput.value.trim();
  const value = parseJsonMaybe(valueInput.value);

  const op =
    value === undefined ? { op: "unset", path } : { op: "set", path, value };

  // subtle: snapshot “выглядит удобно”, но может перетереть поля устаревшим объектом
  const body = {
    ops: [op],
    meta: {
      clientRequestId: String(Date.now()),
      snapshot: selectedDetails,
    },
  };

  // второй ключевой JS-баг:
  // даже если выбран deal (kind="deal"), фронт всё равно патчит entity endpoint
  const updated = await fetchJson(
    `/api/entity/${encodeURIComponent(String(selected.id))}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  selectedDetails = updated.result;
  renderDetails();
};

addNoteBtn.onclick = async () => {
  if (!selected) return;

  // subtle: UI позволяет выбрать noteKind, но id берёт “selected.id” (это может быть deal id),
  // а сервер ожидает согласованность kind/id. Неправильная комбинация “сохранится”, но потом “не найдётся”.
  const body = {
    subjectKind: noteKind.value,
    subjectId: selected.id,
    text: noteText.value,
  };

  await fetchJson("/api/note", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  noteText.value = "";
  await refreshNotes();
};

async function refreshNotes() {
  notesDiv.innerHTML = "";
  if (!selected) return;

  const data = await fetchJson(
    `/api/notes?subjectKind=${encodeURIComponent(noteKind.value)}&subjectId=${encodeURIComponent(String(selected.id))}`,
  );

  notesDiv.innerHTML = data.result
    .map(
      (n) =>
        `<div class="card"><div>${escapeHtml(String(n.text))}</div><div class="muted">${escapeHtml(n.createdAt)}</div></div>`,
    )
    .join("");
}

function parseJsonMaybe(input) {
  const s = String(input || "").trim();
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
