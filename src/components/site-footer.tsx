import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="relative z-10 px-4 pb-10 sm:px-8">
      <div className="glass-panel flex flex-col items-start gap-3 rounded-2xl px-5 py-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <div className="sunset-gradient grid size-7 place-items-center rounded-lg font-display text-xs font-semibold text-primary-foreground">
            R
          </div>
          <span className="font-display text-lg font-semibold">ReMarket</span>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Buy Smart · Sell Fast</p>
        <div className="flex gap-4 text-sm text-muted-foreground sm:ml-auto">
          <Link to="/browse" className="hover:text-foreground">
            Browse
          </Link>
          <Link to="/listings/new" className="hover:text-foreground">
            Start selling
          </Link>
          <Link to="/compare" className="hover:text-foreground">
            Compare
          </Link>
        </div>
      </div>
    </footer>
  );
}
