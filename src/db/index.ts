import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const DEFAULT_DEV_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/quorumly';
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;
const isDevelopment = process.env.NODE_ENV === 'development';

const db = isDevelopment
	? drizzleNode({ client: new Pool({ connectionString: databaseUrl }) })
	: drizzleNeon({ client: neon(databaseUrl) });

export default db;