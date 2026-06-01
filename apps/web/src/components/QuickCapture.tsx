import { captureItem, useGarden } from "@garden/shared-state";
import type { WorkItemKind } from "@garden/types";
import { Button, cn, Input } from "@garden/ui";
import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const kinds: { id: WorkItemKind; label: string }[] = [
  { id: "thought", label: "Thought" },
  { id: "task", label: "Task" },
  { id: "idea", label: "Idea" },
  { id: "content", label: "Content" },
];

export const QuickCapture = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { update } = useGarden();
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<WorkItemKind>("thought");
  const [capturedCount, setCapturedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCapturedCount(0);
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
    setDraft("");
  }, [open]);

  if (!open) return null;

  const submit = () => {
    if (!draft.trim()) return;
    update((current) => captureItem(current, draft, kind));
    setDraft("");
    setCapturedCount((count) => count + 1);
    inputRef.current?.focus();
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
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-forest/70">Quick capture</p>
          <button aria-label="Close capture" onClick={onClose} className="text-muted transition hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
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
            placeholder="What's on your mind?"
            className="h-12 text-base"
          />
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
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
        </form>
        {capturedCount > 0 ? (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-forest">
            <Check size={15} />
            {capturedCount} sent to Work inbox · keep typing or press Esc
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">
            {kind === "content" ? "Content ideas also appear in Work → Content." : "Lands in your Work inbox to triage later."}
          </p>
        )}
      </div>
    </div>
  );
};
