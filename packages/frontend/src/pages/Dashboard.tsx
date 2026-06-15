import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Building2, CalendarOff } from 'lucide-react';
import { api } from '@/api/client';
import { SetoresEditor } from '@/components/SetoresEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.getDashboard,
  });

  if (isLoading) return <div className="p-8">Carregando...</div>;

  const mes = data?.mes ?? new Date().getMonth() + 1;
  const ano = data?.ano ?? new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Hospital Teresa de Lisieux — Gestão de Escala
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalFuncionarios ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Setores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.setores.length ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sem Escala definida</CardTitle>
            <CalendarOff className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {data?.semEscalaDefinida.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Técnicos sem grupo em {MESES[mes - 1]}/{ano}
            </p>
          </CardContent>
        </Card>
      </div>

      <SetoresEditor setores={data?.setores ?? []} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Funcionários por Setor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data?.funcionariosPorSetor.map((item) => (
              <Link
                key={item.setorId}
                to={`/setores/${item.setorId}/escala/${mes}/${ano}`}
                className="border rounded-lg p-3 hover:bg-muted/40 hover:border-primary/30 transition-colors"
              >
                <div className="text-sm font-medium">{item.setor}</div>
                <div className="text-2xl font-bold">{item.total}</div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
