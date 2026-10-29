import type { UserProfile } from "./authService";

// Matches accounts.models.UserAccount.acc_lvl on the backend — 0 is the admin tier.
export const ADMIN_ACC_LVL = 0;

export function isAdmin(user: UserProfile | null): boolean {
  return user?.acc_lvl === ADMIN_ACC_LVL;
}

export function getHomePath(user: UserProfile | null): string {
  return isAdmin(user)
    ? "/nico/admin/dashboard"
    : "/nico/user/dashboard";
}
