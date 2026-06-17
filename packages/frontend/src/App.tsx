import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MuiProvider } from '@/providers/MuiProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { EmpresaProvider } from '@/contexts/EmpresaContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { EmpresaGate } from '@/components/EmpresaGate';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { Dashboard } from '@/pages/Dashboard';
import { EscalaPage } from '@/pages/EscalaPage';
import { FuncionariosPage } from '@/pages/FuncionariosPage';
import { FuncionarioProfilePage } from '@/pages/FuncionarioProfilePage';
import { ImportacaoPage } from '@/pages/ImportacaoPage';
import { BancoHorasPage } from '@/pages/BancoHorasPage';
import { PerfilPage } from '@/pages/UsuariosPage';
import { EmpresasAdminPage } from '@/pages/EmpresasAdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MuiProvider>
        <AuthProvider>
          <EmpresaProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/cadastro" element={<RegisterPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route element={<EmpresaGate />}>
                    <Route element={<Layout />}>
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="setores/:setorId/escala/:mes/:ano" element={<EscalaPage tipoEscala="tecnico" />} />
                      <Route
                        path="setores/:setorId/escala-enfermeiros/:mes/:ano"
                        element={<EscalaPage tipoEscala="enfermeiro" />}
                      />
                      <Route path="funcionarios" element={<FuncionariosPage />} />
                      <Route path="funcionarios/:id" element={<FuncionarioProfilePage />} />
                      <Route path="importacao" element={<ImportacaoPage />} />
                  <Route path="banco-horas" element={<BancoHorasPage />} />
                  <Route path="admin/empresa" element={<EmpresasAdminPage />} />
                  <Route path="perfil" element={<PerfilPage />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </EmpresaProvider>
        </AuthProvider>
      </MuiProvider>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
