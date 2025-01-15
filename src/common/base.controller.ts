import {
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
  Controller,
} from "@nestjs/common";
import { BaseService } from "./base.service";
import { PaginatedResponse } from "./interfaces/paginated-response.interface";
import { PaginationQueryDto } from "./dto/pagination-query.dto";

@Controller()
export class BaseController<T extends { id: string }> {
  constructor(protected readonly service: BaseService<T>) {}

  @Get()
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10, ...rest } = query;
    const skip = (page - 1) * limit;
    return this.service.findAll({ skip, take: limit, ...rest });
  }

  @Get(":id")
  async findOne(@Param("id") id: string): Promise<T> {
    const entity = await this.service.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
    return entity;
  }

  @Post()
  async create(@Body() data: any): Promise<T> {
    return this.service.create(data);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() data: any): Promise<T> {
    const entity = await this.service.update(id, data);
    if (!entity) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
    return entity;
  }

  @Delete(":id")
  async delete(@Param("id") id: string): Promise<void> {
    const entity = await this.service.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
    await this.service.delete(id);
  }
}
