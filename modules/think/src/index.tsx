import { ModuleHeader, ModuleTabs } from "@garden/design-system";
import { createId, todayKey } from "@garden/domain";
import { useGarden } from "@garden/shared-state";
import type { NoteCategory } from "@garden/types";
import { Button, Card, cn, Input, Pill, SectionHeading, Textarea } from "@garden/ui";
import { ArrowRight, BookText, Compass, Plus, Scale, Sparkles } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { clarityStages, getTodaySummary } from "./lib";

export { getTodaySummary } from "./lib";

const tabs = [
  { to: "/think", label: "Overview", end: true },
  { to: "/think/clarity", label: "Clarity" },
  { to: "/think/field-notes", label: "Field Notes" },
  { to: "/think/journal", label: "Journal" },
  { to: "/think/decisions", label: "Decisions" },
  { to: "/think/models", label: "Mental Models" },
];

export const ThinkRoutes = () => {
  const { data } = useGarden();
  const summary = getTodaySummary(data);
  return (
    <>
      <ModuleHeader title="Think" description="A private thinking partner: guided clarity, knowledge, reflection and considered decisions." aside={<Pill>{summary.unresolvedDecisions} open decisions</Pill>} />
      <ModuleTabs tabs={tabs} />
      <Routes>
        <Route index element={<Overview />} />
        <Route path="clarity" element={<Clarity />} />
        <Route path="field-notes" element={<FieldNotes />} />
        <Route path="journal" element={<Journal />} />
        <Route path="decisions" element={<Decisions />} />
        <Route path="models" element={<Models />} />
      </Routes>
    </>
  );
};

const Overview = () => {
  const { data } = useGarden();
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <Feature icon={<Compass />} title="Clarity" text={data.claritySessions[0]?.title ?? "Begin a guided session."} />
      <Feature icon={<BookText />} title="Field Notes" text={`${data.fieldNotes.length} observations saved and searchable.`} />
      <Feature icon={<Scale />} title="Decisions" text={`${data.decisions.filter((item) => item.status !== "decided").length} decisions needing closure.`} />
      <Card className="p-6 md:col-span-2 xl:col-span-3">
        <SectionHeading title="Today's prompt" />
        <p className="font-serif text-3xl tracking-tight">{data.plans[0]?.reflectionPrompt}</p>
      </Card>
    </div>
  );
};

const Feature = ({ icon, title, text }: { icon: ReactNode; title: string; text: string }) => (
  <Card className="p-6">
    <div className="text-sage">{icon}</div>
    <h2 className="mt-8 font-serif text-3xl tracking-tight">{title}</h2>
    <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
  </Card>
);

