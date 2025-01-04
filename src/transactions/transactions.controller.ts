import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionStatus } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Create transaction',
    description: 'Creates a new transaction for purchasing produce. Only accessible by users with the BUYER role.'
  })
  @ApiBody({
    type: CreateTransactionDto,
    description: 'Transaction details including produce ID, quantity, and payment information'
  })
  @ApiResponse({
    status: 201,
    description: 'The transaction has been successfully created',
    type: Transaction
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid transaction data or produce not available'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the BUYER role'
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Referenced produce does not exist'
  })
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser('id') buyerId: string,
  ): Promise<Transaction> {
    return this.transactionsService.create(createTransactionDto, buyerId);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all transactions',
    description: 'Retrieves a paginated list of all transactions. Only accessible by administrators.'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'List of transactions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: { $ref: '#/components/schemas/Transaction' }
        },
        total: {
          type: 'number',
          description: 'Total number of transactions'
        },
        page: {
          type: 'number',
          description: 'Current page number'
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages'
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have admin privileges'
  })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.transactionsService.findAll(page, limit);
  }

  @Get('my-transactions')
  @Roles(Role.BUYER)
  @ApiOperation({
    summary: 'Get own transactions',
    description: 'Retrieves a paginated list of transactions for the authenticated buyer.'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page',
    required: false,
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Buyer\'s transactions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: { $ref: '#/components/schemas/Transaction' }
        },
        total: {
          type: 'number',
          description: 'Total number of transactions'
        },
        page: {
          type: 'number',
          description: 'Current page number'
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages'
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have the BUYER role'
  })
  async findMyTransactions(
    @CurrentUser('id') buyerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.transactionsService.findByBuyer(buyerId, page, limit);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction by ID',
    description: 'Retrieves detailed information about a specific transaction.'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the transaction',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction retrieved successfully',
    type: Transaction
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - Transaction with provided ID does not exist'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Transaction> {
    return this.transactionsService.findOne(id);
  }
} 