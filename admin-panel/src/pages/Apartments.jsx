import React, { useState, useEffect } from 'react';
import { Home, Filter } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Apartments = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, empty, rented, owner_occupied

  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/apartments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApartments(response.data);
    } catch (error) {
      console.error('Daireler yüklenemedi:', error);
      toast.error('Daireler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'owner_occupied': { label: 'Mal Sahibi', class: 'bg-green-100 text-green-700' },
      'rented': { label: 'Kiracı', class: 'bg-blue-100 text-blue-700' },
      'empty': { label: 'Boş', class: 'bg-gray-100 text-gray-700' }
    };
    const s = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
    return <Badge className={s.class}>{s.label}</Badge>;
  };

  const filteredApartments = apartments.filter(apt => {
    if (filter === 'all') return true;
    return apt.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daireler</h1>
          <p className="mt-1 text-sm text-gray-600">{apartments.length} daire kayıtlı</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">Tümü ({apartments.length})</option>
            <option value="owner_occupied">Mal Sahibi ({apartments.filter(a => a.status === 'owner_occupied').length})</option>
            <option value="rented">Kiracı ({apartments.filter(a => a.status === 'rented').length})</option>
            <option value="empty">Boş ({apartments.filter(a => a.status === 'empty').length})</option>
          </select>
        </div>
      </div>

      {filteredApartments.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Daire bulunamadı</h3>
            <p className="text-sm text-gray-500">Farklı bir filtre deneyin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daire No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oda Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    m²
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApartments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Home className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{apt.apartment_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{apt.floor}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{apt.room_count || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{apt.square_meters || '-'} m²</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(apt.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Mal Sahibi</p>
              <p className="text-2xl font-bold text-green-600">
                {apartments.filter(a => a.status === 'owner_occupied').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Kiracı</p>
              <p className="text-2xl font-bold text-blue-600">
                {apartments.filter(a => a.status === 'rented').length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Boş</p>
              <p className="text-2xl font-bold text-gray-600">
                {apartments.filter(a => a.status === 'empty').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Apartments;
