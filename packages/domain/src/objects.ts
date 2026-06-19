import type {
  DecisionLog,
  GardenData,
  JournalEntry,
  MentalModel,
  ObjectNote,
  ObjectRef,
  ObjectRelation,
  ObjectVisibility,
  SourceRecord,
  SourceType,
  UniversalObjectKind,
} from "@garden/types";

export interface UniversalObject {
  ref: ObjectRef;
  title: string;
  kind: UniversalObjectKind;
  createdAt: string;
  summary: string;
  text: string;
  href: string;
  metadata?: string;
  workspaceId?: string;
  visibility?: ObjectVisibility;
  createdBy?: string;
}

export interface ObjectBacklink {
  id: string;
  title: string;
  kind: string;
  href: string;
  text: string;
  ref?: ObjectRef;
}

export interface RelatedObject {
  object: UniversalObject;
  label?: string;
  source: "relation" | "backlink" | "inferred";
}

const WIKI_LINK_PATTERN = /\[\[([^\]\n]+)\]\]/g;
const URL_PATTERN = /https?:\/\/[^\s)]+/g;

export const objectKey = (ref: ObjectRef) => `${ref.kind}:${ref.id}`;

export const objectPath = (ref: ObjectRef) => `/objects/${ref.kind}/${ref.id}`;

export const sameObject = (left: ObjectRef, right: ObjectRef) =>
  left.kind === right.kind && left.id === right.id;

export const parseWikiLinks = (text: string): string[] => {
  const titles: string[] = [];
  for (const match of text.matchAll(WIKI_LINK_PATTERN)) {
    const title = match[1]?.trim();
    if (title) titles.push(title);
  }
  return titles;
};

export const extractUrls = (text: string) =>
  [...text.matchAll(URL_PATTERN)].map((match) => match[0].replace(/[.,;!?]+$/, ""));

const hostLabel = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Source";
  }
};

const isYoutubeUrl = (url: string) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com");
  } catch {
    return false;
  }
};

const newsHosts = ["news", "bbc", "cnn", "nytimes", "guardian", "statnews", "techcrunch", "theinformation", "wsj"];

const detectSourceType = (url: string): SourceType => {
  if (isYoutubeUrl(url)) return "youtube";
  const host = hostLabel(url).toLowerCase();
  if (newsHosts.some((token) => host.includes(token))) return "news";
  return /^https?:\/\//i.test(url) ? "article" : "link";
};

export const createSourceFromUrl = (url: string, date = new Date().toISOString()): SourceRecord => {
  const trimmed = url.trim();
  const sourceType = detectSourceType(trimmed);
  const publisher = hostLabel(trimmed);
  return {
    id: crypto.randomUUID(),
    createdAt: date,
    title: sourceType === "youtube" ? "YouTube source" : `${publisher} source`,
    url: trimmed,
    sourceType,
    publisher,
  };
};

const contentSummary = (item: GardenData["workItems"][number]) =>
  item.hook ?? item.audience ?? "Captured content idea waiting for an angle.";

export const getUniversalObjects = (data: GardenData): UniversalObject[] => [
  ...data.relationships.map((record) => {
    const ref: ObjectRef = { kind: record.kind, id: record.id };
    const noteText = record.notes.map((note) => note.body).join(" ");
    return {
      ref,
      kind: record.kind,
      title: record.name,
      createdAt: record.createdAt,
      summary: record.role ?? `${record.kind === "person" ? "Person" : "Company"} relationship`,
      text: `${record.name} ${record.role ?? ""} ${noteText}`,
      href: objectPath(ref),
      metadata: record.stage,
      workspaceId: record.workspaceId,
      visibility: record.visibility,
      createdBy: record.createdBy,
    };
  }),
  ...data.workItems.filter((item) => item.kind === "content").map((item) => {
    const ref: ObjectRef = { kind: "content", id: item.id };
    return {
      ref,
      kind: "content" as const,
      title: item.title,
      createdAt: item.createdAt,
      summary: contentSummary(item),
      text: `${item.title} ${item.audience ?? ""} ${item.hook ?? ""}`,
      href: objectPath(ref),
      metadata: item.contentStage ?? "seed",
      workspaceId: item.workspaceId,
      visibility: item.visibility,
      createdBy: item.createdBy,
    };
  }),
  ...data.fieldNotes.map((note) => {
    const ref: ObjectRef = { kind: "note", id: note.id };
    return {
      ref,
      kind: "note" as const,
      title: note.title,
      createdAt: note.createdAt,
      summary: note.body,
      text: `${note.title} ${note.body} ${note.tags.join(" ")} ${note.sourceUrl ?? ""}`,
      href: objectPath(ref),
      metadata: note.category,
      workspaceId: note.workspaceId,
      visibility: note.visibility,
      createdBy: note.createdBy,
    };
  }),
  ...data.sources.map((source) => {
    const ref: ObjectRef = { kind: "source", id: source.id };
    return {
      ref,
      kind: "source" as const,
      title: source.title,
      createdAt: source.createdAt,
      summary: source.summary ?? source.url,
      text: `${source.title} ${source.summary ?? ""} ${source.url} ${source.publisher ?? ""}`,
      href: objectPath(ref),
      metadata: source.sourceType,
      workspaceId: source.workspaceId,
      visibility: source.visibility,
      createdBy: source.createdBy,
    };
  }),
];

