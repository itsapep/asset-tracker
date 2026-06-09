import { Suspense } from 'react';
import ComplianceCommandCenter from '@/components/dashboard/ComplianceCommandCenter';
import InventoryLedger from '@/components/dashboard/InventoryLedger';
import { LayoutDashboard } from 'lucide-react';
import { auth } from '@/auth';
import UserDropdown from '@/components/layout/UserDropdown';

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Top Premium Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 dark:bg-zinc-100 p-2 rounded-lg text-white dark:text-black">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-lg text-zinc-950 dark:text-zinc-50">
                Asset<span className="text-zinc-500 font-medium">Tracker</span>
              </span>
              <span className="ml-2 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                v1.0
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center">
            <UserDropdown user={session?.user} />
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Admin Desktop Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            General Affairs and Finance oversight command center.
          </p>
        </div>

        {/* Widgets section */}
        <ComplianceCommandCenter />

        {/* Ledger section */}
        <Suspense fallback={
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500 mx-auto mb-3"></div>
            <p className="text-sm text-zinc-500">Loading ledger data...</p>
          </div>
        }>
          <InventoryLedger />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-12 py-6 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-400 dark:text-zinc-600 gap-4">
          <p>© 2026 AssetTracker Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Audit Logs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

