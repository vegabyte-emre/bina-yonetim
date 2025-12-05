import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Talepler yüklenemedi:', error);
      toast.error('Talepler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Bekliyor', class: 'bg-yellow-100 text-yellow-700' },
      'in_progress': { label: 'İşlemde', class: 'bg-blue-100 text-blue-700' },
      'resolved': { label: 'Çözüldü', class: 'bg-green-100 text-green-700' },
      'rejected': { label: 'Reddedildi', class: 'bg-red-100 text-red-700' }
    };
    const s = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
    return <Badge className={s.class}>{s.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'low': { label: 'Düşük', class: 'bg-gray-100 text-gray-700' },
      'normal': { label: 'Normal', class: 'bg-blue-100 text-blue-700' },
      'high': { label: 'Yüksek', class: 'bg-orange-100 text-orange-700' },
      'urgent': { label: 'Acil', class: 'bg-red-100 text-red-700' }
    };
    const p = priorityMap[priority] || { label: priority, class: 'bg-gray-100 text-gray-700' };
    return <Badge className={p.class}>{p.label}</Badge>;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Talepler & Şikayetler</h1>
          <p className="mt-1 text-sm text-gray-600">{requests.length} talep kayıtlı</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">Tümü ({requests.length})</option>
          <option value="pending">Bekliyor ({requests.filter(r => r.status === 'pending').length})</option>
          <option value="in_progress">İşlemde ({requests.filter(r => r.status === 'in_progress').length})</option>
          <option value="resolved">Çözüldü ({requests.filter(r => r.status === 'resolved').length})</option>
        </select>
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Talep bulunamadı</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      {request.type === 'complaint' ? (
                        <AlertCircle className="h-5 w-5 text-purple-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      {request.response && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-900"><strong>Yanıt:</strong> {request.response}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-3">
                        <Badge className="bg-gray-100 text-gray-700">{request.category}</Badge>
                        {getPriorityBadge(request.priority)}
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Requests;
