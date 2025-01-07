import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inspector } from './entities/inspector.entity';
import { InspectorsService } from './inspectors.service';
import { InspectorsController } from './inspectors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Inspector])],
  providers: [InspectorsService],
  controllers: [InspectorsController],
  exports: [InspectorsService],
})
export class InspectorsModule {} 