import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRevokedAtFromRefreshTokens1739950000000
  implements MigrationInterface
{
  name = 'RemoveRevokedAtFromRefreshTokens1739950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP COLUMN IF EXISTS "revokedAt"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD "revokedAt" TIMESTAMP`,
    );
  }
}
