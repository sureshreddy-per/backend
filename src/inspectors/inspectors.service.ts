import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inspector } from "./entities/inspector.entity";
import { CreateInspectorDto } from "./dto/create-inspector.dto";
import { UpdateInspectorDto } from "./dto/update-inspector.dto";
import { UserRole } from "../enums/user-role.enum";
import { UsersService } from "../users/services/users.service";

@Injectable()
export class InspectorsService {
  constructor(
    @InjectRepository(Inspector)
    private readonly inspectorRepository: Repository<Inspector>,
    private readonly usersService: UsersService,
  ) {}

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
    radiusKm: number,
  ): Promise<Inspector[]> {
    // TODO: Implement geospatial query using PostGIS
    // For now, return all inspectors
    return this.inspectorRepository.find();
  }

  async update(
    id: string,
    updateInspectorDto: UpdateInspectorDto,
  ): Promise<Inspector> {
    const inspector = await this.findOne(id);
    Object.assign(inspector, updateInspectorDto);
    return this.inspectorRepository.save(inspector);
  }

  async remove(id: string): Promise<void> {
    const inspector = await this.findOne(id);
    await this.inspectorRepository.remove(inspector);
  }
}
