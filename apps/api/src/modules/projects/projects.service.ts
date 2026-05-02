import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { AuthenticatedUser, hasRole } from '../../common/authenticated-user';
import { AuditService } from '../audit/audit.service';
import { Project } from './project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  listActive(): Promise<Project[]> {
    return this.projects.find({
      where: { archivedAt: IsNull() },
      relations: { tasks: true },
      order: { code: 'ASC', tasks: { code: 'ASC' } },
    });
  }

  async archive(id: string, actor: AuthenticatedUser): Promise<Project> {
    if (!hasRole(actor, 'admin')) {
      throw new ForbiddenException('Only admins can archive projects');
    }
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Project);
      const project = await repository.findOneByOrFail({ id });
      const before = { ...project };
      project.archivedAt = new Date();
      const saved = await repository.save(project);
      await this.auditService.record(
        {
          actorId: actor.id,
          entityType: 'project',
          entityId: saved.id,
          action: 'project.archived',
          before,
          after: { ...saved },
        },
        manager,
      );
      return saved;
    });
  }
}
