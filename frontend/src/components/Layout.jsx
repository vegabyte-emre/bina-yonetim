import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, CreditCard, Settings, LogOut, Menu, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

const Layout = ({ setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
    toast.success('Başarıyla çıkış yapıldı');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/buildings', icon: Building2, label: 'Binalar' },
    { path: '/users', icon: Users, label: 'Kullanıcılar' },
    { path: '/subscriptions', icon: CreditCard, label: 'Abonelikler' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white">
          <div className="flex items-center flex-shrink-0 px-6 py-5 border-b border-gray-200">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="ml-3 text-xl font-semibold text-gray-900">Süperadmin</span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-blue-700' : 'text-gray-500'
                  }`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              data-testid="logout-button"
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 md:hidden ${
        sidebarOpen ? 'block' : 'hidden'
      }`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="ml-3 text-xl font-semibold text-gray-900">Süperadmin</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-blue-700' : 'text-gray-500'
                  }`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top bar - Mobile */}
        <div className="sticky top-0 z-10 md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="ml-2 text-lg font-semibold text-gray-900">Süperadmin</span>
          </div>
          <div className="w-6"></div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
