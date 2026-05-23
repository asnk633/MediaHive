"use client";
import AppLink from "@/components/AppLink";
import { usePathname } from "next/navigation";

// MediaHive Note: This Navigation component is a legacy scaffold from the UI library.
// It is not used in the main application shell.
// Routes have been cleared to avoid dead-link warnings.
const navItems: { href: string; label: string }[] = [];


export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-foreground/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <AppLink
              href="/"
              className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Orchids
            </AppLink>
          </div>
          <div className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <AppLink
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${pathname === item.href
                  ? "bg-gray-900 text-foreground"
                  : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                {item.label}
              </AppLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
} 
