import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: env.webOrigin, credentials: true });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const openApiConfig = new DocumentBuilder()
    .setTitle('Timesheet Manager API')
    .setDescription('API for human users and agents to manage time submissions.')
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Human JWT access token',
      },
      'bearer-jwt',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        description: 'Agent API key in the form pmis_agent_<publicPrefix>_<secret>',
      },
      'agent-api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    jsonDocumentUrl: '/api/v1/openapi.json',
  });
  const host = '0.0.0.0';
  await app.listen(env.port, host);
}

void bootstrap();
