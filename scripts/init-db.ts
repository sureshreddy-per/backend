import { AppDataSource } from "../src/config/typeorm.config";

async function initializeDatabase() {
  try {
    console.log("[DB Init] Starting database initialization...");
    
    // Initialize the data source with a timeout
    await Promise.race([
      AppDataSource.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database initialization timeout after 30 seconds')), 30000)
      )
    ]);
    console.log("[DB Init] Data source initialized successfully");

    // Enable essential extensions first
    console.log("[DB Init] Setting up essential extensions...");
    try {
      await Promise.race([
        AppDataSource.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
            ) THEN
              CREATE EXTENSION "uuid-ossp";
              RAISE NOTICE 'Created uuid-ossp extension';
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
            ) THEN
              CREATE EXTENSION pg_trgm;
              RAISE NOTICE 'Created pg_trgm extension';
            END IF;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error setting up extensions: %', SQLERRM;
            RAISE;
          END $$;
        `),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Extension setup timeout after 10 seconds')), 10000)
        )
      ]);
      console.log("[DB Init] Database extensions initialized successfully");
    } catch (error) {
      console.error("[DB Init] Failed to initialize extensions:", error);
      throw error;
    }

    // Get list of all entities
    const entities = AppDataSource.entityMetadatas;
    console.log(`[DB Init] Found ${entities.length} entities to process`);

    // Process entities in smaller batches
    const batchSize = 3; // Reduced batch size
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      console.log(`[DB Init] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(entities.length/batchSize)}`);
      
      for (const entity of batch) {
        try {
          console.log(`[DB Init] Creating table: ${entity.tableName}`);
          
          // Create table with timeout
          await Promise.race([
            (async () => {
              const queryRunner = AppDataSource.createQueryRunner();
              try {
                // Check if table exists
                const tableExists = await queryRunner.hasTable(entity.tableName);
                if (!tableExists) {
                  // Create schema if it doesn't exist
                  await queryRunner.createSchema(entity.schema || 'public', true);
                  
                  // Create table using direct SQL
                  const metadata = AppDataSource.getMetadata(entity.target);
                  const tablePath = metadata.tablePath;
                  const columns = metadata.columns
                    .map(column => {
                      const type = column.type.toString().toLowerCase();
                      const nullable = column.isNullable ? 'NULL' : 'NOT NULL';
                      const primary = column.isPrimary ? 'PRIMARY KEY' : '';
                      const defaultValue = column.default ? `DEFAULT ${column.default}` : '';
                      return `"${column.databaseName}" ${type} ${nullable} ${primary} ${defaultValue}`.trim();
                    })
                    .join(',\n');

                  await queryRunner.query(`
                    CREATE TABLE IF NOT EXISTS ${tablePath} (
                      ${columns}
                    );
                  `);
                }
              } finally {
                await queryRunner.release();
              }
            })(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Timeout creating table ${entity.tableName}`)), 15000)
            )
          ]);
          
          console.log(`[DB Init] Successfully created table: ${entity.tableName}`);
        } catch (error) {
          console.error(`[DB Init] Error creating table ${entity.tableName}:`, error);
          // Continue with other tables even if one fails
          continue;
        }

        // Small delay between tables
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verify all tables were created
    try {
      const tables = await AppDataSource.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
      );
      console.log(`[DB Init] Verified ${tables.length} tables created successfully`);
      
      // List all created tables
      for (const table of tables) {
        console.log(`[DB Init] - Table: ${table.table_name}`);
      }
    } catch (error) {
      console.error("[DB Init] Error verifying tables:", error);
    }

    // Clean up
    try {
      await AppDataSource.destroy();
      console.log("[DB Init] Database initialization completed successfully");
      process.exit(0);
    } catch (error) {
      console.error("[DB Init] Error during cleanup:", error);
      throw error;
    }
  } catch (error) {
    console.error("[DB Init] Fatal error during database initialization:", error);
    process.exit(1);
  }
}

initializeDatabase(); 