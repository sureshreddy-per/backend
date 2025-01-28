import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../enums/user-role.enum';
import { FarmerHomeService } from '../services/farmer-home.service';
import { FarmerHomeResponse, GetFarmerHomeQueryDto } from '../dto/farmer-home.dto';

@Controller('home/farmer')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Home')
export class FarmerHomeController {
  private readonly logger = new Logger(FarmerHomeController.name);

  constructor(private readonly farmerHomeService: FarmerHomeService) {}

  @Get()
  @Roles(UserRole.FARMER)
  @ApiOperation({ summary: 'Get farmer home screen data' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns farmer home screen data', 
    type: FarmerHomeResponse 
  })
  async getFarmerHome(
    @GetUser() user: User,
    @Query() query: GetFarmerHomeQueryDto,
  ): Promise<FarmerHomeResponse> {
    this.logger.debug(`Getting home data for user ${user.id} with role ${user.role}`);
    this.logger.debug(`Location query param: ${query.location}`);

    const response = await this.farmerHomeService.getFarmerHomeData(
      user.id,
      query.location
    );

    this.logger.debug(`Response data counts:
      Market Trends: ${response.market_trends?.length ?? 0}
      Active Offers: ${response.active_offers?.my_offers?.length ?? 0} my, ${response.active_offers?.nearby_offers?.length ?? 0} nearby
      Recent Produces: ${response.recent_produces?.length ?? 0}
      Top Buyers: ${response.top_buyers?.length ?? 0}
      Inspections: ${response.inspections?.recent?.length ?? 0} recent, ${response.inspections?.nearby?.length ?? 0} nearby
    `);

    return response;
  }
} 