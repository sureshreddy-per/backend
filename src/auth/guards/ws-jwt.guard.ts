import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth.token;

      if (!token) {
        throw new WsException("Missing authentication token");
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.handshake.auth.userId = payload.sub;

      return true;
    } catch (err) {
      throw new WsException("Invalid authentication token");
    }
  }
}
