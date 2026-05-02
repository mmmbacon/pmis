import { config } from 'dotenv';

config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });
config({ path: '.env.example' });

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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: numberValue('PORT', 3000),
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
