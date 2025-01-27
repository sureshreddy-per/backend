import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { InspectionRequest, InspectionRequestStatus } from "../entities/inspection-request.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Produce } from "../../produce/entities/produce.entity";
import { ListInspectionsDto, InspectionSortBy, SortOrder } from "../dto/list-inspections.dto";
import { Inspector } from "../../inspectors/entities/inspector.entity";
import { PaginatedResponse } from "../../common/interfaces/paginated-response.interface";
import { TransformedInspection } from '../interfaces/transformed-inspection.interface';
import { Logger } from "@nestjs/common";
import { Brackets } from "typeorm";

@Injectable()
export class InspectionRequestService {
  private readonly logger = new Logger(InspectionRequestService.name);

  constructor(
    @InjectRepository(InspectionRequest)
    private readonly inspectionRequestRepository: Repository<InspectionRequest>,
    @InjectRepository(Produce)
    private readonly produceRepository: Repository<Produce>,
    @InjectRepository(Inspector)
    private readonly inspectorRepository: Repository<Inspector>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(data: {
    produce_id: string;
    requester_id: string;
  }): Promise<InspectionRequest> {
    // Get produce to access its location and inspection fee
    const produce = await this.produceRepository.findOne({
      where: { id: data.produce_id }
    });

    if (!produce) {
      throw new NotFoundException(`Produce with ID ${data.produce_id} not found`);
    }

    const request = this.inspectionRequestRepository.create({
      ...data,
      location: produce.location, // Use produce's location
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

  async findAll(
    userId: string,
    role: string,
    queryParams: ListInspectionsDto
  ): Promise<PaginatedResponse<TransformedInspection>> {
    const { page = 1, limit = 10, status, search, sortBy, sortOrder, lat, lng } = queryParams;
    const skip = (page - 1) * limit;

    this.logger.debug(`Finding inspections for user ${userId} with role ${role}`);
    this.logger.debug(`Query params: ${JSON.stringify(queryParams)}`);

    const queryBuilder = this.inspectionRequestRepository
      .createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.produce', 'produce')
      .leftJoinAndSelect('produce.quality_assessments', 'quality_assessments')
      .leftJoinAndSelect('inspection.inspector', 'inspector')
      .leftJoinAndSelect('inspector.user', 'inspector_user')
      .leftJoin('produce.offers', 'offers');

    // Apply role-based filters
    if (role === 'FARMER') {
      queryBuilder.where('produce.farmer_id = :userId', { userId });
      this.logger.debug('Applied FARMER filter');
    } else if (role === 'INSPECTOR') {
      queryBuilder.where('inspection.inspector_id = :userId', { userId });
      this.logger.debug('Applied INSPECTOR filter');
    } else if (role === 'BUYER') {
      queryBuilder.where(new Brackets(qb => {
        qb.where('offers.buyer_id = :userId', { userId })
          .orWhere('inspection.requester_id = :userId', { userId });
      }));
      this.logger.debug('Applied BUYER filter (offers and requests)');
    }

    // Apply status filter
    if (status) {
      queryBuilder.andWhere('inspection.status = :status', { status });
      this.logger.debug(`Applied status filter: ${status}`);
    }

    // Apply search filter
    if (search) {
      queryBuilder.andWhere('produce.name ILIKE :search', { search: `%${search}%` });
      this.logger.debug(`Applied search filter: ${search}`);
    }

    // Apply sorting
    switch (sortBy) {
      case InspectionSortBy.STATUS:
        queryBuilder.orderBy('inspection.status', sortOrder);
        this.logger.debug(`Sorting by status ${sortOrder}`);
        break;
      case InspectionSortBy.QUALITY:
        queryBuilder.orderBy('produce.quality_grade', sortOrder);
        this.logger.debug(`Sorting by quality ${sortOrder}`);
        break;
      case InspectionSortBy.DISTANCE:
        if (lat && lng) {
          // Add distance calculation using PostGIS
          queryBuilder.addSelect(
            `ST_Distance(
              ST_SetSRID(ST_MakePoint(CAST(split_part(inspection.location, ',', 2) AS FLOAT), 
                                     CAST(split_part(inspection.location, ',', 1) AS FLOAT)), 4326),
              ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
            ) as distance`,
            'distance'
          )
          .setParameters({ lat, lng })
          .orderBy('distance', sortOrder);
          this.logger.debug(`Sorting by distance ${sortOrder} with lat=${lat}, lng=${lng}`);
        }
        break;
      default:
        queryBuilder.orderBy('inspection.created_at', sortOrder);
        this.logger.debug(`Sorting by created_at ${sortOrder}`);
    }

    // Log the final SQL query
    const rawQuery = queryBuilder.getSql();
    const parameters = queryBuilder.getParameters();
    this.logger.debug('Final SQL query:', rawQuery);
    this.logger.debug('Query parameters:', parameters);

    // Get total count
    const total = await queryBuilder.getCount();
    this.logger.debug(`Total count before pagination: ${total}`);

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const items = await queryBuilder.getMany();
    this.logger.debug(`Found ${items.length} items after pagination`);

    // Transform response
    const transformedItems = items.map(inspection => ({
      ...inspection,
      produce: {
        id: inspection.produce.id,
        name: inspection.produce.name,
        images: inspection.produce.images,
        location: inspection.produce.location,
        quality_grade: inspection.produce.quality_grade,
        quality_assessments: inspection.produce.quality_assessments
      },
      inspector: inspection.inspector ? {
        id: inspection.inspector.id,
        name: inspection.inspector.name,
        mobile_number: inspection.inspector.mobile_number,
        location: inspection.inspector.location
      } : null
    }));

    return {
      items: transformedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
} 