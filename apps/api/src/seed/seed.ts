import * as bcrypt from 'bcrypt';
import type { DataSource, EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';
import { Project } from '../modules/projects/project.entity';
import { Task } from '../modules/tasks/task.entity';
import type { RoleName } from '../modules/users/role.entity';
import { Role } from '../modules/users/role.entity';
import { User } from '../modules/users/user.entity';

const roleDescriptions: Record<RoleName, string> = {
  employee: 'Can create and submit weekly timesheets.',
  approver: 'Can review, approve, and reject submitted timesheets.',
  admin: 'Can administer users, projects, and local demo setup.',
};

const ensureRole = async (manager: EntityManager, name: RoleName): Promise<Role> => {
  const roles = manager.getRepository(Role);
  const role = await roles.findOneBy({ name });
  if (!role) {
    return roles.save(roles.create({ name, description: roleDescriptions[name] }));
  }
  return role;
};

const ensureUser = async (
  manager: EntityManager,
  input: {
    email: string;
    name: string;
    password: string;
    roles: Role[];
  },
): Promise<User> => {
  const users = manager.getRepository(User);
  const user = await users.findOne({ where: { email: input.email }, relations: { roles: true } });
  if (user) {
    return user;
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  return users.save(
    users.create({ email: input.email, name: input.name, passwordHash, roles: input.roles }),
  );
};

const ensureProject = async (
  manager: EntityManager,
  input: {
    code: string;
    name: string;
    description: string;
    billable: boolean;
    hourlyRate: string;
    tasks: Array<{ code: string; name: string }>;
  },
): Promise<void> => {
  const projects = manager.getRepository(Project);
  const tasks = manager.getRepository(Task);
  let project = await projects.findOneBy({ code: input.code });
  if (!project) {
    project = projects.create({
      code: input.code,
      name: input.name,
      description: input.description,
      billable: input.billable,
      hourlyRate: input.hourlyRate,
    });
    project = await projects.save(project);
  }

  for (const taskInput of input.tasks) {
    const task = await tasks.findOneBy({ projectId: project.id, code: taskInput.code });
    if (!task) {
      await tasks.save(
        tasks.create({ projectId: project.id, code: taskInput.code, name: taskInput.name }),
      );
    }
  }
};

export const seedDatabase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.transaction(async (manager) => {
    const employee = await ensureRole(manager, 'employee');
    const approver = await ensureRole(manager, 'approver');
    const admin = await ensureRole(manager, 'admin');

    await ensureUser(manager, {
      email: env.admin.email,
      name: 'Admin User',
      password: env.admin.password,
      roles: [admin, approver, employee],
    });
    await ensureUser(manager, {
      email: 'employee@example.com',
      name: 'Example Employee',
      password: 'password123',
      roles: [employee],
    });
    await ensureUser(manager, {
      email: 'approver@example.com',
      name: 'Example Approver',
      password: 'password123',
      roles: [approver],
    });

    await ensureProject(manager, {
      code: 'PMIS',
      name: 'PMIS Modernization',
      description: 'Portfolio demo project for core timesheet workflows.',
      billable: true,
      hourlyRate: '150.00',
      tasks: [
        { code: 'ENG', name: 'Engineering' },
        { code: 'QA', name: 'Quality Review' },
      ],
    });
    await ensureProject(manager, {
      code: 'OPS',
      name: 'Operations Support',
      description: 'Non-billable operational support project.',
      billable: false,
      hourlyRate: '0.00',
      tasks: [
        { code: 'SUPPORT', name: 'Support' },
        { code: 'ADMIN', name: 'Administration' },
      ],
    });
  });
};

const run = async (): Promise<void> => {
  await AppDataSource.initialize();
  try {
    await seedDatabase(AppDataSource);
  } finally {
    await AppDataSource.destroy();
  }
};

if (require.main === module) {
  run().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
