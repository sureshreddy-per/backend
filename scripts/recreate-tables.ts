import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AppDataSource } from '../src/config/typeorm.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Wait for all modules to be initialized
  await app.init();
  
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    
    // Drop all tables
    await AppDataSource.dropDatabase();
    console.log('Successfully dropped all tables');

    // Synchronize to recreate tables with new schema
    await AppDataSource.synchronize();
    console.log('Successfully recreated all tables');

  } catch (error) {
    console.error('Error during table recreation:', error);
  } finally {
    await AppDataSource.destroy();
    await app.close();
  }
}

bootstrap(); 