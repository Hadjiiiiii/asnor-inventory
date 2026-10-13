"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Users,
  UserCog,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Contacts", href: "/contacts", icon: Users },
];

const adminNavigation = [
  { name: "User Management", href: "/users", icon: UserCog },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isAdmin = session?.user?.role === "ADMIN";

  const allNav = isAdmin ? [...navigation, ...adminNavigation] : navigation;

  // Drawer open: focus lands on its close button. Escape closes it and hands focus back to the menu button.
  useEffect(() => {
    if (!mobileOpen) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  function closeMenu() {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <>
      {/* Phone / tablet top bar: names the app and holds the menu button, so content never sits under it */}
      <div className="lg:hidden fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-3">
        <Button
          ref={menuButtonRef}
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-tint">
          <Package className="h-4 w-4 text-primary" />
        </div>
        <span className="text-base font-semibold">ASNOR</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar. Closed on small screens it is invisible, which also removes it from the tab order and the accessibility tree. */}
      <aside
        id="app-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 max-w-[85vw] bg-card border-r border-border flex flex-col transition-[transform,visibility] duration-200 ease-in-out lg:visible lg:translate-x-0 lg:static",
          mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-tint">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold">ASNOR</p>
            <p className="text-xs text-muted-foreground">Inventory System</p>
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            className="lg:hidden -mr-3"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav aria-label="Main" className="flex-1 px-3 py-4 space-y-1">
          {allNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 pointer-coarse:py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary-tint text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-tint text-xs font-medium text-primary">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {session?.user?.role?.toLowerCase()}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
