import { Pool as NeonPool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

import * as schema from './schema';

const DEFAULT_DEV_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/quorumly';
const databaseUrl = process.env.DATABASE_URL ?? DEFAULT_DEV_DATABASE_URL;

// Use local postgres if DATABASE_URL points to localhost, otherwise use Neon
const isLocalDatabase = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

if (process.env.NODE_ENV === 'development') {
	console.log('[DB] Database URL:', databaseUrl.replace(/:[^:@]+@/, ':***@'));
	console.log('[DB] Using local database:', isLocalDatabase);
}

type AppSchema = typeof schema;
type AppDatabase = PgDatabase<PgQueryResultHKT, AppSchema>;


const db: AppDatabase = isLocalDatabase
	? (drizzleNode({ 
			client: new Pool({
				connectionString: databaseUrl,
				host: 'localhost',
				port: 5432,
				user: 'postgres',
				password: 'postgres',
				database: 'quorumly',
			}), 
			schema 
		}) as unknown as AppDatabase)
	: drizzleNeon({ 
			client: new NeonPool({ connectionString: databaseUrl }), 
			schema 
		});

export default db;