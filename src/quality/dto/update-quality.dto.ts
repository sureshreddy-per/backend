import { PartialType } from '@nestjs/mapped-types';
import { CreateQualityDto } from './create-quality.dto';

export class UpdateQualityDto extends PartialType(CreateQualityDto) {} 