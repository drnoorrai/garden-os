import { Card, cn, Pill } from "@garden/ui";
import { ArrowRight, Brain, CheckCircle2, FileText, Leaf, LockKeyhole, Search, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

const todayTasks = [
  ["Capture", "Podcast note about attention becoming output", "12:34"],
  ["Content", "Turn the strongest timestamp into a post outline", "35m"],
  ["Shared", "Ask Sonum for three warmer opening hooks", "10m"],
  ["Source", "Save the article for the weekly idea queue", "2m"],
];

const moduleExamples = [
  {
    icon: Search,
    title: "Quick Capture",
    headline: "Everything lands somewhere useful",
    body: "Tasks, links, people, companies and content ideas route into the right object instead of becoming clutter.",
  },
  {
    icon: FileText,
    title: "Universal Objects",
    headline: "One pattern for every idea",
    body: "Sources, notes, people, companies and content ideas all share notes, links, related objects and next actions.",
  },
  {
    icon: UsersRound,
    title: "Partner Garden",
    headline: "Shared without feeling corporate",
    body: "A calm shared workspace for developing captures, prioritizing ideas and keeping relationship context together.",
  },
  {
    icon: Brain,
    title: "Field Notes",
    headline: "Backlinks for real life",
    body: "Use [[links]] to connect notes, sources, people and ideas into a knowledge base that still feels human.",
  },
];

const exampleDays = [
  {
    title: "Creator day",
    mode: "Shaping",
    note: "Capture source moments first. Turn only the strongest idea into a draft.",
  },
  {
    title: "Deep work day",
    mode: "Protected",
    note: "Keep the morning block for one meaningful deliverable. Let the rest stay captured, not urgent.",
  },
  {
    title: "Shared planning day",
    mode: "Collaborative",
    note: "Use the Task Garden to decide what to do now, what needs development and what to ask for.",
  },
];

const steps = [
  "Capture anything that has your attention.",
  "Route it into a task, note, source, person, company or content idea.",
  "Choose private or shared workspace.",
  "Turn the best captures into next actions.",
];

export const LandingPage = () => (
  <main className="min-h-screen bg-canvas text-ink">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link to="/" className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-forest text-white">
          <Leaf size={18} strokeWidth={1.8} />
        </span>
        <span>
          <span className="block font-serif text-xl leading-5 tracking-tight">Garden OS</span>
          <span className="text-xs text-muted">Intentional living</span>
        </span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
        <a href="#example" className="hover:text-ink">Example</a>
        <a href="#tools" className="hover:text-ink">Tools</a>
        <a href="#onboarding" className="hover:text-ink">Onboarding</a>
      </nav>
      <Link
        to="/login"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-forest px-4 text-sm font-medium text-white transition hover:bg-ink"
      >
        Start fresh
      </Link>
    </header>

    <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:pb-24 lg:pt-14">
      <div>
        <h1 className="max-w-3xl font-serif text-[3.2rem] leading-[0.98] tracking-[-0.06em] sm:text-[5.4rem]">
          Capture what has your attention. Turn it into clarity.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
          Garden OS is a calm place to catch ideas, links, tasks, people and source notes, then shape them into useful context with yourself or a trusted partner.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-6 text-sm font-medium text-white transition hover:bg-ink"
          >
            Start with a clean Garden
            <ArrowRight className="ml-2" size={16} />
          </Link>
          <a
            href="#example"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/8 bg-white px-6 text-sm font-medium text-ink transition hover:bg-mist"
          >
            See Quick Capture in action
          </a>
        </div>
        <div className="mt-8 flex items-center gap-3 text-sm text-muted">
          <LockKeyhole size={16} className="text-sage" />
          Public examples stay here. Your account starts empty and private.
        </div>
      </div>

      <Card id="example" className="overflow-hidden p-4 sm:p-6">
        <div className="rounded-[1.35rem] bg-[#f1f2eb] p-5">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-serif text-3xl tracking-tight">Good morning.</p>
              <p className="mt-1 text-sm text-muted">Shared Garden · Thursday</p>
            </div>
            <Pill>2.5 focused hours</Pill>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]">
            <div className="space-y-3">
              {todayTasks.map(([tier, title, time], index) => (
                <div key={title} className={cn("rounded-2xl bg-white p-4 shadow-card", index === 0 && "border border-forest/10")}>
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-muted">
                    <span>{tier}</span>
                    <span>{time}</span>
                  </div>
                  <p className={cn("text-sm font-medium", index === 0 && "font-serif text-2xl tracking-tight")}>{title}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-sage/20 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-forest/70">Today intelligence</p>
                <p className="mt-3 font-serif text-2xl leading-8 tracking-tight">You have several sparks, but only one draft window.</p>
                <p className="mt-3 text-sm leading-6 text-muted">Keep the article and person notes captured. Develop one content idea before adding more.</p>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <p className="text-sm font-medium">Suggested next action</p>
                <p className="mt-2 text-sm leading-6 text-muted">Open the source note at 12:34 and write the first rough hook.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>

    <section id="tools" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Quick Capture is the front door.</h2>
        <p className="mt-4 text-base leading-7 text-muted">Garden OS is not a place to hoard tasks. It is a place to turn mental clutter into organized context: sources, people, notes, ideas and next actions.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleExamples.map(({ icon: Icon, title, headline, body }) => (
          <Card key={title} className="p-5">
            <Icon className="text-sage" size={21} strokeWidth={1.8} />
            <p className="mt-8 text-sm font-medium text-muted">{title}</p>
            <h3 className="mt-2 font-serif text-2xl tracking-tight">{headline}</h3>
            <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
          </Card>
        ))}
      </div>
    </section>

    <section className="mx-auto grid max-w-7xl gap-5 px-5 py-16 sm:px-8 lg:grid-cols-[.85fr_1.15fr]">
      <Card className="p-6 sm:p-8">
        <h2 className="font-serif text-4xl tracking-[-0.045em]">Example daily modes</h2>
        <p className="mt-4 text-sm leading-7 text-muted">The same person does not need the same system every day.</p>
        <div className="mt-8 space-y-3">
          {exampleDays.map((day) => (
            <div key={day.title} className="rounded-2xl bg-mist/55 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{day.title}</p>
                <Pill tone={day.mode === "Low power" ? "clay" : "sage"}>{day.mode}</Pill>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{day.note}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card id="onboarding" className="p-6 sm:p-8">
        <h2 className="font-serif text-4xl tracking-[-0.045em]">Then your account starts clean.</h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          After sign-up, the example data disappears. Onboarding walks you through the tools, then your Work surface is ready for your real life.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-ink/6 bg-white p-4">
              <CheckCircle2 className="text-sage" size={18} />
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">Step {index + 1}</p>
              <p className="mt-2 text-sm font-medium">{step}</p>
            </div>
          ))}
        </div>
        <Link to="/login" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition hover:bg-ink">
          Create your Garden
          <ArrowRight className="ml-2" size={16} />
        </Link>
      </Card>
    </section>
  </main>
);
