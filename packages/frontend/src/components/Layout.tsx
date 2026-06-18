import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PeopleIcon from '@mui/icons-material/People';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import { LogoBrand } from '@/components/LogoBrand';
import { BrandName } from '@/components/BrandName';
import { EmpresaSwitcher } from '@/components/EmpresaSwitcher';
import { useSetoresPorEscala } from '@/hooks/useFuncionarios';
import { useAuth } from '@/contexts/AuthContext';

const DRAWER_WIDTH = 256;
const DRAWER_COLLAPSED_WIDTH = 72;
const MOBILE_APP_BAR_HEIGHT = 56;

const staticNav = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, isActive: (path: string) => path === '/dashboard' },
  {
    to: '/funcionarios',
    label: 'Funcionários',
    icon: PeopleIcon,
    isActive: (path: string) => path.startsWith('/funcionarios'),
  },
  {
    to: '/banco-horas',
    label: 'Banco de horas',
    icon: ScheduleIcon,
    isActive: (path: string) => path.startsWith('/banco-horas'),
  },
  {
    to: '/importacao',
    label: 'Importação',
    icon: UploadFileIcon,
    isActive: (path: string) => path === '/importacao',
  },
] as const;

type NavItem = {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: typeof DashboardIcon;
  isActive?: (path: string) => boolean;
};

const perfilNavBase = {
  to: '/perfil',
  icon: PersonIcon,
  isActive: (path: string) => path.startsWith('/perfil'),
} as const;

const gerenciarEmpresasNav: NavItem = {
  to: '/admin/empresa',
  label: 'Gerenciar Empresas',
  icon: AdminPanelSettingsIcon,
  isActive: (path: string) => path.startsWith('/admin/empresa'),
};

const logoutNav: NavItem = {
  label: 'Sair',
  icon: LogoutIcon,
};

const navButtonSx = (collapsed: boolean) => ({
  borderRadius: 1.5,
  py: 1,
  px: collapsed ? 1.25 : 2,
  justifyContent: collapsed ? 'center' : 'flex-start',
  color: 'rgba(255,255,255,0.75)',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'primary.main',
    '&:hover': { bgcolor: 'secondary.dark' },
    '& .MuiListItemIcon-root': { color: 'primary.main' },
  },
  '&:hover': {
    bgcolor: 'rgba(255,255,255,0.08)',
    color: 'common.white',
    '& .MuiListItemIcon-root': { color: 'common.white' },
  },
});

function NavButton({
  item,
  collapsed,
  selected = false,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  selected?: boolean;
  onNavigate?: () => void;
}) {
  const { to, onClick, label, icon: Icon } = item;

  const handleClick = () => {
    onClick?.();
    onNavigate?.();
  };

  const button = (
    <ListItemButton
      {...(to ? { component: RouterLink, to, onClick: onNavigate } : { onClick: handleClick })}
      selected={selected}
      sx={navButtonSx(collapsed)}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 0 : 36,
          mr: collapsed ? 0 : undefined,
          justifyContent: 'center',
          color: selected ? 'primary.main' : 'rgba(255,255,255,0.55)',
        }}
      >
        <Icon fontSize="small" />
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={label}
          slotProps={{ primary: { variant: 'body2', noWrap: true } }}
          sx={{ '& .MuiListItemText-primary': { fontWeight: selected ? 600 : 400 } }}
        />
      )}
    </ListItemButton>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
}

