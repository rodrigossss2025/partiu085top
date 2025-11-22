import { NavLink } from 'react-router-dom';
import {
  RocketLaunchIcon,
  TicketIcon,
  CogIcon,
  BeakerIcon,
  BellAlertIcon // 1. Importar o ícone
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/', name: 'Radar', icon: RocketLaunchIcon },
  { to: '/resultados', name: 'Resultados', icon: TicketIcon },
  { to: '/lab', name: 'Lab Milhas', icon: BeakerIcon },
  { to: '/alertas', name: 'Alertas', icon: BellAlertIcon }, // 2. Adicionar na lista
  { to: '/config', name: 'Config', icon: CogIcon },
];

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-lg border-t border-slate-700 flex justify-center">
      <div className="flex space-x-2 max-w-md w-full">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors ${
                isActive ? 'text-orange-500' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}