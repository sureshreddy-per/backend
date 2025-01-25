import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppVersionService } from '../services/app-version.service';
import { UpdateAppVersionDto, AppType } from '../dto/update-app-version.dto';
import { AdminGuard } from '../guards/admin.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('App Version Control')
@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) {}

  @Get('check')
  @ApiOperation({ summary: 'Check app version status' })
  async checkAppVersion(
    @Query('app_type') appType: AppType,
    @Query('current_version') currentVersion: string,
  ) {
    return this.appVersionService.checkAppStatus(appType, currentVersion);
  }

  @Post('update')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update app version settings' })
  async updateAppVersion(
    @CurrentUser('id') adminId: string,
    @Body() updateDto: UpdateAppVersionDto,
  ) {
    return this.appVersionService.updateAppVersion(adminId, updateDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get app version settings' })
  async getAppVersion(@Query('app_type') appType: AppType) {
    return this.appVersionService.getAppVersion(appType);
  }
} 