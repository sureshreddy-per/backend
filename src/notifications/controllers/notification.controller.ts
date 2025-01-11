import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { NotificationService } from "../services/notification.service";
import { AuthGuard } from "@nestjs/passport";
import { Notification } from "../entities/notification.entity";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(AuthGuard("jwt"))
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
      req.user.id,
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
      count: await this.notificationService.getUnreadCount(req.user.id),
    };
  }

  @Post(":id/mark-read")
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiResponse({
    status: 200,
    description: "Notification marked as read",
  })
  async markAsRead(@Param("id") id: string, @Request() req: any) {
    await this.notificationService.markAsRead(id);
    return { success: true };
  }
}
