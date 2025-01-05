import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { Produce } from '../produce/entities/produce.entity';
import { FoodGrains } from '../produce/entities/produce-categories/food-grains.entity';
import { Oilseeds } from '../produce/entities/produce-categories/oilseeds.entity';
import { Fruits } from '../produce/entities/produce-categories/fruits.entity';
import { Vegetables } from '../produce/entities/produce-categories/vegetables.entity';
import { Spices } from '../produce/entities/produce-categories/spices.entity';
import { Fibers } from '../produce/entities/produce-categories/fibers.entity';
import { Sugarcane } from '../produce/entities/produce-categories/sugarcane.entity';
import { Flowers } from '../produce/entities/produce-categories/flowers.entity';
import { MedicinalPlants } from '../produce/entities/produce-categories/medicinal-plants.entity';

config();

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    Produce,
    FoodGrains,
    Oilseeds,
    Fruits,
    Vegetables,
    Spices,
    Fibers,
    Sugarcane,
    Flowers,
    MedicinalPlants,
    __dirname + '/../**/*.entity{.ts,.js}'
  ],
  synchronize: true,
  dropSchema: true,
  logging: true,
  migrationsRun: false,
};

export default typeOrmConfig;

export const AppDataSource = new DataSource({
  ...typeOrmConfig,
  type: 'postgres',
}); 