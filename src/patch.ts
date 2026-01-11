import assert from "node:assert";

type Operation = {
  op: "set" | "unset" | "push" | "inc",
  path: string,
  value: unknown
}
type UnknownObj = Record<string, unknown>;

function assertNever(_x: never) {
  throw new Error("")
}
export function applyOpsInPlace(obj: UnknownObj, ops: Operation[]) {
  for (const op of ops || []) {
    const path = String(op.path || "").trim();
    if (!path) continue;
    //or use ts-pattern or effect
    switch (op.op) {
      case "set":
        setByPath(obj, path, op.value);
        break;
      case "unset":
        unsetByPath(obj, path);
        break;
      case "push":
        pushByPath(obj, path, op.value);
        break;
      case "inc":
        incByPath(obj, path, op.value);
        break;
      default: assertNever(op.op);
    }

  }
}

function setByPath(obj: UnknownObj, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    assert(k) // from "node:assert"; instead ( k! )
    obj[k] ??= {}
    cur = obj[k] as Record<string, unknown> //we know for sure 
  }
  const last = parts.at(-1);
  // assert(last) OR:
  if (!last) throw new Error("No value");
  cur[last] = value;
}

function unsetByPath(obj: UnknownObj, path: string) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    assert(k)
    if (cur == null) return;
    cur = cur[k] as Record<string, unknown>;
  }
  if (cur) {
    const last = parts.at(-1);
    assert(last)
    //eslint-disable-next-line
    delete cur[last];// not optimized operation. dismiss alert: typescript-eslint/no-dynamic-delete
  }
}

function pushByPath(obj: UnknownObj, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    assert(k)
    cur[k] ??= {};
    cur = cur[k] as Record<string, unknown>;
  }
  const last = parts.at(-1);
  assert(last);
  const curArr = Array.isArray(cur[last]) ? cur[last] : [];
  curArr.push(value);
}

function incByPath(obj: UnknownObj, path: string, value: unknown) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    assert(k);
    cur[k] ??= {};
    cur = cur[k] as Record<string, unknown>;
  }
  const last = parts.at(-1);
  assert(last);
  cur[last] =
    (typeof cur[last] === "number" ? cur[last] : 0) + (Number(value) || 0);
}
