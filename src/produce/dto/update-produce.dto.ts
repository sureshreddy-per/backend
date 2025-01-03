import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateProduceDto } from './create-produce.dto';

export class UpdateProduceDto extends PartialType(
  OmitType(CreateProduceDto, ['qualityId'] as const),
) {} 