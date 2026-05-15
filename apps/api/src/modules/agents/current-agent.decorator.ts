import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { AgentPrincipal } from './agent-principal';

export const CurrentAgent = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AgentPrincipal => {
    const request = context.switchToHttp().getRequest<{ agent: AgentPrincipal }>();
    return request.agent;
  },
);
