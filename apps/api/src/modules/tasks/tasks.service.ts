import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly tasks: Repository<Task>) {}

  listActive(projectId?: string): Promise<Task[]> {
    return this.tasks.find({
      where: projectId ? { projectId, archivedAt: IsNull() } : { archivedAt: IsNull() },
      relations: { project: true },
      order: { code: 'ASC' },
    });
  }
}
