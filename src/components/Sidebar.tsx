'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Briefcase, BarChart2, LineChart } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  session?: any;
  signOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, session, signOut }) => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = React.useState<{ [key: string]: boolean }>({
    'Sales & CSS': true
  });

  const menuItems = [
    {
      name: 'Sales & CSS',
      icon: <Briefcase className="w-6 h-6" />,
      subItems: [
        {
          name: 'Odoo Renewal Dashboard',
          href: '/',
          icon: <BarChart2 className="w-5 h-5" />,
        },
        {
          name: 'Odoo Renewal & Collection',
          href: '/odoo-renewal-collection',
          icon: <LineChart className="w-5 h-5" />,
        },
      ],
    },
  ];

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  return (
    <div
      className={`bg-white h-screen border-r border-slate-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && <span className="text-xl font-semibold text-slate-800">Menu</span>}
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#fb8110]"
        >
          {isCollapsed ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
      <nav className="mt-4 flex-1">
        {menuItems.map((item) => (
          <div key={item.name}>
            <button
              onClick={() => toggleMenu(item.name)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium ${
                expandedMenus[item.name]
                  ? 'text-[#fb8110] bg-slate-50'
                  : 'text-slate-600 hover:text-[#fb8110] hover:bg-slate-50'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="ml-3">{item.name}</span>
                  {expandedMenus[item.name] ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </>
              )}
            </button>
            {expandedMenus[item.name] && !isCollapsed && (
              <div className="ml-4">
                {item.subItems?.map((subItem) => (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium ${
                      pathname === subItem.href
                        ? 'text-[#fb8110] bg-slate-50'
                        : 'text-slate-600 hover:text-[#fb8110] hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex-shrink-0">{subItem.icon}</span>
                    <span className="ml-3">{subItem.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      {/* User Info - Fixed to bottom */}
      {session && !isCollapsed && (
        <div className="p-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {session.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="mt-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 