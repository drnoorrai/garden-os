import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { Button, Card, Input, Label, Pill, SectionHeading } from "@garden/ui";
import { createContext, type FormEvent, type PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export interface AuthConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  redirectTo?: string;
}

export interface AuthContextValue {
  client: SupabaseClient | null;
  enabled: boolean;
  ready: boolean;
  user: User | null;
  session: Session | null;
  signInWithEmail: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const createSupabaseClient = (config: AuthConfig): SupabaseClient | null => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
};

export const AuthProvider = ({ children, config }: PropsWithChildren<{ config: AuthConfig }>) => {
  const [client] = useState(() => createSupabaseClient(config));
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!client);
  const redirectTo = config.redirectTo ?? `${window.location.origin}/today`;

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    void client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setReady(true);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo<AuthContextValue>(() => ({
    client,
    enabled: Boolean(client),
    ready,
    session,
    user: session?.user ?? null,
    signInWithEmail: async (email: string) => {
      if (!client) throw new Error("Supabase auth is not configured.");
      const { error } = await client.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (error) throw error;
    },
    signInWithGoogle: async () => {
      if (!client) throw new Error("Supabase auth is not configured.");
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) throw error;
    },
    signOut: async () => {
      if (!client) return;
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
  }), [client, ready, redirectTo, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const RequireAuth = ({ children }: PropsWithChildren) => {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.ready) return <AuthLoading />;
  if (auth.enabled && !auth.user) return <Navigate replace to="/login" state={{ from: location.pathname }} />;
  return children;
};

export const LoginPage = () => {
  const auth = useAuth();
  const location = useLocation();
  const from = typeof location.state === "object" && location.state && "from" in location.state ? String(location.state.from) : "/today";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!auth.enabled) return <Navigate replace to={from} />;
  if (auth.user) return <Navigate replace to={from} />;

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-10 text-ink">
      <Card className="w-full max-w-[460px] p-7 sm:p-9">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-4xl tracking-tight">Garden OS</p>
            <p className="mt-2 text-sm text-muted">Sign in to sync your Garden across devices.</p>
          </div>
          <Pill>private beta</Pill>
        </div>
        <SectionHeading title="Welcome back" supporting="Use a magic link or continue with Google. New accounts start with a clean private workspace." />
        <form className="space-y-4" onSubmit={submitEmail}>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="noor@example.com"
              required
              type="email"
              value={email}
            />
          </div>
          <Button className="w-full" disabled={status === "sending"} type="submit">
            {status === "sending" ? "Sending..." : "Email me a login link"}
          </Button>
        </form>
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted">
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
        <p className="mt-7 text-xs leading-5 text-muted">
          Authentication is handled by Supabase Auth. Signed-in workspaces sync through your private Garden data row when Supabase is configured.
        </p>
      </Card>
    </main>
  );
};

const AuthLoading = () => (
  <main className="flex min-h-screen items-center justify-center bg-canvas px-5 text-ink">
    <Card className="p-7 text-center">
      <p className="font-serif text-3xl tracking-tight">Opening Garden OS</p>
      <p className="mt-2 text-sm text-muted">Checking your session...</p>
    </Card>
  </main>
);
