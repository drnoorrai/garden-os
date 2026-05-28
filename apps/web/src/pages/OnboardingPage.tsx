import { Button, Card, cn, Input, Label, Pill, Textarea } from "@garden/ui";
import { useGarden } from "@garden/shared-state";
import { ArrowRight, BookOpen, Dumbbell, Leaf, SquareCheckBig, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const chapters = [
  {
    title: "Today is the control centre",
    body: "Start with one big thing, three medium things and five small things. The point is not to fill every slot; it is to make the day believable.",
  },
  {
    title: "Modules inform the day",
    body: "Train, Think, Work and Eat are separate tools, but their summaries feed Today so the app can recommend focus, restraint or recovery.",
  },
  {
    title: "Review closes the loop",
    body: "Evening review turns scattered experience into signal: energy, mood, blockers and what should move forward tomorrow.",
  },
];

const tools = [
  { icon: SquareCheckBig, title: "Work", text: "Capture, prioritize, execute and keep scope honest." },
  { icon: BookOpen, title: "Think", text: "Clarity sessions, field notes, journal, decisions and mental models." },
  { icon: Dumbbell, title: "Train", text: "Training structure, sessions, progression and recovery awareness." },
  { icon: UtensilsCrossed, title: "Eat", text: "Protein, hydration, meal planning and energy support without macro obsession." },
];

export const OnboardingPage = () => {
  const { data, update } = useGarden();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(data.profile.name === "You" ? "" : data.profile.name);
  const [focusTheme, setFocusTheme] = useState(data.profile.focusTheme);

  const finish = () => {
    update((current) => ({
      ...current,
      profile: {
        ...current.profile,
        name: name.trim() || current.profile.name,
        focusTheme: focusTheme.trim() || current.profile.focusTheme,
        onboardingComplete: true,
      },
    }));
    navigate("/today", { replace: true });
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-forest text-white">
            <Leaf size={20} strokeWidth={1.8} />
          </div>
          <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-6xl">Set up your Garden.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted">A short orientation before the app hands you a clean, private workspace.</p>
        </div>
        <Pill>Step {step + 1} of 3</Pill>
      </header>

      <div className="mb-8 grid gap-2 sm:grid-cols-3">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.title}
            className={cn(
              "h-2 rounded-full transition",
              index <= step ? "bg-forest" : "bg-mist",
            )}
            onClick={() => setStep(index)}
            aria-label={`Go to onboarding step ${index + 1}`}
          />
        ))}
      </div>

      {step < 2 ? (
        <Card className="p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{chapters[step].title}</p>
          <h2 className="mt-5 max-w-3xl font-serif text-4xl tracking-[-0.045em] sm:text-5xl">{chapters[step].body}</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tools.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-mist/45 p-4">
                <Icon className="text-sage" size={20} strokeWidth={1.8} />
                <p className="mt-5 font-medium">{title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <Button onClick={() => setStep((value) => Math.min(value + 1, 2))}>
              Continue
              <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Personalize the first screen</p>
          <h2 className="mt-4 font-serif text-4xl tracking-[-0.045em]">Start fresh, but not blank.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            These words guide Today while your workspace stays clear of example tasks, notes and projects.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="onboarding-name">Name</Label>
              <Input id="onboarding-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Noor" />
            </div>
            <div>
              <Label htmlFor="onboarding-theme">Focus theme</Label>
              <Textarea
                id="onboarding-theme"
                rows={4}
                value={focusTheme}
                onChange={(event) => setFocusTheme(event.target.value)}
                placeholder="Build a life and company with enough space to notice what matters."
              />
            </div>
          </div>
          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="quiet" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={finish}>
              Open my fresh Garden
              <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
