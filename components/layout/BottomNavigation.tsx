"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Headphones } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/daily-checkin', icon: Calendar, label: 'Daily Check-in' },
  { href: '/exercises', icon: Headphones, label: 'Exercises' },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
      <nav className="flex items-center justify-around" role="navigation" aria-label="Main navigation">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="group"
            >
              <Icon 
                className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
                }`} 
              />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}