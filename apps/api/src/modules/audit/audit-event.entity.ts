import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_events')
@Index(['entityType', 'entityId'])
@Index(['actorId'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ name: 'entity_type', type: 'varchar', length: 80 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ type: 'varchar', length: 80 })
  action!: string;

  @Column({ name: 'before_jsonb', type: 'jsonb', nullable: true })
  beforeJsonb!: Record<string, unknown> | null;

  @Column({ name: 'after_jsonb', type: 'jsonb', nullable: true })
  afterJsonb!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
