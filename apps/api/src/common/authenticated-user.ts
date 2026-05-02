import type { RoleName } from '../modules/users/role.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
}

export const hasRole = (user: AuthenticatedUser, role: RoleName): boolean =>
  user.roles.includes(role);
