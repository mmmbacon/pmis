import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Project } from '../src/modules/projects/project.entity';
import { Task } from '../src/modules/tasks/task.entity';
import { Role } from '../src/modules/users/role.entity';
import { User } from '../src/modules/users/user.entity';
import { seedDatabase } from '../src/seed/seed';

describe('Timesheet flow (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let task: Task;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await seed(dataSource);
    await seedDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('seeds missing baseline data without overwriting existing records', async () => {
    const roles = dataSource.getRepository(Role);
    const users = dataSource.getRepository(User);
    const projects = dataSource.getRepository(Project);
    const tasks = dataSource.getRepository(Task);

    await expect(roles.countBy({ name: 'employee' })).resolves.toBe(1);
    await expect(roles.countBy({ name: 'approver' })).resolves.toBe(1);
    await expect(roles.countBy({ name: 'admin' })).resolves.toBe(1);

    const employeeRole = await roles.findOneByOrFail({ name: 'employee' });
    expect(employeeRole.description).toBe('Employee');

    const admin = await users.findOneOrFail({
      where: { email: 'admin@example.com' },
      relations: { roles: true },
    });
    expect(admin.name).toBe('Existing Admin');
    await expect(bcrypt.compare('existing-admin-password', admin.passwordHash)).resolves.toBe(true);
    await expect(bcrypt.compare('password123', admin.passwordHash)).resolves.toBe(false);
    expect(admin.roles.map((role) => role.name).sort()).toEqual(['admin']);

    const pmis = await projects.findOneByOrFail({ code: 'PMIS' });
    expect(pmis.name).toBe('PMIS');
    expect(pmis.description).toBe('Demo');
    expect(pmis.hourlyRate).toBe('175.00');

    const engTask = await tasks.findOneByOrFail({ projectId: pmis.id, code: 'ENG' });
    expect(engTask.name).toBe('Existing Engineering');
    await expect(tasks.countBy({ projectId: pmis.id, code: 'QA' })).resolves.toBe(1);
    await expect(projects.countBy({ code: 'OPS' })).resolves.toBe(1);
  });

  it('lets an employee submit and an approver approve a timesheet with audit and reporting', async () => {
    const employeeLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'employee@example.com', password: 'password123' })
      .expect(201);
    const employeeToken = employeeLogin.body.accessToken as string;

    const saved = await request(app.getHttpServer())
      .post('/api/v1/timesheets')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        periodStart: '2026-04-27',
        periodEnd: '2026-05-03',
        entries: [{ taskId: task.id, workDate: '2026-04-27', hours: 8, note: 'Integration flow' }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/timesheets/${saved.body.id}/submit`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(201);

    const approverLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'approver@example.com', password: 'password123' })
      .expect(201);
    const approverToken = approverLogin.body.accessToken as string;

    await request(app.getHttpServer())
      .post(`/api/v1/approvals/${saved.body.id}/approve`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({ note: 'Looks good' })
      .expect(201)
      .expect(({ body }) => expect(body.status).toBe('approved'));

    await request(app.getHttpServer())
      .post('/api/v1/timesheets')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({
        periodStart: '2026-04-27',
        periodEnd: '2026-05-03',
        entries: [{ taskId: task.id, workDate: '2026-04-27', hours: 2, note: 'Should fail' }],
      })
      .expect(400);

    await request(app.getHttpServer())
      .get(`/api/v1/audit/timesheet/${saved.body.id}`)
      .set('Authorization', `Bearer ${approverToken}`)
      .expect(200)
      .expect(({ body }) => expect(body.length).toBeGreaterThanOrEqual(3));

    await request(app.getHttpServer())
      .get('/api/v1/reporting/projects')
      .set('Authorization', `Bearer ${approverToken}`)
      .expect(200)
      .expect(({ body }) => expect(body[0].totalHours).toBe(8));
  });

  async function seed(dataSource: DataSource): Promise<void> {
    const roles = dataSource.getRepository(Role);
    const users = dataSource.getRepository(User);
    const projects = dataSource.getRepository(Project);
    const tasks = dataSource.getRepository(Task);
    const employeeRole = await roles.save(
      roles.create({ name: 'employee', description: 'Employee' }),
    );
    const approverRole = await roles.save(
      roles.create({ name: 'approver', description: 'Approver' }),
    );
    const adminRole = await roles.save(roles.create({ name: 'admin', description: 'Admin' }));
    const passwordHash = await bcrypt.hash('password123', 4);
    const adminPasswordHash = await bcrypt.hash('existing-admin-password', 4);
    await users.save(
      users.create({
        email: 'admin@example.com',
        name: 'Existing Admin',
        passwordHash: adminPasswordHash,
        roles: [adminRole],
      }),
    );
    await users.save(
      users.create({
        email: 'employee@example.com',
        name: 'Employee',
        passwordHash,
        roles: [employeeRole],
      }),
    );
    await users.save(
      users.create({
        email: 'approver@example.com',
        name: 'Approver',
        passwordHash,
        roles: [approverRole],
      }),
    );
    const project = await projects.save(
      projects.create({
        code: 'PMIS',
        name: 'PMIS',
        description: 'Demo',
        billable: true,
        hourlyRate: '175.00',
      }),
    );
    task = await tasks.save(
      tasks.create({ projectId: project.id, code: 'ENG', name: 'Existing Engineering' }),
    );
  }
});
