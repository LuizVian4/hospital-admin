import { ImportacaoCard } from '@/components/ImportacaoCard';

export function ImportacaoPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Importação de planilhas</h1>
        <p className="text-muted-foreground">
          Importe a equipe (cadastro de funcionários) ou as escalas mensais em arquivos separados.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ImportacaoCard tipo="equipe" />
        <ImportacaoCard tipo="escala" />
      </div>
    </div>
  );
}
