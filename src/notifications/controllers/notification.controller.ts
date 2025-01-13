import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { NotificationService } from "../services/notification.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Notification } from "../entities/notification.entity";
import { UpdateNotificationPreferencesDto } from "../dto/update-notification-preferences.dto";
import { UpdateFCMTokenDto } from "../dto/update-fcm-token.dto";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Get user notifications" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated list of notifications",
    type: [Notification],
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getUserNotifications(
    @Request() req: any,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.notificationService.getUserNotifications(
      req.user.sub,
      page,
      limit,
    );
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notifications count" })
  @ApiResponse({
    status: 200,
    description: "Returns count of unread notifications",
    type: Number,
  })
  async getUnreadCount(@Request() req: any) {
    return {
      count: await this.notificationService.getUnreadCount(req.user.sub),
    };
  }

  @Put("preferences")
  @ApiOperation({ summary: "Update notification preferences" })
  @ApiResponse({
    status: 200,
    description: "Notification preferences updated successfully",
  })
  async updatePreferences(
    @Request() req: any,
    @Body() data: UpdateNotificationPreferencesDto,
  ) {
    console.log('User from request:', req.user);
    console.log('User ID from token:', req.user?.sub);
    if (!req.user?.sub) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.notificationService.updatePreferences(req.user.sub, data);
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences" })
  @ApiResponse({
    status: 200,
    description: "Returns notification preferences",
  })
  async getPreferences(@Request() req: any) {
    return this.notificationService.getPreferences(req.user.sub);
  }

  @Put(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiResponse({
    status: 200,
    description: "Notification marked as read",
  })
  async markAsRead(@Param("id") id: string) {
    await this.notificationService.markAsRead(id);
    return { success: true };
  }

  @Put("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({
    status: 200,
    description: "All notifications marked as read",
  })
  async markAllAsRead(@Request() req: any) {
    await this.notificationService.markAllAsRead(req.user.sub);
    return { success: true };
  }

  @Put("fcm-token")
  @ApiOperation({ summary: "Update FCM token" })
  @ApiResponse({
    status: 200,
    description: "FCM token updated successfully",
  })
  async updateFCMToken(
    @Request() req: any,
    @Body() data: UpdateFCMTokenDto,
  ) {
    await this.notificationService.updateFCMToken(req.user.sub, data.fcm_token);
    return { success: true };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  @ApiResponse({
    status: 200,
    description: "Notification deleted successfully",
  })
  async deleteNotification(@Param("id") id: string) {
    await this.notificationService.remove(id);
    return { success: true };
  }
}
