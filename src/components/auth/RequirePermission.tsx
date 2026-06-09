"use client";

import React from "react";
import { usePermissions } from "@/lib/hooks/use-permissions";

interface RequirePermissionProps {
  permissions: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequirePermission({
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  const permissionList = Array.isArray(permissions) ? permissions : [permissions];

  let isAuthorized = false;
  if (requireAll) {
    isAuthorized = permissionList.every(p => hasPermission(p));
  } else {
    isAuthorized = hasAnyPermission(permissionList);
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
