import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { createPostgresClient } from './connection';

const client = createPostgresClient();
export const db = drizzle(client, { schema });
