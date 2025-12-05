import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Dues = () => {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, paid, unpaid

  useEffect(() => {
    fetchDues();
  }, []);

  const fetchDues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/dues`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDues(response.data);
    } catch (error) {
      console.error('Aidatlar yüklenemedi:', error);
      toast.error('Aidatlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredDues = dues.filter(due => {
    if (filter === 'all') return true;
    return due.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const totalUnpaid = dues.filter(d => d.status === 'unpaid').reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = dues.filter(d => d.status === 'paid').reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aidatlar</h1>
          <p className="mt-1 text-sm text-gray-600">{dues.length} aidat kaydı</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">Tümü ({dues.length})</option>
          <option value="unpaid">Ödenmedi ({dues.filter(d => d.status === 'unpaid').length})</option>
          <option value="paid">Ödendi ({dues.filter(d => d.status === 'paid').length})</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Bekleyen Tutar</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{totalUnpaid.toLocaleString('tr-TR')} ₺</p>
              </div>
              <DollarSign className="h-12 w-12 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tahsil Edilen</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{totalPaid.toLocaleString('tr-TR')} ₺</p>
              </div>
              <DollarSign className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredDues.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aidat bulunamadı</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Ödeme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDues.map((due) => (
                  <tr key={due.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{due.month}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{due.description}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{due.amount.toLocaleString('tr-TR')} ₺</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{new Date(due.due_date).toLocaleDateString('tr-TR')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={due.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {due.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </Badge>
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

export default Dues;
