import { AppDataSource } from '../config/data-source';

const run = async (): Promise<void> => {
  await AppDataSource.initialize();
  const migrations = await AppDataSource.runMigrations();
  for (const migration of migrations) {
    console.log(`Applied migration ${migration.name}`);
  }
  if (migrations.length === 0) {
    console.log('No pending migrations');
  }
  await AppDataSource.destroy();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
