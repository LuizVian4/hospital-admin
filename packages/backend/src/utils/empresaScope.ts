import { and, eq, type SQL } from 'drizzle-orm';

export function scopeEmpresa<T extends { empresaId: SQL | unknown }>(
  table: T,
  empresaId: string,
  ...extra: (SQL | undefined)[]
): SQL | undefined {
  const empresaColumn = table.empresaId as SQL;
  const conditions = [eq(empresaColumn, empresaId), ...extra.filter(Boolean)] as SQL[];
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}
