import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Transaction>> {
    return this.transactionsService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Transaction> {
    return this.transactionsService.findOne(id);
  }

  @Get('buyer/:buyerId')
  findByBuyer(
    @Param('buyerId') buyerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<Transaction>> {
    return this.transactionsService.findByBuyer(buyerId, page, limit);
  }
} 