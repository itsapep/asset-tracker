"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { toast } from 'sonner';
import { Check, X, Eye, Image as ImageIcon, Clock } from 'lucide-react';

interface StatusRequest {
  requestId: string;
  assetId: string;
  requestedStatus: 'active' | 'idle' | 'under_maintenance' | 'disposed';
  reasonOrNotes: string;
  evidenceUrl: string | null;
  estimatedCost: string | null;
  approvalStatus: 'pending_hrga' | 'pending_finance' | 'approved' | 'rejected';
  hrgaReviewedBy: string | null;
  financeReviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  asset: {
    assetTagCode: string;
    assetName: string;
    assetType: 'appliance' | 'vehicle';
    status: string;
  };
}

export default function ApprovalsPage() {
  const { hasRole, session, isLoading: isAuthLoading } = usePermissions();

  const userRoles = session?.user?.roles || [];
  let headerRole = 'reader';
  if (userRoles.includes('System Admin') || userRoles.includes('HRGA Head')) {
    headerRole = 'admin';
  } else if (userRoles.includes('Finance')) {
    headerRole = 'finance';
  } else if (userRoles.includes('Asset Manager') || userRoles.includes('Technician')) {
    headerRole = 'editor';
  }

  // Define fetcher inside the component so it uses the resolved headerRole reactively
  const fetcher = (url: string) => fetch(url, {
    headers: {
      'x-role': headerRole
    }
  }).then(res => res.json());

  const { data: response, error, isLoading: isDataLoading, mutate } = useSWR<{
    success: boolean;
    data: StatusRequest[];
  }>(isAuthLoading ? null : '/api/v1/status-requests', fetcher);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = hasRole('System Admin');
  const isHRGA = hasRole('HRGA Head') || isAdmin;
  const isFinance = hasRole('Finance') || isAdmin;

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId);
    const toastId = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} request...`);
    try {
      const res = await fetch(`/api/v1/status-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-role': headerRole
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update request');
      }
      toast.success(data.message || 'Request updated successfully', { id: toastId });
      mutate();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred', { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 md:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    );
  }

  const requests = response?.data || [];

  // Filter requests based on tab
  const filteredRequests = requests.filter(req => {
    if (activeTab === 'pending') {
      return req.approvalStatus === 'pending_hrga' || req.approvalStatus === 'pending_finance';
    }
    return req.approvalStatus === activeTab;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_hrga: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30',
      pending_finance: 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30',
      approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30',
      rejected: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/30',
    };
    const labels: Record<string, string> = {
      pending_hrga: 'Pending HRGA Head',
      pending_finance: 'Pending Finance',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatIDR = (val: string | null) => {
    if (!val) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(parseFloat(val));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
      {/* Hero section */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
          Approvals Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-sans">
          Review and process pending status changes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        {(['pending', 'approved', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors uppercase tracking-wider ${
              activeTab === tab
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-650'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Requests list */}
      {isDataLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center shadow-xs">
          <Clock className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">No requests found in this tab.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Requested Status</th>
                <th className="px-6 py-4">Estimated Cost</th>
                <th className="px-6 py-4">Reason / Notes</th>
                <th className="px-6 py-4">Evidence</th>
                <th className="px-6 py-4">Status / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredRequests.map(req => {
                const canApprove =
                  (req.approvalStatus === 'pending_hrga' && isHRGA) ||
                  (req.approvalStatus === 'pending_finance' && isFinance);

                return (
                  <tr key={req.requestId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-50">{req.asset?.assetName}</div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">{req.asset?.assetTagCode}</div>
                    </td>
                    <td className="px-6 py-4 capitalize font-medium">
                      {req.requestedStatus.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-950 dark:text-zinc-50">
                      {req.estimatedCost ? formatIDR(req.estimatedCost) : '-'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate" title={req.reasonOrNotes}>
                      {req.reasonOrNotes}
                    </td>
                    <td className="px-6 py-4">
                      {req.evidenceUrl ? (
                        <button
                          onClick={() => setSelectedImage(req.evidenceUrl)}
                          className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          View Image
                        </button>
                      ) : (
                        <span className="text-zinc-400 text-xs">No evidence</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(req.approvalStatus)}
                        {canApprove && activeTab === 'pending' && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => handleAction(req.requestId, 'approve')}
                              disabled={processingId !== null}
                              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAction(req.requestId, 'reject')}
                              disabled={processingId !== null}
                              className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-450 border border-red-200 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="Evidence Upload"
              className="object-contain max-h-[75vh] w-auto mx-auto p-4"
            />
            <div className="px-6 py-4 bg-zinc-900 border-t border-zinc-800 text-center">
              <a
                href={selectedImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-emerald-450 hover:underline inline-flex items-center gap-1"
              >
                Open original file in new tab
                <Eye className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
