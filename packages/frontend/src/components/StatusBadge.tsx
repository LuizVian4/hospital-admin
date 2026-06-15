import { cn } from '@/lib/utils';
import type { StatusEspecial } from '@escala/shared';

const STATUS_COLORS: Record<string, string> = {
  'FÉRIAS': 'bg-orange-100 text-orange-800',
  'LICENÇA INSS': 'bg-red-100 text-red-800',
  'LICENÇA GESTACIONAL': 'bg-pink-100 text-pink-800',
};

export function StatusBadge({ status }: { status: StatusEspecial | string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
      )}
    >
      {status}
    </span>
  );
}
