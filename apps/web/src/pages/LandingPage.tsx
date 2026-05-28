import { Card, cn, Pill } from "@garden/ui";
import { ArrowRight, Brain, CheckCircle2, Dumbbell, Leaf, LockKeyhole, Stethoscope, UtensilsCrossed } from "lucide-react";
import { Link } from "react-router-dom";

const todayTasks = [
  ["One Big Thing", "Ship patient intake pilot plan", "90m"],
  ["Medium", "Review clinician feedback from asthma pathway", "35m"],
  ["Medium", "Decide what is not in the MVP", "25m"],
  ["Small", "Send investor update paragraph", "10m"],
];

const moduleExamples = [
  {
    icon: Stethoscope,
    title: "Work",
    headline: "NHS pathway integration",
    body: "Two blockers need attention before the sprint can absorb new scope.",
  },
  {
    icon: Dumbbell,
    title: "Train",
    headline: "Recovery strength",
    body: "Low intensity after a clinic-heavy day. Protect tomorrow's focus.",
  },
  {
    icon: Brain,
    title: "Think",
    headline: "Decision log",
    body: "Clarify whether the pilot optimizes learning, revenue or trust.",
  },
  {
    icon: UtensilsCrossed,
    title: "Eat",
    headline: "Protein and hydration",
    body: "72 / 125g logged. Build a simple dinner before evening review.",
  },
];

const exampleDays = [
  {
    title: "Clinic + founder day",
    mode: "Low power",
    note: "Move non-essential work to Not Today. One meaningful deliverable counts.",
  },
  {
    title: "Deep work day",
    mode: "Protected",
    note: "Hold the morning block for product narrative. Batch admin after lunch.",
  },
  {
    title: "Investor day",
    mode: "High context",
    note: "Reduce training intensity and close one decision before adding tasks.",
  },
];

const steps = [
  "Choose today's operating mode.",
  "Commit to one big thing.",
  "Let Train, Think, Work and Eat adjust the recommendation.",
  "Close the day with a two-minute review.",
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
          A calm operating system for healthtech founders.
        </h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-muted">
          See how a clinician-founder might use Garden OS to decide what matters, protect recovery and keep work from becoming the whole weather system.
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
            See Noor's example
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
              <p className="font-serif text-3xl tracking-tight">Good morning, Noor.</p>
              <p className="mt-1 text-sm text-muted">Healthtech founder · Thursday</p>
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
                <p className="mt-3 font-serif text-2xl leading-8 tracking-tight">Your capacity is real, but narrow.</p>
                <p className="mt-3 text-sm leading-6 text-muted">Clinic load and yesterday's heavy training suggest one meaningful deliverable, not a heroic list.</p>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <p className="text-sm font-medium">Suggested next action</p>
                <p className="mt-2 text-sm leading-6 text-muted">Write the pilot acceptance criteria before opening Slack.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>

    <section id="tools" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">The examples are opinionated on purpose.</h2>
        <p className="mt-4 text-base leading-7 text-muted">Garden OS is not a place to hoard tasks. It is a place to reconcile ambition with the body, calendar and attention you actually have.</p>
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
        <p className="mt-4 text-sm leading-7 text-muted">The same founder does not need the same plan every day.</p>
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
          After sign-up, the example data disappears. Onboarding walks you through the tools, then your first Today screen is ready for your real life.
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
