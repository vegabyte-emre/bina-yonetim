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
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user'));
      
      let meetLink = null;
      let googleEventId = null;

      // Create Google Meet if enabled
      if (formData.use_google_meet && googleConnected) {
        try {
          const googleRes = await axios.post(
            `${API_URL}/api/google-calendar/meetings/${userData.building_id}`,
            {
              title: formData.title,
              description: formData.description || formData.agenda,
              date: formData.date,
              time: formData.time,
              duration_minutes: parseInt(formData.duration_minutes) || 60,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          meetLink = googleRes.data.meet_link;
          googleEventId = googleRes.data.event_id;
          toast.success('Google Meet linki oluşturuldu!');
        } catch (googleError) {
          console.error('Google Meet error:', googleError);
          toast.error('Google Meet linki oluşturulamadı, toplantı Meet linksiz kaydedilecek');
        }
      }

      // Save meeting to database
      await axios.post(`${API_URL}/api/meetings`, {
        ...formData,
        building_id: userData.building_id,
        status: 'scheduled',
        meet_link: meetLink,
        google_event_id: googleEventId,
        location: formData.use_google_meet && meetLink ? 'Google Meet' : formData.location,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Toplantı oluşturuldu!');
      setDialogOpen(false);
      setFormData({ 
        title: '', description: '', date: '', time: '', 
        location: '', agenda: '', use_google_meet: false, duration_minutes: 60 
      });
      fetchMeetings();
    } catch (error) {
      toast.error('Toplantı eklenemedi');
    } finally {
      setSubmitting(false);
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
          <Card key={meeting.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{meeting.title}</h3>
                    {meeting.meet_link && (
                      <Badge className="bg-green-100 text-green-700">
                        <Video className="h-3 w-3 mr-1" />
                        Meet
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{meeting.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(meeting.date).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      {meeting.time}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {meeting.location}
                    </div>
                  </div>
                  {meeting.meet_link && (
                    <div className="mt-3">
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Video className="h-4 w-4" />
                        Toplantıya Katıl
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
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
            {/* Google Meet Option */}
            {googleConnected && (
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Video className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <Label htmlFor="use_google_meet" className="font-medium text-indigo-900">
                        Google Meet ile Toplantı
                      </Label>
                      <p className="text-sm text-indigo-600">
                        Otomatik video konferans linki oluştur
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="use_google_meet"
                    checked={formData.use_google_meet}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_google_meet: checked })}
                  />
                </div>
                {formData.use_google_meet && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <Label htmlFor="duration">Süre (dakika)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="15"
                      max="480"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                      className="w-32 mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            {!googleConnected && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Google Meet entegrasyonu için <a href="/settings" className="text-indigo-600 hover:underline">Ayarlar</a> sayfasından bağlantı kurun
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!formData.use_google_meet && (
              <div>
                <Label htmlFor="location">Yer *</Label>
                <Input
                  id="location"
                  required={!formData.use_google_meet}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Site toplantı salonu"
                />
              </div>
            )}
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                İptal
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {formData.use_google_meet ? 'Meet Linki Oluşturuluyor...' : 'Oluşturuluyor...'}
                  </>
                ) : (
                  <>
                    {formData.use_google_meet && <Video className="h-4 w-4 mr-2" />}
                    Toplantı Oluştur
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Meetings;