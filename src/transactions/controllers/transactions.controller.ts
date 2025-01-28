import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  UnauthorizedException,
  NotFoundException,
  Req,
} from "@nestjs/common";
import { TransactionService } from "../services/transaction.service";
import { Transaction, TransactionStatus } from "../entities/transaction.entity";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GetUser } from "../../auth/decorators/get-user.decorator";
import { User } from "../../users/entities/user.entity";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { OffersService } from "../../offers/services/offers.service";
import { BuyersService } from "../../buyers/services/buyers.service";
import { FarmersService } from "../../farmers/farmers.service";
import { FindManyOptions } from "typeorm";
import { Request } from 'express';

// Import the TransformedTransaction type from the service
import { TransformedTransaction } from "../services/transaction.service";

@Controller("transactions")
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly offersService: OffersService,
    private readonly buyersService: BuyersService,
    private readonly farmersService: FarmersService,
  ) {}

  @Post()
  async create(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<TransformedTransaction> {
    const offer = await this.offersService.findOne(
      createTransactionDto.offer_id,
    );
    if (!offer) {
      throw new NotFoundException("Offer not found");
    }

    const buyer = await this.buyersService.findByUserId(user.id);
    const farmer = await this.farmersService.findByUserId(user.id);
    const userRole = buyer ? 'BUYER' : 'FARMER';

    const transaction = await this.transactionService.create({
      ...createTransactionDto,
      buyer_id: offer.buyer_id,
      farmer_id: offer.farmer_id,
      status: TransactionStatus.PENDING,
    });

    return this.transactionService.findOneAndTransform(transaction.id, userRole);
  }

  @Get()
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @Req() req: Request,
  ): Promise<PaginatedResponse<TransformedTransaction>> {
    const userId = req.user['id'];
    const userRole = req.user['role'];

    const where = [];
    if (userRole === 'BUYER') {
      where.push({ buyer_id: userId });
    } else if (userRole === 'FARMER') {
      where.push({ farmer_id: userId });
    } else {
      throw new UnauthorizedException("User is neither a buyer nor a farmer");
    }

    return this.transactionService.findAllAndTransform({
      where,
      skip: (page - 1) * limit,
      take: limit,
      relations: ["offer", "produce"],
    }, userRole);
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<TransformedTransaction> {
    const userId = req.user['id'];
    const userRole = req.user['role'];

    const transaction = await this.transactionService.findOneAndTransform(id, userRole);
    if (!transaction) {
      throw new UnauthorizedException("Transaction not found");
    }

    if ((userRole === 'BUYER' && transaction.buyer_id !== userId) ||
        (userRole === 'FARMER' && transaction.farmer_id !== userId)) {
      throw new UnauthorizedException(
        "You can only view your own transactions",
      );
    }

    return transaction;
  }

  @Post(":id/start-delivery")
  async startDelivery(
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<TransformedTransaction> {
    const userId = req.user['id'];
    const transaction = await this.transactionService.startDeliveryWindow(id, userId);
    return this.transactionService.findOneAndTransform(transaction.id, req.user['role']);
  }

  @Post(":id/confirm-delivery")
  async confirmDelivery(
    @Param("id") id: string,
    @Body("notes") notes: string,
    @Req() req: Request,
  ): Promise<TransformedTransaction> {
    const userId = req.user['id'];
    const transaction = await this.transactionService.confirmDelivery(id, userId, notes);
    return this.transactionService.findOneAndTransform(transaction.id, req.user['role']);
  }

  @Post(":id/confirm-inspection")
  async confirmInspection(
    @Param("id") id: string,
    @Body("notes") notes: string,
    @Req() req: Request,
  ): Promise<TransformedTransaction> {
    const userId = req.user['id'];
    const transaction = await this.transactionService.confirmBuyerInspection(id, userId, notes);
    return this.transactionService.findOneAndTransform(transaction.id, req.user['role']);
  }

  @Post(":id/complete")
  async complete(
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<TransformedTransaction> {
    const userId = req.user['id'];
    const transaction = await this.transactionService.completeTransaction(id, userId);
    return this.transactionService.findOneAndTransform(transaction.id, req.user['role']);
  }

  @Post("reactivate/:id")
  async reactivateTransaction(
    @Param("id") id: string,
    @Req() req: Request,
  ): Promise<TransformedTransaction> {
    const userId = req.user['id'];
    const transaction = await this.transactionService.reactivateExpiredTransaction(id, userId);
    return this.transactionService.findOneAndTransform(transaction.id, req.user['role']);
  }

  @Post(":id/cancel")
  async cancel(
    @Param("id") id: string,
    @Body("reason") reason: string,
    @Req() req: Request,
  ): Promise<TransformedTransaction> {
    const userId = req.user['id'];
    const transaction = await this.transactionService.cancel(id, userId, reason);
    return this.transactionService.findOneAndTransform(transaction.id, req.user['role']);
  }
}
