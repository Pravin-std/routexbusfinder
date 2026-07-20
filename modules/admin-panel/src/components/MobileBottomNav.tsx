import React from 'react';
import { Home, Heart, Ticket, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { label: 'Home', icon: Home, route: '/' },
  { label: 'Favorites', icon: Heart, route: '/favorites' },
  { label: 'Tickets', icon: Ticket, route: '/tickets' },
  { label: 'Profile', icon: User, route: '/profile' },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide the nav on non-main pages if needed, but since it's only included in the main pages, it's fine.
  // We can also just return null if path is /login or something, but we'll include it directly in the App.
  
  return (
    <div className="flex md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-3xl z-50 h-[70px] pb-[env(safe-area-inset-bottom)]">
      <div className="flex w-full justify-around items-center px-2 h-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.route;
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95 ${
                isActive ? 'text-[#8B5CF6]' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className={`relative flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                <Icon className="h-6 w-6 stroke-[2px]" />
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-[#8B5CF6]' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
