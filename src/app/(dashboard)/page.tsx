import { Suspense } from 'react';
import ComplianceCommandCenter from '@/components/dashboard/ComplianceCommandCenter';
import InventoryLedger from '@/components/dashboard/InventoryLedger';

export default async function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
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
    </div>
  );
}
