import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const connection = getConnection();

  try {
    // Drop all tables
    await connection.dropDatabase();
    console.log('Successfully dropped all tables');

    // Synchronize to recreate tables with new schema
    await connection.synchronize();
    console.log('Successfully recreated all tables');

  } catch (error) {
    console.error('Error during table recreation:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 