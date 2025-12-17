import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Users, FileText, Video, ExternalLink, Loader2, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Meetings = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    agenda: '',
    use_google_meet: false,
    duration_minutes: 60,
  });

  useEffect(() => {
    fetchMeetings();
    checkGoogleConnection();
  }, []);

  const checkGoogleConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.building_id) return;

      const response = await axios.get(
        `${API_URL}/api/google-calendar/config/${userData.building_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGoogleConnected(response.data.is_connected);
    } catch (error) {
      console.log('Google connection check failed');
    }
  };

  const fetchMeetings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/meetings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeetings(response.data || []);
    } catch (error) {
      console.error('Toplantılar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      await axios.post(`${API_URL}/api/meetings`, {
        ...formData,
        building_id: userData.building_id,
        status: 'scheduled',
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Toplantı oluşturuldu!');
      setDialogOpen(false);
      setFormData({ title: '', description: '', date: '', time: '', location: '', agenda: '' });
      fetchMeetings();
    } catch (error) {
      toast.error('Toplantı eklenemedi');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Toplantılar</h1>
          <p className="mt-1 text-sm text-gray-600">Yönetim kurulu toplantılarını yönetin</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Yeni Toplantı
        </Button>
      </div>

      <div className="grid gap-4">
        {meetings.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz toplantı yok</h3>
              <p className="text-sm text-gray-500 mb-4">Yeni bir toplantı oluşturarak başlayın</p>
            </CardContent>
          </Card>
        ) : (
        meetings.map((meeting) => (
          <Card key={meeting.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                  <p className="text-gray-600 mb-3">{meeting.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(meeting.date).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      {meeting.location}
                    </div>
                  </div>
                </div>
                <Badge className={meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                  {meeting.status === 'scheduled' ? 'Planlandı' : 'Tamamlandı'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Toplantı Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Başlık *</Label>
              <Input
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Aylık yönetim kurulu toplantısı"
              />
            </div>
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Tarih *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="time">Saat *</Label>
                <Input
                  id="time"
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Yer *</Label>
              <Input
                id="location"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Site toplantı salonu"
              />
            </div>
            <div>
              <Label htmlFor="agenda">Gündem</Label>
              <Textarea
                id="agenda"
                value={formData.agenda}
                onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                placeholder="1. Açılış\n2. Geçen toplantı kararları\n3..."
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                İptal
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                Toplantı Oluştur
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Meetings;