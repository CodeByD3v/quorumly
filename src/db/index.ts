import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

import * as schema from './schema';

const DEFAULT_DEV_DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/quorumly';
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;
const isDevelopment = process.env.NODE_ENV === 'development';

type AppSchema = typeof schema;
type AppDatabase = PgDatabase<PgQueryResultHKT, AppSchema>;

const db: AppDatabase = isDevelopment
	? (drizzleNode({ client: new Pool({ connectionString: databaseUrl }) }) as unknown as AppDatabase)
	: (drizzleNeon({ client: neon(databaseUrl) }) as unknown as AppDatabase);

export default db;