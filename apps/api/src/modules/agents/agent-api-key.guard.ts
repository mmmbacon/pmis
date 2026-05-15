import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentPrincipal } from './agent-principal';

@Injectable()
export class AgentApiKeyGuard implements CanActivate {
  constructor(private readonly agentsService: AgentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      agent?: AgentPrincipal;
    }>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Agent API key is required');
    }

    request.agent = await this.agentsService.validateApiKey(authorization.slice('Bearer '.length));
    return true;
  }
}
