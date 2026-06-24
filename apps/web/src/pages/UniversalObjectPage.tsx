import {
  DEFAULT_PRIVATE_WORKSPACE_ID,
  createId,
  extractUrls,
  formatTimestamp,
  getBacklinks,
  getObjectByRef,
  getObjectNotes,
  getRelatedObjects,
  getUniversalObjects,
  objectPath,
  parseTimestamp,
  urlAtTimestamp,
} from "@garden/domain";
import { createContentIdeaFromSourceNote, useGarden } from "@garden/shared-state";
import type { ObjectNoteKind, ObjectRef, ObjectRelationLabel, SourceRecord, SourceType, UniversalObjectKind } from "@garden/types";
import { Button, Card, cn, Input, Label, Pill, SectionHeading, Textarea } from "@garden/ui";
import { ArrowLeft, ExternalLink, Link as LinkIcon, Plus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

const objectKinds: UniversalObjectKind[] = ["person", "company", "content", "note", "source"];
const noteKinds: ObjectNoteKind[] = ["note", "idea", "link"];
const relationLabels: ObjectRelationLabel[] = ["mentions", "source-for", "about", "works-at", "inspired-by"];
const sourceTypes: SourceType[] = ["youtube", "podcast", "article", "news", "link"];

const toneForKind = (kind: UniversalObjectKind) => kind === "source" || kind === "content" ? "sage" : kind === "note" ? "stone" : "clay";

const isObjectKind = (kind: string | undefined): kind is UniversalObjectKind =>
  Boolean(kind && objectKinds.includes(kind as UniversalObjectKind));

const youtubeEmbedUrl = (url: string) => {
  try {
    const value = new URL(url);
    const host = value.hostname.replace(/^www\./, "");
    const id = host === "youtu.be" ? value.pathname.slice(1) : value.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}` : null;
  } catch {
    return null;
  }
};

const sameRef = (left: ObjectRef, right: ObjectRef) => left.kind === right.kind && left.id === right.id;

export const UniversalObjectPage = () => {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const { currentMemberId, data, update } = useGarden();
  const [noteBody, setNoteBody] = useState("");
  const [noteKind, setNoteKind] = useState<ObjectNoteKind>("note");
  const [timestamp, setTimestamp] = useState("");
  const [timestampError, setTimestampError] = useState<string | null>(null);
  const [linkDraft, setLinkDraft] = useState({ url: "", label: "" });
  const [nextAction, setNextAction] = useState("");
  const [relationTarget, setRelationTarget] = useState("");
  const [relationLabel, setRelationLabel] = useState<ObjectRelationLabel>("mentions");
  const [noteRelationTargets, setNoteRelationTargets] = useState<Record<string, string>>({});
  const [commentBody, setCommentBody] = useState("");
  const [commentAuthorId, setCommentAuthorId] = useState(currentMemberId);

  if (!isObjectKind(kind) || !id) return <Navigate replace to="/think" />;

  const ref: ObjectRef = { kind, id };
  const object = getObjectByRef(data, ref);
  const objectWorkspaceId = object?.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID;
  const objectVisibility = object?.visibility ?? "private";
  const notes = getObjectNotes(data, ref);
  const related = getRelatedObjects(data, ref);
  const backlinks = getBacklinks(data, ref);
  const allObjects = getUniversalObjects(data);
  const relationOptions = allObjects.filter((item) => !sameRef(item.ref, ref) && (item.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === objectWorkspaceId);
  const explicitLinks = data.objectLinks.filter((link) => sameRef(link.object, ref));
  const outboundUrls = object
    ? [...new Set([
      ...explicitLinks.map((link) => link.url),
      ...extractUrls(object.text),
      ...notes.flatMap((note) => extractUrls(note.body)),
    ])]
    : [];
  const activity = data.objectActivity
    .filter((item) => sameRef(item.object, ref))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const actions = data.objectNextActions.filter((item) => sameRef(item.object, ref));
  const comments = data.objectComments
    .filter((item) => sameRef(item.object, ref) && item.workspaceId === objectWorkspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (!object) {
    return (
      <Card className="p-8">
        <Pill tone="stone">Missing object</Pill>
        <h1 className="mt-4 font-serif text-4xl tracking-tight">This object is not in your Garden.</h1>
        <Button className="mt-6" variant="secondary" onClick={() => navigate("/think")}>Back to Think</Button>
      </Card>
    );
  }

  const source = ref.kind === "source" ? data.sources.find((item) => item.id === ref.id) : undefined;
  const embedUrl = source?.sourceType === "youtube" ? youtubeEmbedUrl(source.url) : null;

  const updateTitle = (title: string) => update((current) => {
    if (ref.kind === "person" || ref.kind === "company") {
      return { ...current, relationships: current.relationships.map((item) => item.id === ref.id ? { ...item, name: title } : item) };
    }
    if (ref.kind === "content") {
      return { ...current, workItems: current.workItems.map((item) => item.id === ref.id ? { ...item, title } : item) };
    }
    if (ref.kind === "note") {
      return { ...current, fieldNotes: current.fieldNotes.map((item) => item.id === ref.id ? { ...item, title } : item) };
    }
    return { ...current, sources: current.sources.map((item) => item.id === ref.id ? { ...item, title } : item) };
  });

  const updateSummary = (summary: string) => update((current) => {
    if (ref.kind === "person" || ref.kind === "company") {
      return { ...current, relationships: current.relationships.map((item) => item.id === ref.id ? { ...item, role: summary } : item) };
    }
    if (ref.kind === "content") {
      return { ...current, workItems: current.workItems.map((item) => item.id === ref.id ? { ...item, hook: summary } : item) };
    }
    if (ref.kind === "note") {
      return { ...current, fieldNotes: current.fieldNotes.map((item) => item.id === ref.id ? { ...item, body: summary } : item) };
    }
    return { ...current, sources: current.sources.map((item) => item.id === ref.id ? { ...item, summary } : item) };
  });

  const updateSource = (change: Partial<SourceRecord>) => update((current) => ({
    ...current,
    sources: current.sources.map((item) => item.id === ref.id ? { ...item, ...change } : item),
  }));

  const memberName = (memberId?: string) => data.members.find((member) => member.id === memberId)?.name ?? "Someone";

  const addNote = () => {
    const body = noteBody.trim();
    if (!body) return;
    const timestampText = timestamp.trim();
    const parsedTimestamp = timestampText ? parseTimestamp(timestampText) : undefined;
    if (timestampText && parsedTimestamp == null) {
      setTimestampError("Use seconds, MM:SS or HH:MM:SS.");
      return;
    }
    const timestampSeconds = parsedTimestamp ?? undefined;
    setTimestampError(null);
    const createdAt = new Date().toISOString();
    update((current) => ({
      ...current,
      objectNotes: [
        {
          id: createId(),
          object: ref,
          createdAt,
          body,
          kind: noteKind,
          timestampSeconds,
          workspaceId: objectWorkspaceId,
          visibility: objectVisibility,
          createdBy: currentMemberId,
        },
        ...current.objectNotes,
      ],
      objectLinks: noteKind === "link" && /^https?:\/\//i.test(body)
        ? [{ id: createId(), object: ref, createdAt, url: body, label: "Note link", workspaceId: objectWorkspaceId, visibility: objectVisibility, createdBy: currentMemberId }, ...current.objectLinks]
        : current.objectLinks,
      objectActivity: [
        { id: createId(), object: ref, createdAt, action: "Added note", detail: noteKind, workspaceId: objectWorkspaceId, visibility: objectVisibility, createdBy: currentMemberId },
        ...current.objectActivity,
      ],
    }));
    setNoteBody("");
    setTimestamp("");
  };

  const addLink = () => {
    const url = linkDraft.url.trim();
    if (!/^https?:\/\//i.test(url)) return;
    update((current) => ({
      ...current,
      objectLinks: [
        {
          id: createId(),
          object: ref,
          createdAt: new Date().toISOString(),
          url,
          label: linkDraft.label.trim() || undefined,
          workspaceId: objectWorkspaceId,
          visibility: objectVisibility,
          createdBy: currentMemberId,
        },
        ...current.objectLinks,
      ],
    }));
    setLinkDraft({ url: "", label: "" });
  };

  const addNextAction = () => {
    const title = nextAction.trim();
    if (!title) return;
    update((current) => ({
      ...current,
      objectNextActions: [
        {
          id: createId(),
          object: ref,
          title,
          status: "open",
          workspaceId: objectWorkspaceId,
          visibility: objectVisibility,
          createdBy: currentMemberId,
        },
        ...current.objectNextActions,
      ],
    }));
    setNextAction("");
  };

  const addRelation = (targetKey = relationTarget, label = relationLabel) => {
    const target = relationOptions.find((item) => `${item.ref.kind}:${item.ref.id}` === targetKey);
    if (!target) return;
    update((current) => ({
      ...current,
      objectRelations: [
        { id: createId(), from: ref, to: target.ref, label, workspaceId: objectWorkspaceId },
        ...current.objectRelations,
      ],
    }));
    setRelationTarget("");
  };

  const createContentFromNote = (noteId: string) => {
    const result = createContentIdeaFromSourceNote(data, ref, noteId, { workspaceId: objectWorkspaceId, visibility: objectVisibility, createdBy: currentMemberId });
    update(() => result.data);
    if (result.ref) navigate(objectPath(result.ref));
  };

  const addComment = () => {
    const body = commentBody.trim();
    if (!body) return;
    update((current) => ({
      ...current,
      objectComments: [
        {
          id: createId(),
          object: ref,
          workspaceId: objectWorkspaceId,
          authorId: commentAuthorId,
          body,
          createdAt: new Date().toISOString(),
        },
        ...current.objectComments,
      ],
    }));
    setCommentBody("");
  };

  return (
    <div className="space-y-6">
      <Link to="/think" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} />
        Back to Think
      </Link>

      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Pill tone={toneForKind(object.kind)}>{object.kind}</Pill>
            <Input
              value={object.title}
              onChange={(event) => updateTitle(event.target.value)}
              className="mt-4 h-auto border-none bg-transparent px-0 font-serif text-4xl tracking-[-0.045em] shadow-none focus:ring-0 sm:text-5xl"
            />
            <Textarea
              value={object.summary}
              onChange={(event) => updateSummary(event.target.value)}
              rows={3}
              className="mt-3 border-none bg-mist/45 text-base leading-7 shadow-none focus:ring-sage/10"
              placeholder="Write the summary that future you needs."
            />
          </div>
          <div className="rounded-2xl bg-mist/45 p-4 text-sm text-muted lg:w-64">
            <p>Created {new Date(object.createdAt).toLocaleDateString()}</p>
            {object.createdBy ? <p className="mt-2">By {memberName(object.createdBy)}</p> : null}
            {object.metadata ? <p className="mt-2">Status: {object.metadata}</p> : null}
            {source ? (
              <>
                <Label className="mt-4" htmlFor="source-type">Source type</Label>
                <select
                  id="source-type"
                  value={source.sourceType}
                  onChange={(event) => updateSource({ sourceType: event.target.value as SourceType })}
                  className="h-10 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm"
                >
                  {sourceTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      {source ? (
        <Card className="p-5">
          <SectionHeading title="Source" supporting="Manual notes first. Transcripts and metadata can come later." />
          <div className="grid gap-4 lg:grid-cols-[1fr_.85fr]">
            <div>
              <Input value={source.url} onChange={(event) => updateSource({ url: event.target.value })} />
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm font-medium text-white hover:bg-ink">
                  Open source
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
            {embedUrl ? (
              <iframe
                title={source.title}
                src={embedUrl}
                className="aspect-video w-full rounded-2xl border border-ink/8"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex min-h-40 items-center justify-center rounded-2xl bg-mist/45 text-sm text-muted">
                Preview unavailable. Use the source link.
              </div>
            )}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <SectionHeading title="Notes" supporting={ref.kind === "source" ? "Add timestamped thoughts while watching or reading." : "Keep useful context attached to the object."} />
            <div className="grid gap-3 md:grid-cols-[140px_140px_1fr_auto]">
              <select value={noteKind} onChange={(event) => setNoteKind(event.target.value as ObjectNoteKind)} className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm">
                {noteKinds.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <Input value={timestamp} onChange={(event) => setTimestamp(event.target.value)} placeholder="12:34" disabled={ref.kind !== "source"} />
              <Input value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder={noteKind === "link" ? "Paste a link" : "What do you think about this?"} />
              <Button onClick={addNote}>Add note</Button>
            </div>
            {timestampError ? <p className="mt-2 text-sm text-clay">{timestampError}</p> : null}
            <div className="mt-6 space-y-3">
              {notes.length ? notes.map((note) => (
                <div key={note.id} className="rounded-2xl bg-mist/45 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={note.kind === "idea" ? "sage" : "stone"}>{note.kind}</Pill>
                      {note.timestampSeconds != null ? <Pill tone="clay">{formatTimestamp(note.timestampSeconds)}</Pill> : null}
                    </div>
                    <span className="text-xs text-muted">{new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7">{note.body}</p>
                  {source && note.timestampSeconds != null ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={urlAtTimestamp(source.url, note.timestampSeconds)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-medium text-forest hover:bg-sage/10">
                        Open moment
                        <ExternalLink size={13} />
                      </a>
                      <Button variant="secondary" className="h-8 min-h-8 px-3 text-xs" onClick={() => createContentFromNote(note.id)}>
                        Create content idea
                      </Button>
                      <select
                        value={noteRelationTargets[note.id] ?? ""}
                        onChange={(event) => setNoteRelationTargets({ ...noteRelationTargets, [note.id]: event.target.value })}
                        className="h-8 rounded-full border border-ink/8 bg-white px-3 text-xs"
                      >
                        <option value="">Relate note context</option>
                        {relationOptions.map((item) => <option key={`${item.ref.kind}:${item.ref.id}`} value={`${item.ref.kind}:${item.ref.id}`}>{item.title} ({item.kind})</option>)}
                      </select>
                      <Button variant="quiet" className="h-8 min-h-8 px-3 text-xs" onClick={() => addRelation(noteRelationTargets[note.id], "mentions")}>
                        Relate
                      </Button>
                    </div>
                  ) : null}
                </div>
              )) : <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm text-muted">No notes yet.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeading title="Comments" supporting="Partner context, hook suggestions and shaping notes stay attached to the object." />
            <div className="grid gap-3 md:grid-cols-[160px_1fr_auto]">
              <select
                value={commentAuthorId}
                onChange={(event) => setCommentAuthorId(event.target.value)}
                className="h-11 rounded-xl border border-ink/8 bg-white px-3 text-sm"
              >
                {data.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
              </select>
              <Input value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Add a comment, hook suggestion or angle..." />
              <Button onClick={addComment}>Comment</Button>
            </div>
            <div className="mt-5 space-y-3">
              {comments.length ? comments.map((comment) => {
                const author = data.members.find((member) => member.id === comment.authorId);
                return (
                  <div key={comment.id} className="rounded-2xl bg-mist/45 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-forest">
                        {author?.avatarInitials ?? "?"}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{author?.name ?? "Someone"}</p>
                        <p className="text-xs text-muted">{new Date(comment.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-7">{comment.body}</p>
                  </div>
                );
              }) : <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm text-muted">No comments yet.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeading title="Activity" supporting="A quiet trail of what changed." />
            <div className="space-y-3">
              {activity.length ? activity.map((item) => (
                <div key={item.id} className="rounded-2xl bg-mist/45 p-4">
                  <p className="text-sm font-medium">{item.action}</p>
                  {item.detail ? <p className="mt-1 text-sm text-muted">{item.detail}</p> : null}
                  <p className="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              )) : <p className="text-sm text-muted">No activity yet beyond creation.</p>}
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <SectionHeading title="Next action" />
            <div className="space-y-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  className={cn("w-full rounded-2xl p-3 text-left text-sm", action.status === "done" ? "bg-sage/10 text-muted line-through" : "bg-mist/45")}
                  onClick={() => update((current) => ({
                    ...current,
                    objectNextActions: current.objectNextActions.map((item) => item.id === action.id ? { ...item, status: item.status === "done" ? "open" : "done" } : item),
                  }))}
                >
                  {action.title}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input value={nextAction} onChange={(event) => setNextAction(event.target.value)} placeholder="Add next action" />
              <Button onClick={addNextAction}><Plus size={15} /></Button>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Links" />
            <div className="space-y-2">
              {outboundUrls.length ? outboundUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl bg-mist/45 p-3 text-sm text-forest hover:bg-mist">
                  <LinkIcon size={15} />
                  <span className="min-w-0 truncate">{explicitLinks.find((link) => link.url === url)?.label ?? url}</span>
                </a>
              )) : <p className="text-sm text-muted">No links yet.</p>}
            </div>
            <div className="mt-3 space-y-2">
              <Input value={linkDraft.url} onChange={(event) => setLinkDraft({ ...linkDraft, url: event.target.value })} placeholder="https://..." />
              <div className="flex gap-2">
                <Input value={linkDraft.label} onChange={(event) => setLinkDraft({ ...linkDraft, label: event.target.value })} placeholder="Label" />
                <Button onClick={addLink}>Add</Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Related objects" />
            <div className="space-y-2">
              {related.length ? related.map((item) => (
                <Link key={`${item.object.kind}:${item.object.ref.id}`} to={item.object.href} className="block rounded-2xl bg-mist/45 p-3 hover:bg-mist">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-medium">{item.object.title}</p>
                    <Pill tone="stone">{item.label ?? item.source}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.object.kind}</p>
                </Link>
              )) : <p className="text-sm text-muted">No related objects yet.</p>}
            </div>
            <div className="mt-3 space-y-2">
              <select value={relationTarget} onChange={(event) => setRelationTarget(event.target.value)} className="h-10 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm">
                <option value="">Choose object</option>
                {relationOptions.map((item) => <option key={`${item.ref.kind}:${item.ref.id}`} value={`${item.ref.kind}:${item.ref.id}`}>{item.title} ({item.kind})</option>)}
              </select>
              <div className="flex gap-2">
                <select value={relationLabel} onChange={(event) => setRelationLabel(event.target.value as ObjectRelationLabel)} className="h-10 min-w-0 flex-1 rounded-xl border border-ink/8 bg-white px-3 text-sm">
                  {relationLabels.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <Button onClick={() => addRelation()}>Relate</Button>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeading title="Backlinks" />
            <div className="space-y-2">
              {backlinks.length ? backlinks.map((link) => (
                <Link key={link.id} to={link.href} className="block rounded-2xl bg-mist/45 p-3 hover:bg-mist">
                  <p className="text-sm font-medium">{link.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{link.kind}</p>
                </Link>
              )) : <p className="text-sm text-muted">No backlinks yet. Use [[{object.title}]] in notes to create one.</p>}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
};
