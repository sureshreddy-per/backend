import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Offer } from './entities/offer.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OffersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const userSocketIds = this.userSockets.get(userId);
      if (userSocketIds) {
        userSocketIds.delete(client.id);
        if (userSocketIds.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  notifyNewOffer(offer: Offer) {
    // Notify all clients subscribed to this produce
    this.server.to(`produce:${offer.produce_id}`).emit('newOffer', offer);
  }

  notifyOfferStatusUpdated(offer: Offer) {
    // Notify all clients subscribed to this produce
    this.server.to(`produce:${offer.produce_id}`).emit('offerStatusUpdated', offer);

    // Notify the buyer
    const buyerSockets = this.userSockets.get(offer.buyer_id);
    if (buyerSockets) {
      buyerSockets.forEach(socketId => {
        this.server.to(socketId).emit('offerStatusUpdated', offer);
      });
    }
  }
} 