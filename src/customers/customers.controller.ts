import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Return all customers' })
  async findAll(): Promise<Customer[]> {
    return this.customersService.findAll();
  }

  @Get('profile')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Get customer profile' })
  @ApiResponse({ status: 200, description: 'Return customer profile' })
  async getProfile(@CurrentUser() customer: Customer): Promise<Customer> {
    return this.customersService.findOne(customer.id);
  }

  @Put('profile')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Update customer profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() customer: Customer,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(customer.id, updateCustomerDto);
  }

  @Put('location')
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Update customer location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  async updateLocation(
    @CurrentUser() customer: Customer,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Customer> {
    return this.customersService.updateLocation(
      customer.id,
      updateLocationDto.lat,
      updateLocationDto.lng,
    );
  }

  @Put(':id/block')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Block a customer' })
  @ApiResponse({ status: 200, description: 'Customer blocked successfully' })
  async block(@Param('id', ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customersService.block(id);
  }

  @Put(':id/unblock')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Unblock a customer' })
  @ApiResponse({ status: 200, description: 'Customer unblocked successfully' })
  async unblock(@Param('id', ParseUUIDPipe) id: string): Promise<Customer> {
    return this.customersService.unblock(id);
  }
} 