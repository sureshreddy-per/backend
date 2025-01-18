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

    // Helper function to convert TypeORM type to PostgreSQL type
    function getPostgresType(column: any): string {
      if (!column || !column.type) {
        console.error(`[DB Init] Invalid column definition:`, column);
        return 'text'; // fallback type
      }

      let type = '';
      if (typeof column.type === 'string') {
        type = column.type.toLowerCase();
      } else if (typeof column.type === 'function') {
        // Handle constructor functions (like Date, Number, etc.)
        type = column.type.name.toLowerCase();
      } else if (column.type.name) {
        // Handle class types
        type = column.type.name.toLowerCase();
      } else {
        console.error(`[DB Init] Unknown column type:`, column.type);
        return 'text'; // fallback type
      }
      
      // Handle special cases
      switch(type) {
        case 'uuid':
          return 'uuid';
        case 'varchar':
        case 'string':
          return column.length ? `varchar(${column.length})` : 'text';
        case 'int':
        case 'integer':
        case 'number':
          return 'integer';
        case 'float':
        case 'double':
          return 'double precision';
        case 'datetime':
        case 'timestamp':
        case 'date':
          return 'timestamp';
        case 'boolean':
          return 'boolean';
        case 'json':
        case 'jsonb':
          return 'jsonb';
        case 'enum':
          // Create enum type if it doesn't exist
          const enumName = `${column.entityMetadata.tableName}_${column.databaseName}_enum`;
          return enumName;
        default:
          console.warn(`[DB Init] Using default type 'text' for unknown type: ${type}`);
          return 'text';
      }
    }

    // Helper function to get default value
    function getDefaultValue(column: any): string {
      if (!column || column.default === undefined || column.default === null) {
        return '';
      }
      
      if (typeof column.default === 'function') {
        const defaultStr = column.default.toString();
        if (defaultStr.includes('uuid_generate_v4')) {
          return "DEFAULT uuid_generate_v4()";
        }
        if (defaultStr.includes('now')) {
          return "DEFAULT CURRENT_TIMESTAMP";
        }
        console.warn(`[DB Init] Unsupported function default value:`, defaultStr);
        return '';
      }
      
      if (typeof column.default === 'string') {
        return `DEFAULT '${column.default.replace(/'/g, "''")}'`;
      }
      
      if (typeof column.default === 'number' || typeof column.default === 'boolean') {
        return `DEFAULT ${column.default}`;
      }
      
      console.warn(`[DB Init] Unsupported default value type:`, typeof column.default);
      return '';
    }

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
                
                // Create enums first if needed
                for (const column of entity.columns) {
                  if (column.type === 'enum' && column.enum) {
                    const enumName = `${entity.tableName}_${column.databaseName}_enum`;
                    const enumValues = column.enum.map((val: string) => `'${val.replace(/'/g, "''")}'`).join(', ');
                    await queryRunner.query(`
                      DO $$
                      BEGIN
                        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumName}') THEN
                          CREATE TYPE ${enumName} AS ENUM (${enumValues});
                        END IF;
                      END$$;
                    `);
                  }
                }
                
                // Create table
                const columns = entity.columns
                  .map(column => {
                    try {
                      const type = getPostgresType(column);
                      const nullable = column.isNullable ? 'NULL' : 'NOT NULL';
                      const primary = column.isPrimary ? 'PRIMARY KEY' : '';
                      const defaultValue = getDefaultValue(column);
                      return `"${column.databaseName}" ${type} ${nullable} ${primary} ${defaultValue}`.trim();
                    } catch (error) {
                      console.error(`[DB Init] Error processing column in ${entity.tableName}:`, column, error);
                      throw error;
                    }
                  })
                  .join(',\n');

                await queryRunner.query(`
                  CREATE TABLE IF NOT EXISTS "${entity.tableName}" (
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