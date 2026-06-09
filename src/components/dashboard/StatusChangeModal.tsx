"use client";

import { useState } from 'react';
import { X, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: {
    assetId: string;
    assetName: string;
    assetTagCode: string;
    assetType: 'appliance' | 'vehicle';
    status: string;
  };
  onSuccess: () => void;
}

export default function StatusChangeModal({ isOpen, onClose, asset, onSuccess }: StatusChangeModalProps) {
  const { data: session } = useSession();
  const [requestedStatus, setRequestedStatus] = useState<'active' | 'idle' | 'under_maintenance' | 'disposed'>(asset.status === 'under_maintenance' ? 'disposed' : 'under_maintenance');
  const [reasonOrNotes, setReasonOrNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRoles = session?.user?.roles || [];
  let headerRole = 'reader';
  if (userRoles.includes('System Admin') || userRoles.includes('HRGA Head')) {
    headerRole = 'admin';
  } else if (userRoles.includes('Finance')) {
    headerRole = 'finance';
  } else if (userRoles.includes('Asset Manager') || userRoles.includes('Technician')) {
    headerRole = 'editor';
  }

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonOrNotes.trim()) {
      toast.error('Please provide a reason or notes for the status change.');
      return;
    }

    setIsSubmitting(true);
    let evidenceUrl = '';

    try {
      // 1. Upload file to Vercel Blob if selected
      if (file) {
        toast.loading('Uploading evidence...', { id: 'upload-toast' });
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: 'POST',
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload evidence file.');
        }

        const blobData = await uploadRes.json();
        evidenceUrl = blobData.url;
        toast.success('Evidence uploaded successfully!', { id: 'upload-toast' });
      }

      // 2. Submit status change request
      const payload = {
        assetId: asset.assetId,
        requestedStatus,
        reasonOrNotes,
        evidenceUrl: evidenceUrl || null,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
      };

      const res = await fetch('/api/v1/status-requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-role': headerRole
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      if (data.message === 'Auto-approved') {
        toast.success('Status change completed successfully (Auto-approved).');
      } else {
        toast.success('Status change request submitted for management approval.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Request Status Change</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{asset.assetName} • {asset.assetTagCode}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Status */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Target Status</label>
            <select
              value={requestedStatus}
              onChange={(e) => setRequestedStatus(e.target.value as any)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              {asset.status !== 'active' && <option value="active">Active</option>}
              {asset.status !== 'idle' && <option value="idle">Idle</option>}
              {asset.status !== 'under_maintenance' && <option value="under_maintenance">Under Maintenance</option>}
              {asset.status !== 'disposed' && <option value="disposed">Disposed / Scrapped</option>}
            </select>
          </div>

          {/* Conditional Estimated Cost (only for under_maintenance) */}
          {requestedStatus === 'under_maintenance' && (
            <div>
              <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Estimated Cost (IDR)</label>
              <input
                type="number"
                placeholder="e.g. 6000000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                Vehicles with cost &gt; 5,000,000 IDR require HRGA and Finance approval.
              </p>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Reason or Notes</label>
            <textarea
              rows={3}
              placeholder="Provide business justification or technician notes..."
              value={reasonOrNotes}
              onChange={(e) => setReasonOrNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              required
            />
          </div>

          {/* File Upload Evidence */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Evidence / Attachment</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-zinc-400 mb-1" />
                  <p className="text-xs text-zinc-500">
                    {file ? file.name : "Click to upload image or PDF"}
                  </p>
                </div>
                <input type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
