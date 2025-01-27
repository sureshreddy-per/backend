import { Injectable, NotFoundException, UnauthorizedException, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inspector } from "./entities/inspector.entity";
import { CreateInspectorDto } from "./dto/create-inspector.dto";
import { UpdateInspectorDto } from "./dto/update-inspector.dto";
import { UserRole } from "../enums/user-role.enum";
import { UsersService } from "../users/services/users.service";
import { SystemConfigService } from "../config/services/system-config.service";
import { SystemConfigKey } from "../config/enums/system-config-key.enum";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class InspectorsService {
  private readonly logger = new Logger(InspectorsService.name);

  constructor(
    @InjectRepository(Inspector)
    private readonly inspectorRepository: Repository<Inspector>,
    private readonly usersService: UsersService,
    private readonly systemConfigService: SystemConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    this.logger.debug(`Calculated distance between (${lat1},${lon1}) and (${lat2},${lon2}): ${distance}km`);
    return distance;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private parseLocation(location: string): { lat: number; lng: number } {
    try {
      const [lat, lng] = location.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) {
        this.logger.error(`Invalid location format: ${location}`);
        throw new Error('Invalid location format');
      }
      return { lat, lng };
    } catch (error) {
      this.logger.error(`Failed to parse location ${location}: ${error.message}`);
      throw error;
    }
  }

  async create(createInspectorDto: CreateInspectorDto): Promise<Inspector> {
    // Check if inspector already exists with this user_id
    const existingInspector = await this.inspectorRepository.findOne({
      where: { user_id: createInspectorDto.user_id },
      relations: ["user"],
    });

    if (existingInspector) {
      // If exists, update the location only if provided
      if (createInspectorDto.location) {
        existingInspector.location = createInspectorDto.location;
        return this.inspectorRepository.save(existingInspector);
      }
      return existingInspector;
    }

    // If not exists, create new inspector with default location if not provided
    const inspector = this.inspectorRepository.create({
      ...createInspectorDto,
      location: createInspectorDto.location || "0.0,0.0",
    });

    // Load the user relationship
    const savedInspector = await this.inspectorRepository.save(inspector);
    return this.findByUserId(savedInspector.user_id);
  }

  async findAll(): Promise<Inspector[]> {
    return this.inspectorRepository.find();
  }

  async findOne(id: string): Promise<Inspector> {
    const inspector = await this.inspectorRepository.findOne({
      where: { id },
      relations: ["user"],
    });
    if (!inspector) {
      throw new NotFoundException(`Inspector with ID ${id} not found`);
    }
    return inspector;
  }

  async findByUserId(userId: string): Promise<Inspector> {
    try {
      const inspector = await this.inspectorRepository.findOne({
        where: { user_id: userId },
        relations: ["user"],
      });
      if (!inspector) {
        throw new NotFoundException(`Inspector with user ID ${userId} not found`);
      }
      return inspector;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Error finding inspector: ${error.message}`);
    }
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm?: number, // Made optional since we'll use system config as default
  ): Promise<{ inspector: Inspector; distance: number }[]> {
    // Get max radius from system config, fallback to 50km if not set
    const configRadius = await this.systemConfigService.getValue(SystemConfigKey.MAX_GEOSPATIAL_RADIUS_KM);
    const maxRadius = radiusKm ?? (configRadius ? Number(configRadius) : 50);
    
    this.logger.debug(`Finding inspectors near (${lat},${lng}) within ${maxRadius}km`);
    
    const inspectors = await this.inspectorRepository.find({
      relations: ["user"],
    });
    this.logger.debug(`Found ${inspectors.length} total inspectors`);

    const inspectorsWithDistance = inspectors
      .map(inspector => {
        try {
          const { lat: inspLat, lng: inspLng } = this.parseLocation(inspector.location);
          const distance = this.calculateDistance(lat, lng, inspLat, inspLng);
          return { inspector, distance };
        } catch (error) {
          this.logger.warn(`Skipping inspector ${inspector.id} due to invalid location: ${error.message}`);
          return null;
        }
      })
      .filter(result => result !== null)
      .filter(({ distance }) => {
        const withinRadius = distance <= maxRadius;
        if (!withinRadius) {
          this.logger.debug(`Inspector at distance ${distance}km excluded (exceeds ${maxRadius}km radius)`);
        }
        return withinRadius;
      })
      .sort((a, b) => a.distance - b.distance);

    this.logger.debug(`Found ${inspectorsWithDistance.length} inspectors within ${maxRadius}km radius`);
    if (inspectorsWithDistance.length > 0) {
      this.logger.debug(`Nearest inspector is at ${inspectorsWithDistance[0].distance}km`);
    }

    return inspectorsWithDistance;
  }

  async update(
    id: string,
    updateInspectorDto: UpdateInspectorDto,
  ): Promise<Inspector> {
    const inspector = await this.findOne(id);
    const oldLocation = inspector.location;

    Object.assign(inspector, updateInspectorDto);
    const updatedInspector = await this.inspectorRepository.save(inspector);

    // If location was updated, emit event
    if (updateInspectorDto.location && updateInspectorDto.location !== oldLocation) {
      await this.eventEmitter.emit('inspector.location.updated', {
        inspector_id: updatedInspector.id,
        user_id: updatedInspector.user_id,
        location: updatedInspector.location
      });
      this.logger.log(`Inspector ${id} location updated to ${updatedInspector.location}`);
    }

    return updatedInspector;
  }

  async remove(id: string): Promise<void> {
    const inspector = await this.findOne(id);
    await this.inspectorRepository.remove(inspector);
  }
}
