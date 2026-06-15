import { Link, Outlet, useLocation } from 'react-router-dom';
import { Calendar, CalendarDays, Users, Upload, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSetores } from '@/hooks/useFuncionarios';

const staticNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, isActive: (path: string) => path === '/' },
  { to: '/funcionarios', label: 'Funcionários', icon: Users, isActive: (path: string) => path === '/funcionarios' },
  { to: '/importacao', label: 'Importação', icon: Upload, isActive: (path: string) => path === '/importacao' },
] as const;

export function Layout() {
  const location = useLocation();
  const { data: setores = [] } = useSetores();

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
      icon: CalendarDays,
      isActive: (path: string) => path.includes('/escala/'),
    },
    ...staticNav.slice(1),
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-400" />
            <div>
              <div className="font-bold text-sm">Escala Hospital</div>
              <div className="text-xs text-slate-400">Teresa de Lisieux</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, isActive }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive(location.pathname)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
