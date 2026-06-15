import { Badge } from '@/components/ui/badge';
import type { Funcionario } from '@escala/shared';

const VARIANTS: Record<string, 'success' | 'info' | 'warning' | 'muted'> = {
  EFETIVO: 'success',
  'PROVISÓRIO': 'info',
  PROVISORIO: 'info',
  'Temporário': 'warning',
};

export function ContratoBadge({ contrato }: { contrato: Funcionario['tipoContrato'] | string }) {
  const variant = VARIANTS[contrato] ?? 'muted';
  return <Badge variant={variant}>{contrato}</Badge>;
}
