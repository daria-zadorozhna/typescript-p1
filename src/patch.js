export function applyOpsInPlace(obj, ops) {
  for (const op of ops || []) {
    const path = String(op.path || "").trim();
    if (!path) continue;

    if (op.op === "set") setByPath(obj, path, op.value);
    if (op.op === "unset") unsetByPath(obj, path);
    if (op.op === "push") pushByPath(obj, path, op.value);
    if (op.op === "inc") incByPath(obj, path, op.value);
  }
}

function setByPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] ??= {};
    cur = cur[k];
  }
  cur[parts.at(-1)] = value;
}

function unsetByPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur == null) return;
    cur = cur[k];
  }
  if (cur) delete cur[parts.at(-1)];
}

function pushByPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] ??= {};
    cur = cur[k];
  }
  const last = parts.at(-1);
  if (!Array.isArray(cur[last])) cur[last] = [];
  cur[last].push(value);
}

function incByPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] ??= {};
    cur = cur[k];
  }
  const last = parts.at(-1);
  cur[last] =
    (typeof cur[last] === "number" ? cur[last] : 0) + (Number(value) || 0);
}
