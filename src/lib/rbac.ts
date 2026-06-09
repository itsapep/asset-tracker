import { auth } from "@/auth";

export async function hasPermission(requiredPermission: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  
  return session.user.permissions.includes(requiredPermission);
}

export async function hasRole(requiredRole: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  
  return session.user.roles.includes(requiredRole);
}

export async function requirePermission(requiredPermission: string) {
  const isAuthorized = await hasPermission(requiredPermission);
  if (!isAuthorized) {
    throw new Error("Unauthorized: Missing required permission");
  }
}
