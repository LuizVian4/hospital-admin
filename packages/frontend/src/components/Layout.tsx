import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useSetores } from '@/hooks/useFuncionarios';

const DRAWER_WIDTH = 256;
const DRAWER_COLLAPSED_WIDTH = 72;

const staticNav = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, isActive: (path: string) => path === '/' },
  {
    to: '/funcionarios',
    label: 'Funcionários',
    icon: PeopleIcon,
    isActive: (path: string) => path === '/funcionarios',
  },
  {
    to: '/importacao',
    label: 'Importação',
    icon: UploadFileIcon,
    isActive: (path: string) => path === '/importacao',
  },
] as const;

const drawerPaperSx = (collapsed: boolean) => ({
  width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
  boxSizing: 'border-box' as const,
  bgcolor: 'grey.900',
  color: 'common.white',
  borderRight: 'none',
  overflowX: 'hidden',
  transition: (theme: { transitions: { create: (props: string | string[], options?: object) => string } }) =>
    theme.transitions.create('width', {
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      duration: 225,
    }),
});

export function Layout() {
  const location = useLocation();
  const { data: setores = [] } = useSetores();
  const [collapsed, setCollapsed] = useState(false);

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const setorId = setores[0]?.id ?? 1;
  const escalaTo = `/setores/${setorId}/escala/${mes}/${ano}`;

  const nav = [
    staticNav[0],
    {
      to: escalaTo,
      label: 'Escala do Mês',
      icon: CalendarMonthIcon,
      isActive: (path: string) => path.includes('/escala/'),
    },
    ...staticNav.slice(1),
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: collapsed ? 1.5 : 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
          minHeight: 72,
        }}
      >
        <LocalHospitalIcon sx={{ fontSize: 28, color: 'primary.light', flexShrink: 0 }} />
        {!collapsed && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, whiteSpace: 'nowrap' }}>
              Escala Hospital
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.400', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
              Teresa de Lisieux
            </Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: 'grey.800' }} />

      <List sx={{ flex: 1, px: collapsed ? 1 : 1.5, py: 2 }}>
        {nav.map(({ to, label, icon: Icon, isActive }) => {
          const selected = isActive(location.pathname);

          const button = (
            <ListItemButton
              component={RouterLink}
              to={to}
              selected={selected}
              sx={{
                borderRadius: 1.5,
                py: 1,
                px: collapsed ? 1.25 : 2,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: 'grey.300',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '& .MuiListItemIcon-root': { color: 'common.white' },
                },
                '&:hover': {
                  bgcolor: 'grey.800',
                  color: 'common.white',
                  '& .MuiListItemIcon-root': { color: 'common.white' },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed ? 0 : 36,
                  mr: collapsed ? 0 : undefined,
                  justifyContent: 'center',
                  color: selected ? 'common.white' : 'grey.400',
                }}
              >
                <Icon fontSize="small" />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: selected ? 600 : 400, noWrap: true }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={to} disablePadding sx={{ mb: 0.5, display: 'block' }}>
              {collapsed ? (
                <Tooltip title={label} placement="right" arrow>
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'grey.800' }} />

      <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <IconButton
          onClick={() => setCollapsed((prev) => !prev)}
          size="small"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          sx={{
            color: 'grey.400',
            '&:hover': { color: 'common.white', bgcolor: 'grey.800' },
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              duration: 225,
            }),
          '& .MuiDrawer-paper': drawerPaperSx(collapsed),
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ p: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