const drawerPaperSx = (collapsed: boolean) => ({
  width: collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
  boxSizing: 'border-box' as const,
  bgcolor: 'primary.main',
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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: setoresTecnicos = [] } = useSetoresPorEscala('tecnico');
  const { data: setoresEnfermeiros = [] } = useSetoresPorEscala('enfermeiro');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const perfilNav: NavItem = useMemo(
    () => ({
      ...perfilNavBase,
      label: user?.nome ?? 'Meu perfil',
    }),
    [user?.nome]
  );

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const setorTecnicosId = setoresTecnicos[0]?.id ?? 1;
  const setorEnfermeirosId = setoresEnfermeiros[0]?.id ?? 1;
  const escalaTecnicosTo = `/setores/${setorTecnicosId}/escala/${mes}/${ano}`;
  const escalaEnfermeirosTo = `/setores/${setorEnfermeirosId}/escala-enfermeiros/${mes}/${ano}`;

  const nav = [
    staticNav[0],
    {
      to: escalaTecnicosTo,
      label: 'Escala de Técnicos',
      icon: CalendarMonthIcon,
      isActive: (path: string) =>
        path.includes('/escala/') && !path.includes('/escala-enfermeiros/'),
    },
    {
      to: escalaEnfermeirosTo,
      label: 'Escala de Enfermeiros',
      icon: MedicalServicesIcon,
      isActive: (path: string) => path.includes('/escala-enfermeiros/'),
    },
    ...staticNav.slice(1),
  ];

  const closeMobile = () => setMobileOpen(false);
  const drawerCollapsed = isDesktop ? collapsed : false;

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          px: drawerCollapsed ? 1.5 : 3,
          py: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerCollapsed ? 'center' : 'space-between',
          gap: 1.5,
          minHeight: 72,
        }}
      >
        <Box
          component={RouterLink}
          to="/dashboard"
          onClick={closeMobile}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: drawerCollapsed ? 'center' : 'flex-start',
            gap: 1.5,
            textDecoration: 'none',
            color: 'inherit',
            borderRadius: 1.5,
            flex: 1,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          <LogoBrand
            size={drawerCollapsed ? 44 : 56}
            showText={!drawerCollapsed}
            subtitle="Gestão de escalas"
            textColor="text-white"
            subtitleColor="text-white/55"
          />
        </Box>

        {!isDesktop && (
          <IconButton onClick={closeMobile} aria-label="Fechar menu" sx={{ color: 'rgba(255,255,255,0.75)' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <Box sx={{ px: drawerCollapsed ? 1 : 1.5, py: 2 }}>
        <EmpresaSwitcher collapsed={drawerCollapsed} />
        <ListItem disablePadding sx={{ mt: 1, display: 'block' }}>
          <NavButton
            item={gerenciarEmpresasNav}
            collapsed={drawerCollapsed}
            selected={gerenciarEmpresasNav.isActive?.(location.pathname) ?? false}
            onNavigate={closeMobile}
          />
        </ListItem>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <List sx={{ flex: 1, px: drawerCollapsed ? 1 : 1.5, py: 2, overflowY: 'auto' }}>
        {nav.map((item) => (
          <ListItem key={item.to} disablePadding sx={{ mb: 0.5, display: 'block' }}>
            <NavButton
              item={item}
              collapsed={drawerCollapsed}
              selected={item.isActive?.(location.pathname) ?? false}
              onNavigate={closeMobile}
            />
          </ListItem>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

      <Box sx={{ px: drawerCollapsed ? 1 : 1.5, py: 1.5 }}>
        <ListItem disablePadding sx={{ mb: 0.5, display: 'block' }}>
          <NavButton
            item={perfilNav}
            collapsed={drawerCollapsed}
            selected={perfilNav.isActive?.(location.pathname) ?? false}
            onNavigate={closeMobile}
          />
        </ListItem>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <NavButton
            item={{ ...logoutNav, onClick: logout }}
            collapsed={drawerCollapsed}
            onNavigate={closeMobile}
          />
        </ListItem>
      </Box>

      {isDesktop && (
        <Box sx={{ px: drawerCollapsed ? 1 : 1.5, py: 1 }}>
          <IconButton
            onClick={() => setCollapsed((prev) => !prev)}
            size="small"
            aria-label={drawerCollapsed ? 'Expandir menu' : 'Recolher menu'}
            sx={{
              width: '100%',
              borderRadius: 1.5,
              color: 'rgba(255,255,255,0.55)',
              '&:hover': { color: 'common.white', bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            {drawerCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isDesktop && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'primary.main',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Toolbar sx={{ minHeight: MOBILE_APP_BAR_HEIGHT, px: 1.5 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Box component={RouterLink} to="/dashboard" sx={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}>
              <LogoBrand size={36} showText={false} />
            </Box>
            <Box component="span" sx={{ ml: 1.5, display: 'inline-flex', alignItems: 'center' }}>
              <BrandName size="md" variant="light" />
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH,
            flexShrink: 0,
            transition: (t) =>
              t.transitions.create('width', {
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                duration: 225,
              }),
            '& .MuiDrawer-paper': drawerPaperSx(drawerCollapsed),
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              ...drawerPaperSx(false),
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
          width: '100%',
          minWidth: 0,
          ...(isDesktop
            ? {}
            : {
                pt: `${MOBILE_APP_BAR_HEIGHT}px`,
              }),
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
