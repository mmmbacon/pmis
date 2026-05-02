import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AuditEvent } from '../modules/audit/audit-event.entity';
import { Project } from '../modules/projects/project.entity';
import { Task } from '../modules/tasks/task.entity';
import { TimesheetEntry } from '../modules/timesheets/timesheet-entry.entity';
import { Timesheet } from '../modules/timesheets/timesheet.entity';
import { Role } from '../modules/users/role.entity';
import { User } from '../modules/users/user.entity';
import { env } from './env';

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(env.databaseUrl
    ? { url: env.databaseUrl }
    : {
        host: env.database.host,
        port: env.database.port,
        username: env.database.user,
        password: env.database.password,
        database: env.database.name,
      }),
  synchronize: false,
  logging: env.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
  entities: [AuditEvent, Project, Task, TimesheetEntry, Timesheet, Role, User],
  migrations: [`${__dirname}/../migrations/*{.ts,.js}`],
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
  },
});
