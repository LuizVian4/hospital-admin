import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { EscalaPage } from '@/pages/EscalaPage';
import { FuncionariosPage } from '@/pages/FuncionariosPage';
import { ImportacaoPage } from '@/pages/ImportacaoPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="setores/:setorId/escala/:mes/:ano" element={<EscalaPage />} />
            <Route path="funcionarios" element={<FuncionariosPage />} />
            <Route path="importacao" element={<ImportacaoPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
