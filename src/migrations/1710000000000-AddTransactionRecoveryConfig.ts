import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionRecoveryConfig1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO system_configs (id, key, value, description, created_at, updated_at)
            VALUES (
                uuid_generate_v4(),
                'TRANSACTION_RECOVERY_ENABLED',
                'true',
                'Controls whether the automatic recovery of missing transactions for accepted offers is enabled',
                NOW(),
                NOW()
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM system_configs
            WHERE key = 'transaction_recovery_cron_enabled';
        `);
    }
} 