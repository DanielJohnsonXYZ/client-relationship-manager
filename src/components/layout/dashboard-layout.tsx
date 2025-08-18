'use client';

import { Sidebar } from './sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="h-screen flex">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 overflow-auto">
          <main className="p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}