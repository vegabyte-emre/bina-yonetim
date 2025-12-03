import React, { useState, useEffect } from 'react';
import { Building2, Users, Home, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('İstatistikler yüklenemedi');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Bina',
      value: stats?.total_buildings || 0,
      icon: Building2,
      color: 'bg-blue-500',
      testId: 'stat-total-buildings'
    },
    {
      title: 'Aktif Bina',
      value: stats?.active_buildings || 0,
      icon: Home,
      color: 'bg-green-500',
      testId: 'stat-active-buildings'
    },
    {
      title: 'Toplam Kullanıcı',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-purple-500',
      testId: 'stat-total-users'
    },
    {
      title: 'Toplam Gelir',
      value: `${stats?.total_revenue?.toFixed(2) || 0} TL`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      testId: 'stat-total-revenue'
    },
  ];

  return (
    <div className="space-y-6 fade-in" data-testid="dashboard-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Sistem genelindeki önemli metriklere göz atın</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="stat-card card-hover border-0 shadow-md" data-testid={stat.testId}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Buildings */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Son Eklenen Binalar</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {stats?.recent_buildings && stats.recent_buildings.length > 0 ? (
            <div className="space-y-4">
              {stats.recent_buildings.map((building) => (
                <div
                  key={building.id}
                  data-testid={`recent-building-${building.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{building.name}</p>
                      <p className="text-sm text-gray-500">{building.city}, {building.district}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{building.apartment_count} Daire</p>
                    <p className={`text-xs ${
                      building.subscription_status === 'active'
                        ? 'text-green-600'
                        : building.subscription_status === 'trial'
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}>
                      {building.subscription_status === 'active'
                        ? 'Aktif'
                        : building.subscription_status === 'trial'
                        ? 'Deneme'
                        : 'Süresi Dolmuş'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Henüz bina eklenmemiş</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
