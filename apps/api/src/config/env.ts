import { config } from 'dotenv';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
if (process.env.NODE_ENV !== 'production') {
  config({ path: '.env.example' });
}

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const numberValue = (key: string, fallback: number): number => {
  const value = process.env[key];
  return value ? Number(value) : fallback;
};

/** Set by managed PostgreSQL hosts; overrides discrete DATABASE_* when present. */
const databaseUrl = process.env.DATABASE_URL?.trim();

const defaultPort = process.env.NODE_ENV === 'production' ? 8080 : 3000;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberValue('PORT', defaultPort),
  databaseUrl: databaseUrl || undefined,
  database: {
    host: required('DATABASE_HOST', '127.0.0.1'),
    port: numberValue('DATABASE_PORT', 5433),
    user: required('DATABASE_USER', 'app'),
    password: required('DATABASE_PASSWORD', 'app'),
    name: required('DATABASE_NAME', 'timesheets_dev'),
  },
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'local-access-secret-change-me'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'local-refresh-secret-change-me'),
    accessExpiresIn: 900,
    refreshExpiresIn: 604800,
  },
  admin: {
    email: required('ADMIN_EMAIL', 'admin@example.com'),
    password: required('ADMIN_PASSWORD', 'password123'),
  },
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
};
