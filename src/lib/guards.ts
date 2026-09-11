import { auth } from "@/lib/auth";

export type AllowedRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export async function requireRole(roles: AllowedRole[]) {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (!roles.includes(session.user.role as AllowedRole)) return null;
  return session;
}

export async function requireProvider() {
  return requireRole(["PROVIDER"]);
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireCustomer() {
  return requireRole(["CUSTOMER", "ADMIN"]);
}
