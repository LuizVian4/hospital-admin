import { Navigate, Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEmpresa } from '@/contexts/EmpresaContext';

export function EmpresaGate() {
  const { empresas, empresaId, isLoading, selectEmpresa } = useEmpresa();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Typography color="text.secondary">Carregando empresas...</Typography>
      </Box>
    );
  }

  if (empresas.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Card sx={{ maxWidth: 480, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Nenhuma empresa vinculada
            </Typography>
            <Typography color="text.secondary">
              Seu usuário ainda não possui acesso a nenhuma empresa. Solicite ao administrador o
              vínculo com a organização correta.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!empresaId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Card sx={{ maxWidth: 520, width: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Selecione a empresa
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Escolha o ambiente que deseja acessar. Somente os dados dessa empresa serão exibidos.
            </Typography>
            <Stack spacing={1.5}>
              {empresas.map((item) => (
                <Button
                  key={item.id}
                  variant="outlined"
                  onClick={() => selectEmpresa(item.id)}
                  sx={{ justifyContent: 'flex-start', py: 1.5, px: 2 }}
                >
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography sx={{ fontWeight: 600 }}>{item.nome}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.papel === 'admin' ? 'Administrador' : 'Membro'}
                    </Typography>
                  </Box>
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return <Outlet />;
}

export function EmpresaRedirect() {
  const { empresaId } = useEmpresa();
  if (!empresaId) return <Navigate to="/selecionar-empresa" replace />;
  return <Navigate to="/dashboard" replace />;
}
