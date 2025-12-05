import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Residents = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, owner, tenant

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/residents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidents(response.data);
    } catch (error) {
      console.error('Sakinler yüklenemedi:', error);
      toast.error('Sakinler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredResidents = residents.filter(resident => {
    if (filter === 'all') return true;
    return resident.type === filter;
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
          <h1 className="text-2xl font-bold text-gray-900">Sakinler</h1>
          <p className="mt-1 text-sm text-gray-600">{residents.length} sakin kayıtlı</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">Tümü ({residents.length})</option>
          <option value="owner">Mal Sahibi ({residents.filter(r => r.type === 'owner').length})</option>
          <option value="tenant">Kiracı ({residents.filter(r => r.type === 'tenant').length})</option>
        </select>
      </div>

      {filteredResidents.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sakin bulunamadı</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ad Soyad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    E-posta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tip
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{resident.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{resident.phone}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{resident.email || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={resident.type === 'owner' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                        {resident.type === 'owner' ? 'Mal Sahibi' : 'Kiracı'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {resident.is_active ? (
                        <UserCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <UserX className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Residents;
