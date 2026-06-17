import postgres from 'postgres';

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5433/escala_hospital'
  );
}

function needsSsl(url: string): boolean {
  if (process.env.DATABASE_SSL === 'require') return true;
  if (process.env.DATABASE_SSL === 'disable') return false;
  return url.includes('rlwy.net') || url.includes('railway.app');
}

export function createPostgresClient(
  connectionString?: string,
  overrides?: postgres.Options<Record<string, postgres.PostgresType>>
) {
  const url = connectionString ?? getDatabaseUrl();
  const ssl = needsSsl(url) ? ('require' as const) : undefined;
  return postgres(url, { ssl, ...overrides });
}
