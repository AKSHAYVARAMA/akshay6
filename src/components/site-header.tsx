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
    <header className="relative z-30 border-b border-border bg-white px-4 py-3 sm:px-8">
      <nav className="market-section flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="sunset-gradient grid size-10 place-items-center rounded-xl text-lg font-extrabold text-white">
            R
          </div>
          <div className="leading-none">
            <p className="text-xl font-extrabold tracking-tight text-[#111827]">ReMarket</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Buy smart · sell fast
            </p>
          </div>
        </Link>
        <div className="hidden items-center gap-1 text-sm font-bold md:flex">
          <Link
            to="/browse"
            search={{ condition: "new" }}
            className="rounded-lg px-3 py-2 text-primary hover:bg-secondary"
          >
            New
          </Link>
          <Link
            to="/browse"
            search={{ condition: "used" }}
            className="rounded-lg px-3 py-2 text-accent hover:bg-green-50"
          >
            Used
          </Link>
          <Link
            to="/browse"
            search={{ condition: "refurbished" }}
            className="rounded-lg px-3 py-2 text-yellow-700 hover:bg-yellow-50"
          >
            Refurbished
          </Link>
        </div>
        <form
          className="order-last flex w-full items-center gap-2 rounded-xl border border-border bg-[#f4f6f8] px-3 py-2 sm:order-none sm:w-52 lg:w-72"
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
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
                aria-label="Favourites"
              >
                <Heart className="size-4" />
              </Link>
              <Link
                to="/messages"
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
                aria-label="Chat inbox"
              >
                <MessageCircle className="size-4" />
              </Link>
            </>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-lg">
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
            <Button asChild size="sm" variant="outline" className="rounded-lg">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
          <Button asChild size="sm" className="rounded-lg bg-primary font-bold hover:bg-primary/90">
            <Link to="/listings/new">Post an ad</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
