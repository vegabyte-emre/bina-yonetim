import React, { useState, useEffect } from 'react';
import { Bell, Calendar } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Duyurular yüklenemedi:', error);
      toast.error('Duyurular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      'general': { label: 'Genel', class: 'bg-blue-100 text-blue-700' },
      'urgent': { label: 'Acil', class: 'bg-red-100 text-red-700' },
      'event': { label: 'Etkinlik', class: 'bg-purple-100 text-purple-700' },
      'maintenance': { label: 'Bakım', class: 'bg-orange-100 text-orange-700' }
    };
    const t = typeMap[type] || { label: type, class: 'bg-gray-100 text-gray-700' };
    return <Badge className={t.class}>{t.label}</Badge>;
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyurular</h1>
        <p className="mt-1 text-sm text-gray-600">{announcements.length} duyuru kayıtlı</p>
      </div>

      {announcements.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz duyuru yok</h3>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-xl ${
                      announcement.type === 'urgent' ? 'bg-red-100' :
                      announcement.type === 'event' ? 'bg-purple-100' :
                      announcement.type === 'maintenance' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      <Bell className={`h-5 w-5 ${
                        announcement.type === 'urgent' ? 'text-red-600' :
                        announcement.type === 'event' ? 'text-purple-600' :
                        announcement.type === 'maintenance' ? 'text-orange-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(announcement.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  {getTypeBadge(announcement.type)}
                </div>
                <p className="text-gray-700 leading-relaxed">{announcement.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
