import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ children, role }: { children: ReactNode; role?: "seller" | "admin" }) {
  const { user, loading, isAdmin, isSeller } = useAuth();

  if (loading) {
    return <div className="px-6 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="glass-panel mx-auto my-16 max-w-md rounded-3xl p-8 text-center">
        <h1 className="font-display text-2xl">Sign in to continue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a free ReMarket account to buy, sell and message other members.
        </p>
        <Button asChild className="sunset-gradient mt-6 rounded-full border-0 text-primary-foreground">
          <Link to="/auth">Sign in or register</Link>
        </Button>
      </div>
    );
  }

  if (role === "admin" && !isAdmin) {
    return <div className="px-6 py-20 text-center text-muted-foreground">Admins only.</div>;
  }

  if (role === "seller" && !isSeller && !isAdmin) {
    return <div className="px-6 py-20 text-center text-muted-foreground">Seller access required.</div>;
  }

  return <>{children}</>;
}
