import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useEscala, useUpdateObservacoes } from '@/hooks/useEscala';
import { useSetores } from '@/hooks/useFuncionarios';
import { GradeEscala } from '@/components/GradeEscala/GradeEscala';
import { GradeEscalaSkeleton } from '@/components/GradeEscala/GradeEscalaSkeleton';
import { LegendaTurnos } from '@/components/GradeEscala/LegendaTurnos';
import { LegendaFeriados } from '@/components/GradeEscala/LegendaFeriados';
import { ObservacoesCompetencia } from '@/components/GradeEscala/ObservacoesCompetencia';
import { SetorSelector } from '@/components/SetorSelector';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function EscalaPage() {
  const { setorId, mes, ano } = useParams<{ setorId: string; mes: string; ano: string }>();
  const navigate = useNavigate();
  const [competenciaId, setCompetenciaId] = useState<number | undefined>();
  const [exportando, setExportando] = useState(false);

  const setorIdNum = parseInt(setorId || '1', 10);
  const mesNum = parseInt(mes || '6', 10);
  const anoNum = parseInt(ano || '2026', 10);

  const { data: setores = [] } = useSetores();

  useEffect(() => {
    async function loadCompetencia() {
      const existing = await api.getCompetencia(setorIdNum, mesNum, anoNum);
      if (existing) {
        setCompetenciaId(existing.id);
        return;
      }
      const created = await api.createCompetencia(setorIdNum, mesNum, anoNum);
      setCompetenciaId(created.id);
    }
    loadCompetencia().catch(() => toast.error('Erro ao carregar competência'));
  }, [setorIdNum, mesNum, anoNum]);

  const { data: escala, isLoading } = useEscala(competenciaId);
  const updateObs = useUpdateObservacoes(competenciaId ?? 0);

  const setor = setores.find((s) => s.id === setorIdNum);

  const changeMes = (delta: number) => {
    let newMes = mesNum + delta;
    let newAno = anoNum;
    if (newMes < 1) { newMes = 12; newAno--; }
    if (newMes > 12) { newMes = 1; newAno++; }
    navigate(`/setores/${setorIdNum}/escala/${newMes}/${newAno}`);
    setCompetenciaId(undefined);
  };

  const handleSaveObservacoes = (texto: string) => {
    if (!competenciaId) return;
    updateObs.mutate(texto, {
      onSuccess: () => toast.success('Observações atualizadas'),
      onError: () => toast.error('Erro ao salvar observações'),
    });
  };

  const handleExportExcel = async () => {
    if (!competenciaId) return;
    setExportando(true);
    try {
      await api.downloadEscalaExcel(competenciaId);
      toast.success('Planilha exportada');
    } catch {
      toast.error('Erro ao exportar planilha');
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Escala — {setor?.nome ?? 'Setor'}</h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-8">
            {setor?.empresa}
            {setor?.gerente && (
              <span className="before:content-['|'] before:mx-2 before:text-border">
                Gerente: {setor.gerente}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SetorSelector
            value={setorIdNum}
            onChange={(id) => navigate(`/setores/${id}/escala/${mesNum}/${anoNum}`)}
          />

          <div className="flex items-center rounded-lg border bg-card shadow-sm">
            <Button variant="ghost" size="icon" className="rounded-r-none" onClick={() => changeMes(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm font-semibold min-w-[140px] text-center tabular-nums">
              {MESES[mesNum - 1]} / {anoNum}
            </span>
            <Button variant="ghost" size="icon" className="rounded-l-none" onClick={() => changeMes(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={!competenciaId || exportando || isLoading}
          >
            <Download className="h-4 w-4 mr-1.5" />
            {exportando ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      <LegendaTurnos />
      <LegendaFeriados mes={mesNum} ano={anoNum} />

      {isLoading && <GradeEscalaSkeleton />}
      {escala && <GradeEscala data={escala} />}

      {escala && escala.statusEspeciais.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Especiais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y rounded-md border">
              {escala.statusEspeciais.map((se) => (
                <div key={se.id ?? se.funcionario.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">
                    {se.funcionario.matricula}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="truncate block">{se.funcionario.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {se.dataInicio.split('-').reverse().join('/')} —{' '}
                      {se.dataFim.split('-').reverse().join('/')}
                    </span>
                  </div>
                  <StatusBadge status={se.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Observações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ObservacoesCompetencia
            observacoes={escala?.observacoes}
            disabled={!competenciaId || isLoading}
            isSaving={updateObs.isPending}
            onSave={handleSaveObservacoes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
