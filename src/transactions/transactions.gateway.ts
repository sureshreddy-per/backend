import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Transaction } from "./entities/transaction.entity";

@WebSocketGateway({
  namespace: "transactions",
  cors: {
    origin: "*",
  },
})
export class TransactionsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket[]> = new Map();

  async handleConnection(client: Socket): Promise<void> {
    const user_id = client.handshake.auth.user_id;
    if (user_id) {
      const userSockets = this.userSockets.get(user_id) || [];
      userSockets.push(client);
      this.userSockets.set(user_id, userSockets);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const user_id = client.handshake.auth.user_id;
    if (user_id) {
      const userSockets = this.userSockets.get(user_id) || [];
      const updatedSockets = userSockets.filter(
        (socket) => socket.id !== client.id,
      );
      if (updatedSockets.length > 0) {
        this.userSockets.set(user_id, updatedSockets);
      } else {
        this.userSockets.delete(user_id);
      }
    }
  }

  notifyNewTransaction(transaction: Transaction): void {
    // Notify the buyer who made the transaction
    const buyerSockets = this.userSockets.get(transaction.buyer_id);
    if (buyerSockets) {
      buyerSockets.forEach((socket) => {
        socket.emit("newTransaction", transaction);
      });
    }

    // Notify the farmer who owns the produce
    const farmerSockets = this.userSockets.get(transaction.produce.farmer_id);
    if (farmerSockets) {
      farmerSockets.forEach((socket) => {
        socket.emit("newTransactionForProduce", transaction);
      });
    }
  }

  notifyTransactionStatusUpdate(transaction: Transaction): void {
    // Notify the buyer
    const buyerSockets = this.userSockets.get(transaction.buyer_id);
    if (buyerSockets) {
      buyerSockets.forEach((socket) => {
        socket.emit("transactionStatusUpdated", transaction);
      });
    }

    // Notify the farmer
    const farmerSockets = this.userSockets.get(transaction.produce.farmer_id);
    if (farmerSockets) {
      farmerSockets.forEach((socket) => {
        socket.emit("transactionStatusUpdated", transaction);
      });
    }
  }
}
