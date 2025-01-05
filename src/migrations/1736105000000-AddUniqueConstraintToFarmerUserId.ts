import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueConstraintToFarmerUserId1736105000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, find all duplicate farmer records
        await queryRunner.query(`
            WITH duplicates AS (
                SELECT user_id, array_agg(id ORDER BY created_at) as farmer_ids
                FROM farmers
                GROUP BY user_id
                HAVING COUNT(*) > 1
            )
            UPDATE bank_details
            SET farmer_id = duplicates.farmer_ids[1]
            FROM duplicates
            WHERE farmer_id = ANY(duplicates.farmer_ids[2:]);
        `);

        await queryRunner.query(`
            WITH duplicates AS (
                SELECT user_id, array_agg(id ORDER BY created_at) as farmer_ids
                FROM farmers
                GROUP BY user_id
                HAVING COUNT(*) > 1
            )
            UPDATE farm_details
            SET farmer_id = duplicates.farmer_ids[1]
            FROM duplicates
            WHERE farmer_id = ANY(duplicates.farmer_ids[2:]);
        `);

        await queryRunner.query(`
            WITH duplicates AS (
                SELECT user_id, array_agg(id ORDER BY created_at) as farmer_ids
                FROM farmers
                GROUP BY user_id
                HAVING COUNT(*) > 1
            )
            UPDATE produces
            SET farmer_id = duplicates.farmer_ids[1]
            FROM duplicates
            WHERE farmer_id = ANY(duplicates.farmer_ids[2:]);
        `);

        // Delete duplicate farmer records, keeping the oldest one
        await queryRunner.query(`
            DELETE FROM farmers a
            USING (
                SELECT user_id, MIN(created_at) as min_created_at
                FROM farmers
                GROUP BY user_id
                HAVING COUNT(*) > 1
            ) b
            WHERE a.user_id = b.user_id
            AND a.created_at > b.min_created_at;
        `);

        // Add unique constraint
        await queryRunner.query(`
            ALTER TABLE farmers
            ADD CONSTRAINT "UQ_farmers_user_id" UNIQUE ("user_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE farmers
            DROP CONSTRAINT "UQ_farmers_user_id";
        `);
    }
} 