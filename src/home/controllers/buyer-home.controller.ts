import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';
import { BuyerHomeService } from '../services/buyer-home.service';
import { BuyerHomeResponse, GetBuyerHomeQueryDto } from '../dto/buyer-home.dto';

@Controller('home/buyer')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Home')
export class BuyerHomeController {
  constructor(private readonly buyerHomeService: BuyerHomeService) {}

  @Get()
  @Roles(UserRole.BUYER)
  @ApiOperation({ summary: 'Get buyer home screen data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns buyer home screen data', 
    type: BuyerHomeResponse 
  })
  async getBuyerHome(
    @GetUser() user: User,
    @Query() query: GetBuyerHomeQueryDto,
  ): Promise<BuyerHomeResponse> {
    return this.buyerHomeService.getBuyerHomeData(
      user.id,
      query.location
    );
  }
} 