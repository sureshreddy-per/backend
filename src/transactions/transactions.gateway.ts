import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Transaction } from './entities/transaction.entity';

@WebSocketGateway({
  namespace: 'transactions',
  cors: {
    origin: '*',
  },
})
export class TransactionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
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

  notifyNewTransaction(transaction: Transaction): void {
    // Notify the buyer who made the transaction
    const buyerSockets = this.userSockets.get(transaction.buyerId);
    if (buyerSockets) {
      buyerSockets.forEach(socket => {
        socket.emit('newTransaction', transaction);
      });
    }

    // Notify the customer who owns the produce
    const customerSockets = this.userSockets.get(transaction.produce.customerId);
    if (customerSockets) {
      customerSockets.forEach(socket => {
        socket.emit('newTransactionForProduce', transaction);
      });
    }
  }

  notifyTransactionStatusUpdate(transaction: Transaction): void {
    // Notify the buyer
    const buyerSockets = this.userSockets.get(transaction.buyerId);
    if (buyerSockets) {
      buyerSockets.forEach(socket => {
        socket.emit('transactionStatusUpdated', transaction);
      });
    }

    // Notify the customer
    const customerSockets = this.userSockets.get(transaction.produce.customerId);
    if (customerSockets) {
      customerSockets.forEach(socket => {
        socket.emit('transactionStatusUpdated', transaction);
      });
    }
  }
} 