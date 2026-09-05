import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — ReMarket" },
      { name: "description", content: "Set a new password for your ReMarket account." },
      { property: "og:title", content: "Reset your ReMarket password" },
      { property: "og:description", content: "Set a new password for your ReMarket account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    void navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="glass-panel rounded-3xl p-8">
        <h1 className="font-display text-3xl">Choose a new password</h1>
        <div className="mt-6 space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button
          onClick={() => void submit()}
          className="sunset-gradient mt-5 w-full rounded-full border-0 text-primary-foreground"
        >
          Update password
        </Button>
      </div>
    </div>
  );
}
