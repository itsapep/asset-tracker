"use client";

import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';

interface ApprovalsLinkProps {
  user?: {
    name?: string | null;
    email?: string | null;
    roles?: string[];
  };
}

export default function ApprovalsLink({ user }: ApprovalsLinkProps) {
  const pathname = usePathname(); // Using usePathname to trigger revalidation on page change
  
  const userRoles = user?.roles || [];
  let headerRole = 'reader';
  if (userRoles.includes('System Admin') || userRoles.includes('HRGA Head')) {
    headerRole = 'admin';
  } else if (userRoles.includes('Finance')) {
    headerRole = 'finance';
  } else if (userRoles.includes('Asset Manager') || userRoles.includes('Technician')) {
    headerRole = 'editor';
  }

  const isApprover = userRoles.some(role => 
    ['System Admin', 'Finance', 'HRGA Head'].includes(role)
  );

  const isAdmin = userRoles.includes('System Admin');
  const isHRGA = userRoles.includes('HRGA Head') || isAdmin;
  const isFinance = userRoles.includes('Finance') || isAdmin;

  const fetcher = (url: string) => fetch(url.split('?')[0], {
    headers: { 'x-role': headerRole }
  }).then(res => res.json());

  // Include pathname in the key so it refetches when pathname changes
  const { data } = useSWR(isApprover ? `/api/v1/status-requests?_path=${pathname}` : null, fetcher, {
    refreshInterval: 10000, // Poll every 10 seconds
    revalidateOnFocus: true,
  });

  if (!isApprover) return null;

  let hasPending = false;
  if (data?.success && data.data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hasPending = data.data.some((req: any) => {
      if (req.approvalStatus === 'pending_hrga' && isHRGA) return true;
      if (req.approvalStatus === 'pending_finance' && isFinance) return true;
      return false;
    });
  }

  return (
    <Link
      href="/approvals"
      className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors border border-zinc-200 dark:border-zinc-800"
    >
      <ClipboardCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      <span>Approvals</span>
      {hasPending && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-zinc-950"></span>
        </span>
      )}
    </Link>
  );
}
