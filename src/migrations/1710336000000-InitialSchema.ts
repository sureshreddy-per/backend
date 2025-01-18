import { MigrationInterface, QueryRunner } from "typeorm";
import * as fs from 'fs';
import * as path from 'path';

export class InitialSchema1710336000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            // Try multiple possible locations for the SQL file
            const possiblePaths = [
                path.join(__dirname, '../../create_tables.sql'), // Development
                path.join(process.cwd(), 'create_tables.sql'),  // Production root
                path.join(process.cwd(), 'dist/create_tables.sql'), // Production dist
            ];

            let sqlContent: string | null = null;
            let usedPath: string | null = null;

            // Try each path until we find the file
            for (const filePath of possiblePaths) {
                try {
                    if (fs.existsSync(filePath)) {
                        sqlContent = fs.readFileSync(filePath, 'utf8');
                        usedPath = filePath;
                        break;
                    }
                } catch (err) {
                    console.log(`Could not read from ${filePath}`);
                }
            }

            if (!sqlContent) {
                throw new Error(`Could not find create_tables.sql in any of these locations: ${possiblePaths.join(', ')}`);
            }

            console.log(`Found SQL file at: ${usedPath}`);

            // Split the SQL content into individual statements
            const statements = sqlContent
                .split(';')
                .filter(statement => statement.trim().length > 0);

            // Execute each statement separately
            for (const statement of statements) {
                await queryRunner.query(statement + ';');
            }

            console.log('Initial schema migration completed successfully');
        } catch (error) {
            console.error('Error during migration:', error);
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all tables in reverse order
        await queryRunner.query(`
            DROP TABLE IF EXISTS config_audit_logs CASCADE;
            DROP TABLE IF EXISTS admin_audit_logs CASCADE;
            DROP TABLE IF EXISTS system_configs CASCADE;
            DROP TABLE IF EXISTS produce_synonyms CASCADE;
            DROP TABLE IF EXISTS inspection_base_fee_config CASCADE;
            DROP TABLE IF EXISTS transaction_history CASCADE;
            DROP TABLE IF EXISTS business_metrics CASCADE;
            DROP TABLE IF EXISTS daily_prices CASCADE;
            DROP TABLE IF EXISTS ratings CASCADE;
            DROP TABLE IF EXISTS bank_accounts CASCADE;
            DROP TABLE IF EXISTS farm_details CASCADE;
            DROP TABLE IF EXISTS support_tickets CASCADE;
            DROP TABLE IF EXISTS reports CASCADE;
            DROP TABLE IF EXISTS notification_preferences CASCADE;
            DROP TABLE IF EXISTS notifications CASCADE;
            DROP TABLE IF EXISTS media CASCADE;
            DROP TABLE IF EXISTS transactions CASCADE;
            DROP TABLE IF EXISTS offers CASCADE;
            DROP TABLE IF EXISTS buyer_preferences CASCADE;
            DROP TABLE IF EXISTS buyers CASCADE;
            DROP TABLE IF EXISTS quality_assessments CASCADE;
            DROP TABLE IF EXISTS inspection_requests CASCADE;
            DROP TABLE IF EXISTS inspection_distance_fee_config CASCADE;
            DROP TABLE IF EXISTS produce CASCADE;
            DROP TABLE IF EXISTS farms CASCADE;
            DROP TABLE IF EXISTS farmers CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
        `);
    }
} 