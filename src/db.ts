const nowIso = () => new Date().toISOString();
const makeId = (prefix) =>
  `${prefix}_${Math.random().toString(16).slice(2, 10)}`;

// ВАЖНО: "почти все" id — строки, но одна запись имеет id числом.
// Это редкий баг: Map различает 2001 и "2001" => иногда 404, иногда "пропадает" сущность.
const entitiesSeed = [
  {
    id: "p_1001",
    kind: "person",
    name: "Illya Klymov",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    email: "illya@example.com",
    dob: "1990-04-03",
    tags: ["vip", "frontend"],
    custom: { score: 42, isActive: true },
  },
  {
    id: 2001, // <-- subtle: number вместо string
    kind: "company",
    name: "GitLab",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    domain: "gitlab.com",
    foundedAt: "2011-10-08",
    tags: ["b2b"],
    custom: { seats: 5000, isPublic: true },
  },
];

for (let i = 0; i < 18; i++) {
  entitiesSeed.push({
    id: `p_${1100 + i}`,
    kind: "person",
    name: `Person ${i}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    email: i % 7 === 0 ? null : `person${i}@example.com`,
    dob: i % 9 === 0 ? undefined : `199${i % 10}-0${(i % 8) + 1}-1${i % 9}`,
    tags: i % 3 === 0 ? ["new"] : [],
    custom: { score: i * 3 },
  });
}

for (let i = 0; i < 10; i++) {
  entitiesSeed.push({
    id: `c_${2100 + i}`,
    kind: "company",
    name: `Company ${i}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    domain: i % 5 === 0 ? undefined : `company${i}.example`,
    foundedAt: `200${i}-01-01`,
    tags: i % 4 === 0 ? ["partner"] : [],
    custom: { seats: 10 + i, churnRisk: i % 6 === 0 ? 0.9 : 0.2 },
  });
}

export const entities = new Map(entitiesSeed.map((e) => [e.id, e]));

const dealsSeed = [
  {
    id: "d_3001",
    title: "Renewal Q4",
    stage: "proposal",
    amount: 12000,
    ownerId: "p_1001",
    contactIds: ["p_1001"],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    id: "d_3002",
    title: "Enterprise Upsell",
    stage: "negotiation",
    amount: 50000,
    ownerId: 2001, // <-- subtle: привязка к company с numeric id
    contactIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
];

for (let i = 0; i < 10; i++) {
  dealsSeed.push({
    id: `d_${3100 + i}`,
    title: `Deal ${i}`,
    stage: i % 3 === 0 ? "lead" : "proposal",
    amount: 1000 + i * 250,
    ownerId: `p_${1100 + (i % 6)}`,
    contactIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
}

export const deals = new Map(dealsSeed.map((d) => [d.id, d]));

export const notesByKey = new Map();
// key = `${kind}:${id}`

export function listNotes(kind, id) {
  return notesByKey.get(`${kind}:${id}`) ?? [];
}

export function addNote(kind, id, text) {
  const note = {
    id: makeId("n"),
    subjectKind: kind,
    subjectId: id,
    text,
    createdAt: nowIso(),
  };
  const key = `${kind}:${id}`;
  const arr = notesByKey.get(key);
  if (arr) arr.push(note);
  else notesByKey.set(key, [note]);
  return note;
}

export function touch(obj) {
  obj.updatedAt = nowIso();
}

export function createDeal({ title, amount, ownerId, contactIds }) {
  const d = {
    id: makeId("d"),
    title,
    stage: "lead",
    amount: Number(amount) || 0,
    ownerId,
    contactIds: Array.isArray(contactIds) ? contactIds : [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  deals.set(d.id, d);
  return d;
}
