import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MuiProvider } from '@/providers/MuiProvider';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { EscalaPage } from '@/pages/EscalaPage';
import { FuncionariosPage } from '@/pages/FuncionariosPage';
import { FuncionarioProfilePage } from '@/pages/FuncionarioProfilePage';
import { ImportacaoPage } from '@/pages/ImportacaoPage';
import { BancoHorasPage } from '@/pages/BancoHorasPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MuiProvider>
        <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="setores/:setorId/escala/:mes/:ano" element={<EscalaPage tipoEscala="tecnico" />} />
            <Route
              path="setores/:setorId/escala-enfermeiros/:mes/:ano"
              element={<EscalaPage tipoEscala="enfermeiro" />}
            />
            <Route path="funcionarios" element={<FuncionariosPage />} />
            <Route path="funcionarios/:id" element={<FuncionarioProfilePage />} />
            <Route path="importacao" element={<ImportacaoPage />} />
            <Route path="banco-horas" element={<BancoHorasPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </BrowserRouter>
      </MuiProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
