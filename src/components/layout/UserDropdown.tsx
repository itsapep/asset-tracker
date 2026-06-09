"use client";

import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { ShieldCheck, ChevronDown, LogOut } from 'lucide-react';

interface UserDropdownProps {
  user?: {
    name?: string | null;
    email?: string | null;
    roles?: string[];
  };
}

export default function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (!user) return null;

  const roleName = user.roles && user.roles.length > 0 ? user.roles[0] : 'User';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
      >
        <ShieldCheck className="w-4 h-4" />
        <span>{user.name || 'Account'} ({roleName})</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-900 mb-1">
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 font-sans">Logged in as</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate font-sans">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors text-left cursor-pointer font-sans"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
