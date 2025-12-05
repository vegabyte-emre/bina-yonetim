import React, { useState, useEffect } from 'react';
import { Building, Home, Users, DollarSign, AlertCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/building-manager/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Toplam Daire',
      value: stats?.total_apartments || 0,
      icon: Home,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Dolu Daire',
      value: stats?.occupied_apartments || 0,
      icon: Building,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Boş Daire',
      value: stats?.empty_apartments || 0,
      icon: Home,
      color: 'bg-gray-500',
      lightColor: 'bg-gray-50',
      textColor: 'text-gray-600'
    },
    {
      title: 'Toplam Sakin',
      value: stats?.total_residents || 0,
      icon: Users,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Bekleyen Aidat',
      value: stats?.pending_dues || 0,
      icon: DollarSign,
      color: 'bg-red-500',
      lightColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Bekleyen Talep',
      value: stats?.pending_requests || 0,
      icon: FileText,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">Bina yönetim özeti</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.lightColor} p-4 rounded-xl`}>
                    <Icon className={`h-8 w-8 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg">Tahsilat Özeti</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tahsil Edilen</span>
              <span className="text-2xl font-bold text-green-600">
                {stats?.collected_amount?.toLocaleString('tr-TR') || 0} ₺
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Bekleyen Tutar</span>
              <span className="text-2xl font-bold text-red-600">
                {stats?.total_due_amount?.toLocaleString('tr-TR') || 0} ₺
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg">Hızlı Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <span className="text-gray-600">{stats?.pending_dues || 0} bekleyen aidat ödemesi</span>
            </div>
            <div className="flex items-center text-sm">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-3" />
              <span className="text-gray-600">{stats?.pending_requests || 0} bekleyen talep/şikayet</span>
            </div>
            <div className="flex items-center text-sm">
              <Building className="h-5 w-5 text-gray-500 mr-3" />
              <span className="text-gray-600">{stats?.empty_apartments || 0} boş daire</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
