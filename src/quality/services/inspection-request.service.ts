import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InspectionRequest, InspectionRequestStatus } from "../entities/inspection-request.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Produce } from "../../produce/entities/produce.entity";

@Injectable()
export class InspectionRequestService {
  constructor(
    @InjectRepository(InspectionRequest)
    private readonly inspectionRequestRepository: Repository<InspectionRequest>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: {
    produce_id: string;
    requester_id: string;
    location: string;
  }): Promise<InspectionRequest> {
    // Get produce to access its inspection fee
    const produce = await this.produceRepository.findOne({
      where: { id: data.produce_id }
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID ${data.produce_id} not found`);
    }

    const request = this.inspectionRequestRepository.create({
      ...data,
      inspection_fee: produce.inspection_fee,
      status: InspectionRequestStatus.PENDING,
    });

    const savedRequest = await this.inspectionRequestRepository.save(request);

    // Emit event for other services
    await this.eventEmitter.emit('inspection.request.created', {
      request_id: savedRequest.id,
      produce_id: savedRequest.produce_id,
      location: savedRequest.location,
    });

    return savedRequest;
  }

  async findOne(id: string): Promise<InspectionRequest> {
    const request = await this.inspectionRequestRepository.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Inspection request ${id} not found`);
    }

    return request;
  }

  async assignInspector(id: string, inspectorId: string): Promise<InspectionRequest> {
    const request = await this.findOne(id);

    if (request.status !== InspectionRequestStatus.PENDING) {
      throw new BadRequestException("Can only assign inspector to pending requests");
    }

    request.inspector_id = inspectorId;
    request.status = InspectionRequestStatus.IN_PROGRESS;
    request.assigned_at = new Date();

    const updatedRequest = await this.inspectionRequestRepository.save(request);

    // Emit event for other services
    await this.eventEmitter.emit('inspection.request.assigned', {
      request_id: updatedRequest.id,
      inspector_id: inspectorId,
    });

    return updatedRequest;
  }

  async complete(id: string): Promise<InspectionRequest> {
    const request = await this.findOne(id);

    if (request.status !== InspectionRequestStatus.IN_PROGRESS) {
      throw new BadRequestException("Can only complete in-progress requests");
    }

    request.status = InspectionRequestStatus.COMPLETED;
    request.completed_at = new Date();

    const updatedRequest = await this.inspectionRequestRepository.save(request);

    // Emit event for other services
    await this.eventEmitter.emit('inspection.request.completed', {
      request_id: updatedRequest.id,
      produce_id: updatedRequest.produce_id,
    });

    return updatedRequest;
  }
} 