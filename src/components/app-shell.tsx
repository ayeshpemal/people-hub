import { Link } from "@tanstack/react-router";
import { LogOut, Plus, Settings2, UserCircle2, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { user } = useAuth();
  const compact = Boolean(backTo);
  const accountLabel = user?.email ?? "Your account";
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

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
              <span className="truncate font-display text-base font-semibold text-ink sm:text-lg">
                {currentLabel}
              </span>
            </>
          ) : (
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <img src="/person-cache-logo.png" alt="" className="size-8 shrink-0 object-contain" />
              <span className="truncate font-display text-lg font-semibold tracking-tight">
                Person Cache
              </span>
            </Link>
          )}

          {/* Right-side actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Manage data button */}
            {!compact && (
              <Link
                to={compact ? "/" : "/manage-data"}
                className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-card px-3 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 transition-colors hover:bg-accent"
                title={compact ? "Directory" : "Manage data"}
              >
                <>
                  <Settings2 className="size-4 shrink-0" />
                  <span className="hidden sm:inline">Manage data</span>
                </>
              </Link>
            )}

            {/* Save someone button */}
            {!compact && (
              <Link
                to="/add-person"
                className="inline-flex items-center gap-1.5 rounded-[min(1vw,10px)] bg-linear-to-br from-brand to-pink px-3 py-2 text-sm font-medium text-ink-foreground shadow-inner ring-1 ring-brand/40 transition-transform hover:-translate-y-0.5"
                title="Save someone"
              >
                <Plus className="size-4 shrink-0" />
                <span className="hidden sm:inline">Save someone</span>
              </Link>
            )}

            {/* Profile icon + floating popover */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                id="profile-menu-btn"
                aria-label="Account menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((v) => !v)}
                className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ring-2 transition-all ${
                  profileOpen
                    ? "bg-brand/20 ring-brand/60 text-brand"
                    : "bg-card ring-ink/10 text-muted-foreground hover:bg-accent hover:text-ink hover:ring-ink/20"
                }`}
              >
                <UserCircle2 className="size-5" />
              </button>

              {/* Floating profile popover */}
              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 z-50 w-64 origin-top-right animate-in fade-in slide-in-from-top-2 rounded-[min(1.2vw,14px)] border border-ink/10 bg-card p-3 shadow-xl shadow-black/10 ring-1 ring-inset ring-white/5"
                >
                  {/* User info */}
                  <div className="mb-3 space-y-1 border-b border-ink/10 pb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Signed in as
                    </p>
                    <p className="truncate text-sm font-medium text-ink" title={accountLabel}>
                      {accountLabel}
                    </p>
                  </div>

                  {/* People count */}
                  {total !== undefined && (
                    <div className="mb-3 flex items-center gap-2 rounded-[min(0.8vw,10px)] bg-silver px-3 py-2 ring-1 ring-ink/10">
                      <Users className="size-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        <span className="font-semibold text-ink">{total}</span> people saved
                      </span>
                    </div>
                  )}

                  {/* Sign out */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      setLogoutOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-[min(0.8vw,10px)] px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-ink"
                  >
                    <LogOut className="size-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sign-out confirmation dialog */}
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
