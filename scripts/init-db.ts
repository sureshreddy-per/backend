import { AppDataSource } from "../src/config/typeorm.config";

async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("Data source initialized");

    // Create database schema
    await AppDataSource.synchronize(false);
    console.log("Database schema created");

    // Run essential extensions
    console.log("Initializing essential extensions...");
    await AppDataSource.query(`
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Enable pg_trgm for text search operations
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);
    console.log("Database extensions initialized");

    await AppDataSource.destroy();
    console.log("Database initialization completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during database initialization:", error);
    process.exit(1);
  }
}

initializeDatabase(); 