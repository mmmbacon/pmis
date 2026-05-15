import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';

@Entity('agent_api_keys')
@Index(['keyPrefix'], { unique: true })
export class AgentApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'agent_id', type: 'uuid' })
  agentId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'key_prefix', type: 'varchar', length: 32 })
  keyPrefix!: string;

  @Column({ name: 'key_hash', type: 'varchar', length: 255 })
  keyHash!: string;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @ManyToOne(() => Agent, (agent) => agent.apiKeys, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agent_id' })
  agent!: Agent;
}
