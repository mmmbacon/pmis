import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/authenticated-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(): Promise<Project[]> {
    return this.projectsService.listActive();
  }

  @Post(':id/archive')
  @Roles('admin')
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser): Promise<Project> {
    return this.projectsService.archive(id, user);
  }
}
