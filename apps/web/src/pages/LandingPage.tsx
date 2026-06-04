import { useAuth } from "@garden/auth";
import { Button, Card, Input, Label, Pill } from "@garden/ui";
import {
  ArrowRight,
  Building2,
  CheckSquare,
  FileText,
  Leaf,
  Lightbulb,
  Link as LinkIcon,
  LockKeyhole,
  Search,
  UserRound,
  UsersRound,
  Video,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";

const captureTypes = [
  {
    icon: CheckSquare,
    label: "Tasks",
    example: "Send the draft, book the call, move the bill.",
  },
  {
    icon: Lightbulb,
    label: "Ideas",
    example: "A half-formed thought before it disappears.",
  },
  {
    icon: FileText,
    label: "Content",
    example: "Hooks, angles, outlines and things worth saying.",
  },
  {
    icon: UserRound,
    label: "People",
    example: "Someone to remember, help, ask or follow up with.",
  },
  {
    icon: Building2,
    label: "Companies",
    example: "A partner, client, studio, fund, publication or lead.",
  },
  {
    icon: Video,
    label: "Sources",
    example: "YouTube, podcasts, articles and top-news links.",
  },
  {
    icon: LinkIcon,
    label: "Links",
    example: "Resources that need context, not another lost tab.",
  },
  {
    icon: FileText,
    label: "Notes",
    example: "Field notes, reflections, decisions and mental models.",
  },
];

const flow = [
  ["Capture", "Type a thought, paste a URL, name a person or save a source."],
  ["Route", "Garden OS turns it into the right object: task, note, person, company, source or content idea."],
  ["Develop", "Add notes, links, backlinks, comments, timestamped thoughts and next actions."],
  ["Share", "Keep it private in My Garden or send it to a shared workspace like Noor + Sonum."],
];

const examples = [
  "YouTube timestamp: 12:34, good opening for a post",
  "Person: Maya, ask about the newsletter collaboration",
  "Company: Common Room Studio, save the pitch link",
  "Content: why quick capture beats a blank page",
  "Task: send Sonum three hook options",
];

const LandingAuthPanel = () => {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setStatus("sending");
    try {
      await auth.signInWithEmail(email.trim());
      setStatus("sent");
    } catch (caught) {
      setStatus("idle");
      setError(caught instanceof Error ? caught.message : "Could not send the login email.");
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await auth.signInWithGoogle();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start Google sign in.");
    }
  };

  return (
    <Card className="p-5 shadow-card sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Pill tone="sage">Sign in</Pill>
          <h2 className="mt-4 font-serif text-3xl tracking-[-0.045em]">Open your Garden.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your account starts clean. Your captures sync privately, and shared workspace items sync with invited partners.
          </p>
        </div>
        <LockKeyhole className="mt-1 shrink-0 text-sage" size={20} strokeWidth={1.8} />
      </div>

      {auth.enabled && auth.user ? (
        <Link to="/work" className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition hover:bg-ink">
          Open Work
          <ArrowRight className="ml-2" size={16} />
        </Link>
      ) : auth.enabled ? (
        <>
          <form className="space-y-4" onSubmit={submitEmail}>
            <div>
              <Label htmlFor="landing-email">Email</Label>
              <Input
                id="landing-email"
                autoComplete="email"
                inputMode="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>
            <Button className="w-full" disabled={status === "sending"} type="submit">
              {status === "sending" ? "Sending..." : "Email me a login link"}
            </Button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted">
            <span className="h-px flex-1 bg-ink/8" />
            or
            <span className="h-px flex-1 bg-ink/8" />
          </div>
          <Button className="w-full" onClick={signInWithGoogle} type="button" variant="secondary">
            Continue with Google
          </Button>
          {status === "sent" ? (
            <p className="mt-5 rounded-2xl bg-sage/12 p-4 text-sm leading-6 text-forest">
              Check your email for a secure login link. It will bring you back to Garden OS.
            </p>
          ) : null}
          {error ? <p className="mt-5 rounded-2xl bg-clay/12 p-4 text-sm leading-6 text-clay">{error}</p> : null}
        </>
      ) : (
        <Link to="/work" className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-forest px-5 text-sm font-medium text-white transition hover:bg-ink">
          Open local Garden
          <ArrowRight className="ml-2" size={16} />
        </Link>
      )}
    </Card>
  );
};

