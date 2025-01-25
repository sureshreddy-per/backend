import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
    return this.farmerHomeService.getFarmerHomeData(
      user.id,
      query.location
    );
  }
} 