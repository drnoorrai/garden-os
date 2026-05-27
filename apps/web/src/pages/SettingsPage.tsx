import { Button, Card, Input, Label, SectionHeading } from "@garden/ui";
import { useState } from "react";
import { useGarden } from "../lib/garden-context";

export const SettingsPage = () => {
  const { data, update, reset } = useGarden();
  const [name, setName] = useState(data.profile.name);
  const [protein, setProtein] = useState(data.profile.proteinTarget);

  return (
    <div className="max-w-2xl">
      <header className="mb-8">
        <h1 className="font-serif text-4xl tracking-[-0.045em] sm:text-5xl">Settings</h1>
        <p className="mt-3 text-muted">Your Garden lives locally on this device in V1.</p>
      </header>
      <Card className="p-6 sm:p-8">
        <SectionHeading title="Profile" supporting="Used to shape your daily view." />
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            update((current) => ({ ...current, profile: { ...current.profile, name: name.trim() || current.profile.name, proteinTarget: protein } }));
          }}
        >
          <div><Label htmlFor="profile-name">Name</Label><Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div><Label htmlFor="protein-target">Protein target (g)</Label><Input id="protein-target" type="number" value={protein} min={0} onChange={(event) => setProtein(Number(event.target.value))} /></div>
          <Button type="submit">Save profile</Button>
        </form>
        <div className="mt-9 border-t border-ink/6 pt-6">
          <p className="mb-4 text-sm leading-6 text-muted">Resetting restores the realistic demo day and removes changes stored in this browser.</p>
          <Button variant="danger" onClick={() => void reset()}>Reset local data</Button>
        </div>
      </Card>
    </div>
  );
};
