import { createId, todayKey } from "@garden/domain";
import type { NoteCategory } from "@garden/types";
import { Button, Card, cn, Input, Label, Pill, SectionHeading, Textarea } from "@garden/ui";
import { BookText, Compass, Plus } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGarden } from "../lib/garden-context";

const questions = [
  "What do you want?",
  "What’s important to you?",
  "How are you getting it?",
  "What is preventing you from having it?",
  "How will you know that you have it?",
];

export const ThinkPage = () => {
  const path = useLocation().pathname;
  const clarity = path === "/think/clarity";
  const notes = path === "/think/field-notes";

  return (
    <>
      <header className="mb-8">
        <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Think</h1>
        <p className="mt-3 text-muted">Clarity for decisions. Notes worth returning to.</p>
      </header>
      <div className="mb-8 flex gap-2">
        <ThinkLink to="/think/clarity" active={clarity}><Compass size={16} /> Clarity</ThinkLink>
        <ThinkLink to="/think/field-notes" active={notes}><BookText size={16} /> Field Notes</ThinkLink>
      </div>
      {clarity ? <ClarityPanel /> : notes ? <NotesPanel /> : <ThinkHome />}
    </>
  );
};

const ThinkLink = ({ to, active, children }: { to: string; active: boolean; children: ReactNode }) => (
  <Link to={to} className={cn("flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-muted", active && "bg-white text-forest shadow-card")}>
    {children}
  </Link>
);

const ThinkHome = () => {
  const { data } = useGarden();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Link to="/think/clarity">
        <Card className="p-7 transition hover:-translate-y-0.5">
          <Compass className="text-sage" />
          <h2 className="mt-8 font-serif text-3xl tracking-tight">Clarity</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{data.claritySessions[0]?.title}</p>
        </Card>
      </Link>
      <Link to="/think/field-notes">
        <Card className="p-7 transition hover:-translate-y-0.5">
          <BookText className="text-sage" />
          <h2 className="mt-8 font-serif text-3xl tracking-tight">Field Notes</h2>
          <p className="mt-3 text-sm leading-6 text-muted">{data.fieldNotes.length} saved observations and models.</p>
        </Card>
      </Link>
    </div>
  );
};

const ClarityPanel = () => {
  const { data, update } = useGarden();
  const [title, setTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_.72fr]">
      <Card className="p-6 sm:p-8">
        <SectionHeading title="New clarity session" supporting="Name what matters before solving around it." />
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            update((current) => ({
              ...current,
              claritySessions: [{ id: createId(), createdAt: todayKey(), title: title.trim(), answers }, ...current.claritySessions],
            }));
            setTitle("");
            setAnswers({});
          }}
        >
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What are you getting clear on?" />
          {questions.map((question, index) => (
            <div key={question}>
              <Label htmlFor={`clarity-answer-${index}`}>{question}</Label>
              <Textarea id={`clarity-answer-${index}`} rows={2} value={answers[question] ?? ""} onChange={(event) => setAnswers({ ...answers, [question]: event.target.value })} />
            </div>
          ))}
          <Button type="submit">Save session</Button>
        </form>
      </Card>
      <div className="space-y-4">
        {data.claritySessions.map((session) => (
          <Card key={session.id} className="p-5">
            <p className="text-xs text-muted">{session.createdAt}</p>
            <h2 className="mt-2 text-lg font-medium">{session.title}</h2>
            <p className="mt-3 text-sm leading-6 text-muted">{session.answers[questions[0]]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const NotesPanel = () => {
  const { data, update } = useGarden();
  const [draft, setDraft] = useState({ title: "", body: "", tags: "", category: "Saved Insights" as NoteCategory, sourceUrl: "" });

  return (
    <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
      <Card className="p-6">
        <SectionHeading title="Capture a note" />
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.title.trim() || !draft.body.trim()) return;
            update((current) => ({
              ...current,
              fieldNotes: [{
                id: createId(), createdAt: todayKey(), title: draft.title.trim(), body: draft.body.trim(),
                tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean), category: draft.category,
                sourceUrl: draft.sourceUrl.trim() || undefined,
              }, ...current.fieldNotes],
            }));
            setDraft({ title: "", body: "", tags: "", category: "Saved Insights", sourceUrl: "" });
          }}
        >
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" />
          <Textarea rows={5} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="What is worth keeping?" />
          <Input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="Tags, separated by commas" />
          <Input value={draft.sourceUrl} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} placeholder="Source URL (optional)" />
          <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as NoteCategory })} className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm">
            {(["Research", "Essays", "Mental Models", "Saved Insights"] as NoteCategory[]).map((category) => <option key={category}>{category}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Save note</Button>
        </form>
      </Card>
      <div className="space-y-4">
        {data.fieldNotes.map((note) => (
          <Card key={note.id} className="p-6">
            <div className="flex justify-between gap-3">
              <Pill tone="stone">{note.category}</Pill>
              <span className="text-xs text-muted">{note.createdAt}</span>
            </div>
            <h2 className="mt-4 font-serif text-2xl tracking-tight">{note.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted">{note.body}</p>
            <div className="mt-4 flex gap-2">{note.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};