export const getObjectByRef = (data: GardenData, ref: ObjectRef) =>
  getUniversalObjects(data).find((object) => sameObject(object.ref, ref)) ?? null;

export const getObjectNotes = (data: GardenData, ref: ObjectRef): ObjectNote[] => {
  const universalNotes = data.objectNotes.filter((note) => sameObject(note.object, ref));
  if (ref.kind !== "person" && ref.kind !== "company") return universalNotes;
  const legacy = data.relationships.find((record) => record.id === ref.id)?.notes ?? [];
  const legacyNotes = legacy.map((note) => ({
    id: note.id,
    object: ref,
    createdAt: note.createdAt,
    body: note.body,
    kind: note.kind,
  }));
  return [...universalNotes, ...legacyNotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

const sourceDocs = (data: GardenData): ObjectBacklink[] => [
  ...getUniversalObjects(data).map((object) => ({
    id: objectKey(object.ref),
    title: object.title,
    kind: object.kind,
    href: object.href,
    text: [
      object.text,
      getObjectNotes(data, object.ref).map((note) => note.body).join(" "),
      data.objectLinks.filter((link) => sameObject(link.object, object.ref)).map((link) => `${link.label ?? ""} ${link.url}`).join(" "),
    ].join(" "),
    ref: object.ref,
  })),
  ...data.mentalModels.map((model: MentalModel) => ({
    id: `model:${model.id}`,
    title: model.title,
    kind: "model",
    href: `/think/clarity?ref=${model.id}`,
    text: `${model.principle} ${model.application}`,
  })),
  ...data.decisions.map((decision: DecisionLog) => ({
    id: `decision:${decision.id}`,
    title: decision.decision,
    kind: "decision",
    href: `/think?ref=${decision.id}`,
    text: decision.rationale,
  })),
  ...data.journal.map((entry: JournalEntry) => ({
    id: `journal:${entry.id}`,
    title: `${entry.title} · ${entry.date}`,
    kind: "journal",
    href: "/think",
    text: entry.body,
  })),
];

export const getBacklinks = (data: GardenData, ref: ObjectRef): ObjectBacklink[] => {
  const object = getObjectByRef(data, ref);
  if (!object) return [];
  const target = object.title.trim().toLowerCase();
  return sourceDocs(data)
    .filter((doc) => doc.id !== objectKey(ref))
    .filter((doc) => parseWikiLinks(doc.text).some((link) => link.toLowerCase() === target));
};

const relationMatches = (relation: ObjectRelation, ref: ObjectRef) =>
  sameObject(relation.from, ref) || sameObject(relation.to, ref);

const otherSide = (relation: ObjectRelation, ref: ObjectRef) =>
  sameObject(relation.from, ref) ? relation.to : relation.from;

export const getRelatedObjects = (data: GardenData, ref: ObjectRef): RelatedObject[] => {
  const related = new Map<string, RelatedObject>();
  const add = (object: UniversalObject | null, label: string | undefined, source: RelatedObject["source"]) => {
    if (!object || sameObject(object.ref, ref)) return;
    const key = objectKey(object.ref);
    if (!related.has(key)) related.set(key, { object, label, source });
  };

  data.objectRelations
    .filter((relation) => relationMatches(relation, ref))
    .forEach((relation) => add(getObjectByRef(data, otherSide(relation, ref)), relation.label, "relation"));

  if (ref.kind === "person") {
    const record = data.relationships.find((item) => item.id === ref.id);
    if (record?.companyId) add(getObjectByRef(data, { kind: "company", id: record.companyId }), "works-at", "inferred");
  }
  if (ref.kind === "company") {
    data.relationships
      .filter((record) => record.kind === "person" && record.companyId === ref.id)
      .forEach((record) => add(getObjectByRef(data, { kind: "person", id: record.id }), "works-at", "inferred"));
  }

  getBacklinks(data, ref).forEach((backlink) => {
    if (backlink.ref) add(getObjectByRef(data, backlink.ref), "mentions", "backlink");
  });

  return [...related.values()];
};

export const parseTimestamp = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part) || part < 0)) return null;
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds > 59) return null;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (minutes > 59 || seconds > 59) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null;
};

export const formatTimestamp = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const rest = safe % 60;
  const pad = (value: number) => value.toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(rest)}` : `${minutes}:${pad(rest)}`;
};

export const urlAtTimestamp = (url: string, seconds?: number) => {
  if (seconds == null) return url;
  try {
    const value = new URL(url);
    value.searchParams.set("t", `${Math.max(0, Math.floor(seconds))}`);
    return value.toString();
  } catch {
    return url;
  }
};
