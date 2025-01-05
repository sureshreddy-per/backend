import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (roles: UserRole | UserRole[]) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return SetMetadata(ROLES_KEY, roleArray);
}; 