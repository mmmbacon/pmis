import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../../common/authenticated-user';
import type { RoleName } from '../users/role.entity';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const handler = jest.fn();
  const controller = jest.fn();
  const user: AuthenticatedUser = {
    id: 'user-1',
    email: 'approver@example.com',
    name: 'Approver',
    roles: ['approver'],
  };

  const createGuard = (requiredRoles?: RoleName[]): RolesGuard =>
    new RolesGuard({
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector);

  const createContext = (requestUser?: AuthenticatedUser): ExecutionContext =>
    ({
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => ({ user: requestUser }),
      }),
    }) as unknown as ExecutionContext;

  it('allows routes with no role metadata', () => {
    const guard = createGuard();

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows authenticated users with at least one required role', () => {
    const guard = createGuard(['admin', 'approver']);

    expect(guard.canActivate(createContext(user))).toBe(true);
  });

  it('denies missing or insufficient roles', () => {
    const guard = createGuard(['admin']);

    expect(guard.canActivate(createContext(user))).toBe(false);
    expect(guard.canActivate(createContext())).toBe(false);
  });
});
