import { Suspense } from 'react';
import { LayoutDashboard, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import UserDropdown from '@/components/layout/UserDropdown';
import { Toaster } from 'sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  const isApprover = session?.user?.roles?.some((role: string) =>
    ['System Admin', 'Finance', 'HRGA Head'].includes(role)
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 font-sans flex flex-col">
      {/* Top Premium Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
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
          </Link>

          <div className="flex items-center gap-4">
            {isApprover && (
              <Link
                href="/approvals"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Approvals</span>
              </Link>
            )}
            <div className="hidden sm:flex items-center">
              <UserDropdown user={session?.user} />
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1">
        {children}
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
      <Toaster position="top-right" richColors />
    </div>
  );
}
