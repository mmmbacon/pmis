import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { TasksModule } from '../tasks/tasks.module';
import { TimesheetsModule } from '../timesheets/timesheets.module';
import { AgentApiKey } from './agent-api-key.entity';
import { AgentApiKeyGuard } from './agent-api-key.guard';
import { AgentController } from './agent.controller';
import { Agent } from './agent.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, AgentApiKey]),
    AuthModule,
    TasksModule,
    TimesheetsModule,
  ],
  controllers: [AgentsController, AgentController],
  providers: [AgentsService, AgentApiKeyGuard],
})
export class AgentsModule {}
