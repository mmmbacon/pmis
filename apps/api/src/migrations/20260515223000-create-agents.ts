import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgents20260515223000 implements MigrationInterface {
  name = 'CreateAgents20260515223000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE agents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL,
        description text,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        disabled_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_agents_user_id UNIQUE (user_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_agents_created_by ON agents(created_by)`);
    await queryRunner.query(`CREATE INDEX idx_agents_disabled_at ON agents(disabled_at)`);

    await queryRunner.query(`
      CREATE TABLE agent_api_keys (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        name varchar(120) NOT NULL,
        key_prefix varchar(32) NOT NULL,
        key_hash varchar(255) NOT NULL,
        last_used_at timestamptz,
        revoked_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_agent_api_keys_key_prefix UNIQUE (key_prefix)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_agent_api_keys_agent_id ON agent_api_keys(agent_id)`);
    await queryRunner.query(
      `CREATE INDEX idx_agent_api_keys_revoked_at ON agent_api_keys(revoked_at)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agent_api_keys_revoked_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agent_api_keys_agent_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS agent_api_keys`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agents_disabled_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_agents_created_by`);
    await queryRunner.query(`DROP TABLE IF EXISTS agents`);
  }
}