export const LandingPage = () => (
  <main className="min-h-screen bg-canvas text-ink">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link to="/" className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-forest text-white">
          <Leaf size={18} strokeWidth={1.8} />
        </span>
        <span>
          <span className="block font-serif text-xl leading-5 tracking-tight">Garden OS</span>
          <span className="text-xs text-muted">Quick capture for real life</span>
        </span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
        <a href="#capture-types" className="hover:text-ink">What it captures</a>
        <a href="#how-it-works" className="hover:text-ink">How it works</a>
        <a href="#login" className="hover:text-ink">Login</a>
      </nav>
      <a
        href="#login"
        className="inline-flex min-h-10 items-center justify-center rounded-full bg-forest px-4 text-sm font-medium text-white transition hover:bg-ink"
      >
        Login
      </a>
    </header>

    <section className="mx-auto grid max-w-7xl items-center gap-8 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.72fr] lg:pb-20 lg:pt-16">
      <div>
        <Pill tone="sage">Quick Capture</Pill>
        <h1 className="mt-6 max-w-4xl font-serif text-[3.3rem] leading-[0.98] tracking-[-0.06em] sm:text-[5.8rem]">
          Get it out of your head before it becomes clutter.
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-muted">
          Garden OS captures tasks, links, sources, people, companies, notes and content ideas, then turns them into objects you can develop, search and share.
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          {["Task", "Idea", "Content", "Person", "Company", "Source", "Note", "Link"].map((item) => (
            <span key={item} className="rounded-full border border-ink/8 bg-white px-3 py-1.5 text-sm font-medium text-muted">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-3 text-sm text-muted">
          <Search size={16} className="text-sage" />
          Capture mode for input. Find mode for everything you have already saved.
        </div>
      </div>

      <section id="login">
        <LandingAuthPanel />
      </section>
    </section>

    <section id="capture-types" className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">One capture box. Many kinds of context.</h2>
        <p className="mt-4 text-base leading-7 text-muted">
          The point is not to create another inbox. The point is to put each thing where future you can actually use it.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {captureTypes.map(({ icon: Icon, label, example }) => (
          <Card key={label} className="p-5">
            <Icon className="text-sage" size={20} strokeWidth={1.8} />
            <h3 className="mt-8 font-serif text-2xl tracking-tight">{label}</h3>
            <p className="mt-3 text-sm leading-6 text-muted">{example}</p>
          </Card>
        ))}
      </div>
    </section>

    <section id="how-it-works" className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 lg:grid-cols-[.86fr_1.14fr]">
      <Card className="p-6 sm:p-8">
        <h2 className="font-serif text-4xl tracking-[-0.045em]">What a capture can become.</h2>
        <div className="mt-8 space-y-3">
          {examples.map((example) => (
            <div key={example} className="rounded-2xl bg-mist/55 p-4 text-sm font-medium leading-6">
              {example}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-6 sm:p-8">
        <h2 className="font-serif text-4xl tracking-[-0.045em]">The operating loop is simple.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {flow.map(([title, body], index) => (
            <div key={title} className="rounded-2xl border border-ink/6 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Step {index + 1}</p>
              <p className="mt-4 text-lg font-medium">{title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-forest/8 p-4 text-sm leading-6 text-forest">
          <UsersRound size={18} className="shrink-0" />
          Shared workspaces let partners develop captures together without exposing private Gardens.
        </div>
      </Card>
    </section>
  </main>
);
