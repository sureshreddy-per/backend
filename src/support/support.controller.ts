import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UnauthorizedException,
} from "@nestjs/common";
import { SupportService } from "./support.service";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../auth/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import { SupportTicket } from "./entities/support-ticket.entity";
import { PaginatedResponse } from "../common/interfaces/paginated-response.interface";

@Controller("support")
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  create(
    @GetUser() user: User,
    @Body() createSupportTicketDto: CreateSupportTicketDto,
  ): Promise<SupportTicket> {
    return this.supportService.create(user.id, createSupportTicketDto);
  }

  @Get()
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<SupportTicket>> {
    return this.supportService.findAll(page, limit);
  }

  @Get("my-tickets")
  findMyTickets(
    @GetUser() user: User,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ): Promise<PaginatedResponse<SupportTicket>> {
    return this.supportService.findByUser(user.id, page, limit);
  }

  @Get(":id")
  async findOne(
    @GetUser() user: User,
    @Param("id") id: string,
  ): Promise<SupportTicket> {
    const ticket = await this.supportService.findOne(id);

    if (ticket.user_id !== user.id) {
      throw new UnauthorizedException(
        "You can only view your own support tickets",
      );
    }

    return ticket;
  }

  @Delete(":id")
  async remove(@GetUser() user: User, @Param("id") id: string): Promise<void> {
    const ticket = await this.supportService.findOne(id);

    if (ticket.user_id !== user.id) {
      throw new UnauthorizedException(
        "You can only delete your own support tickets",
      );
    }

    return this.supportService.remove(id);
  }
}
