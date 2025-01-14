import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SupportTicket } from "./entities/support-ticket.entity";
import { CreateSupportTicketDto } from "./dto/create-support-ticket.dto";
import { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import { PaginatedResponse } from "../common/interfaces/paginated-response.interface";

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportTicketRepository: Repository<SupportTicket>,
  ) {}

  async create(
    userId: string,
    createSupportTicketDto: CreateSupportTicketDto,
  ): Promise<SupportTicket> {
    try {
      console.log('Creating ticket with DTO:', JSON.stringify(createSupportTicketDto, null, 2));
      
      // Ensure attachments is properly formatted for PostgreSQL simple-array
      if (createSupportTicketDto.attachments) {
        if (!Array.isArray(createSupportTicketDto.attachments)) {
          createSupportTicketDto.attachments = [createSupportTicketDto.attachments];
        }
        // Convert to array of strings and join with commas for PostgreSQL simple-array
        const attachmentsArray = createSupportTicketDto.attachments.map(String);
        console.log('Attachments array:', attachmentsArray);
        
        const ticket = this.supportTicketRepository.create({
          ...createSupportTicketDto,
          user_id: userId,
          attachments: attachmentsArray,
        });

        console.log('Saving ticket:', JSON.stringify(ticket, null, 2));
        const savedTicket = await this.supportTicketRepository.save(ticket);
        console.log('Saved ticket:', JSON.stringify(savedTicket, null, 2));
        return savedTicket;
      } else {
        const ticket = this.supportTicketRepository.create({
          ...createSupportTicketDto,
          user_id: userId,
          attachments: [],
        });

        console.log('Saving ticket:', JSON.stringify(ticket, null, 2));
        const savedTicket = await this.supportTicketRepository.save(ticket);
        console.log('Saved ticket:', JSON.stringify(savedTicket, null, 2));
        return savedTicket;
      }
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<SupportTicket>> {
    const [items, total] = await this.supportTicketRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ["user"],
      order: { created_at: "DESC" },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<SupportTicket> {
    const ticket = await this.supportTicketRepository.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(
    id: string,
    updateSupportTicketDto: UpdateSupportTicketDto,
  ): Promise<SupportTicket> {
    const ticket = await this.findOne(id);
    Object.assign(ticket, updateSupportTicketDto);
    return this.supportTicketRepository.save(ticket);
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.supportTicketRepository.remove(ticket);
  }

  async findByUser(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<SupportTicket>> {
    const [items, total] = await this.supportTicketRepository.findAndCount({
      where: { user_id: userId },
      skip: (page - 1) * limit,
      take: limit,
      relations: ["user"],
      order: { created_at: "DESC" },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
