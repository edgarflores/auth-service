import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppsAndSimplifyUser1739900000000 implements MigrationInterface {
  name = 'AddAppsAndSimplifyUser1739900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_username_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "firstName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "lastName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "apps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "code" character varying NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_apps_code" UNIQUE ("code"),
        CONSTRAINT "PK_apps_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_apps" (
        "roleId" uuid NOT NULL,
        "appId" uuid NOT NULL,
        CONSTRAINT "PK_role_apps" PRIMARY KEY ("roleId", "appId")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "role_apps"
      ADD CONSTRAINT "FK_role_apps_roleId"
      FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "role_apps"
      ADD CONSTRAINT "FK_role_apps_appId"
      FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "role_apps" DROP CONSTRAINT "FK_role_apps_appId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_apps" DROP CONSTRAINT "FK_role_apps_roleId"`,
    );
    await queryRunner.query(`DROP TABLE "role_apps"`);
    await queryRunner.query(`DROP TABLE "apps"`);

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "username" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "firstName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_username_email" UNIQUE ("username", "email")`,
    );
  }
}
