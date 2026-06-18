import { useCallback, useId, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, Users, CalendarDays } from 'lucide-react';
import { api } from '@/api/client';
import type { ImportPreview } from '@escala/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export type ImportacaoTipo = 'equipe' | 'escala';

const CONFIG: Record<
  ImportacaoTipo,
  {
    titulo: string;
    descricao: string;
    icone: typeof Users;
    instrucoes: string[];
    aceita: string;
  }
> = {
  equipe: {
    titulo: 'Importação de equipe',
    descricao: 'Cadastre ou atualize funcionários e vínculos com setores.',
    icone: Users,
    instrucoes: [
      'Planilha .xlsx com colunas MAT, NOME, COREN, CAT, CTRT, ADM, CH e SETOR',
      'Uma linha por funcionário; o setor é definido na coluna SETOR',
      'Não inclua colunas de dias — use a importação de escala para turnos',
    ],
    aceita: '.xlsx',
  },
  escala: {
    titulo: 'Importação de escala',
    descricao: 'Importe a escala mensal por setor (turnos dia a dia).',
    icone: CalendarDays,
    instrucoes: [
      'Planilha .xlsx ou .ods com uma aba por setor',
      'Cabeçalho com EMPRESA, GERENTE, SETOR e COMPETÊNCIA (ex.: 6/2026)',
      'Colunas de funcionário + dias 1…31 com turnos (MT, F, SN, /, etc.)',
    ],
    aceita: '.xlsx, .ods',
  },
};

interface ImportacaoCardProps {
  tipo: ImportacaoTipo;
}

export function ImportacaoCard({ tipo }: ImportacaoCardProps) {
  const config = CONFIG[tipo];
  const Icon = config.icone;
  const inputId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    const valido =
      tipo === 'equipe'
        ? f.name.endsWith('.xlsx')
        : f.name.endsWith('.xlsx') || f.name.endsWith('.ods');

    if (!valido) {
      toast.error(`Para ${config.titulo.toLowerCase()}, use ${config.aceita}`);
      return;
    }
    setFile(f);
    setPreview(null);
    setLoading(true);
    try {
      const result = await api.importOds(f, false, tipo);
      setPreview(result);
      toast.success('Preview gerado com sucesso');
    } catch (e) {
      toast.error((e as Error).message);
      setFile(null);
    } finally {
      setLoading(false);
    }
  }, [tipo, config.titulo, config.aceita]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleConfirm = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await api.importOds(file, true, tipo);
      setPreview(result);
      toast.success('Importação concluída com sucesso!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await api.downloadImportTemplate(tipo);
      toast.success('Template baixado');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const limpar = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {config.titulo}
        </CardTitle>
        <CardDescription>{config.descricao}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
          {config.instrucoes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          disabled={downloadingTemplate || loading}
        >
          <Download className="h-4 w-4 mr-2" />
          {downloadingTemplate ? 'Baixando...' : 'Baixar template de exemplo'}
        </Button>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium mb-1">Arraste o arquivo aqui</p>
          <p className="text-sm text-muted-foreground mb-3">
            Formatos: {config.aceita}
          </p>
          <input
            type="file"
            accept={tipo === 'equipe' ? '.xlsx' : '.ods,.xlsx'}
            className="hidden"
            id={inputId}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button asChild variant="outline" size="sm" disabled={loading}>
            <label htmlFor={inputId} className="cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Selecionar arquivo
            </label>
          </Button>
          {file && (
            <p className="mt-3 text-sm text-muted-foreground">
              Arquivo: <strong>{file.name}</strong>
              {!loading && (
                <button
                  type="button"
                  onClick={limpar}
                  className="ml-2 text-primary underline-offset-2 hover:underline"
                >
                  remover
                </button>
              )}
            </p>
          )}
        </div>

        {loading && <p className="text-center text-sm text-muted-foreground">Processando...</p>}

        {preview && (
          <div className="space-y-4 border rounded-lg p-4 bg-slate-50/50">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Preview da importação
            </div>

            <div className={`grid gap-3 ${tipo === 'escala' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}>
              <div className="border rounded-lg p-3 text-center bg-white">
                <div className="text-xl font-bold">{preview.setores.length}</div>
                <div className="text-xs text-muted-foreground">Setores</div>
              </div>
              <div className="border rounded-lg p-3 text-center bg-white">
                <div className="text-xl font-bold">{preview.totalFuncionarios}</div>
                <div className="text-xs text-muted-foreground">Funcionários</div>
              </div>
              {tipo === 'escala' && (
                <div className="border rounded-lg p-3 text-center bg-white">
                  <div className="text-xl font-bold">{preview.totalCelulas}</div>
                  <div className="text-xs text-muted-foreground">Células de escala</div>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border bg-white">
              <table className="w-full min-w-[320px] text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Setor</th>
                    <th className="text-right p-2">Novos</th>
                    <th className="text-right p-2">Atualizados</th>
                    {tipo === 'escala' && (
                      <>
                        <th className="text-right p-2">Células</th>
                        <th className="text-right p-2">Status esp.</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.setores.map((s) => (
                    <tr key={s.nome} className="border-t">
                      <td className="p-2 font-medium">{s.nome}</td>
                      <td className="p-2 text-right text-green-600">{s.funcionariosNovos}</td>
                      <td className="p-2 text-right text-blue-600">{s.funcionariosAtualizados}</td>
                      {tipo === 'escala' && (
                        <>
                          <td className="p-2 text-right">{s.celulasEscala}</td>
                          <td className="p-2 text-right">{s.statusEspeciais}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.erros.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800 font-medium mb-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Avisos ({preview.erros.length})
                </div>
                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto text-amber-700">
                  {preview.erros.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleConfirm} disabled={loading} className="w-full">
              Confirmar importação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
