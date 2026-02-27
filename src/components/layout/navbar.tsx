"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "♠" },
  { href: "/sessions", label: "Sessions", icon: "♥" },
  { href: "/sessions/new", label: "New Game", icon: "♦" },
  { href: "/players", label: "Players", icon: "♣" },
];

export function Navbar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link href="/" className="text-xl font-bold text-gold flex items-center gap-2">
          🃏 Poker Nights
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-accent text-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`}
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="POST" className="ml-4">
            <button
              type="submit"
              className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card flex justify-around py-2">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-md text-xs transition-colors ${
              pathname === item.href
                ? "text-gold"
                : "text-muted-foreground"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
