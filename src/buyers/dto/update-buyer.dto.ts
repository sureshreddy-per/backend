import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBuyerDto } from './create-buyer.dto';

export class UpdateBuyerDto extends PartialType(
  OmitType(CreateBuyerDto, ['password'] as const),
) {} 