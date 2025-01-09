import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionRequest, InspectionRequestStatus } from '../entities/inspection-request.entity';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/entities/notification.entity';
import { ConfigService } from '@nestjs/config';
import { InspectionFeeService } from '../services/inspection-fee.service';
import { ProduceService } from '../../produce/services/produce.service';
import { QualityAssessmentService } from '../../quality/services/quality-assessment.service';

@Injectable()
export class InspectionService {
  constructor(
    @InjectRepository(InspectionRequest)
    private readonly inspectionRepository: Repository<InspectionRequest>,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly inspectionFeeService: InspectionFeeService,
    private readonly produceService: ProduceService,
    private readonly qualityAssessmentService: QualityAssessmentService,
  ) {}

  async createRequest(data: {
    produce_id: string;
    requester_id: string;
  }): Promise<InspectionRequest> {
    const produce = await this.produceService.findOne(data.produce_id);
    if (!produce) {
      throw new NotFoundException('Produce not found');
    }

    // Calculate inspection fee
    const fee = await this.inspectionFeeService.calculateInspectionFee({
      produce_id: data.produce_id,
      location: produce.location,
    });

    const request = this.inspectionRepository.create({
      ...data,
      inspection_fee: fee,
      status: InspectionRequestStatus.PENDING,
    });

    const savedRequest = await this.inspectionRepository.save(request);

    // Notify inspectors about new request
    await this.notificationService.notifyInspectors({
      type: NotificationType.NEW_INSPECTION_REQUEST,
      data: {
        inspection_id: savedRequest.id,
        produce_name: produce.name,
        location: produce.location,
      },
    });

    return savedRequest;
  }

  async assignInspector(inspection_id: string, inspector_id: string): Promise<InspectionRequest> {
    const request = await this.findOne(inspection_id);
    if (!request) {
      throw new NotFoundException('Inspection request not found');
    }

    request.inspector_id = inspector_id;
    request.status = InspectionRequestStatus.SCHEDULED;

    const updatedRequest = await this.inspectionRepository.save(request);

    // Notify requester about inspector assignment
    await this.notificationService.create({
      user_id: request.requester_id,
      type: NotificationType.INSPECTION_SCHEDULED,
      data: {
        inspection_id: request.id,
        scheduled_at: request.scheduled_at,
      },
    });

    return updatedRequest;
  }

  async submitInspectionResult(
    inspection_id: string,
    result: {
      quality_grade: number;
      defects?: string[];
      recommendations?: string[];
      images?: string[];
      notes?: string;
    },
  ): Promise<InspectionRequest> {
    const request = await this.findOne(inspection_id);
    if (!request) {
      throw new NotFoundException('Inspection request not found');
    }

    request.inspection_result = result;
    request.status = InspectionRequestStatus.COMPLETED;
    request.completed_at = new Date();

    const updatedRequest = await this.inspectionRepository.save(request);

    // Update quality assessment with inspection results
    await this.qualityAssessmentService.updateFromInspection(request.produce_id, {
      ...result,
      inspector_id: request.inspector_id,
      inspection_id: request.id,
    });

    // Notify requester about completion
    await this.notificationService.create({
      user_id: request.requester_id,
      type: NotificationType.INSPECTION_COMPLETED,
      data: {
        inspection_id: request.id,
        result: result,
      },
    });

    return updatedRequest;
  }

  async findOne(id: string): Promise<InspectionRequest> {
    return this.inspectionRepository.findOne({
      where: { id },
      relations: ['produce', 'requester', 'inspector'],
    });
  }

  async findByProduce(produce_id: string): Promise<InspectionRequest[]> {
    return this.inspectionRepository.find({
      where: { produce_id },
      relations: ['produce', 'requester', 'inspector'],
      order: { created_at: 'DESC' },
    });
  }

  async findByRequester(requester_id: string): Promise<InspectionRequest[]> {
    return this.inspectionRepository.find({
      where: { requester_id },
      relations: ['produce', 'requester', 'inspector'],
      order: { created_at: 'DESC' },
    });
  }

  async findByInspector(inspector_id: string): Promise<InspectionRequest[]> {
    return this.inspectionRepository.find({
      where: { inspector_id },
      relations: ['produce', 'requester', 'inspector'],
      order: { created_at: 'DESC' },
    });
  }
}