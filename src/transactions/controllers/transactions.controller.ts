import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { TransactionService } from '../services/transaction.service';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { OffersService } from '../../offers/services/offers.service';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly offersService: OffersService
  ) {}

  @Post()
  async create(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto
  ): Promise<Transaction> {
    const offer = await this.offersService.findOne(createTransactionDto.offer_id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    return this.transactionService.create({
      ...createTransactionDto,
      buyer_id: offer.buyer_id,
      farmer_id: offer.farmer_id,
      status: TransactionStatus.PENDING
    });
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
    @GetUser() user: User
  ): Promise<PaginatedResponse<Transaction>> {
    return this.transactionService.findAll({
      where: [
        { buyer_id: user.id },
        { farmer_id: user.id }
      ],
      skip: (page - 1) * limit,
      take: limit,
      relations: ['offer', 'produce']
    });
  }

  @Get(':id')
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ): Promise<Transaction> {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      throw new UnauthorizedException('Transaction not found');
    }

    if (transaction.buyer_id !== user.id && transaction.farmer_id !== user.id) {
      throw new UnauthorizedException('You can only view your own transactions');
    }

    return transaction;
  }

  @Post(':id/start-delivery')
  async startDelivery(
    @GetUser() user: User,
    @Param('id') id: string
  ): Promise<Transaction> {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      throw new UnauthorizedException('Transaction not found');
    }

    if (transaction.farmer_id !== user.id) {
      throw new UnauthorizedException('Only the farmer can start delivery');
    }

    return this.transactionService.startDeliveryWindow(id);
  }

  @Post(':id/confirm-delivery')
  async confirmDelivery(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('notes') notes?: string
  ): Promise<Transaction> {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      throw new UnauthorizedException('Transaction not found');
    }

    if (transaction.farmer_id !== user.id) {
      throw new UnauthorizedException('Only the farmer can confirm delivery');
    }

    return this.transactionService.confirmDelivery(id, notes);
  }

  @Post(':id/confirm-inspection')
  async confirmInspection(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('notes') notes?: string
  ): Promise<Transaction> {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      throw new UnauthorizedException('Transaction not found');
    }

    if (transaction.buyer_id !== user.id) {
      throw new UnauthorizedException('Only the buyer can confirm inspection');
    }

    return this.transactionService.confirmBuyerInspection(id, notes);
  }

  @Post(':id/complete')
  async completeTransaction(
    @GetUser() user: User,
    @Param('id') id: string
  ): Promise<Transaction> {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      throw new UnauthorizedException('Transaction not found');
    }

    if (transaction.buyer_id !== user.id) {
      throw new UnauthorizedException('Only the buyer can complete the transaction');
    }

    if (!transaction.buyer_inspection_completed_at) {
      throw new UnauthorizedException('Buyer must complete inspection before completing the transaction');
    }

    return this.transactionService.completeTransaction(id);
  }

  @Post(':id/reactivate')
  async reactivateTransaction(
    @GetUser() user: User,
    @Param('id') id: string
  ): Promise<Transaction> {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      throw new UnauthorizedException('Transaction not found');
    }

    if (transaction.farmer_id !== user.id) {
      throw new UnauthorizedException('Only the farmer can reactivate the transaction');
    }

    if (transaction.status !== TransactionStatus.EXPIRED) {
      throw new UnauthorizedException('Only expired transactions can be reactivated');
    }

    return this.transactionService.reactivateExpiredTransaction(id);
  }

  @Post(':id/cancel')
  async cancelTransaction(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body('reason') reason: string
  ): Promise<Transaction> {
    const transaction = await this.transactionService.findOne(id);
    if (!transaction) {
      throw new UnauthorizedException('Transaction not found');
    }

    if (transaction.buyer_id !== user.id && transaction.farmer_id !== user.id) {
      throw new UnauthorizedException('Only transaction participants can cancel it');
    }

    return this.transactionService.cancel(id, reason);
  }
} 