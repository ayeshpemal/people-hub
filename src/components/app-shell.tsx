import { Link } from "@tanstack/react-router";
import { Menu, Plus, Settings2, Users, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppHeaderProps {
  total?: number;
  backTo?: "/";
  backLabel?: string;
  currentLabel?: string;
}

export function AppHeader({ total, backTo, backLabel, currentLabel }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const compact = Boolean(backTo);

  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-silver/90 backdrop-blur-sm">
      <div className={`mx-auto ${compact ? "max-w-5xl" : "max-w-6xl"} px-4 sm:px-6`}>
        <div className="flex min-h-16 items-center justify-between gap-3 py-3">
          {compact ? (
            <>
              <Link
                to={backTo!}
                className="inline-flex shrink-0 items-center rounded-[min(1vw,10px)] bg-card px-3 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
              >
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline">← {backLabel ?? "Back"}</span>
              </Link>
              <span className="truncate rounded-full bg-brand/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand">
                {currentLabel}
              </span>
            </>
          ) : (
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <img src="/person-cache-logo.png" alt="" className="size-8 shrink-0 object-contain" />
              <span className="truncate font-display text-lg font-semibold tracking-tight">
                Person Cache
              </span>
              <span className="hidden rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand sm:inline">
                Saved people
              </span>
            </Link>
          )}

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            {!compact && total !== undefined && (
              <div className="flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-2 ring-1 ring-ink/10">
                <Users className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{total} saved</span>
              </div>
            )}
            <Link
              to={compact ? "/" : "/manage-data"}
              className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-transform hover:-translate-y-0.5"
            >
              {compact ? (
                "Directory"
              ) : (
                <>
                  <Settings2 className="size-4" /> Manage data
                </>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="rounded-[min(1vw,10px)] px-2 py-2 text-xs text-muted-foreground hover:text-ink"
            >
              Sign out
            </button>
            {!compact && (
              <Link
                to="/add-person"
                className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-linear-to-br from-brand to-pink px-3 py-2 text-sm font-medium text-ink-foreground shadow-inner ring-1 ring-brand/40 transition-transform hover:-translate-y-0.5"
              >
                <Plus className="size-4" /> Save someone
              </Link>
            )}
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-[min(1vw,10px)] bg-card text-ink ring-1 ring-ink/10 sm:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-2 border-t border-ink/10 py-3 sm:hidden">
            {!compact && total !== undefined && (
              <p className="px-3 py-1 text-xs text-muted-foreground">{total} saved people</p>
            )}
            <Link
              to={compact ? "/" : "/manage-data"}
              onClick={() => setMenuOpen(false)}
              className="rounded-[min(1vw,10px)] bg-card px-3 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/10"
            >
              {compact ? "Directory" : "Manage data"}
            </Link>
            {!compact && (
              <Link
                to="/add-person"
                onClick={() => setMenuOpen(false)}
                className="rounded-[min(1vw,10px)] bg-linear-to-br from-brand to-pink px-3 py-2.5 text-sm font-medium text-ink-foreground"
              >
                Save someone
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                setLogoutOpen(true);
              }}
              className="rounded-[min(1vw,10px)] px-3 py-2.5 text-left text-sm text-muted-foreground hover:text-ink"
            >
              Sign out
            </button>
          </nav>
        )}
      </div>
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="max-w-sm rounded-[min(1.4vw,16px)] border-ink/10 bg-card p-5 text-ink">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your private directory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="mt-0 border-ink/10 bg-silver text-ink hover:bg-silver/80">
              Stay signed in
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void supabase.auth.signOut()}
              className="bg-brand text-ink-foreground hover:bg-brand/90"
            >
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-ink/10 bg-silver">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-display font-semibold text-ink">Person Cache</span> · Your private
          people directory.
        </p>
        <p>Made for the people worth remembering.</p>
      </div>
    </footer>
  );
}
