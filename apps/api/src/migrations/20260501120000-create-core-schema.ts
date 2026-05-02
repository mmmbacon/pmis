import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreSchema20260501120000 implements MigrationInterface {
  name = 'CreateCoreSchema20260501120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE timesheet_status AS ENUM ('draft', 'submitted', 'approved', 'rejected')`);

    await queryRunner.query(`
      CREATE TABLE roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(50) NOT NULL UNIQUE,
        description varchar(255) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        name varchar(120) NOT NULL,
        refresh_token_hash varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE user_roles (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
        PRIMARY KEY (user_id, role_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_user_roles_role_id ON user_roles(role_id)`);

    await queryRunner.query(`
      CREATE TABLE projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(24) NOT NULL UNIQUE,
        name varchar(120) NOT NULL,
        description text,
        billable boolean NOT NULL DEFAULT true,
        hourly_rate numeric(10,2) NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        archived_at timestamptz
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_projects_archived_at ON projects(archived_at)`);

    await queryRunner.query(`
      CREATE TABLE tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
        code varchar(24) NOT NULL,
        name varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        archived_at timestamptz,
        CONSTRAINT uq_tasks_project_code UNIQUE (project_id, code)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_tasks_project_id ON tasks(project_id)`);
    await queryRunner.query(`CREATE INDEX idx_tasks_archived_at ON tasks(archived_at)`);

    await queryRunner.query(`
      CREATE TABLE timesheets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        period_start date NOT NULL,
        period_end date NOT NULL,
        status timesheet_status NOT NULL DEFAULT 'draft',
        submitted_at timestamptz,
        decided_at timestamptz,
        decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
        decision_note text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_timesheets_user_period UNIQUE (user_id, period_start),
        CONSTRAINT chk_timesheets_period CHECK (period_end >= period_start)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_timesheets_user_period ON timesheets(user_id, period_start)`);
    await queryRunner.query(`CREATE INDEX idx_timesheets_status ON timesheets(status)`);
    await queryRunner.query(`CREATE INDEX idx_timesheets_decided_by ON timesheets(decided_by)`);

    await queryRunner.query(`
      CREATE TABLE timesheet_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        timesheet_id uuid NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
        task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE RESTRICT,
        work_date date NOT NULL,
        hours numeric(5,2) NOT NULL,
        note text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_timesheet_entries_hours CHECK (hours > 0 AND hours <= 24),
        CONSTRAINT uq_timesheet_entries_day_task UNIQUE (timesheet_id, work_date, task_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_timesheet_entries_timesheet_id ON timesheet_entries(timesheet_id)`);
    await queryRunner.query(`CREATE INDEX idx_timesheet_entries_task_id ON timesheet_entries(task_id)`);
    await queryRunner.query(`CREATE INDEX idx_timesheet_entries_work_date ON timesheet_entries(work_date)`);

    await queryRunner.query(`
      CREATE TABLE audit_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
        entity_type varchar(80) NOT NULL,
        entity_id uuid NOT NULL,
        action varchar(80) NOT NULL,
        before_jsonb jsonb,
        after_jsonb jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_audit_events_actor_id ON audit_events(actor_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id)`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_events_entity`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_events_actor_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_events`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_timesheet_entries_work_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_timesheet_entries_task_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_timesheet_entries_timesheet_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS timesheet_entries`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_timesheets_decided_by`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_timesheets_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_timesheets_user_period`);
    await queryRunner.query(`DROP TABLE IF EXISTS timesheets`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_archived_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tasks_project_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS tasks`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_projects_archived_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS projects`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_roles_role_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_roles`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);
    await queryRunner.query(`DROP TYPE IF EXISTS timesheet_status`);
  }
}
