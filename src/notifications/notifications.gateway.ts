import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { RedisService } from '../redis/redis.service';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private readonly redisService: RedisService) {}

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (!userId) {
      client.disconnect();
      return;
    }

    // Store socket connection
    const userSocketIds = this.userSockets.get(userId) || new Set();
    userSocketIds.add(client.id);
    this.userSockets.set(userId, userSocketIds);

    // Subscribe to Redis channel for this user
    await this.redisService.subscribe(`notifications:${userId}`, (message) => {
      this.sendToUser(userId, 'notification', JSON.parse(message));
    });
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (!userId) return;

    // Remove socket connection
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.delete(client.id);
      if (userSocketIds.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('readNotification')
  async handleReadNotification(client: Socket, notificationId: string) {
    // Handle read notification event
    // This can be implemented based on your requirements
  }

  async sendNotification(userId: string, notification: Notification) {
    // Publish to Redis channel
    await this.redisService.publish(
      `notifications:${userId}`,
      JSON.stringify(notification),
    );

    // Send to connected WebSocket clients
    this.sendToUser(userId, 'notification', notification);
  }

  private sendToUser(userId: string, event: string, data: any) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds) {
      userSocketIds.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
} 