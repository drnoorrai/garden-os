import { getUniversalObjects, parseWikiLinks } from "@garden/domain";
import type { GardenData, UniversalObjectKind } from "@garden/types";
import { Textarea } from "@garden/ui";
import { Fragment, type TextareaHTMLAttributes, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export type LinkKind = UniversalObjectKind | "model" | "decision" | "journal";

export interface LinkTarget {
  id: string;
  title: string;
  kind: LinkKind;
  href: string;
}

export const KIND_LABEL: Record<LinkKind, string> = {
  person: "Person",
  company: "Company",
  content: "Content",
  note: "Field Note",
  source: "Source",
  model: "Mental Model",
  decision: "Decision",
  journal: "Journal",
};

const LINK_PATTERN = /\[\[([^\]\n]+)\]\]/g;

/** Extract the titles referenced inside [[double brackets]] in a body of text. */
export const parseLinks = (text: string): string[] => {
  if (!LINK_PATTERN.test(text)) return [];
  LINK_PATTERN.lastIndex = 0;
  return parseWikiLinks(text);
};

/**
 * Titles that can be linked TO. Journal entries are intentionally excluded —
 * their titles ("Daily reflection") are not unique, so they make poor targets.
 * They can still link to other notes (they are scanned as sources).
 */
export const linkTargets = (data: GardenData): LinkTarget[] => [
  ...getUniversalObjects(data).map((object) => ({ id: object.ref.id, title: object.title, kind: object.kind, href: object.href })),
  ...data.mentalModels.map((model) => ({ id: model.id, title: model.title, kind: "model" as const, href: `/think/models?ref=${model.id}` })),
  ...data.decisions.map((decision) => ({ id: decision.id, title: decision.decision, kind: "decision" as const, href: `/think/decisions?ref=${decision.id}` })),
];

interface SourceDoc {
  id: string;
  title: string;
  kind: LinkKind;
  text: string;
  href: string;
}

/** Every Think entry whose free text may contain [[links]]. */
const sourceDocs = (data: GardenData): SourceDoc[] => [
  ...getUniversalObjects(data).map((object) => ({
    id: `${object.kind}:${object.ref.id}`,
    title: object.title,
    kind: object.kind,
    text: object.text,
    href: object.href,
  })),
  ...data.mentalModels.map((model) => ({
    id: model.id,
    title: model.title,
    kind: "model" as const,
    text: `${model.principle} ${model.application}`,
    href: `/think/models?ref=${model.id}`,
  })),
  ...data.decisions.map((decision) => ({
    id: decision.id,
    title: decision.decision,
    kind: "decision" as const,
    text: decision.rationale,
    href: `/think/decisions?ref=${decision.id}`,
  })),
  ...data.journal.map((entry) => ({
    id: entry.id,
    title: `${entry.title} · ${entry.date}`,
    kind: "journal" as const,
    text: entry.body,
    href: "/think/journal",
  })),
];

export interface Backlink {
  id: string;
  title: string;
  kind: LinkKind;
  href: string;
}

/** Find every Think entry that references `title` via a [[link]] (case-insensitive). */
export const backlinksFor = (data: GardenData, title: string): Backlink[] => {
  const target = title.trim().toLowerCase();
  return sourceDocs(data)
    .filter((doc) => doc.title.trim().toLowerCase() !== target)
    .filter((doc) => parseLinks(doc.text).some((link) => link.toLowerCase() === target))
    .map(({ id, title: docTitle, kind, href }) => ({ id, title: docTitle, kind, href }));
};

const chipClass = "rounded-md bg-sage/15 px-1.5 py-0.5 text-[0.95em] font-medium text-forest transition hover:bg-sage/25";

const useTargetNavigate = () => {
  const navigate = useNavigate();
  return (href: string) => navigate(href);
};

/** Renders body text, turning [[links]] into navigable chips. Unresolved links show muted. */
export const LinkedText = ({ text, targets }: { text: string; targets: LinkTarget[] }) => {
  const go = useTargetNavigate();
  const segments = text.split(/(\[\[[^\]\n]+\]\])/g);
  return (
    <>
      {segments.map((segment, index) => {
        const match = segment.match(/^\[\[([^\]\n]+)\]\]$/);
        if (!match) return <Fragment key={index}>{segment}</Fragment>;
        const title = match[1].trim();
        const target = targets.find((item) => item.title.toLowerCase() === title.toLowerCase());
        if (!target) return <span key={index} className="text-clay/70">{title}</span>;
        return (
          <button key={index} type="button" onClick={() => go(target.href)} className={chipClass}>
            {title}
          </button>
        );
      })}
    </>
  );
};

/** A "Referenced by" footer listing every entry that links to `title`. */
export const ReferencedBy = ({ title, data }: { title: string; data: GardenData }) => {
  const go = useTargetNavigate();
  const backlinks = backlinksFor(data, title);
  if (!backlinks.length) return null;
  return (
    <div className="mt-4 border-t border-ink/6 pt-3">
      <p className="text-xs uppercase tracking-[0.13em] text-muted">Referenced by</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {backlinks.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => go(link.href)}
            className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-muted transition hover:text-ink"
          >
            {link.title}
            <span className="text-[10px] uppercase tracking-wide text-muted/70">{KIND_LABEL[link.kind]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

type LinkTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  targets: LinkTarget[];
};

/** Textarea with [[ autocomplete over existing Think titles. */
export const LinkTextarea = ({ value, onChange, targets, ...props }: LinkTextareaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);

  const refreshQuery = (text: string, caret: number | null) => {
    if (caret === null) return setQuery(null);
    const before = text.slice(0, caret);
    const match = before.match(/\[\[([^\]\n]*)$/);
    setQuery(match ? match[1] : null);
  };

  const suggestions =
    query === null
      ? []
      : targets.filter((target) => target.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6);

  const insert = (title: string) => {
    const element = ref.current;
    if (!element) return;
    const caret = element.selectionStart;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const start = before.lastIndexOf("[[");
    if (start === -1) return;
    const next = `${before.slice(0, start)}[[${title}]]${after}`;
    onChange(next);
    setQuery(null);
    const cursor = start + title.length + 4;
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="relative">
      <Textarea
        ref={ref}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          refreshQuery(event.target.value, event.target.selectionStart);
        }}
        onKeyUp={(event) => refreshQuery(event.currentTarget.value, event.currentTarget.selectionStart)}
        onClick={(event) => refreshQuery(event.currentTarget.value, event.currentTarget.selectionStart)}
        onBlur={() => window.setTimeout(() => setQuery(null), 150)}
        {...props}
      />
      {suggestions.length ? (
        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-ink/8 bg-white py-1 shadow-card">
          {suggestions.map((target) => (
            <li key={target.id}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  insert(target.title);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-ink hover:bg-mist"
              >
                <span className="min-w-0 truncate">{target.title}</span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted">{KIND_LABEL[target.kind]}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
