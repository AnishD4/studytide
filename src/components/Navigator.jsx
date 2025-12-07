"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigator() {
  const path = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/assignments', label: 'Assignments' },
    { href: '/study', label: 'Test' },
    { href: '/flashcards', label: 'Flashcards' },
    { href: '/study-guides', label: 'Guides' },
  ];

  return (
    <nav className="w-full border-b border-zinc-800 bg-black">
      <div className="max-w-4xl mx-auto flex gap-2 p-4 overflow-x-auto">
        {links.map(link => {
          const isActive = link.href === '/'
            ? path === '/'
            : path?.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                isActive 
                  ? 'bg-white text-black' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
