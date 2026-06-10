"use client";

import { useState, useEffect } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Truck, 
  FileText, 
  Calendar, 
  DollarSign, 
  RefreshCw 
} from "lucide-react";
import { Asset } from "@/types/dashboard";
import AssetDetailsDrawer from "./AssetDetailsDrawer";

const fetcher = (url: string) => fetch(url, {
  headers: {
    'x-role': 'admin'
  }
}).then((res) => res.json());

export default function InventoryLedger() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Extract params
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  const page = searchParams.get("page") || "1";

  const [searchValue, setSearchValue] = useState(q);
  
  // Sync the local search input state with the URL query parameter
  // so that clearing filters resets the input field.
  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("page", page);
  queryParams.set("limit", "10");
  if (q) queryParams.set("q", q);
  if (status) queryParams.set("status", status);
  if (type) queryParams.set("type", type);

  const { data: response, error, isLoading } = useSWR<{
    success: boolean;
    data: Asset[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>("/api/v1/assets?" + queryParams.toString(), fetcher);

  const updateFilters = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    
    // Reset page to 1 on any filter change, except when opening/closing the drawer
    if (!updates.hasOwnProperty("page") && !updates.hasOwnProperty("assetId")) {
      nextParams.set("page", "1");
    }

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val);
      }
    });

    router.push(pathname + "?" + nextParams.toString());
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchVal = formData.get("search") as string;
    updateFilters({ q: searchVal });
  };

  const getStatusBadge = (statusStr: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30", label: "Active" },
      idle: { bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30", label: "Idle" },
      under_maintenance: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30", label: "Maintenance" },
      disposed: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700", label: "Disposed" },
    };
    const c = config[statusStr] || { bg: "bg-zinc-50", text: "text-zinc-700", label: statusStr };
    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
      {/* Table Header / Action Bar */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-zinc-500" />
          Inventory Ledger
        </h2>

        <div className="flex items-center justify-between md:hidden mb-4">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center justify-center gap-2 px-4 py-2 w-full border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            <Filter className="w-4 h-4" />
            {isFiltersOpen ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className={`${isFiltersOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row gap-4 items-center justify-between`}>
          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative w-full md:w-80">
            <input
              type="text"
              name="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by name or tag code..."
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-colors"
            />
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-zinc-400" />
            {q && (
              <button 
                type="button"
                onClick={() => updateFilters({ q: null })}
                className="absolute right-3 top-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Clear
              </button>
            )}
          </form>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
            {/* Asset Type */}
            <select
              value={type}
              onChange={(e) => updateFilters({ type: e.target.value })}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
            >
              <option value="">All Types</option>
              <option value="appliance">Appliance</option>
              <option value="vehicle">Vehicle</option>
            </select>

            {/* Asset Status */}
            <select
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
              className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="idle">Idle</option>
              <option value="under_maintenance">Maintenance</option>
              <option value="disposed">Disposed</option>
            </select>

            {/* Reset Button */}
            {(q || status || type || page !== "1") && (
              <button
                onClick={() => router.push(pathname)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-200 font-medium px-2 py-1 rounded transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
            <p className="text-sm text-zinc-500">Loading ledger data...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            Failed to load assets: {error.message || "Unknown error"}
          </div>
        ) : !response?.data || response.data.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No assets found matching the selected criteria.
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse block md:table">
            <thead className="hidden md:table-header-group">
              <tr className="bg-zinc-50/70 dark:bg-zinc-900/70 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-medium">
                <th className="px-6 py-4">Asset Code</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="hidden md:table-cell px-6 py-4">Purchase Info</th>
                <th className="px-6 py-4">Site</th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group divide-y divide-zinc-200 dark:divide-zinc-800">
              {response.data.map((asset) => (
                <tr 
                  key={asset.assetId} 
                  onClick={() => updateFilters({ assetId: asset.assetId })}
                  className="block md:table-row bg-white dark:bg-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors py-4 md:py-0 cursor-pointer"
                >
                  <td className="block md:table-cell px-6 py-2 md:py-4 font-mono text-xs font-semibold text-zinc-950 dark:text-zinc-50">
                    <span className="md:hidden text-zinc-500 mr-2 font-normal">Code:</span>
                    {asset.assetTagCode}
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    <span className="md:hidden text-zinc-500 mr-2 font-normal">Name:</span>
                    {asset.assetName}
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                      <span className="md:hidden text-zinc-500 mr-2 font-normal">Type:</span>
                      {asset.assetType === "vehicle" ? (
                        <>
                          <Truck className="w-3.5 h-3.5 text-zinc-400" />
                          Vehicle
                        </>
                      ) : (
                        <>
                          <FileText className="w-3.5 h-3.5 text-zinc-400" />
                          Appliance
                        </>
                      )}
                    </span>
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4">
                    <span className="md:hidden text-zinc-500 mr-2 font-normal">Status:</span>
                    {getStatusBadge(asset.status)}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4">
                    <div className="text-xs space-y-0.5 text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0
                        }).format(parseFloat(asset.purchaseCost))}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-3 h-3" />
                        {asset.purchaseDate}
                      </div>
                    </div>
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 text-xs border-t border-zinc-100 dark:border-zinc-800 md:border-0 mt-2 md:mt-0 pt-4 md:pt-4">
                    <div className="md:hidden text-zinc-500 mb-1 font-normal">Site Location:</div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {asset.location?.siteName || "N/A"}
                    </div>
                    <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px] mt-0.5">
                      Floor {asset.location?.floor || "N/A"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination controls */}
      {response && response.pagination && response.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <span className="text-xs text-zinc-500">
            Showing Page {response.pagination.page} of {response.pagination.totalPages} ({response.pagination.total} total assets)
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => updateFilters({ page: (response.pagination.page - 1).toString() })}
              disabled={response.pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <button
              onClick={() => updateFilters({ page: (response.pagination.page + 1).toString() })}
              disabled={response.pagination.page >= response.pagination.totalPages}
              className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      <AssetDetailsDrawer />
    </div>
  );
}
