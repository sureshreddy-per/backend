import { PartialType } from '@nestjs/mapped-types';
import { CreateProduceDto } from './create-produce.dto';

export class UpdateProduceDto extends PartialType(CreateProduceDto) {} 