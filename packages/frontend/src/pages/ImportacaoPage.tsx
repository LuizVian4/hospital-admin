import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/api/client';
import type { ImportPreview } from '@escala/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function ImportacaoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.ods') && !f.name.endsWith('.xlsx')) {
      toast.error('Apenas arquivos .ods ou .xlsx são aceitos');
      return;
    }
    setFile(f);
    setLoading(true);
    try {
      const result = await api.importOds(f, false);
      setPreview(result);
      toast.success('Preview gerado com sucesso');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const result = await api.importOds(file, true);
      setPreview(result);
      toast.success('Importação concluída com sucesso!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Importação de Planilha</h1>
        <p className="text-muted-foreground">
          Importe planilhas de equipe (.xlsx) ou escalas mensais (.ods / .xlsx)
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Arraste o arquivo .xlsx ou .ods aqui</p>
        <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
        <input
          type="file"
          accept=".ods,.xlsx"
          className="hidden"
          id="file-input"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button asChild variant="outline">
          <label htmlFor="file-input" className="cursor-pointer">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Selecionar arquivo
          </label>
        </Button>
        {file && (
          <p className="mt-4 text-sm text-muted-foreground">
            Arquivo: <strong>{file.name}</strong>
          </p>
        )}
      </div>

      {loading && <div className="text-center text-muted-foreground">Processando...</div>}

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Preview da Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{preview.setores.length}</div>
                <div className="text-sm text-muted-foreground">Setores</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{preview.totalFuncionarios}</div>
                <div className="text-sm text-muted-foreground">Funcionários</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{preview.totalCelulas}</div>
                <div className="text-sm text-muted-foreground">Células de escala</div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-3">Setor</th>
                    <th className="text-right p-3">Novos</th>
                    <th className="text-right p-3">Atualizados</th>
                    <th className="text-right p-3">Células</th>
                    <th className="text-right p-3">Status Esp.</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.setores.map((s) => (
                    <tr key={s.nome} className="border-t">
                      <td className="p-3 font-medium">{s.nome}</td>
                      <td className="p-3 text-right text-green-600">{s.funcionariosNovos}</td>
                      <td className="p-3 text-right text-blue-600">{s.funcionariosAtualizados}</td>
                      <td className="p-3 text-right">{s.celulasEscala}</td>
                      <td className="p-3 text-right">{s.statusEspeciais}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.erros.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-800 font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Avisos de parsing ({preview.erros.length})
                </div>
                <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                  {preview.erros.map((e, i) => (
                    <li key={i} className="text-amber-700">{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleConfirm} disabled={loading} className="w-full">
              Confirmar Importação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