const Clarity = () => {
  const { data, update } = useGarden();
  const [stage, setStage] = useState(0);
  const [title, setTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const prompt = clarityStages[stage];
  const complete = stage === clarityStages.length - 1;
  const report = useMemo(() => ({
    want: answers.want || "Not yet named.",
    blockers: answers.blockers || "Not yet named.",
    next: answers.evidence || "Choose one practical test.",
  }), [answers]);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_.78fr]">
      <Card className="p-6 sm:p-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {clarityStages.map((item, index) => (
            <button key={item.id} onClick={() => index <= stage && setStage(index)} className={cn("rounded-full px-3 py-2 text-xs font-medium", index === stage ? "bg-forest text-white" : index < stage ? "bg-sage/15 text-forest" : "bg-mist text-muted")}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted">{prompt.label} · {String(stage + 1).padStart(2, "0")}</p>
        <h2 className="mt-4 font-serif text-4xl tracking-tight">{prompt.question}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{prompt.guidance}</p>
        {stage === 0 ? <Input className="mt-7" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name this session" /> : null}
        <Textarea className="mt-4 min-h-52" value={answers[prompt.id] ?? ""} onChange={(event) => setAnswers({ ...answers, [prompt.id]: event.target.value })} placeholder="Write freely. Your response stays in this browser." />
        <div className="mt-5 flex justify-between">
          <Button variant="quiet" disabled={stage === 0} onClick={() => setStage((value) => Math.max(value - 1, 0))}>Back</Button>
          {!complete ? (
            <Button onClick={() => setStage((value) => Math.min(value + 1, clarityStages.length - 1))}>Continue <ArrowRight size={15} /></Button>
          ) : (
            <Button
              onClick={() => {
                update((current) => ({ ...current, claritySessions: [{ id: createId(), title: title.trim() || "Clarity session", createdAt: todayKey(), answers: Object.fromEntries(clarityStages.map((item) => [item.question, answers[item.id] ?? ""])) }, ...current.claritySessions] }));
                setStage(0); setTitle(""); setAnswers({});
              }}
            >Save report</Button>
          )}
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-6">
          <SectionHeading title="Private report preview" supporting="A considered reading, not an answer imposed on you." />
          <Insight label="What you want" text={report.want} />
          <Insight label="Constraint" text={report.blockers} />
          <Insight label="Success signal" text={report.next} />
        </Card>
        {data.claritySessions.map((session) => (
          <Card key={session.id} className="p-5">
            <p className="text-xs text-muted">{session.createdAt}</p>
            <p className="mt-2 font-medium">{session.title}</p>
            <p className="mt-2 text-sm text-muted">{session.answers["What do you want?"]}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Insight = ({ label, text }: { label: string; text: string }) => (
  <div className="mb-4 rounded-xl bg-mist/55 p-4"><p className="text-xs uppercase tracking-[0.13em] text-muted">{label}</p><p className="mt-2 text-sm leading-6">{text}</p></div>
);

const FieldNotes = () => {
  const { data, update } = useGarden();
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState({ title: "", body: "", tags: "", category: "Saved Insights" as NoteCategory });
  const notes = data.fieldNotes.filter((note) => `${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
      <Card className="p-6">
        <SectionHeading title="Capture insight" supporting="Research, essays and annotations live together." />
        <form className="space-y-3" onSubmit={(event) => {
          event.preventDefault();
          if (!draft.title.trim() || !draft.body.trim()) return;
          update((current) => ({ ...current, fieldNotes: [{ id: createId(), createdAt: todayKey(), title: draft.title.trim(), body: draft.body.trim(), tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean), category: draft.category }, ...current.fieldNotes] }));
          setDraft({ title: "", body: "", tags: "", category: "Saved Insights" });
        }}>
          <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" />
          <Textarea rows={6} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Paste a highlight or write an observation..." />
          <Input value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} placeholder="Tags, comma separated" />
          <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as NoteCategory })} className="h-11 w-full rounded-xl border border-ink/8 bg-white px-3 text-sm">
            {(["Research", "Essays", "Mental Models", "Saved Insights"] as NoteCategory[]).map((category) => <option key={category}>{category}</option>)}
          </select>
          <Button type="submit"><Plus size={15} /> Save note</Button>
        </form>
      </Card>
      <div>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notes, tags or ideas..." className="mb-4" />
        <div className="space-y-4">
          {notes.map((note) => <Card key={note.id} className="p-6"><div className="flex justify-between"><Pill tone="stone">{note.category}</Pill><span className="text-xs text-muted">{note.createdAt}</span></div><h2 className="mt-4 font-serif text-2xl tracking-tight">{note.title}</h2><p className="mt-3 text-sm leading-7 text-muted">{note.body}</p><div className="mt-4 flex gap-2">{note.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}</div></Card>)}
        </div>
      </div>
    </div>
  );
};

const Journal = () => {
  const { data, update } = useGarden();
  const [entry, setEntry] = useState("");
  const [mood, setMood] = useState(3);
  return (
    <div className="grid gap-6 lg:grid-cols-[.85fr_1fr]">
      <Card className="p-6">
        <SectionHeading title="Journal today" supporting="A private reflection, kept close to decisions." />
        <Textarea rows={9} value={entry} onChange={(event) => setEntry(event.target.value)} placeholder="What is true today?" />
        <div className="my-4 flex items-center gap-3 text-sm text-muted">Mood {[1, 2, 3, 4, 5].map((score) => <button key={score} className={cn("size-9 rounded-full", mood === score ? "bg-forest text-white" : "bg-mist")} onClick={() => setMood(score)}>{score}</button>)}</div>
        <Button onClick={() => { if (!entry.trim()) return; update((current) => ({ ...current, journal: [{ id: createId(), date: todayKey(), title: "Daily reflection", body: entry.trim(), mood }, ...current.journal] })); setEntry(""); }}>Save entry</Button>
      </Card>
      <div className="space-y-3">{data.journal.map((item) => <Card key={item.id} className="p-5"><p className="text-xs text-muted">{item.date} · Mood {item.mood ?? "-"}</p><p className="mt-3 text-sm leading-7">{item.body}</p></Card>)}</div>
    </div>
  );
};

const Decisions = () => {
  const { data, update } = useGarden();
  const [decision, setDecision] = useState("");
  const [rationale, setRationale] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-[.8fr_1fr]">
      <Card className="p-6">
        <SectionHeading title="Decision log" supporting="Record a choice and why it deserved making." />
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (!decision.trim()) return; update((current) => ({ ...current, decisions: [{ id: createId(), date: todayKey(), decision: decision.trim(), rationale: rationale.trim(), status: "open" }, ...current.decisions] })); setDecision(""); setRationale(""); }}>
          <Input value={decision} onChange={(event) => setDecision(event.target.value)} placeholder="Decision to make" />
          <Textarea value={rationale} onChange={(event) => setRationale(event.target.value)} placeholder="Context and rationale" rows={4} />
          <Button type="submit">Log decision</Button>
        </form>
      </Card>
      <div className="space-y-3">{data.decisions.map((item) => <Card key={item.id} className="p-5"><div className="flex justify-between gap-3"><p className="font-medium">{item.decision}</p><Pill tone={item.status === "decided" ? "sage" : "clay"}>{item.status}</Pill></div><p className="mt-3 text-sm text-muted">{item.rationale}</p>{item.status !== "decided" ? <Button variant="secondary" className="mt-4" onClick={() => update((current) => ({ ...current, decisions: current.decisions.map((decision) => decision.id === item.id ? { ...decision, status: "decided" } : decision) }))}>Mark decided</Button> : null}</Card>)}</div>
    </div>
  );
};

const Models = () => {
  const { data, update } = useGarden();
  const [title, setTitle] = useState("");
  const [principle, setPrinciple] = useState("");
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6"><SectionHeading title="Save a framework" /><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Model name" /><Textarea className="mt-3" rows={4} value={principle} onChange={(event) => setPrinciple(event.target.value)} placeholder="Core principle" /><Button className="mt-4" onClick={() => { if (!title.trim()) return; update((current) => ({ ...current, mentalModels: [{ id: createId(), title: title.trim(), principle: principle.trim(), application: "Apply deliberately this week." }, ...current.mentalModels] })); setTitle(""); setPrinciple(""); }}><Sparkles size={15} /> Save</Button></Card>
      <div className="space-y-3">{data.mentalModels.map((model) => <Card key={model.id} className="p-6"><h2 className="font-serif text-2xl tracking-tight">{model.title}</h2><p className="mt-3 text-sm leading-7">{model.principle}</p><p className="mt-3 text-sm text-muted">{model.application}</p></Card>)}</div>
    </div>
  );
};
