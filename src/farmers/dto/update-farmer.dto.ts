import { PartialType } from '@nestjs/swagger';
import { CreateFarmerDto } from './create-farmer.dto';

export class UpdateFarmerDto extends PartialType(CreateFarmerDto) {} 