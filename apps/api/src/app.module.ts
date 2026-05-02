import { existsSync } from 'fs';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppDataSource } from './config/data-source';
import { env } from './config/env';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { UsersModule } from './modules/users/users.module';

const clientDir = join(__dirname, '..', 'public');
const serveWebClient = existsSync(join(clientDir, 'index.html'));

@Module({
  imports: [
    ...(serveWebClient
      ? [
          ServeStaticModule.forRoot({
            rootPath: clientDir,
            exclude: ['/api/(.*)'],
          }),
        ]
      : []),
    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      migrationsRun: env.nodeEnv === 'development',
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    TimesheetsModule,
    ApprovalsModule,
    AuditModule,
    ReportingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
