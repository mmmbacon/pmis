import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AuditEvent } from './audit-event.entity';

export interface AuditInput {
  actorId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditEvent) private readonly auditEvents: Repository<AuditEvent>) {}

  async record(input: AuditInput, manager?: EntityManager): Promise<AuditEvent> {
    const repository = manager?.getRepository(AuditEvent) ?? this.auditEvents;
    return repository.save(
      repository.create({
        actorId: input.actorId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        beforeJsonb: input.before,
        afterJsonb: input.after,
      }),
    );
  }

  findForEntity(entityType: string, entityId: string): Promise<AuditEvent[]> {
    return this.auditEvents.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }
}
