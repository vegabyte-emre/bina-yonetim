import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building, Home, Users, Bell, FileText, Settings, LogOut, Menu, X, TrendingUp, BarChart3, ThumbsUp, Calendar, CheckSquare, Mail } from 'lucide-react';
import { toast } from 'sonner';

// TL İkonu komponenti
const TLIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16" />
    <path d="M6 8h8" />
    <path d="M6 14h6" />
    <path d="M14 4l4 16" />
  </svg>
);

const Layout = ({ setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Disable zoom on mobile
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
    toast.success('Başarıyla çıkış yapıldı');
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/blocks', icon: Building, label: 'Bloklar' },
    { path: '/apartments', icon: Home, label: 'Daireler' },
    { path: '/residents', icon: Users, label: 'Sakinler' },
    { path: '/dues', icon: TLIcon, label: 'Aidat' },
    { path: '/announcements', icon: Bell, label: 'Duyurular' },
    { path: '/requests', icon: FileText, label: 'Talepler' },
    { path: '/financial-report', icon: TrendingUp, label: 'Tahsilat Özeti' },
    { path: '/surveys', icon: BarChart3, label: 'Anketler' },
    { path: '/voting', icon: ThumbsUp, label: 'Oylamalar' },
    { path: '/meetings', icon: Calendar, label: 'Toplantılar' },
    { path: '/decisions', icon: CheckSquare, label: 'Kararlar' },
    { path: '/mail-gonder', icon: Mail, label: 'Mail Gönder' },
    { path: '/settings', icon: Settings, label: 'Ayarlar' },
  ];

  // Logo component
  const Logo = ({ size = 'default' }) => (
    <div className="flex items-center">
      <span className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent ${
        size === 'small' ? 'text-xl' : 'text-2xl'
      }`}>
        yönetioo
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow backdrop-blur-xl bg-white/80 border-r border-blue-100/50 shadow-xl">
          <div className="flex items-center flex-shrink-0 px-6 py-5 border-b border-blue-100/50">
            <Logo />
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200/50'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-blue-100/50 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 backdrop-blur-xl bg-white/95 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-5 border-b border-blue-100/50">
            <Logo size="small" />
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex-shrink-0 flex border-t border-blue-100/50 p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar - Mobile & Tablet */}
        <div className="sticky top-0 z-30 lg:hidden flex items-center justify-between px-4 py-3 backdrop-blur-xl bg-white/80 border-b border-blue-100/50 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Logo size="small" />
          <div className="w-11"></div>
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
