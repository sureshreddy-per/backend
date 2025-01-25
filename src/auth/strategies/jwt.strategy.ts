import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/services/users.service";
import { AuthService } from "../auth.service";
import { UserStatus } from "../../users/enums/user-status.enum";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET"),
    });
    // Log the JWT secret length to verify it's set (without exposing the actual secret)
    this.logger.debug(`JWT_SECRET is ${configService.get<string>("JWT_SECRET")?.length ?? 0} characters long`);
  }

  async validate(payload: any) {
    this.logger.debug(`Validating JWT payload for user ID: ${payload?.sub}`);
    
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        this.logger.error(`User not found for ID: ${payload.sub}`);
        throw new UnauthorizedException("User not found");
      }

      if (user.status === UserStatus.DELETED) {
        this.logger.error(`Deleted user attempted access: ${payload.sub}`);
        throw new UnauthorizedException("User account has been deleted");
      }

      this.logger.debug(`JWT validation successful for user: ${user.id}`);
      return {
        id: user.id,
        sub: user.id,
        mobile_number: user.mobile_number,
        role: user.role,
        status: user.status,
      };
    } catch (error) {
      this.logger.error(`JWT validation error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
