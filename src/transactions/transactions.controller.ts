import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe, UseGuards, UnauthorizedException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @GetUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto
  ): Promise<Transaction> {
    return this.transactionsService.create({
      ...createTransactionDto,
      buyer_id: user.id,
    });
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Transaction>> {
    return this.transactionsService.findAll(page, limit);
  }

  @Get('my-transactions')
  findMyTransactions(
    @GetUser() user: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Transaction>> {
    return this.transactionsService.findByBuyer(user.id, page, limit);
  }

  @Get(':id')
  async findOne(
    @GetUser() user: User,
    @Param('id') id: string
  ): Promise<Transaction> {
    const transaction = await this.transactionsService.findOne(id);

    if (transaction.buyer_id !== user.id) {
      throw new UnauthorizedException('You can only view your own transactions');
    }

    return transaction;
  }
}