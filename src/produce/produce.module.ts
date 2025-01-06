import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { ProduceController } from './produce.controller';
import { ProduceService } from './produce.service';
import { Produce } from './entities/produce.entity';
import { FarmerMiddleware } from '../auth/middleware/farmer.middleware';
import { Farmer } from '../farmers/entities/farmer.entity';
import { FarmDetails } from '../farmers/entities/farm-details.entity';
import { FoodGrains } from './entities/produce-categories/food-grains.entity';
import { Oilseeds } from './entities/produce-categories/oilseeds.entity';
import { Fruits } from './entities/produce-categories/fruits.entity';
import { Vegetables } from './entities/produce-categories/vegetables.entity';
import { Spices } from './entities/produce-categories/spices.entity';
import { Fibers } from './entities/produce-categories/fibers.entity';
import { Sugarcane } from './entities/produce-categories/sugarcane.entity';
import { Flowers } from './entities/produce-categories/flowers.entity';
import { MedicinalPlants } from './entities/produce-categories/medicinal-plants.entity';
import { FarmersModule } from '../farmers/farmers.module';
import { S3Service } from '../common/services/s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Produce,
      Farmer,
      FarmDetails,
      FoodGrains,
      Oilseeds,
      Fruits,
      Vegetables,
      Spices,
      Fibers,
      Sugarcane,
      Flowers,
      MedicinalPlants
    ]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    ConfigModule,
    FarmersModule
  ],
  controllers: [ProduceController],
  providers: [ProduceService, S3Service],
  exports: [ProduceService]
})
export class ProduceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FarmerMiddleware)
      .forRoutes(ProduceController);
  }
} 