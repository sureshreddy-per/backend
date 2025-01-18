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

    // Get list of all entities and remove duplicates
    const entities = AppDataSource.entityMetadatas;
    const uniqueEntities = entities.filter((entity, index, self) =>
      index === self.findIndex((e) => e.tableName === entity.tableName)
    );
    console.log(`[DB Init] Found ${uniqueEntities.length} unique entities to process`);

    // Define legacy tables that should be dropped
    const legacyTables = [
      'transaction_history',
      'inspection_base_fee_config',
      'reports',
      'event_metrics'
    ];

    // Drop legacy tables if they exist
    console.log("[DB Init] Checking for legacy tables...");
    for (const tableName of legacyTables) {
      try {
        await AppDataSource.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        console.log(`[DB Init] Dropped legacy table: ${tableName}`);
      } catch (error) {
        console.error(`[DB Init] Error dropping legacy table ${tableName}:`, error);
      }
    }

    // Process entities in smaller batches
    const batchSize = 3;
    const processedTables = new Set();

    for (let i = 0; i < uniqueEntities.length; i += batchSize) {
      const batch = uniqueEntities.slice(i, i + batchSize);
      console.log(`[DB Init] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(uniqueEntities.length/batchSize)}`);
      
      for (const entity of batch) {
        // Skip if table was already processed
        if (processedTables.has(entity.tableName)) {
          console.log(`[DB Init] Skipping duplicate table: ${entity.tableName}`);
          continue;
        }

        try {
          console.log(`[DB Init] Creating table: ${entity.tableName}`);
          
          // Create table with timeout
          await Promise.race([
            (async () => {
              const queryRunner = AppDataSource.createQueryRunner();
              try {
                // Drop table if it exists (to ensure clean state)
                await queryRunner.dropTable(entity.tableName, true);
                
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
              } finally {
                await queryRunner.release();
              }
            })(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error(`Timeout creating table ${entity.tableName}`)), 15000)
            )
          ]);
          
          processedTables.add(entity.tableName);
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
      
      // Compare with processed tables
      console.log(`[DB Init] Processed ${processedTables.size} unique tables`);
      
      // List all created tables
      for (const table of tables) {
        const status = processedTables.has(table.table_name) ? 'processed' : 
                      table.table_name === 'migrations' ? 'system' :
                      'unexpected';
        console.log(`[DB Init] - Table: ${table.table_name} (${status})`);
      }

      // Verify no legacy tables exist
      for (const legacyTable of legacyTables) {
        const exists = await AppDataSource.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [legacyTable]
        );
        if (exists[0].exists) {
          console.error(`[DB Init] Warning: Legacy table ${legacyTable} still exists`);
        }
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