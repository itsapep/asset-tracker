"use client";

import { useSession } from "next-auth/react";

export function usePermissions() {
  const { data: session, status } = useSession();
  
  const user = session?.user;
  const userRoles = user?.roles || [];
  const userPermissions = user?.permissions || [];
  
  const hasPermission = (permission: string) => {
    return userPermissions.includes(permission);
  };
  
  const hasAnyPermission = (perms: string[]) => {
    return perms.some(p => userPermissions.includes(p));
  };
  
  const hasRole = (role: string) => {
    return userRoles.includes(role);
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    isLoading: status === "loading",
    session,
  };
}
