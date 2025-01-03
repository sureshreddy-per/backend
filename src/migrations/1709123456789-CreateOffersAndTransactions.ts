import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOffersAndTransactions1709123456789 implements MigrationInterface {
  name = 'CreateOffersAndTransactions1709123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."offers_status_enum" AS ENUM (
        'PENDING',
        'ACCEPTED',
        'REJECTED',
        'EXPIRED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."transactions_status_enum" AS ENUM (
        'PENDING',
        'COMPLETED',
        'FAILED',
        'REFUNDED'
      )
    `);

    // Create offers table
    await queryRunner.query(`
      CREATE TABLE "offers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "buyer_id" uuid NOT NULL,
        "produce_id" uuid NOT NULL,
        "price" decimal NOT NULL,
        "quantity" decimal NOT NULL,
        "status" "public"."offers_status_enum" NOT NULL DEFAULT 'PENDING',
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_offers" PRIMARY KEY ("id")
      )
    `);

    // Create transactions table
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "buyer_id" uuid NOT NULL,
        "produce_id" uuid NOT NULL,
        "quantity" decimal NOT NULL,
        "total_cost" decimal NOT NULL,
        "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'PENDING',
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "pk_transactions" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "offers"
      ADD CONSTRAINT "fk_offers_buyer"
      FOREIGN KEY ("buyer_id")
      REFERENCES "buyers"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "offers"
      ADD CONSTRAINT "fk_offers_produce"
      FOREIGN KEY ("produce_id")
      REFERENCES "produce"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "fk_transactions_buyer"
      FOREIGN KEY ("buyer_id")
      REFERENCES "buyers"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "transactions"
      ADD CONSTRAINT "fk_transactions_produce"
      FOREIGN KEY ("produce_id")
      REFERENCES "produce"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "fk_transactions_produce"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "fk_transactions_buyer"`);
    await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "fk_offers_produce"`);
    await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "fk_offers_buyer"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "offers"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."offers_status_enum"`);
  }
} 