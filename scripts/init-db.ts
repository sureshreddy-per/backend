import { AppDataSource } from "../src/config/typeorm.config";

async function initializeDatabase() {
  try {
    console.log("Initializing database...");
    
    // Initialize the data source with a timeout
    await Promise.race([
      AppDataSource.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout')), 30000)
      )
    ]);
    console.log("Data source initialized");

    // Create database schema with progress logging
    console.log("Creating database schema...");
    try {
      await AppDataSource.synchronize(false);
      console.log("Database schema created");
    } catch (error) {
      console.error("Error creating database schema:", error);
      throw error;
    }

    // Run essential extensions with error handling
    console.log("Initializing essential extensions...");
    try {
      await AppDataSource.query(`
        DO $$
        BEGIN
          -- Enable UUID extension
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          RAISE NOTICE 'UUID extension enabled';
          
          -- Enable pg_trgm for text search operations
          CREATE EXTENSION IF NOT EXISTS pg_trgm;
          RAISE NOTICE 'pg_trgm extension enabled';
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error enabling extensions: %', SQLERRM;
          RAISE;
        END $$;
      `);
      console.log("Database extensions initialized");
    } catch (error) {
      console.error("Error initializing extensions:", error);
      throw error;
    }

    // Clean up
    try {
      await AppDataSource.destroy();
      console.log("Database initialization completed successfully");
      process.exit(0);
    } catch (error) {
      console.error("Error during cleanup:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error during database initialization:", error);
    process.exit(1);
  }
}

initializeDatabase(); 