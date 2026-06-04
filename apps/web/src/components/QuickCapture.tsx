import { DEFAULT_PRIVATE_WORKSPACE_ID, getUniversalObjects, objectPath } from "@garden/domain";
import { captureUniversalItem, useGarden } from "@garden/shared-state";
import type { ObjectRef, TaskGardenZone, WorkItemKind } from "@garden/types";
import { Button, cn, Input } from "@garden/ui";
import { Check, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const kinds: { id: WorkItemKind; label: string }[] = [
  { id: "thought", label: "Thought" },
  { id: "task", label: "Task" },
  { id: "idea", label: "Idea" },
  { id: "content", label: "Content" },
  { id: "person", label: "Person" },
  { id: "company", label: "Company" },
];

const helperText: Record<WorkItemKind, string> = {
  thought: "Lands in your Work inbox to triage later.",
  task: "Lands in your Work inbox to triage later.",
  idea: "Lands in your Work inbox to triage later.",
  obligation: "Lands in your Work inbox to triage later.",
  content: "Content ideas also appear in Work → Content.",
  person: "People appear in Work → Relationships.",
  company: "Companies appear in Work → Relationships.",
};

export const QuickCapture = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { activeWorkspace, activeWorkspaceId, currentMemberId, data, update } = useGarden();
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<WorkItemKind>("thought");
  const [mode, setMode] = useState<"capture" | "find">("capture");
  const [sendToTaskGarden, setSendToTaskGarden] = useState(activeWorkspace.kind === "shared");
  const [taskGardenZone, setTaskGardenZone] = useState<TaskGardenZone>("develop");
  const [ownerId, setOwnerId] = useState("");
  const [capturedCount, setCapturedCount] = useState(0);
  const [capturedRef, setCapturedRef] = useState<ObjectRef | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceMembers = activeWorkspace.memberIds
    .map((memberId) => data.members.find((member) => member.id === memberId))
    .filter(Boolean);
  const objects = useMemo(
    () => getUniversalObjects(data).filter((object) => (object.workspaceId ?? DEFAULT_PRIVATE_WORKSPACE_ID) === activeWorkspaceId),
    [activeWorkspaceId, data],
  );
  const results = mode === "find" && draft.trim()
    ? objects.filter((object) =>
      `${object.title} ${object.summary} ${object.kind}`.toLowerCase().includes(draft.toLowerCase())
    ).slice(0, 7)
    : [];

  useEffect(() => {
    if (open) {
      setCapturedCount(0);
      setCapturedRef(null);
      setSendToTaskGarden(activeWorkspace.kind === "shared");
      setTaskGardenZone("develop");
      setOwnerId("");
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
    setDraft("");
  }, [activeWorkspace.kind, open]);

  if (!open) return null;

  const submit = () => {
    if (!draft.trim()) return;
    let nextRef: ObjectRef | undefined;
    update((current) => {
      const result = captureUniversalItem(current, draft, kind, {
        workspaceId: activeWorkspaceId,
        visibility: activeWorkspace.kind === "shared" ? "shared" : "private",
        createdBy: currentMemberId,
        addToTaskGarden: sendToTaskGarden,
        taskGardenZone,
        ownerId: ownerId || undefined,
      });
      nextRef = result.ref;
      return result.data;
    });
    setDraft("");
    setCapturedRef(nextRef ?? null);
    setCapturedCount((count) => count + 1);
    inputRef.current?.focus();
  };

  const openRef = (ref: ObjectRef) => {
    navigate(objectPath(ref));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-start sm:pt-[14vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[1.55rem] border border-ink/6 bg-white p-5 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex rounded-full bg-mist p-1">
              {(["capture", "find"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setMode(item);
                    setDraft("");
                    setCapturedRef(null);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium capitalize transition",
                    mode === item ? "bg-white text-forest shadow-sm" : "text-muted hover:text-ink",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              {mode === "capture" ? "Capturing to" : "Searching"} <span className="font-medium text-ink">{activeWorkspace.name}</span>
            </p>
          </div>
          <button aria-label="Close capture" onClick={onClose} className="text-muted transition hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (mode === "find") {
              if (results[0]) openRef(results[0].ref);
              return;
            }
            submit();
          }}
        >
          <Input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
            }}
            placeholder={mode === "find" ? "Find a person, company, note, content idea or source..." : "What's on your mind? Paste links here too."}
            className="h-12 text-base"
          />
          {mode === "capture" ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {kinds.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setKind(id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition",
                      kind === id ? "bg-forest text-white" : "bg-mist text-muted hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Button type="submit" disabled={!draft.trim()}>
                Capture
              </Button>
            </div>
          ) : null}
          {mode === "capture" ? (
            <div className="mt-4 rounded-2xl border border-ink/6 bg-mist/45 p-3">
              <label className="flex items-start gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={sendToTaskGarden}
                  onChange={(event) => setSendToTaskGarden(event.target.checked)}
                  className="mt-1 size-4 accent-forest"
                />
                <span>
                  Send to Task Garden
                  <span className="mt-0.5 block text-xs leading-5 text-muted">
                    Useful when this capture needs shaping with Sonum before it becomes work or content.
                  </span>
                </span>
              </label>
              {sendToTaskGarden ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <select
                    value={taskGardenZone}
                    onChange={(event) => setTaskGardenZone(event.target.value as TaskGardenZone)}
                    className="h-10 rounded-2xl border border-ink/8 bg-white px-3 text-sm text-ink outline-none"
                  >
                    <option value="do-now">Do Now</option>
                    <option value="develop">Develop</option>
                    <option value="ask-delegate">Ask / Delegate</option>
                  </select>
                  <select
                    value={ownerId}
                    onChange={(event) => setOwnerId(event.target.value)}
                    className="h-10 rounded-2xl border border-ink/8 bg-white px-3 text-sm text-ink outline-none"
                  >
                    <option value="">Owner: both</option>
                    {workspaceMembers.map((member) => (
                      <option key={member?.id} value={member?.id}>
                        Owner: {member?.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
        {mode === "find" ? (
          <div className="mt-4 space-y-2">
            {results.length ? results.map((object) => (
              <button
                key={`${object.kind}:${object.ref.id}`}
                type="button"
                onClick={() => openRef(object.ref)}
                className="w-full rounded-2xl bg-mist/55 p-3 text-left transition hover:bg-mist"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium">{object.title}</p>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted">{object.kind}</span>
                </div>
                <p className="mt-1 truncate text-xs text-muted">{object.summary}</p>
              </button>
            )) : <p className="rounded-xl border border-dashed border-ink/10 p-4 text-sm text-muted">Search your people, companies, content ideas, field notes and sources.</p>}
          </div>
        ) : capturedCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-forest">
            <span className="flex items-center gap-1.5">
              <Check size={15} />
              {capturedCount} captured
            </span>
            {capturedRef ? (
              <Button type="button" variant="secondary" className="h-8 min-h-8 px-3 text-xs" onClick={() => openRef(capturedRef)}>
                Open object
              </Button>
            ) : null}
            <span className="text-muted">keep typing or press Esc</span>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {isUrlLike(draft) ? "URLs become Source objects for podcast notes, news curation and content ideas." : helperText[kind]}
          </p>
        )}
      </div>
    </div>
  );
};

const isUrlLike = (value: string) => /^https?:\/\//i.test(value.trim());
