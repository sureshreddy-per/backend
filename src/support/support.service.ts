import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support, SupportStatus, SupportPriority, SupportCategory } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { FileUploadService } from '../common/services/file-upload.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private readonly supportRepository: Repository<Support>,
    private readonly notificationsService: NotificationsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async create(createSupportDto: CreateSupportDto, userId: string, userType: 'customer' | 'buyer'): Promise<Support> {
    const support = this.supportRepository.create({
      ...createSupportDto,
      [userType === 'customer' ? 'customerId' : 'buyerId']: userId,
    });

    const savedSupport = await this.supportRepository.save(support);

    // Send notification to admin
    await this.notificationsService.create({
      title: 'New Support Ticket',
      message: `A new support ticket has been created: ${savedSupport.title}`,
      type: NotificationType.SUPPORT,
      metadata: {
        supportId: savedSupport.id,
        priority: savedSupport.priority,
      },
    });

    return savedSupport;
  }

  async findAll(page = 1, limit = 10, status?: SupportStatus) {
    const query = this.supportRepository.createQueryBuilder('support')
      .leftJoinAndSelect('support.customer', 'customer')
      .leftJoinAndSelect('support.buyer', 'buyer')
      .orderBy('support.createdAt', 'DESC');

    if (status) {
      query.where('support.status = :status', { status });
    }

    const [tickets, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Support> {
    const support = await this.supportRepository.findOne({
      where: { id },
      relations: ['customer', 'buyer'],
    });

    if (!support) {
      throw new NotFoundException('Support ticket not found');
    }

    return support;
  }

  async findByUser(userId: string, userType: 'customer' | 'buyer', page = 1, limit = 10) {
    const query = this.supportRepository.createQueryBuilder('support')
      .where(userType === 'customer' ? 'support.customerId = :userId' : 'support.buyerId = :userId', { userId })
      .orderBy('support.createdAt', 'DESC');

    const [tickets, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateSupportDto: UpdateSupportDto): Promise<Support> {
    const support = await this.findOne(id);
    const updatedSupport = Object.assign(support, updateSupportDto);
    const savedSupport = await this.supportRepository.save(updatedSupport);

    // Send notification if status changed
    if (updateSupportDto.status && updateSupportDto.status !== support.status) {
      await this.notificationsService.create({
        title: 'Support Ticket Updated',
        message: `Your support ticket status has been updated to ${updateSupportDto.status}`,
        type: NotificationType.SUPPORT,
        metadata: {
          supportId: id,
          status: updateSupportDto.status,
        },
        customerId: support.customerId,
        buyerId: support.buyerId,
      });
    }

    return savedSupport;
  }

  async addAttachment(id: string, filePath: string): Promise<Support> {
    const support = await this.findOne(id);
    support.attachments = [...support.attachments, filePath];
    return this.supportRepository.save(support);
  }

  async removeAttachment(id: string, filePath: string): Promise<Support> {
    const support = await this.findOne(id);
    const index = support.attachments.indexOf(filePath);
    
    if (index === -1) {
      throw new BadRequestException('Attachment not found');
    }

    support.attachments = support.attachments.filter(path => path !== filePath);
    await this.fileUploadService.deleteFile(filePath);
    return this.supportRepository.save(support);
  }
} 