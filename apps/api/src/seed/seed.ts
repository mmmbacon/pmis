import * as bcrypt from 'bcrypt';
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

const upsertRole = async (name: RoleName): Promise<Role> => {
  const roles = AppDataSource.getRepository(Role);
  let role = await roles.findOneBy({ name });
  if (!role) {
    role = roles.create({ name, description: roleDescriptions[name] });
  } else {
    role.description = roleDescriptions[name];
  }
  return roles.save(role);
};

const upsertUser = async (input: {
  email: string;
  name: string;
  password: string;
  roles: Role[];
}): Promise<User> => {
  const users = AppDataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(input.password, 12);
  let user = await users.findOne({ where: { email: input.email }, relations: { roles: true } });
  if (!user) {
    user = users.create({ email: input.email, name: input.name, passwordHash, roles: input.roles });
  } else {
    user.name = input.name;
    user.passwordHash = passwordHash;
    user.roles = input.roles;
  }
  return users.save(user);
};

const upsertProject = async (input: {
  code: string;
  name: string;
  description: string;
  billable: boolean;
  hourlyRate: string;
  tasks: Array<{ code: string; name: string }>;
}): Promise<void> => {
  const projects = AppDataSource.getRepository(Project);
  const tasks = AppDataSource.getRepository(Task);
  let project = await projects.findOneBy({ code: input.code });
  if (!project) {
    project = projects.create({
      code: input.code,
      name: input.name,
      description: input.description,
      billable: input.billable,
      hourlyRate: input.hourlyRate,
    });
  } else {
    project.name = input.name;
    project.description = input.description;
    project.billable = input.billable;
    project.hourlyRate = input.hourlyRate;
    project.archivedAt = null;
  }
  project = await projects.save(project);

  for (const taskInput of input.tasks) {
    let task = await tasks.findOneBy({ projectId: project.id, code: taskInput.code });
    if (!task) {
      task = tasks.create({ projectId: project.id, code: taskInput.code, name: taskInput.name });
    } else {
      task.name = taskInput.name;
      task.archivedAt = null;
    }
    await tasks.save(task);
  }
};

const run = async (): Promise<void> => {
  await AppDataSource.initialize();

  const employee = await upsertRole('employee');
  const approver = await upsertRole('approver');
  const admin = await upsertRole('admin');

  await upsertUser({
    email: env.admin.email,
    name: 'Admin User',
    password: env.admin.password,
    roles: [admin, approver, employee],
  });
  await upsertUser({
    email: 'employee@example.com',
    name: 'Example Employee',
    password: 'password123',
    roles: [employee],
  });
  await upsertUser({
    email: 'approver@example.com',
    name: 'Example Approver',
    password: 'password123',
    roles: [approver],
  });

  await upsertProject({
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
  await upsertProject({
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

  await AppDataSource.destroy();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
