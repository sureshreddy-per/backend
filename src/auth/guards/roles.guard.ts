import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const userRoles: Role[] = [];
    if (user.isFarmer) userRoles.push(Role.FARMER);
    if (user.isBuyer) userRoles.push(Role.BUYER);
    
    // Get admin users from configuration
    const adminUsers = this.configService.get<string[]>('ADMIN_USERS') || [];
    if (adminUsers.includes(user.email)) {
      userRoles.push(Role.ADMIN);
    }

    return requiredRoles.some((role) => userRoles.includes(role));
  }
} 