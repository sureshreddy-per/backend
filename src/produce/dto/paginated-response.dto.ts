import { ApiProperty } from "@nestjs/swagger";
import { Produce } from "../entities/produce.entity";
import { PaginatedResponse } from "../interfaces/paginated-response.interface";

export class PaginatedProduceResponseDto implements PaginatedResponse<Produce> {
  @ApiProperty({ type: [Produce] })
  items: Produce[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
