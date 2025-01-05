import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBankDetailsTable1706012345678 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bank_details',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'account_name',
            type: 'varchar',
          },
          {
            name: 'account_number',
            type: 'varchar',
          },
          {
            name: 'bank_name',
            type: 'varchar',
          },
          {
            name: 'branch_code',
            type: 'varchar',
          },
          {
            name: 'farmer_id',
            type: 'uuid',
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'bank_details',
      new TableForeignKey({
        columnNames: ['farmer_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'farmers',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('bank_details');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('farmer_id') !== -1,
    );
    await queryRunner.dropForeignKey('bank_details', foreignKey);
    await queryRunner.dropTable('bank_details');
  }
} 