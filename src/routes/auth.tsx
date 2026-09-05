import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — ReMarket" },
      { name: "description", content: "Sign in to ReMarket to buy, sell, message sellers and track your orders." },
      { property: "og:title", content: "Sign in to ReMarket" },
      { property: "og:description", content: "Create a free ReMarket account to buy and sell new and used products." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const signIn = async () => {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid details");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    void navigate({ to: "/dashboard" });
  };

  const signUp = async () => {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid details");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName.trim() } },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data.session) return toast.success("Check your email to confirm your account.");
    void navigate({ to: "/dashboard" });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) return toast.error("Google sign-in failed. Please try again.");
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  };

  const resetPassword = async () => {
    if (!email) return toast.error("Enter your email address first.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="glass-panel rounded-3xl p-8">
        <h1 className="font-display text-3xl tracking-tight">Welcome to ReMarket</h1>
        <p className="mt-2 text-sm text-muted-foreground">Buy Smart. Sell Fast.</p>

        <Tabs defaultValue="signin" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Create account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button
              onClick={() => void signIn()}
              disabled={busy}
              className="sunset-gradient w-full rounded-full border-0 text-primary-foreground"
            >
              Sign in
            </Button>
            <button onClick={() => void resetPassword()} className="text-xs text-muted-foreground hover:underline">
              Forgot your password?
            </button>
          </TabsContent>

          <TabsContent value="signup" className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email2">Email</Label>
              <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password2">Password</Label>
              <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button
              onClick={() => void signUp()}
              disabled={busy}
              className="sunset-gradient w-full rounded-full border-0 text-primary-foreground"
            >
              Create account
            </Button>
            <p className="text-xs text-muted-foreground">
              We'll email you a confirmation link before your account goes live.
            </p>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="secondary" className="w-full rounded-full" onClick={() => void google()}>
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
