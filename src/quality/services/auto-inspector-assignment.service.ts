import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Inspector } from '../../inspectors/entities/inspector.entity';
import { InspectionRequest, InspectionRequestStatus } from '../entities/inspection-request.entity';
import { SystemConfigService } from '../../config/services/system-config.service';
import { SystemConfigKey } from '../../config/enums/system-config-key.enum';
import { InspectionRequestService } from './inspection-request.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { NotificationType } from '../../notifications/enums/notification-type.enum';

@Injectable()
export class AutoInspectorAssignmentService {
  private readonly logger = new Logger(AutoInspectorAssignmentService.name);

  constructor(
    @InjectRepository(Inspector)
    private readonly inspectorRepository: Repository<Inspector>,
    @InjectRepository(InspectionRequest)
    private readonly inspectionRequestRepository: Repository<InspectionRequest>,
    private readonly systemConfigService: SystemConfigService,
    private readonly inspectionRequestService: InspectionRequestService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('inspector.location.updated')
  async handleInspectorLocationUpdated(event: {
    inspector_id: string;
    user_id: string;
    location: string;
  }) {
    try {
      // Check if auto-assignment is enabled
      const useAutoAssignment = await this.systemConfigService.getValue(SystemConfigKey.USE_AUTO_INSPECTOR_ASSIGNMENT);
      if (useAutoAssignment !== 'true') {
        this.logger.debug('Automatic inspector assignment is disabled');
        return;
      }

      // Get the maximum radius for auto-assignment
      const configRadius = await this.systemConfigService.getValue(SystemConfigKey.AUTO_INSPECTOR_ASSIGNMENT_RADIUS_KM);
      const maxRadius = configRadius ? Number(configRadius) : 50;

      // Parse inspector location
      const [inspectorLat, inspectorLng] = event.location.split(',').map(Number);
      if (isNaN(inspectorLat) || isNaN(inspectorLng)) {
        throw new Error(`Invalid inspector location format: ${event.location}`);
      }

      // Verify inspector exists
      const inspector = await this.inspectorRepository.findOne({
        where: { id: event.inspector_id }
      });

      if (!inspector) {
        this.logger.debug(`Inspector ${event.inspector_id} not found`);
        return;
      }

      // Count current active inspections for this inspector
      const initialActiveCount = await this.inspectionRequestRepository.count({
        where: {
          inspector_id: event.user_id,
          status: InspectionRequestStatus.IN_PROGRESS
        }
      });

      // Find all pending inspection requests within radius
      const nearbyRequests = await this.findNearbyPendingRequests(inspectorLat, inspectorLng, maxRadius);
      this.logger.debug(`Found ${nearbyRequests.length} pending requests within ${maxRadius}km radius`);

      // Sort requests by distance
      const sortedRequests = nearbyRequests.sort((a, b) => a.distance - b.distance);

      // Track number of new assignments
      let newAssignments = 0;

      // Assign requests to inspector
      for (const request of sortedRequests) {
        try {
          // Check if request is still pending before assigning
          const currentRequest = await this.inspectionRequestRepository.findOne({
            where: { 
              id: request.id,
              status: InspectionRequestStatus.PENDING
            }
          });

          if (!currentRequest) {
            this.logger.debug(`Request ${request.id} is no longer pending, skipping`);
            continue;
          }

          await this.inspectionRequestService.assignInspector(request.id, event.user_id);
          
          await this.notificationService.create({
            user_id: event.user_id,
            type: NotificationType.INSPECTION_ASSIGNED,
            data: {
              request_id: request.id,
              produce_id: request.produce_id,
              location: request.location,
              distance_km: request.distance
            }
          });

          this.logger.log(`Automatically assigned request ${request.id} to inspector ${event.inspector_id}`);
          
          // Track new assignment
          newAssignments++;
          
          // Optional: Break if inspector has reached a maximum number of active inspections
          if (initialActiveCount + newAssignments >= 5) { // You can make this configurable
            this.logger.debug(`Inspector ${event.inspector_id} has reached maximum active inspections`);
            break;
          }
        } catch (error) {
          this.logger.error(
            `Failed to assign request ${request.id} to inspector ${event.inspector_id}: ${error.message}`
          );
          continue;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process inspector location update: ${error.message}`, error.stack);
    }
  }

  @OnEvent('inspection.request.created')
  async handleInspectionRequestCreated(event: { 
    request_id: string;
    produce_id: string;
    location: string;
  }) {
    try {
      // Check if auto-assignment is enabled
      const useAutoAssignment = await this.systemConfigService.getValue(SystemConfigKey.USE_AUTO_INSPECTOR_ASSIGNMENT);
      if (useAutoAssignment !== 'true') {
        this.logger.debug('Automatic inspector assignment is disabled');
        return;
      }

      // Get the maximum radius for auto-assignment
      const configRadius = await this.systemConfigService.getValue(SystemConfigKey.AUTO_INSPECTOR_ASSIGNMENT_RADIUS_KM);
      const maxRadius = configRadius ? Number(configRadius) : 50;

      // Parse the location
      const [lat, lng] = event.location.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(`Invalid location format: ${event.location}`);
      }

      // Find nearest available inspector
      const nearestInspector = await this.findNearestAvailableInspector(lat, lng, maxRadius);
      if (!nearestInspector) {
        this.logger.debug(`No available inspectors found within ${maxRadius}km radius`);
        return;
      }

      // Assign the inspector
      await this.inspectionRequestService.assignInspector(event.request_id, nearestInspector.user_id);
      
      // Notify the inspector
      await this.notificationService.create({
        user_id: nearestInspector.user_id,
        type: NotificationType.INSPECTION_ASSIGNED,
        data: {
          request_id: event.request_id,
          produce_id: event.produce_id,
          location: event.location,
          distance_km: nearestInspector.distance
        }
      });

      this.logger.log(`Automatically assigned inspector ${nearestInspector.id} to inspection request ${event.request_id}`);
    } catch (error) {
      this.logger.error(`Failed to auto-assign inspector: ${error.message}`, error.stack);
    }
  }

  private async findNearbyPendingRequests(lat: number, lng: number, maxRadius: number) {
    // Query to find pending inspection requests within radius using PostGIS
    const query = this.inspectionRequestRepository
      .createQueryBuilder('request')
      .addSelect(
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(CAST(split_part(request.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(request.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        ) * 111.32`,
        'distance'
      )
      .where('request.status = :status', { status: InspectionRequestStatus.PENDING })
      .andWhere(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(CAST(split_part(request.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(request.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
          :radius
        )`,
        { lat, lng, radius: maxRadius / 111.32 } // Convert km to degrees
      )
      .orderBy('distance', 'ASC');

    const results = await query.getRawAndEntities();
    
    return results.entities.map((entity, index) => ({
      ...entity,
      distance: parseFloat(results.raw[index].distance)
    }));
  }

  private async findNearestAvailableInspector(lat: number, lng: number, maxRadius: number) {
    // Query to find nearest inspector within radius using PostGIS
    const query = this.inspectorRepository
      .createQueryBuilder('inspector')
      .leftJoinAndSelect('inspector.user', 'user')
      // Count active inspections for workload
      .leftJoin(
        InspectionRequest,
        'active_inspections',
        'active_inspections.inspector_id = inspector.id AND active_inspections.status = :activeStatus',
        { activeStatus: InspectionRequestStatus.IN_PROGRESS }
      )
      .addSelect('COUNT(active_inspections.id)', 'active_inspection_count')
      .addSelect(
        `ST_Distance(
          ST_SetSRID(ST_MakePoint(CAST(split_part(inspector.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(inspector.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
        ) * 111.32`,
        'distance'
      )
      // Calculate weighted score (90% distance, 10% workload)
      .addSelect(
        `(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(CAST(split_part(inspector.location, ',', 2) AS FLOAT), 
                                   CAST(split_part(inspector.location, ',', 1) AS FLOAT)), 4326),
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
          ) * 111.32 * 0.9 +
          (COUNT(active_inspections.id) * :maxRadius * 0.1)
        )`,
        'score'
      )
      .where(
        `ST_DWithin(
          ST_SetSRID(ST_MakePoint(CAST(split_part(inspector.location, ',', 2) AS FLOAT), 
                                 CAST(split_part(inspector.location, ',', 1) AS FLOAT)), 4326),
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
          :radius
        )`,
        { lat, lng, radius: maxRadius / 111.32, maxRadius } // Convert km to degrees
      )
      // Only consider active inspectors
      .andWhere('inspector.is_active = :isActive', { isActive: true })
      .groupBy('inspector.id')
      .addGroupBy('user.id')
      // Order by weighted score
      .orderBy('score', 'ASC')
      .limit(1);

    const result = await query.getOne();
    if (!result) return null;

    const rawResult = await query.getRawOne();
    const distance = parseFloat(rawResult?.distance || '0');
    const activeInspectionCount = parseInt(rawResult?.active_inspection_count || '0');
    const score = parseFloat(rawResult?.score || '0');

    this.logger.debug(
      `Selected inspector ${result.id} with score ${score.toFixed(2)} ` +
      `(distance: ${distance.toFixed(2)}km, active inspections: ${activeInspectionCount})`
    );

    return {
      ...result,
      distance,
      activeInspectionCount,
      score
    };
  }
} 