import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Offer } from './entities/offer.entity';

@WebSocketGateway({
  namespace: 'offers',
  cors: {
    origin: '*',
  },
})
export class OffersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket[]> = new Map();

  async handleConnection(client: Socket): Promise<void> {
    const userId = client.handshake.auth.userId;
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      userSockets.push(client);
      this.userSockets.set(userId, userSockets);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId = client.handshake.auth.userId;
    if (userId) {
      const userSockets = this.userSockets.get(userId) || [];
      const updatedSockets = userSockets.filter(socket => socket.id !== client.id);
      if (updatedSockets.length > 0) {
        this.userSockets.set(userId, updatedSockets);
      } else {
        this.userSockets.delete(userId);
      }
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinProduceRoom')
  async handleJoinProduceRoom(
    client: Socket,
    produceId: string,
  ): Promise<void> {
    client.join(`produce:${produceId}`);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leaveProduceRoom')
  async handleLeaveProduceRoom(
    client: Socket,
    produceId: string,
  ): Promise<void> {
    client.leave(`produce:${produceId}`);
  }

  notifyNewOffer(offer: Offer): void {
    // Notify the produce room about the new offer
    this.server.to(`produce:${offer.produceId}`).emit('newOffer', offer);

    // Notify the customer who owns the produce
    const customerSockets = this.userSockets.get(offer.produce.customerId);
    if (customerSockets) {
      customerSockets.forEach(socket => {
        socket.emit('newOfferForProduce', offer);
      });
    }
  }

  notifyOfferStatusUpdate(offer: Offer): void {
    // Notify the produce room about the offer status update
    this.server.to(`produce:${offer.produceId}`).emit('offerStatusUpdated', offer);

    // Notify the buyer who made the offer
    const buyerSockets = this.userSockets.get(offer.buyerId);
    if (buyerSockets) {
      buyerSockets.forEach(socket => {
        socket.emit('myOfferStatusUpdated', offer);
      });
    }
  }
} 