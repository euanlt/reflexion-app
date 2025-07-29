"use client";

import { BottomNavigation } from './BottomNavigation';

interface AppShellProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

export function AppShell({ children, showBottomNav = true }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className={showBottomNav ? 'pb-20' : ''}>
        {children}
      </div>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
}