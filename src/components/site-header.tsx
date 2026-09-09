import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Heart, LayoutDashboard, LogOut, MessageCircle, Search, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const { user, profile, isAdmin, isSeller, signOut } = useAuth();
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  return (
    <header className="relative z-30 px-4 pt-4 sm:px-8 sm:pt-6">
      <nav className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="sunset-gradient grid size-9 place-items-center rounded-xl font-display text-lg font-semibold text-primary-foreground">
            R
          </div>
          <div className="leading-none">
            <p className="font-display text-xl font-semibold tracking-tight">ReMarket</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Buy Smart · Sell Fast
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 rounded-full bg-secondary p-1 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/browse" search={{ condition: "new" }} className="rounded-full px-4 py-1.5 hover:bg-background/70">
            New
          </Link>
          <Link to="/browse" search={{ condition: "used" }} className="rounded-full px-4 py-1.5 hover:bg-background/70">
            Used
          </Link>
          <Link
            to="/browse"
            search={{ condition: "refurbished" }}
            className="rounded-full px-4 py-1.5 hover:bg-background/70"
          >
            Refurbished
          </Link>
        </div>

        <form
          className="order-last flex w-full items-center gap-2 rounded-full border border-border bg-input px-4 py-2 sm:order-none sm:w-52 lg:w-72"
          onSubmit={(event) => {
            event.preventDefault();
            void navigate({ to: "/browse", search: { q: term || undefined } });
          }}
        >
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search ReMarket…"
            aria-label="Search listings"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <div className="flex items-center gap-2">
          {user && (
            <>
              <Link
                to="/wishlist"
                className="grid size-9 place-items-center rounded-full bg-secondary"
                aria-label="Favourites"
              >
                <Heart className="size-4" />
              </Link>
              <Link
                to="/messages"
                className="grid size-9 place-items-center rounded-full bg-secondary"
                aria-label="Chat inbox"
              >
                <MessageCircle className="size-4" />
              </Link>
            </>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="rounded-full">
                  <User className="size-4" />
                  <span className="hidden sm:inline">{profile?.full_name ?? "Account"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{profile?.full_name ?? user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="size-4" /> My account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/wishlist">
                    <Heart className="size-4" /> Favourites
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/messages">
                    <MessageCircle className="size-4" /> Chat inbox
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications">
                    <Bell className="size-4" /> Notifications
                  </Link>
                </DropdownMenuItem>
                {isSeller && (
                  <DropdownMenuItem asChild>
                    <Link to="/seller">Seller dashboard</Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">Admin panel</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void signOut()}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" variant="secondary" className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Button asChild size="sm" className="sunset-gradient rounded-full border-0 text-primary-foreground">
            <Link to="/listings/new">Post an ad</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
