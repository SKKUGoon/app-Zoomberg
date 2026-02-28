import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const getRequiredEnv = (key: keyof typeof env): string => {
	const value = env[key];
	if (!value) {
		throw new Error(`Missing required environment variable: ${key}`);
	}

	return value;
};

const parseSslMode = (rawValue: string | undefined): boolean => {
	const normalized = (rawValue ?? 'false').trim().toLowerCase();
	return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const parsePort = (rawValue: string | undefined): number => {
	const parsed = Number(rawValue ?? '5432');
	if (Number.isNaN(parsed)) {
		return 5432;
	}

	return parsed;
};

const pool = new Pool({
	host: getRequiredEnv('NEWS_DB_HOST'),
	port: parsePort(env.NEWS_DB_PORT),
	user: getRequiredEnv('NEWS_DB_USER'),
	password: getRequiredEnv('NEWS_DB_PASSWORD'),
	database: getRequiredEnv('NEWS_DB_NAME'),
	ssl: parseSslMode(env.NEWS_DB_SSL) ? { rejectUnauthorized: false } : false,
	connectionTimeoutMillis: 5_000,
	idleTimeoutMillis: 15_000
});

export const db = drizzle(pool, { schema });
