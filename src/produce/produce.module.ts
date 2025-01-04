import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProduceService } from './produce.service';
import { ProduceController } from './produce.controller';
import { Produce } from './entities/produce.entity';
import { QualityModule } from '../quality/quality.module';
import { AuthModule } from '../auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { User } from '../auth/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produce, User]),
    QualityModule,
    AuthModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [ProduceService],
  controllers: [ProduceController],
  exports: [ProduceService],
})
export class ProduceModule {} 